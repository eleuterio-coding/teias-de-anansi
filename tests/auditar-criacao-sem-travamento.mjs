import fs from'node:fs';
import assert from'node:assert/strict';

const text=p=>fs.readFileSync(p,'utf8');
const html=text('criacao-personagem.html');
const loader=text('scripts/character-builder.js');
const core=text('scripts/character-builder/ui.js');
const classUi=text('scripts/character-builder/class-skill-ui.js');
const wizardUi=text('scripts/character-builder/wizard-subclass-ui.js');
const wizardMechanics=text('scripts/character-builder/wizard-subclass-mechanics.js');
const equipmentUi=text('scripts/character-builder/equipment-ownership-ui.js');
const legacyEquipment=text('scripts/character-builder/active-equipment-ui.js');
const packageB=text('scripts/character-builder/package-b-purchase-ui.js');

// Contratos reais de carregamento. A página e o motor já usam uma revisão
// posterior à indicada nas constantes congeladas de 2026-09-17.
const LEGACY_UI_REV='20260828-character-builder-freeze1';
const RULES_REV='20260831-tasha-metamagic1';
const WEALTH_REV='20260923-wealth-collapse1';
const pageRevision=html.match(/scripts\/character-builder\.js\?v=([\w-]+)/)?.[1];
const coreRevision=loader.match(/character-builder\/ui\.js\?v=([\w-]+)/)?.[1];
const wizardRevision=loader.match(/character-builder\/wizard-ui\.js\?v=([\w-]+)/)?.[1];
assert.ok(pageRevision,'A página deve importar o carregador com revisão explícita.');
assert.ok(coreRevision,'O carregador deve importar o núcleo com revisão explícita.');
assert.ok(wizardRevision,'O carregador deve importar o controle de acesso com revisão explícita.');
assert.notEqual(pageRevision,'20260917-master-full-control1','A página não pode voltar ao carregador anterior à revisão atual.');
assert.equal(pageRevision,coreRevision,'A página e o núcleo devem compartilhar a revisão de correção atual.');
assert.match(core,new RegExp('rules\\.js\\?v='+coreRevision+'[\\\'"]'),'O núcleo deve usar a revisão normativa correspondente.');
assert.ok(loader.includes(`class-skill-ui.js?v=${RULES_REV}`),'A etapa de perícias deve manter sua revisão normativa validada.');
assert.ok(loader.includes(`equipment-ownership-ui.js?v=${LEGACY_UI_REV}`),'Equipamento ativo deve manter sua revisão anti-travamento.');
assert.ok(loader.includes(`package-b-purchase-ui.js?v=${WEALTH_REV}`),'O carregador deve usar a revisão atual de compras/riqueza.');
assert.ok(packageB.includes(`wealth-purchase-ui.js?v=${WEALTH_REV}`),'Compras deve importar a mesma revisão de riqueza.');
for(const [label,source] of [['Mago',wizardUi],['equipamento',equipmentUi]]){
 assert.ok(source.includes(`rules.js?v=${RULES_REV}`),`${label}: regras normativas previamente verificadas devem continuar vinculadas.`);
}
assert.ok(classUi.includes(`rules.js?v=${RULES_REV}`),'Perícias devem conservar regras e testes de perícia.');
assert.ok(classUi.includes('renderSkillChecks'),'A prévia de perícias deve renderizar os valores mecânicos.');

const access=fs.readFileSync('scripts/character-builder/wizard-ui.js','utf8');
assert.ok(access.includes('function enforceCharacterEditAccess()'),'Criação deve verificar acesso ao editar.');
assert.ok(access.includes("if(mode==='guest')"),'Visitante não pode acessar a criação autenticada.');
assert.ok(access.includes('if(!id)return true'),'Jogador autenticado pode criar ficha nova.');
assert.ok(access.includes('if(canEditCharacter(id))return true'),'Edição só pode prosseguir com permissão explícita.');
assert.ok(access.includes('if(canOpenCharacter(id))'),'Ficha de outra pessoa deve abrir somente como leitura.');
assert.ok(access.includes('function stampPlayerOwnership()'),'A criação pelo jogador precisa registrar o proprietário.');
assert.ok(access.includes('state.c.ownerUid=session.uid')&&access.includes('state.c.ownerUsername=session.username'),'Propriedade deve ficar vinculada ao usuário autenticado.');
assert.ok(access.includes("byId('save')?.addEventListener('click',stampPlayerOwnership,true)"),'A identidade deve ser gravada no ato de salvar.');

for(const token of['ensureSpellIndex','spellCatalogRef','schoolLevelCache','spellByIdCache','sameChoiceState'])assert.ok(wizardMechanics.includes(token),`Cache do Mago ausente: ${token}`);
assert.ok(!wizardMechanics.includes("arr(state.catalogs?.spells).filter(s=>wizardSpell(s)&&sLevel(s)===level"),'Savant não pode voltar a varrer o catálogo inteiro por escolha.');
assert.ok(wizardUi.includes("if(card.innerHTML!==html)"),'Painel do Mago deve evitar reescrita de DOM idêntica.');
assert.ok(equipmentUi.includes("if(box.innerHTML!==html)"),'Equipamento deve evitar reescrita de DOM idêntica.');
assert.ok(legacyEquipment.includes('no-op intencional'),'Controlador legado de equipamento precisa permanecer inativo.');
const legacyInit=legacyEquipment.split('export function initActiveEquipmentUi',2)[1]||'';
assert.ok(!/\.observe\s*\(/.test(legacyInit),'Controlador legado não pode registrar MutationObserver.');
assert.ok(!/observe\([^\n]*equipamento-escolhas/.test(equipmentUi),'Controlador atual não pode observar #equipamento-escolhas.');

const{state}=await import('../scripts/character-builder/state.js');
const{wizardSubclassChoiceDefs}=await import('../scripts/character-builder/wizard-subclass-mechanics.js');
let classReads=0;
const spells=[];
for(let i=0;i<537;i++){
 const level=(i%9)+1,school=i%4===0?'Abjuração':'Evocação';
 const row={id:`perf-${i}`,name:`Magia ${i}`,level,school};
 Object.defineProperty(row,'classes',{get(){classReads++;return['Wizard']},enumerable:true});
 spells.push(row);
}
state.catalogs={...(state.catalogs||{}),spells,weapons:[]};
state.c={choices:{subclassMechanics:{},spells:{leveled:[]},equipment:{shield:false}}};
const d={klass:{slug:'wizard'},sub:{name:'Abjurer',mechanics:{name:'Abjurer'},features:[]},level:20,pbonus:6,scores:{Inteligência:20},selectedSpells:{leveled:[]}};
wizardSubclassChoiceDefs(d);
const firstReads=classReads;
assert.equal(firstReads,spells.length,'Primeira indexação deve visitar cada magia uma única vez.');
for(let i=0;i<25;i++)wizardSubclassChoiceDefs(d);
assert.equal(classReads,firstReads,'Chamadas repetidas de derive/choiceDefs não podem revarrer as 537 magias.');

console.log('Criação validada sem regressão de cache, ping-pong de equipamento ou varredura repetida do catálogo do Mago; revisão normativa canônica rastreada sem perder a revisão do fluxo de jogador.');