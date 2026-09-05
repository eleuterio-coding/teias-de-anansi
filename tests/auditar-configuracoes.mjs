import assert from'node:assert/strict';
import fs from'node:fs';
import{SETTINGS_KEY,SETTINGS_SCHEMA,SOURCE_AUTHORITIES,HOUSE_RULE_PRESETS,defaultSettings,normalizeSettings,readSettings,writeSettings,campaignDefaultsFromSettings,applyUiPreferences}from'../scripts/settings-state.js';

class MemoryStorage{constructor(){this.map=new Map}getItem(k){return this.map.get(k)??null}setItem(k,v){this.map.set(k,String(v))}removeItem(k){this.map.delete(k)}}
const storage=new MemoryStorage(),defaults=defaultSettings();
assert.equal(SETTINGS_KEY,'hub-rpg:settings:v1');
assert.equal(defaults.schema,SETTINGS_SCHEMA);
assert.equal(defaults.sources.enabled.length,SOURCE_AUTHORITIES.length);
assert.equal(defaults.houseRules.preset,'teias-v1');
assert.ok(HOUSE_RULE_PRESETS.some(x=>x.id==='mesa-personalizada'));

const saved=writeSettings({...defaults,workspace:'mestre',sheet:{density:'compact',showSources:false,stickySections:false},accessibility:{fontScale:'large',contrast:'high',motion:'reduce'},campaignDefaults:{dmName:'Anansi',setting:'Eberron',system:'D&D 5.5e'},houseRules:{preset:'mesa-personalizada',enabled:['Concentração Expandida']}},storage,{timestamp:false});
assert.equal(readSettings(storage).workspace,'mestre');
assert.equal(saved.sheet.density,'compact');
assert.equal(saved.accessibility.contrast,'high');
assert.deepEqual(saved.houseRules.enabled,['Concentração Expandida']);

const sanitized=normalizeSettings({workspace:'root',sources:{enabled:['inexistente']},accessibility:{fontScale:'gigante'},sheet:{density:'mínima'}});
assert.equal(sanitized.workspace,'auto');
assert.equal(sanitized.accessibility.fontScale,'normal');
assert.equal(sanitized.sheet.density,'comfortable');
assert.equal(sanitized.sources.enabled.length,SOURCE_AUTHORITIES.length,'Fonte inválida não pode deixar o perfil sem fontes reconhecidas.');

const campaign=campaignDefaultsFromSettings(saved);
assert.equal(campaign.dmName,'Anansi');
assert.equal(campaign.setting,'Eberron');
assert.equal(campaign.rulesProfile.preset,'mesa-personalizada');
assert.deepEqual(campaign.rulesProfile.enabledHouseRules,['Concentração Expandida']);

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

for(const id of['workspace','source-options','house-preset','house-rule-options','sheet-density','show-sources','sticky-sections','font-scale','contrast','motion','default-dm','default-setting','default-system','save-settings','reset-settings','settings-status'])assert.ok(page.includes(`id="${id}"`),`Configurações sem ${id}.`);
for(const token of['readSettings','writeSettings','resetSettings','applyUiPreferences'])assert.ok(ui.includes(token),`UI de Configurações sem ${token}.`);
assert.ok(ux.includes('readSettings')&&ux.includes('hub-rpg:settings-changed'),'UX global deve consumir preferências persistidas.');
for(const token of['data-hub-font-scale','data-hub-contrast','data-hub-motion','data-hub-sheet-density','data-hub-sticky-sections','data-hub-show-sources'])assert.ok(css.includes(token),`CSS global sem preferência ${token}.`);
assert.ok(settingsCss.includes('@media(max-width:760px)'),'Configurações devem ser responsivas.');
assert.ok(campaigns.includes('campaignDefaultsFromSettings')&&campaigns.includes('applyDefaults'),'Nova Mesa deve consumir defaults persistidos.');
assert.ok(campaignsPage.includes('campaign-defaults-note'),'Tela de Campanhas deve explicar os defaults ativos.');
assert.ok(storageRegistry.includes("id:'settings'")&&storageRegistry.includes('SETTINGS_KEY'),'Chave de Configurações deve estar classificada no registro de armazenamento.');
assert.ok(home.includes('href="configuracoes.html'),'Início deve expor Configurações.');
assert.equal((home.match(/aria-disabled="true"/g)||[]).length,0,'Após o Bloco 17 nenhuma área planejada da home deve permanecer desabilitada.');
assert.ok(page.includes('não reescreve personagens'),'A UI deve deixar explícito que presets não alteram retroativamente fichas existentes.');

console.log('OK — Bloco 17: preferências persistentes, fontes, presets de Regras da Casa, Ficha, acessibilidade e defaults de campanha.');
