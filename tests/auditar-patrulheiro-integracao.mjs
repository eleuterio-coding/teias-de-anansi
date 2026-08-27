import fs from'node:fs';
import assert from'node:assert/strict';
import{applyRangerSubclassRuleDetails}from'../scripts/character-builder/ranger-subclass-details.js';

const rules=fs.readFileSync('scripts/character-builder/rules.js','utf8'),ui=fs.readFileSync('scripts/character-builder/ranger-subclass-ui.js','utf8'),sharedSkills=fs.readFileSync('scripts/character-builder/expertise-companion-ui.js','utf8');
assert.ok(rules.includes('applyRangerSubclassMechanics(d)')&&rules.includes('applyRangerSubclassRuleDetails(d)'),'derive() deve aplicar motor e detalhes de Patrulheiro.');
for(const token of['data-ranger-subclass-pending','data-ranger-subclass-combat','data-ranger-subclass-spells'])assert.ok(ui.includes(token),`Integração visual ausente: ${token}`);
assert.ok(sharedSkills.includes('subclassSkillBonuses?.[skill]'),'Bônus de perícia de subclasse não chega ao quadro compartilhado de perícias.');
{
 const d={klass:{slug:'ranger'},subclassMechanics:{name:'Fey Wanderer'},scores:{Sabedoria:18},subclassAbilityCheckBonuses:{},subclassSkillBonuses:{}};applyRangerSubclassRuleDetails(d);assert.equal(d.subclassAbilityCheckBonuses.Carisma,4,'Otherworldly Glamour deve somar SAB em checks de Carisma.');for(const skill of['Enganação','Intimidação','Atuação','Persuasão'])assert.equal(d.subclassSkillBonuses[skill],4,`Otherworldly Glamour não chegou a ${skill}.`)
}
{
 const d={klass:{slug:'ranger'},subclassMechanics:{name:'Gloom Stalker',senses:[{name:'Darkvision',range:60,stack:'se já possuir, +60 ft'}]},scores:{Sabedoria:18},initiative:5};applyRangerSubclassRuleDetails(d);assert.equal(d.initiative,9,'Gloom Stalker deve somar SAB à Iniciativa.');assert.deepEqual(d.subclassDarkvision,{range:60,stack:'se já possuir, +60 ft'});
}
console.log('Integração de Patrulheiro validada: derive, Glamour feérico, perícias, iniciativa, Darkvision, combate, magias e pendências.');
