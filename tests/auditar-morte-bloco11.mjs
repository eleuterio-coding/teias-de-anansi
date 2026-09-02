import assert from'node:assert/strict';
import{rollDeathSave,deathState,applyDamageAtZeroConsequences,applyHealingDeathConsequences,stabilizeCharacter,resetDeathState}from'../scripts/character-sheet-death-rules.js';

const seq=(...values)=>{let i=0;return()=>values[Math.min(i++,values.length-1)]};
const character={sheet:{runtime:{currentHp:0,tempHp:0,exhaustion:1}},choices:{}};
let result=rollDeathSave(character,{rng:seq(.55)});assert.equal(result.ok,true);assert.equal(result.roll.natural,12);assert.equal(result.roll.total,10,'Exaustão 1 reduz a Salvaguarda contra a Morte em 2.');assert.equal(deathState(character).successes,1);
result=rollDeathSave(character,{rng:seq(0)});assert.equal(result.roll.natural,1);assert.equal(deathState(character).failures,2,'1 natural causa duas falhas.');
resetDeathState(character);result=rollDeathSave(character,{rng:seq(.99)});assert.equal(result.revived,true);assert.equal(character.sheet.runtime.currentHp,1,'20 natural recupera 1 PV.');

const zero={sheet:{runtime:{currentHp:0,tempHp:0}},choices:{}};
let damage={ok:true,effective:5,absorbedByTempHp:0,before:{currentHp:0,tempHp:0},after:{currentHp:0,tempHp:0}};
let consequence=applyDamageAtZeroConsequences(zero,20,damage,{critical:false});assert.equal(consequence.failures,1);assert.equal(deathState(zero).failures,1);
consequence=applyDamageAtZeroConsequences(zero,20,damage,{critical:true});assert.equal(consequence.dead,true,'Crítico a 0 PV adiciona duas falhas e completa três.');

const massive={sheet:{runtime:{currentHp:5,tempHp:0}},choices:{}};
damage={ok:true,effective:30,absorbedByTempHp:0,before:{currentHp:5,tempHp:0},after:{currentHp:0,tempHp:0}};
consequence=applyDamageAtZeroConsequences(massive,20,damage);assert.equal(consequence.dead,true,'Dano excedente igual ao máximo de PV causa morte instantânea.');

const stable={sheet:{runtime:{currentHp:0,tempHp:0}},choices:{}};stabilizeCharacter(stable);assert.equal(deathState(stable).stable,true);damage={ok:true,effective:1,absorbedByTempHp:0,before:{currentHp:0,tempHp:0},after:{currentHp:0,tempHp:0}};consequence=applyDamageAtZeroConsequences(stable,20,damage);assert.equal(deathState(stable).stable,false,'Dano a 0 PV quebra estabilidade.');assert.equal(deathState(stable).failures,1);
stable.sheet.runtime.currentHp=3;applyHealingDeathConsequences(stable,20);assert.equal(deathState(stable).failures,0);assert.equal(deathState(stable).stable,false,'Recuperar PV zera sucessos/falhas e estabilidade.');

console.log('Bloco 11 · Salvaguardas contra a Morte e dano a 0 PV: OK');
