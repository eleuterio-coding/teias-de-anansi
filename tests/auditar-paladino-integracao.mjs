import fs from'node:fs';
import assert from'node:assert/strict';
import{applyPaladinSubclassRuleDetails}from'../scripts/character-builder/paladin-subclass-details.js';

const rules=fs.readFileSync('scripts/character-builder/rules.js','utf8'),ui=fs.readFileSync('scripts/character-builder/paladin-subclass-ui.js','utf8');
assert.ok(rules.includes('applyPaladinSubclassMechanics(d)')&&rules.includes('applyPaladinSubclassRuleDetails(d)'),'derive() deve aplicar motor e detalhes globais do Paladino.');
for(const token of['data-paladin-subclass-pending','data-paladin-subclass-combat','data-paladin-subclass-spells'])assert.ok(ui.includes(token),`Integração visual ausente: ${token}`);
{
 const d={klass:{slug:'paladin'},subclassMechanics:{name:'Oath of Glory'},level:20,speed:30};applyPaladinSubclassRuleDetails(d);assert.equal(d.speed,40,'Aura of Alacrity deve somar +10 ft ao Speed próprio.');assert.equal(d.glorySpeedBonus,10)
}
{
 const d={klass:{slug:'paladin'},subclassMechanics:{name:'Oath of the Watchers'},level:20,initiative:2,pbonus:6};applyPaladinSubclassRuleDetails(d);assert.equal(d.initiative,8,'Aura of the Sentinel deve somar PB à Iniciativa própria.');assert.equal(d.sentinelInitiativeBonus,6)
}
{
 globalThis.window=globalThis.window||{};const d={klass:{slug:'paladin'},subclassMechanics:{name:'Oath of the Noble Genies'},level:20,armor:null,ac:14,scores:{Destreza:14,Carisma:18},featMechanics:{acBonus:0}};
 const old=globalThis.state;try{const{state}=await import('../scripts/character-builder/state.js');state.c={choices:{equipment:{shield:true}}};applyPaladinSubclassRuleDetails(d);assert.equal(d.ac,18,"Genie's Splendor deve calcular 10 + DEX + CHA e permitir escudo.");assert.equal(d.genieSplendorAC,18)}finally{void old}
}
console.log('Integração de Paladino validada: derive, Glory, Watchers, Noble Genies, combate, magias e pendências.');
