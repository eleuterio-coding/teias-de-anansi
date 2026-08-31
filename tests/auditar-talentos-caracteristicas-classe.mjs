import assert from'node:assert/strict';
import fs from'node:fs';
import{state,SKILL_AB}from'../scripts/character-builder/state.js';
import{classFeatureFeatGrants,featEligibleForClassGrant,classFeatureFeatInstances,sanitizeClassFeatureFeatSelections}from'../scripts/character-builder/class-feature-feat-mechanics.js';
import{FEAT_RULES,activeFeatInstances,featMechanicalOutcome,sanitizeFeatChoices}from'../scripts/character-builder/feat-mechanics.js';

const phb=JSON.parse(fs.readFileSync('dados/talentos-phb-2024.json','utf8'));
assert.equal(phb.itens.length,75,'PHB 2024 deve conter 75 talentos');
const counts=Object.fromEntries(['Origem','Geral','Estilo de Luta','Dádiva Épica'].map(category=>[category,phb.itens.filter(row=>row[1]===category).length]));
assert.deepEqual(counts,{Origem:10,Geral:43,'Estilo de Luta':10,'Dádiva Épica':12},'categorias PHB 2024 divergentes');
const styleNames=phb.itens.filter(row=>row[1]==='Estilo de Luta').map(row=>row[0]);
const boonNames=phb.itens.filter(row=>row[1]==='Dádiva Épica').map(row=>row[0]);
for(const name of[...styleNames,...boonNames])assert.ok(FEAT_RULES[name],`talento PHB sem regra mecânica: ${name}`);

const fighter={id:'fighter',slug:'fighter',name:'Guerreiro',spellAbility:'',proficiencies:['Armas marciais','Armadura pesada','Escudo'],proficienciesRaw:[],features:[{level:1,name:'Estilo de Luta'},{level:19,name:'Dádiva Épica'}],_houseFeatProgression:[]};
const feats=phb.itens.map((row,i)=>({id:`feat-${i}`,name:row[0],category:row[1],prereq:row[2],repeatable:/^sim/i.test(String(row[3])),description:row[4]}));
const archery=feats.find(x=>x.name==='Archery'),speed=feats.find(x=>x.name==='Boon of Speed'),athlete=feats.find(x=>x.name==='Athlete'),alert=feats.find(x=>x.name==='Alert');
assert.ok(archery&&speed&&athlete&&alert);
state.catalogs={classes:[fighter],species:[],backgrounds:[],subclasses:[],feats,armors:[],weapons:[],spells:[]};
state.c={refs:{class:'fighter',species:null,background:null,subclass:null},baseAbilities:{Força:16,Destreza:16,Constituição:14,Inteligência:10,Sabedoria:10,Carisma:10},choices:{class:{level:1,skills:[]},species:{traitChoices:{}},background:{},feats:{},classFeatureFeats:{fightingStyle:archery.id},featMechanics:{},equipment:{armor:null,shield:false,weapon:null},spells:{cantrips:[],leveled:[],arcanum:{}}}};

let grants=classFeatureFeatGrants(fighter,1);
assert.deepEqual(grants.map(x=>x.kind),['fightingStyle']);
assert.ok(featEligibleForClassGrant(archery,grants[0],{klass:fighter,level:1}));
assert.equal(featEligibleForClassGrant(athlete,grants[0],{klass:fighter,level:1}),false,'talento Geral não pode ocupar Fighting Style');
assert.deepEqual(classFeatureFeatInstances().map(x=>x.feat.name),['Archery']);
assert.ok(activeFeatInstances().some(x=>x.key==='class-feature:fighting-style'&&x.feat.name==='Archery'));
assert.equal(featMechanicalOutcome().rangedAttackBonus,2,'Archery deve produzir +2 de ataque à distância no outcome');

state.c.choices.class.level=19;state.c.choices.classFeatureFeats.epicBoon=speed.id;state.c.choices.featMechanics['class-feature:epic-boon']={ability:'Destreza'};
grants=classFeatureFeatGrants(fighter,19);const epic=grants.find(x=>x.kind==='epicBoon');assert.ok(epic,'Epic Boon deve surgir no nível 19');
assert.ok(featEligibleForClassGrant(speed,epic,{klass:fighter,level:19,scores:state.c.baseAbilities,classProficiencies:fighter.proficiencies}));
assert.ok(featEligibleForClassGrant(athlete,epic,{klass:fighter,level:19,scores:state.c.baseAbilities,classProficiencies:fighter.proficiencies}),'Epic Boon permite outro talento elegível');
assert.ok(featEligibleForClassGrant(alert,epic,{klass:fighter,level:19,scores:state.c.baseAbilities,classProficiencies:fighter.proficiencies}),'Epic Boon sem categoria fixa também admite Origem elegível');
sanitizeFeatChoices();let outcome=featMechanicalOutcome();assert.equal(outcome.speedBonus,30,'Boon of Speed deve adicionar 30 ft');assert.equal(outcome.abilityBonuses.Destreza,1);assert.equal(outcome.abilityCaps.Destreza,30,'Epic Boon deve registrar teto 30');

state.c.choices.class.level=18;assert.equal(sanitizeClassFeatureFeatSelections(),true);assert.equal(state.c.choices.classFeatureFeats.epicBoon,undefined,'Epic Boon deve ser removido abaixo do nível 19');

const ui=fs.readFileSync('scripts/character-builder/class-feature-feat-ui.js','utf8'),classUi=fs.readFileSync('scripts/character-builder/class-skill-ui.js','utf8');
assert.match(ui,/data-class-feature-feat-controls/);assert.match(ui,/Dádiva Épica ou outro talento elegível/);assert.match(classUi,/initClassFeatureFeatUi\(\)/);
assert.equal(Object.keys(SKILL_AB).length,18);
console.log(`Talentos de classe validados: ${counts.Origem} Origem, ${counts.Geral} Gerais, ${counts['Estilo de Luta']} Estilos de Luta e ${counts['Dádiva Épica']} Dádivas Épicas.`);
