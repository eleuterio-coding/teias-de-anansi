import fs from'node:fs';
import assert from'node:assert/strict';
import{applyMonkSubclassRuleDetails}from'../scripts/character-builder/monk-subclass-details.js';

const rules=fs.readFileSync('scripts/character-builder/rules.js','utf8'),ui=fs.readFileSync('scripts/character-builder/monk-subclass-ui.js','utf8');
assert.ok(rules.includes('applyMonkSubclassMechanics(d)')&&rules.includes('applyMonkSubclassRuleDetails(d)'),'derive() deve aplicar motor e detalhes globais do Monge.');
for(const token of['data-monk-subclass-pending','data-monk-subclass-combat','data-monk-subclass-spells'])assert.ok(ui.includes(token),`Integração visual ausente: ${token}`);
{
 const d={klass:{slug:'monk'},subclassMechanics:{name:'Way of the Kensei',choices:{kenseiMelee:'longsword',kenseiRanged:'longbow'},martialArtsDie:'d12'},weapon:{id:'longsword'},scores:{Destreza:20},pbonus:6,wprof:false,wAbility:'Força',attack:5};
 applyMonkSubclassRuleDetails(d);assert.equal(d.wprof,true,'Arma Kensei escolhida deve conceder proficiência efetiva.');assert.equal(d.wAbility,'Destreza','Arma Kensei deve participar de Martial Arts usando Destreza.');assert.equal(d.attack,11,'Ataque da arma Kensei deve receber DES + PB.');assert.equal(d.kenseiWeaponDamageDie,'d12','Arma Kensei deve registrar o dado atual de Artes Marciais.')
}
{
 const d={klass:{slug:'monk'},subclassMechanics:{name:'Warrior of Shadow',senses:[{name:'Darkvision',range:60,stack:'se já possuir, +60 ft'}]}};applyMonkSubclassRuleDetails(d);assert.deepEqual(d.subclassDarkvision,{range:60,stack:'se já possuir, +60 ft'},'Darkvision de Shadow deve chegar à ficha derivada.')
}
console.log('Integração de Monge validada: derive, Kensei, Shadow, combate, magias e pendências.');
