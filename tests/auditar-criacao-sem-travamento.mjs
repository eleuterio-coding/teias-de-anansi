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

const REV='20260831-tasha-metamagic1';
const SKILL_REV='20260831-tasha-metamagic1';
const WEALTH_REV='20260831-tasha-metamagic1';
assert.ok(html.includes(`character-builder.js?v=${REV}`),'A página precisa invalidar o carregador antigo em cache.');
assert.ok(loader.includes(`ui.js?v=${REV}`),'O núcleo da criação precisa usar a revisão anti-travamento.');
assert.ok(loader.includes(`class-skill-ui.js?v=${SKILL_REV}`),'A etapa de perícias precisa invalidar a revisão anterior após mudança mecânica.');
assert.ok(loader.includes(`equipment-ownership-ui.js?v=${REV}`),'Equipamento ativo precisa usar a revisão anti-travamento.');
assert.ok(loader.includes(`package-b-purchase-ui.js?v=${WEALTH_REV}`),'Carregador precisa invalidar a revisão antiga da etapa de compras/riqueza.');
assert.ok(packageB.includes(`wealth-purchase-ui.js?v=${WEALTH_REV}`),'Etapa de compras precisa invalidar a versão da loja anterior à correção de raridades.');
for(const [label,source] of [['núcleo',core],['Mago',wizardUi],['equipamento',equipmentUi]]){
 assert.ok(source.includes(`rules.js?v=${REV}`),`${label}: rules.js deve permanecer na revisão anti-travamento.`);
}
assert.ok(classUi.includes(`rules.js?v=${SKILL_REV}`),'Perícias devem carregar a revisão de rules.js que contém a integração de testes de perícia.');
assert.ok(classUi.includes('renderSkillChecks'),'A revisão dedicada de perícias precisa aplicar os valores mecânicos no preview.');

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

console.log('Criação validada sem regressão de cache, ping-pong de equipamento ou varredura repetida do catálogo do Mago; revisões mecânicas de perícias e riqueza isoladas e rastreadas.');
