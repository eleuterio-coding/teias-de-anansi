import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {state} from '../scripts/character-builder/state.js';
import {XANATHAR_2017_FEAT_NAMES,XANATHAR_2017_FEAT_RULES} from '../scripts/character-builder/feat-rules-xanathar-2017.js';
import {featRule,featMechanicalOutcome,featEligibleSpells,sanitizeFeatChoices} from '../scripts/character-builder/feat-mechanics.js';
import {languageGrantDefinitions} from '../scripts/character-builder/language-mechanics.js';
import {derive as deriveBase} from '../scripts/character-builder/rules-base.js';

const source=JSON.parse(readFileSync('dados/talentos-xanathar-2017.json','utf8'));
const names=source.itens.map(row=>row[0]);
assert.equal(names.length,15,'O catálogo ativo de Xanathar deve conter exatamente 15 talentos.');
assert.deepEqual(new Set(XANATHAR_2017_FEAT_NAMES),new Set(names),'Todo talento Xanathar ativo deve possuir regra mecânica própria e vice-versa.');

const feat=(name)=>({id:`feat:${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,name,category:'Geral',prereq:source.itens.find(r=>r[0]===name)?.[2]||'',repeatable:false,description:source.itens.find(r=>r[0]===name)?.[4]||'',ruleset:'5e',compatibleWith:['5.5e']});
const feats=names.map(feat);
const spells=[
 {id:'detect-magic',name:'Detect Magic',originalName:'Detect Magic',level:1,classes:['Wizard','Mago'],school:'Divination'},
 {id:'levitate',name:'Levitate',originalName:'Levitate',level:2,classes:['Wizard','Mago'],school:'Transmutation'},
 {id:'dispel-magic',name:'Dispel Magic',originalName:'Dispel Magic',level:3,classes:['Wizard','Mago'],school:'Abjuration'},
 {id:'misty-step',name:'Misty Step',originalName:'Misty Step',level:2,classes:['Wizard','Mago'],school:'Conjuration'},
 {id:'longstrider',name:'Longstrider',originalName:'Longstrider',level:1,classes:['Druid','Druida','Wizard'],school:'Transmutation'},
 {id:'pass-without-trace',name:'Pass Without Trace',originalName:'Pass Without Trace',level:2,classes:['Druid','Druida'],school:'Abjuration'},
 {id:'guidance',name:'Guidance',originalName:'Guidance',level:0,classes:['Druid','Druida','Cleric'],school:'Divination'},
 {id:'fire-bolt',name:'Fire Bolt',originalName:'Fire Bolt',level:0,classes:['Wizard','Mago'],school:'Evocation'}
];
const klass={id:'class:fighter',slug:'fighter',name:'Guerreiro',hitDie:10,savingThrows:['Força','Constituição'],proficiencies:['Armas marciais','Todas as armaduras','Escudos'],proficienciesRaw:['Martial Weapons','All Armor','Shields'],skillChoices:[],features:[],levels:[],featSlots:[],spellAbility:''};
const species={id:'species:test',name:'Dragonborn',ruleset:'5.5e',sizes:['Medium'],speed:30,abilityBonuses:[],traits:[],lineages:[]};
const bg={id:'bg:test',name:'Antecedente de Teste',ruleset:'5.5e',abilities:[],skills:[],tools:[],languages:[],feat:null};
state.catalogs.classes=[klass];state.catalogs.species=[species];state.catalogs.backgrounds=[bg];state.catalogs.subclasses=[];state.catalogs.feats=feats;state.catalogs.spells=spells;state.catalogs.armors=[];state.catalogs.weapons=[];

function select(name,{level=6,speciesName='Dragonborn',mechanics={}}={}){
 species.name=speciesName;species.originalName=speciesName;
 const f=feats.find(x=>x.name===name);assert.ok(f,`Talento ausente: ${name}`);
 state.c={refs:{class:klass.id,species:species.id,background:bg.id,subclass:null},baseAbilities:{Força:14,Destreza:14,Constituição:14,Inteligência:14,Sabedoria:14,Carisma:14},choices:{class:{level,skills:[],equipment:'A'},species:{size:null,lineage:null,traitChoices:{}},background:{abilityMode:'2+1',plus2:null,plus1:null,plusOnes:[],equipment:'A',toolChoice:'',originFeat:null},feats:{'house-6':f.id},featMechanics:{'class:house-6':mechanics},houseAbilities:{},classFeatureFeats:{},equipment:{armor:null,shield:false,weapon:null},spells:{cantrips:[],leveled:[],arcanum:{}}},sheet:{profile:{languages:''}}};
 klass._houseOriginalFeatSlots=[];klass._houseFeatProgression=[{level:6,kind:'house',slot:'house-6',legacySlot:'slot-6-0'}];
 return f
}

for(const name of names)assert.ok(featRule(feats.find(x=>x.name===name)),`${name}: regra precisa ser registrada no motor central.`);

select('Dragon Hide',{mechanics:{ability:'Constituição'}});
let out=featMechanicalOutcome();
assert.equal(out.abilityBonuses.Constituição,1);
assert.equal(out.naturalArmorBase,13);
assert.match(out.unarmedDamage,/1d4/i);
let derived=deriveBase();
assert.equal(derived.ac,15,'Dragon Hide deve produzir CA 13 + Destreza quando não há armadura.');

select('Infernal Constitution');out=featMechanicalOutcome();
assert.equal(out.abilityBonuses.Constituição,1);
assert.deepEqual(new Set(out.resistances),new Set(['Frio','Veneno']));
assert.ok(out.combatFlags.includes('advantageSavesAgainstPoison'));

select('Squat Nimbleness',{mechanics:{ability:'Destreza',skill:'Atletismo'}});sanitizeFeatChoices();out=featMechanicalOutcome();
assert.equal(out.abilityBonuses.Destreza,1);
assert.equal(out.speedBonus,5);
assert.ok(out.skills.includes('Atletismo'));

select('Drow High Magic');out=featMechanicalOutcome();
assert.deepEqual(new Set(out.spells.map(s=>s.name)),new Set(['Detect Magic','Levitate','Dispel Magic']));
assert.equal(out.spellcasting[0]?.ability,'Carisma');
assert.ok(out.combatFlags.includes('detectMagicAtWill'));

select('Wood Elf Magic',{speciesName:'Wood Elf',mechanics:{cantrip:['guidance']}});sanitizeFeatChoices();
const def=Object.values(XANATHAR_2017_FEAT_RULES['Wood Elf Magic'].choices)[0]||XANATHAR_2017_FEAT_RULES['Wood Elf Magic'].choices[0];
const eligible=featEligibleSpells({...def,instanceKey:'class:house-6'},'class:house-6').map(s=>s.name);
assert.ok(eligible.includes('Guidance'),'Wood Elf Magic deve aceitar truques da lista de Druida.');
assert.ok(!eligible.includes('Fire Bolt'),'Wood Elf Magic não pode aceitar truques fora da lista de Druida.');
out=featMechanicalOutcome();
assert.deepEqual(new Set(out.spells.map(s=>s.name)),new Set(['Guidance','Longstrider','Pass Without Trace']));
assert.equal(out.spellcasting[0]?.ability,'Sabedoria');

select('Fey Teleportation',{speciesName:'High Elf',mechanics:{ability:'Inteligência'}});
let defs=languageGrantDefinitions();
assert.ok(defs.some(d=>d.label.startsWith('Fey Teleportation')&&d.fixed.includes('Silvestre')),'Fey Teleportation deve conceder Silvestre de forma estruturada.');

select('Prodigy',{speciesName:'Human',mechanics:{skill:'Percepção',tool:['Ferramentas de Ladrão'],expertise:'Percepção'}});sanitizeFeatChoices();out=featMechanicalOutcome();
assert.ok(out.skills.includes('Percepção'));
assert.ok(out.tools.includes('Ferramentas de Ladrão'));
assert.ok(out.expertise.includes('Percepção'));
defs=languageGrantDefinitions();
assert.ok(defs.some(d=>d.label.startsWith('Prodigy')&&d.choose===1),'Prodigy deve criar uma escolha estruturada de idioma.');

for(const [name,rule] of Object.entries(XANATHAR_2017_FEAT_RULES)){
 assert.ok(rule&&typeof rule==='object',`${name}: regra inválida.`);
 if(['Bountiful Luck','Dragon Fear','Dragon Hide','Dwarven Fortitude','Elven Accuracy','Fade Away','Flames of Phlegethos','Orcish Fury','Second Chance','Squat Nimbleness'].includes(name))assert.ok(rule.combatFlags?.length,`${name}: efeito ativo precisa permanecer rastreável por flag mecânica.`);
}

console.log('Talentos Xanathar 2017 validados: 15/15 com ASIs, perícias, idiomas, magias, resistências, armadura natural e flags mecânicas estruturadas.');