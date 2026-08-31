import assert from 'node:assert/strict';
import{deriveSkillCheckMechanics}from'../scripts/character-builder/skill-check-mechanics.js';

const scores={Força:10,Destreza:10,Constituição:10,Inteligência:10,Sabedoria:10,Carisma:10};
const jackFeature={name:'Jack of All Trades'};

{
 const d={klass:{slug:'bard'},classFeatures:[jackFeature],pbonus:3,scores,skills:[],expertiseSkills:[]};
 const out=deriveSkillCheckMechanics(d);
 assert.equal(out.jackOfAllTrades.active,true);
 assert.equal(out.jackOfAllTrades.bonus,1);
 assert.equal(out.checks.Acrobacia.value,1);
 assert.equal(out.checks.Arcanismo.value,1);
 assert.equal(out.passivePerception,11);
}
{
 const d={klass:{slug:'bard'},classFeatures:[jackFeature],pbonus:3,scores,skills:['Percepção'],expertiseSkills:[]};
 const out=deriveSkillCheckMechanics(d);
 assert.equal(out.checks.Percepção.proficient,true);
 assert.equal(out.checks.Percepção.jackOfAllTrades,false);
 assert.equal(out.checks.Percepção.value,3);
 assert.equal(out.passivePerception,13);
}
{
 const d={klass:{slug:'bard'},classFeatures:[jackFeature],pbonus:3,scores,skills:['Percepção'],expertiseSkills:['Percepção']};
 const out=deriveSkillCheckMechanics(d);
 assert.equal(out.checks.Percepção.expertise,true);
 assert.equal(out.checks.Percepção.value,6);
 assert.equal(out.passivePerception,16);
}
{
 const d={klass:{slug:'fighter'},classFeatures:[],pbonus:3,scores,skills:[],expertiseSkills:[]};
 const out=deriveSkillCheckMechanics(d);
 assert.equal(out.jackOfAllTrades.active,false);
 assert.equal(out.checks.Acrobacia.value,0);
 assert.equal(out.passivePerception,10);
}
console.log('Testes de perícia validados: proficiência, especialização, Pau para Toda Obra e Percepção Passiva.');
