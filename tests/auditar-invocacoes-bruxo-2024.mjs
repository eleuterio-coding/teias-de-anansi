import assert from'node:assert/strict';
import fs from'node:fs';
import{state}from'../scripts/character-builder/state.js';
import{invocationLimit,invocationPrerequisiteResult,sanitizeInvocationSlots,sanitizeWarlockInvocations,invocationOutcome,invocationOriginFeatInstances}from'../scripts/character-builder/invocation-mechanics.js';

const data=JSON.parse(fs.readFileSync(new URL('../dados/invocacoes-bruxo-2024.json',import.meta.url),'utf8'));
assert.equal(data.schema,'hub-rpg/invocacoes-bruxo/v1');
assert.equal(data.fonte.autoridade,'oficial_atual');
assert.equal(data.fonte.ruleset,'5.5e');
assert.equal(data.controle.quantidade,28);
assert.equal(data.itens.length,28);
assert.equal(new Set(data.itens.map(x=>x.id)).size,28,'IDs de Invocações devem ser únicos.');
for(const item of data.itens)for(const req of item.requer_invocacoes||[])assert.ok(data.itens.some(x=>x.id===req),`${item.nome} referencia Invocação inexistente: ${req}.`);
assert.deepEqual(Object.fromEntries(['1','2','5','7','9','12','15','18','20'].map(k=>[k,data.progressao[k]])),{'1':1,'2':3,'5':5,'7':6,'9':7,'12':8,'15':9,'18':10,'20':10});
assert.equal(data.itens.filter(x=>x.repeatable).length,4,'A lista auditada deve manter quatro Invocações repetíveis.');

const spells=[
 {id:'eb',name:'Eldritch Blast',originalName:'Eldritch Blast',level:0,classes:['Bruxo'],effectType:'Dano',damageType:'Força',range:'120 ft',attackSave:'Ataque de magia à distância'},
 {id:'ts',name:'Toll the Dead',originalName:'Toll the Dead',level:0,classes:['Bruxo'],effectType:'Dano',damageType:'Necrótico',range:'60 ft',attackSave:'Salvaguarda'},
 {id:'guidance',name:'Guidance',originalName:'Guidance',level:0,classes:['Clérigo'],effectType:'Magia'},
 {id:'firebolt',name:'Fire Bolt',originalName:'Fire Bolt',level:0,classes:['Mago'],effectType:'Dano',damageType:'Fogo',range:'120 ft',attackSave:'Ataque de magia à distância'},
 {id:'identify',name:'Identify',originalName:'Identify',level:1,classes:['Mago'],ritual:true},
 {id:'detect-magic',name:'Detect Magic',originalName:'Detect Magic',level:1,classes:['Mago'],ritual:true},
 {id:'mage-armor',name:'Mage Armor',originalName:'Mage Armor',level:1,classes:['Mago']},
 {id:'levitate',name:'Levitate',originalName:'Levitate',level:2,classes:['Mago']},
 {id:'false-life',name:'False Life',originalName:'False Life',level:1,classes:['Mago']},
 {id:'water-breathing',name:'Water Breathing',originalName:'Water Breathing',level:3,classes:['Mago']},
 {id:'disguise-self',name:'Disguise Self',originalName:'Disguise Self',level:1,classes:['Mago']},
 {id:'alter-self',name:'Alter Self',originalName:'Alter Self',level:2,classes:['Mago']},
 {id:'silent-image',name:'Silent Image',originalName:'Silent Image',level:1,classes:['Mago']},
 {id:'invisibility',name:'Invisibility',originalName:'Invisibility',level:2,classes:['Mago']},
 {id:'jump',name:'Jump',originalName:'Jump',level:1,classes:['Mago']},
 {id:'find-familiar',name:'Find Familiar',originalName:'Find Familiar',level:1,classes:['Mago']},
 {id:'arcane-eye',name:'Arcane Eye',originalName:'Arcane Eye',level:4,classes:['Mago']},
 {id:'speak-with-dead',name:'Speak with Dead',originalName:'Speak with Dead',level:3,classes:['Clérigo']}
];
const feats=[{id:'alert',name:'Alert',category:'Origem'},{id:'tough',name:'Tough',category:'Origem'},{id:'actor',name:'Actor',category:'Geral'}];
const weapons=[{id:'longsword',nome:'Espada Longa',categoria:'Marcial corpo a corpo'},{id:'longbow',nome:'Arco Longo',categoria:'Marcial à distância'}];
state.catalogs.classes=[{id:'warlock',slug:'warlock',name:'Bruxo'},{id:'fighter',slug:'fighter',name:'Guerreiro'}];
state.catalogs.invocations=data.itens;
state.catalogs.invocationProgression=data.progressao;
state.catalogs.spells=spells;
state.catalogs.feats=feats;
state.catalogs.weapons=weapons;
state.c={refs:{class:'warlock'},choices:{class:{level:1},spells:{cantrips:['eb','ts']},warlockInvocations:{slots:[]}}};
assert.equal(invocationLimit(1),1);assert.equal(invocationLimit(2),3);assert.equal(invocationLimit(18),10);

let clean=sanitizeInvocationSlots([{id:'armor-of-shadows'}],{consumer:'class',limit:1});
assert.equal(clean.selected[0].invocation.id,'armor-of-shadows');
assert.equal(clean.pending.length,0);
state.c.refs.class='fighter';
clean=sanitizeInvocationSlots([{id:'armor-of-shadows'}],{consumer:'class',limit:1});
assert.equal(clean.limit,0,'Invocações de classe devem sumir fora do Bruxo.');
assert.equal(invocationPrerequisiteResult(data.itens.find(x=>x.id==='armor-of-shadows'),{consumer:'feat',selectedIds:[]}).ok,true,'Eldritch Adept pode usar opção sem pré-requisito fora do Bruxo.');
assert.equal(invocationPrerequisiteResult(data.itens.find(x=>x.id==='agonizing-blast'),{consumer:'feat',selectedIds:[]}).ok,false,'Invocação com requisito de Bruxo deve bloquear personagem não-Bruxo.');
state.c.refs.class='warlock';state.c.choices.class.level=2;
clean=sanitizeInvocationSlots([{id:'devils-sight'},{id:'devils-sight'},{id:'armor-of-shadows'}],{consumer:'class',limit:3});
assert.equal(clean.selected.filter(x=>x.invocation.id==='devils-sight').length,1,'Invocação não repetível não pode duplicar.');

clean=sanitizeInvocationSlots([{id:'agonizing-blast',choice:{cantripId:'eb'}},{id:'agonizing-blast',choice:{cantripId:'ts'}},{id:'armor-of-shadows'}],{consumer:'class',limit:3});
assert.equal(clean.selected.filter(x=>x.invocation.id==='agonizing-blast').length,2);
assert.equal(clean.pending.length,0,'Repetições válidas com truques diferentes devem fechar.');
clean=sanitizeInvocationSlots([{id:'agonizing-blast',choice:{cantripId:'eb'}},{id:'agonizing-blast',choice:{cantripId:'eb'}},{id:'armor-of-shadows'}],{consumer:'class',limit:3});
assert.equal(clean.slots[1].choice,null,'A mesma escolha não pode ser repetida em Agonizing Blast.');
assert.ok(clean.pending.some(x=>x.slot===1&&x.type==='choice'));

state.c.choices.class.level=12;
clean=sanitizeInvocationSlots([{id:'devouring-blade'},{id:'armor-of-shadows'},{id:'eldritch-mind'},{id:'devils-sight'},{id:'mask-of-many-faces'},{id:'misty-visions'},{id:'otherworldly-leap'},{id:'whispers-of-the-grave'}],{consumer:'class',limit:8});
assert.ok(!clean.selected.some(x=>x.invocation.id==='devouring-blade'),'Devouring Blade sem cadeia de pré-requisitos deve ser removida.');
clean=sanitizeInvocationSlots([{id:'pact-of-the-blade',choice:{weaponId:'longsword'}},{id:'thirsting-blade'},{id:'devouring-blade'},{id:'armor-of-shadows'},{id:'eldritch-mind'},{id:'devils-sight'},{id:'mask-of-many-faces'},{id:'misty-visions'}],{consumer:'class',limit:8});
assert.ok(clean.selected.some(x=>x.invocation.id==='devouring-blade'),'A cadeia Pact of the Blade → Thirsting Blade → Devouring Blade deve ser válida.');

state.c.choices.class.level=1;state.c.choices.warlockInvocations.slots=[{id:'pact-of-the-tome',choice:{cantrips:['eb','guidance','firebolt'],rituals:['identify','detect-magic']}}];
let outcome=invocationOutcome();
assert.equal(outcome.spellGrants.length,5,'Pact of the Tome deve conceder três truques e dois rituais.');
assert.ok(outcome.flags.includes('pactOfTheTome'));

state.c.choices.class.level=2;state.c.choices.warlockInvocations.slots=[{id:'lessons-of-the-first-ones',choice:{featId:'alert'}},{id:'lessons-of-the-first-ones',choice:{featId:'tough'}},{id:'armor-of-shadows'}];
outcome=invocationOutcome();
assert.deepEqual(new Set(outcome.originFeatIds),new Set(['alert','tough']));
assert.equal(invocationOriginFeatInstances().length,2,'Lessons of the First Ones deve gerar instâncias reais de Talentos de Origem.');

state.c.choices.class.level=1;state.c.choices.warlockInvocations.slots=[{id:'pact-of-the-blade',choice:{weaponId:'longsword'}}];
outcome=invocationOutcome();
assert.equal(outcome.pactWeaponId,'longsword');
assert.equal(outcome.pactWeaponUsesCharisma,true);
assert.ok(outcome.flags.includes('pactOfTheBlade'));

const savedInvocations=state.catalogs.invocations,savedProgression=state.catalogs.invocationProgression;
state.catalogs.invocations=[];state.catalogs.invocationProgression={};
clean=sanitizeInvocationSlots([{id:'pact-of-the-blade',choice:{weaponId:'longsword'}}],{consumer:'class',limit:1});
assert.equal(clean.catalogReady,false);assert.equal(clean.slots[0].id,'pact-of-the-blade','Estado salvo não pode ser apagado antes do catálogo carregar.');
state.catalogs.invocations=savedInvocations;state.catalogs.invocationProgression=savedProgression;

const rules=fs.readFileSync(new URL('../scripts/character-builder/rules.js',import.meta.url),'utf8');
const classUi=fs.readFileSync(new URL('../scripts/character-builder/class-skill-ui.js',import.meta.url),'utf8');
const invocationUi=fs.readFileSync(new URL('../scripts/character-builder/invocation-ui.js',import.meta.url),'utf8');
const spellModule=fs.readFileSync(new URL('../scripts/character-builder/spells.js',import.meta.url),'utf8');
assert.match(rules,/invocationOutcome/);assert.match(rules,/withInvocationOriginFeats/);assert.match(rules,/pactWeaponUsesCharisma/);assert.match(classUi,/initInvocationUi/);assert.match(invocationUi,/loadInvocations/);assert.match(spellModule,/damageType/);assert.match(spellModule,/attackSave/);
console.log('Invocações do Bruxo 2024 validadas: 28/28, progressão 1–20, pré-requisitos, repetição, Pactos e Lessons of the First Ones integrados.');
