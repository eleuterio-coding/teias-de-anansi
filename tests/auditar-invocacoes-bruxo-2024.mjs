import assert from'node:assert/strict';
import fs from'node:fs';
import{state}from'../scripts/character-builder/state.js';
import{sanitizeInvocationSlots,invocationOutcome,invocationLimit,invocationEligibleOptions,invocationPrerequisiteResult}from'../scripts/character-builder/invocation-mechanics.js?v=20260831-tasha-metamagic1';

const data=JSON.parse(fs.readFileSync(new URL('../dados/invocacoes-bruxo-2024.json',import.meta.url),'utf8'));
assert.equal(data.schema,'hub-rpg/invocacoes-bruxo/v1');assert.equal(data.itens.length,28);assert.equal(data.controle.quantidade,28);assert.equal(Object.keys(data.progressao).length,20);
assert.deepEqual([data.progressao['1'],data.progressao['2'],data.progressao['5'],data.progressao['7'],data.progressao['9'],data.progressao['12'],data.progressao['15'],data.progressao['18']],[1,3,5,6,7,8,9,10]);
const ids=new Set(data.itens.map(x=>x.id));assert.equal(ids.size,28);
for(const id of['pact-of-the-blade','pact-of-the-chain','pact-of-the-tome','agonizing-blast','eldritch-spear','repelling-blast','lessons-of-the-first-ones','thirsting-blade','devouring-blade','lifedrinker','witch-sight'])assert.ok(ids.has(id),`Invocação ausente: ${id}`);
const byId=id=>data.itens.find(x=>x.id===id);
assert.equal(byId('lessons-of-the-first-ones').repeatable,true);assert.equal(byId('lessons-of-the-first-ones').escolha.tipo,'talento_origem');assert.equal(byId('devouring-blade').nivel_bruxo,12);assert.ok(byId('devouring-blade').requer_invocacoes.includes('thirsting-blade'));

state.catalogs.invocations=data.itens;state.catalogs.invocationProgression=data.progressao;
state.catalogs.classes=[{id:'warlock',slug:'warlock',name:'Bruxo'},{id:'wizard',slug:'wizard',name:'Mago'}];
state.catalogs.feats=[{id:'alert',name:'Alert',category:'Origem'},{id:'tough',name:'Tough',category:'Origem'},{id:'asi',name:'Ability Score Improvement',category:'Geral'}];
state.catalogs.weapons=[{id:'longsword',nome:'Espada Longa',categoria:'Marcial corpo a corpo'},{id:'longbow',nome:'Arco Longo',categoria:'Marcial à distância'}];
state.catalogs.spells=[
 {id:'eldritch-blast',name:'Eldritch Blast',originalName:'Eldritch Blast',level:0,classes:['Bruxo'],effectType:'Dano',damageType:'Energia',range:'120 ft',attackSave:'Ataque de magia à distância'},
 {id:'poison-spray',name:'Poison Spray',originalName:'Poison Spray',level:0,classes:['Bruxo'],effectType:'Dano',damageType:'Veneno',range:'30 ft',attackSave:'Constituição'},
 {id:'mage-hand',name:'Mage Hand',originalName:'Mage Hand',level:0,classes:['Mago'],range:'30 ft'},
 {id:'detect-magic',name:'Detect Magic',originalName:'Detect Magic',level:1,classes:['Mago'],ritual:true},
 {id:'identify',name:'Identify',originalName:'Identify',level:1,classes:['Mago'],ritual:true},
 {id:'find-familiar',name:'Find Familiar',originalName:'Find Familiar',level:1,classes:['Mago'],ritual:true}
];
state.c={refs:{class:'warlock'},choices:{class:{level:1},spells:{cantrips:['eldritch-blast']},warlockInvocations:{slots:[]},equipment:{}}};
assert.equal(invocationLimit(1),1);state.c.choices.class.level=2;assert.equal(invocationLimit(),3);state.c.choices.class.level=18;assert.equal(invocationLimit(),10);

state.c.choices.class.level=1;let eligible=invocationEligibleOptions();assert.ok(eligible.some(x=>x.id==='pact-of-the-blade'));assert.ok(!eligible.some(x=>x.id==='devouring-blade'));
state.c.choices.class.level=2;let check=invocationPrerequisiteResult(byId('agonizing-blast'),{consumer:'class',selectedIds:[]});assert.equal(check.ok,true,'Agonizing Blast deve ser elegível no nível 2 quando há truque de dano de Bruxo compatível.');
state.c.refs.class='wizard';check=invocationPrerequisiteResult(byId('pact-of-the-blade'),{consumer:'feat',selectedIds:[]});assert.equal(check.ok,true,'Pact of the Blade 2024 não possui pré-requisito e pode ser escolhido por Eldritch Adept sob a precedência atual.');check=invocationPrerequisiteResult(byId('agonizing-blast'),{consumer:'feat',selectedIds:[]});assert.equal(check.ok,false,'Invocação que exige níveis de Bruxo deve permanecer bloqueada para não-Bruxos.');
state.c.refs.class='warlock';

state.c.choices.class.level=2;let clean=sanitizeInvocationSlots([
 {id:'agonizing-blast',choice:{cantripId:'eldritch-blast'}},
 {id:'lessons-of-the-first-ones',choice:{featId:'alert'}},
 {id:'lessons-of-the-first-ones',choice:{featId:'tough'}}
],{consumer:'class',limit:3});
assert.equal(clean.pending.length,0);assert.equal(clean.selected.length,3);assert.equal(clean.slots[1].choice.featId,'alert');assert.equal(clean.slots[2].choice.featId,'tough');
clean=sanitizeInvocationSlots([
 {id:'lessons-of-the-first-ones',choice:{featId:'alert'}},
 {id:'lessons-of-the-first-ones',choice:{featId:'alert'}}
],{consumer:'class',limit:2});assert.equal(clean.slots[1].choice,null,'Repetição de Lessons exige Talento de Origem diferente.');assert.equal(clean.pending.length,1);

state.c.choices.class.level=12;clean=sanitizeInvocationSlots([{id:'devouring-blade',choice:null}],{consumer:'class',limit:1});assert.equal(clean.slots[0].id,'','Devouring Blade sem Thirsting Blade deve ser removida.');
clean=sanitizeInvocationSlots([{id:'pact-of-the-blade',choice:{weaponId:'longsword'}},{id:'thirsting-blade',choice:null},{id:'devouring-blade',choice:null}],{consumer:'class',limit:3});assert.equal(clean.slots[2].id,'devouring-blade','A cadeia Pact of the Blade → Thirsting Blade → Devouring Blade deve permanecer válida no nível 12.');

state.c.choices.class.level=2;clean=sanitizeInvocationSlots([{id:'pact-of-the-tome',choice:{cantrips:['mage-hand','eldritch-blast','poison-spray'],rituals:['detect-magic','identify']}}],{consumer:'class',limit:1});assert.equal(clean.pending.length,0);assert.equal(clean.slots[0].choice.cantrips.length,3);assert.equal(clean.slots[0].choice.rituals.length,2);

state.c.choices.class.level=2;state.c.choices.warlockInvocations={slots:[{id:'pact-of-the-blade',choice:{weaponId:'longsword'}},{id:'agonizing-blast',choice:{cantripId:'eldritch-blast'}},{id:'lessons-of-the-first-ones',choice:{featId:'alert'}}]};
const outcome=invocationOutcome();assert.equal(outcome.pending.length,0);assert.equal(outcome.pactWeaponId,'longsword');assert.equal(outcome.pactWeaponUsesCharisma,true);assert.ok(outcome.flags.includes('pactOfTheBlade'));

const savedInvocations=state.catalogs.invocations,savedProgression=state.catalogs.invocationProgression;
state.catalogs.invocations=[];state.catalogs.invocationProgression={};
clean=sanitizeInvocationSlots([{id:'pact-of-the-blade',choice:{weaponId:'longsword'}}],{consumer:'class',limit:1});
assert.equal(clean.catalogReady,false);assert.equal(clean.slots[0].id,'pact-of-the-blade','Estado salvo não pode ser apagado antes do catálogo carregar.');
state.catalogs.invocations=savedInvocations;state.catalogs.invocationProgression=savedProgression;

const rules=fs.readFileSync(new URL('../scripts/character-builder/rules.js',import.meta.url),'utf8');
const classUi=fs.readFileSync(new URL('../scripts/character-builder/class-skill-ui.js',import.meta.url),'utf8');
const invocationUi=fs.readFileSync(new URL('../scripts/character-builder/invocation-ui.js',import.meta.url),'utf8');
const spellModule=fs.readFileSync(new URL('../scripts/character-builder/spells.js',import.meta.url),'utf8');
assert.match(rules,/invocationOutcome/);assert.match(rules,/withSupplementalOriginFeats/);assert.match(rules,/tashaOriginFeatInstances/);assert.match(rules,/pactWeaponUsesCharisma/);assert.match(classUi,/initInvocationUi/);assert.match(invocationUi,/loadInvocations/);assert.match(spellModule,/damageType/);assert.match(spellModule,/attackSave/);
console.log('Invocações do Bruxo 2024 validadas: 28/28, progressão 1–20, pré-requisitos, repetição, Pactos e Lessons of the First Ones integrados ao pipeline compartilhado.');
