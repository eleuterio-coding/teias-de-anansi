import assert from'node:assert/strict';
import fs from'node:fs';
import{SETTINGS_KEY,SETTINGS_SCHEMA,SOURCE_AUTHORITIES,HOUSE_RULE_PRESETS,defaultSettings,normalizeSettings,readSettings,writeSettings,campaignDefaultsFromSettings,applyUiPreferences}from'../scripts/settings-state.js';

class MemoryStorage{constructor(){this.map=new Map}getItem(k){return this.map.get(k)??null}setItem(k,v){this.map.set(k,String(v))}removeItem(k){this.map.delete(k)}}
const storage=new MemoryStorage(),defaults=defaultSettings();
assert.equal(SETTINGS_KEY,'hub-rpg:settings:v1');
assert.equal(defaults.schema,SETTINGS_SCHEMA);
assert.equal(defaults.sources.enabled.length,SOURCE_AUTHORITIES.length,'Todas as fontes devem permanecer habilitadas.');
assert.equal(defaults.houseRules.preset,'teias-v1');
assert.equal(HOUSE_RULE_PRESETS.length,1,'Regras da Casa não devem possuir presets selecionáveis.');
assert.equal(defaults.campaignDefaults.dmName,'Rafael');

const saved=writeSettings({...defaults,workspace:'mestre',sources:{enabled:[]},houseRules:{preset:'mesa-personalizada',enabled:['Regra isolada']},sheet:{density:'compact',showSources:false,stickySections:false},accessibility:{fontScale:'large',contrast:'high',motion:'reduce'},campaignDefaults:{dmName:'Outro Mestre',setting:'Eberron',system:'Outro sistema'}},storage,{timestamp:false});
assert.equal(readSettings(storage).workspace,'mestre');
assert.equal(saved.sheet.density,'compact');
assert.equal(saved.accessibility.contrast,'high');
assert.deepEqual(saved.sources.enabled,SOURCE_AUTHORITIES.map(x=>x.id),'Preferência antiga não pode desabilitar fontes.');
assert.equal(saved.houseRules.preset,'teias-v1','Regras da Casa devem permanecer sempre no pacote Teias.');
assert.deepEqual(saved.houseRules.enabled,[]);
assert.deepEqual(saved.campaignDefaults,{dmName:'Rafael',setting:'',system:'D&D 5.5e'});

const sanitized=normalizeSettings({workspace:'root',sources:{enabled:['inexistente']},houseRules:{preset:'mesa-personalizada'},accessibility:{fontScale:'gigante'},sheet:{density:'mínima'},campaignDefaults:{dmName:'Anansi'}});
assert.equal(sanitized.workspace,'auto');
assert.equal(sanitized.accessibility.fontScale,'normal');
assert.equal(sanitized.sheet.density,'comfortable');
assert.deepEqual(sanitized.sources.enabled,SOURCE_AUTHORITIES.map(x=>x.id));
assert.equal(sanitized.houseRules.preset,'teias-v1');
assert.equal(sanitized.campaignDefaults.dmName,'Rafael');

const campaign=campaignDefaultsFromSettings(saved);
assert.deepEqual(campaign,{dmName:'Rafael',setting:'',system:'D&D 5.5e'});

const fakeRoot={dataset:{}};
applyUiPreferences(saved,fakeRoot);
assert.equal(fakeRoot.dataset.hubFontScale,'large');
assert.equal(fakeRoot.dataset.hubContrast,'high');
assert.equal(fakeRoot.dataset.hubMotion,'reduce');
assert.equal(fakeRoot.dataset.hubSheetDensity,'compact');
assert.equal(fakeRoot.dataset.hubStickySections,'false');
assert.equal(fakeRoot.dataset.hubShowSources,'false');

const page=fs.readFileSync(new URL('../configuracoes.html',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../scripts/settings-ui.js',import.meta.url),'utf8');
const ux=fs.readFileSync(new URL('../scripts/hub-ux.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../hub-ux.css',import.meta.url),'utf8');
const settingsCss=fs.readFileSync(new URL('../settings.css',import.meta.url),'utf8');
const campaigns=fs.readFileSync(new URL('../scripts/campaign-list-ui.js',import.meta.url),'utf8');
const campaignsPage=fs.readFileSync(new URL('../campanhas.html',import.meta.url),'utf8');
const storageRegistry=fs.readFileSync(new URL('../scripts/storage-registry.js',import.meta.url),'utf8');
const home=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

for(const id of['workspace','sheet-density','show-sources','sticky-sections','font-scale','contrast','motion','save-settings','reset-settings','settings-status'])assert.ok(page.includes(`id="${id}"`),`Configurações sem ${id}.`);
for(const id of['source-options','house-preset','house-rule-options','default-dm','default-setting','default-system','storage-key'])assert.ok(!page.includes(`id="${id}"`),`Configurações não deve expor ${id}.`);
for(const text of['Fontes habilitadas','Regras da Casa','Defaults de campanha','Persistência'])assert.ok(!page.includes(text),`Configurações não deve exibir "${text}".`);
for(const token of['readSettings','writeSettings','resetSettings','applyUiPreferences'])assert.ok(ui.includes(token),`UI de Configurações sem ${token}.`);
for(const token of['loadHouseRules','renderSources','renderPreset','campaignDefaults'])assert.ok(!ui.includes(token),`UI simplificada ainda contém ${token}.`);
assert.ok(ux.includes('readSettings')&&ux.includes('hub-rpg:settings-changed'),'UX global deve consumir preferências persistidas.');
for(const token of['data-hub-font-scale','data-hub-contrast','data-hub-motion','data-hub-sheet-density','data-hub-sticky-sections','data-hub-show-sources'])assert.ok(css.includes(token),`CSS global sem preferência ${token}.`);
assert.ok(settingsCss.includes('@media(max-width:760px)'),'Configurações devem ser responsivas.');
assert.ok(!campaigns.includes('campaignDefaultsFromSettings')&&!campaigns.includes('applyDefaults'),'Campanhas não devem depender de defaults configuráveis.');
assert.ok(campaigns.includes("DM_NAME='Rafael'")&&campaigns.includes('dmName:DM_NAME'),'Nova Mesa deve gravar Rafael como Mestre.');
assert.ok(!campaignsPage.includes('id="campaign-dm"')&&!campaignsPage.includes('campaign-defaults-note'),'Tela de Campanhas não deve pedir Mestre nem exibir defaults.');
assert.ok(campaignsPage.includes('Mestre: Rafael'),'Tela de Campanhas deve informar o Mestre fixo.');
assert.ok(storageRegistry.includes("id:'settings'")&&storageRegistry.includes('SETTINGS_KEY'),'Chave de Configurações deve permanecer classificada no registro de armazenamento.');
assert.ok(home.includes('href="configuracoes.html'),'Início deve expor Configurações.');
assert.ok(!home.includes('Fluxo recomendado:'),'Home não deve exibir o texto de fluxo recomendado removido.');
assert.ok(!home.includes('Preferências, fontes, Regras da Casa'),'Home não deve anunciar opções removidas de Configurações.');
assert.equal((home.match(/aria-disabled="true"/g)||[]).length,0,'Nenhuma área da home deve permanecer desabilitada.');

console.log('OK — Configurações simplificadas: fontes e Regras da Casa sempre ativas, sem Persistência/defaults e Mestre Rafael fixo.');
