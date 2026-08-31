import assert from'node:assert/strict';
import fs from'node:fs';
import{state}from'../scripts/character-builder/state.js';
import{featRule}from'../scripts/character-builder/feat-mechanics.js';
import{sanitizeTashaFeatChoices,activeTashaFeatInstances,applyTashaFeatEffects,tashaOriginFeatInstances,TASHA_FEAT_NAMES}from'../scripts/character-builder/tasha-feat-mechanics.js';

const source=JSON.parse(fs.readFileSync(new URL('../dados/talentos-tasha-2020.json',import.meta.url),'utf8'));
const inv=JSON.parse(fs.readFileSync(new URL('../dados/invocacoes-bruxo-2024.json',import.meta.url),'utf8'));
const meta=JSON.parse(fs.readFileSync(new URL('../dados/metamagias-feiticeiro-2024.json',import.meta.url),'utf8'));
assert.deepEqual(source.itens.map(x=>x[0]),TASHA_FEAT_NAMES);assert.equal(source.itens.length,5);
const tashaFeats=TASHA_FEAT_NAMES.map((name,i)=>({id:`tasha-${i}`,name,category:'Geral',ruleset:'5e',compatibleWith:['5.5e'],source:"Tasha's Cauldron of Everything"}));
const originFeats=[{id:'alert-origin',name:'Alert',category:'Origem'},{id:'tough-origin',name:'Tough',category:'Origem'}];
state.catalogs.feats=[...tashaFeats,...originFeats];
state.catalogs.invocations=inv.itens;state.catalogs.invocationProgression=inv.progressao;state.catalogs.metamagic=meta.itens;state.catalogs.metamagicProgression=meta.progressao;
state.catalogs.spells=[
 {id:'mending',name:'Mending',originalName:'Mending',level:0,classes:['Artífice']},
 {id:'guidance',name:'Guidance',originalName:'Guidance',level:0,classes:['Artífice','Clérigo']},
 {id:'cure-wounds',name:'Cure Wounds',originalName:'Cure Wounds',level:1,classes:['Artífice','Clérigo']},
 {id:'faerie-fire',name:'Faerie Fire',originalName:'Faerie Fire',level:1,classes:['Artífice']},
 {id:'fire-bolt',name:'Fire Bolt',originalName:'Fire Bolt',level:0,classes:['Mago'],effectType:'Dano',damageType:'Fogo',range:'120 ft',attackSave:'Ataque de magia à distância'},
 {id:'mage-armor',name:'Mage Armor',originalName:'Mage Armor',level:1,classes:['Mago']}
];
state.catalogs.weapons=[{id:'longbow',nome:'Arco Longo',categoria:'Marcial à distância'},{id:'longsword',nome:'Espada Longa',categoria:'Marcial corpo a corpo'}];
const klass={id:'wizard',slug:'wizard',name:'Mago',spellAbility:'Inteligência',_houseFeatProgression:TASHA_FEAT_NAMES.map((_,i)=>({level:4,slot:`t${i}`,kind:'house'})),featSlots:[4,4,4,4,4]};state.catalogs.classes=[klass,{id:'warlock',slug:'warlock',name:'Bruxo',spellAbility:'Carisma',_houseFeatProgression:[{level:4,slot:'eld',kind:'house'}]}];
state.c={refs:{class:'wizard'},baseAbilities:{Força:10,Destreza:14,Constituição:12,Inteligência:16,Sabedoria:10,Carisma:12},choices:{class:{level:4,skills:[]},feats:Object.fromEntries(TASHA_FEAT_NAMES.map((_,i)=>[`t${i}`,`tasha-${i}`])),spells:{cantrips:[],leveled:[]},equipment:{armor:null,weapon:'longbow',shield:false},tashaFeatMechanics:{'class:t0':{tool:'Ferramentas de Ferreiro',cantripId:'mending',spellId:'cure-wounds'},'class:t1':{invocation:{id:'armor-of-shadows',choice:null}},'class:t2':{style:'Archery'},'class:t4':{metamagicIds:['careful-spell','twinned-spell']}},warlockInvocations:{slots:[]},sorcererMetamagic:{options:[]}}};
assert.equal(activeTashaFeatInstances().length,5);
let clean=sanitizeTashaFeatChoices();assert.equal(clean['class:t0'].tool,'Ferramentas de Ferreiro');assert.equal(clean['class:t0'].cantripId,'mending');assert.equal(clean['class:t1'].invocation.id,'armor-of-shadows');assert.equal(clean['class:t2'].style,'Archery');assert.deepEqual(clean['class:t4'].metamagicIds,['careful-spell','twinned-spell']);
assert.ok(featRule({name:'Gunner'}),'Gunner deve estar registrado no mapa mecânico principal.');assert.deepEqual(featRule({name:'Gunner'}).ability.options,['Destreza']);assert.ok(featRule({name:'Gunner'}).weaponTraining.includes('Armas de fogo'));
const d={level:4,pbonus:2,scores:{Força:10,Destreza:15,Constituição:12,Inteligência:16,Sabedoria:10,Carisma:12},tools:[],featSpells:[],featSpellcasting:[],featResources:[],featMechanics:{combatFlags:[]},weapon:state.catalogs.weapons[0],attack:5,ac:12,armor:null,unarmedDamage:null,metamagicOptions:[],sorceryPointsBonus:0,invocationFlags:[],invocationSpells:[],invocationSenses:{},cantripInvocationModifiers:{},speed:30};
applyTashaFeatEffects(d);assert.ok(d.tools.includes('Ferramentas de Ferreiro'));assert.deepEqual(new Set(d.featSpells.map(x=>x.id)),new Set(['mending','cure-wounds']));assert.ok(d.featSpellcasting.some(x=>x.ability==='Inteligência'));assert.ok(d.legacyInvocationEffects.some(x=>x.source==='Eldritch Adept'&&x.flags.includes('armorOfShadows')));assert.equal(d.attack,7,'Archery de Fighting Initiate deve acrescentar +2 ao ataque à distância.');assert.ok(d.fightingStyles.includes('Archery'));assert.deepEqual(new Set(d.metamagicOptions),new Set(['careful-spell','twinned-spell']));assert.equal(d.sorceryPointsBonus,2);assert.ok(d.featResources.some(x=>x.label.includes('Metamagic Adept')&&x.max===2));

state.c.refs.class='warlock';state.c.choices.class.level=4;state.c.choices.feats={eld:'tasha-1'};state.c.choices.tashaFeatMechanics={'class:eld':{invocation:{id:'lessons-of-the-first-ones',choice:{featId:'alert-origin'}}}};const origin=tashaOriginFeatInstances();assert.equal(origin.length,1);assert.equal(origin[0].feat.id,'alert-origin','Eldritch Adept deve propagar Lessons of the First Ones como talento de Origem real quando o Bruxo cumpre o pré-requisito.');

state.c.refs.class='wizard';state.c.choices.feats={t0:'tasha-0'};state.c.choices.tashaFeatMechanics={'class:t0':{tool:'Ferramentas de Ferreiro',cantripId:'fire-bolt',spellId:'cure-wounds'}};clean=sanitizeTashaFeatChoices();assert.equal(clean['class:t0'].cantripId,null,'Artificer Initiate deve rejeitar truque fora da lista de Artífice.');

const ui=fs.readFileSync(new URL('../scripts/character-builder/tasha-feat-ui.js',import.meta.url),'utf8');const rules=fs.readFileSync(new URL('../scripts/character-builder/feat-rules-tasha-2020.js',import.meta.url),'utf8');assert.match(ui,/Eldritch Adept/);assert.match(ui,/Metamagic Adept/);assert.match(rules,/gunnerIgnoreLoading/);
console.log('Talentos Tasha 2020 validados: 5/5, com Artificer Initiate, Eldritch Adept, Fighting Initiate, Gunner e Metamagic Adept mecanizados.');
