import assert from'node:assert/strict';
import{
 parseDiceExpression,rollDiceExpression,rollD20,skillCheckModifier,savingThrowModifier,resolveSkillCheck,resolveSavingThrow,resolveInitiative,
 applyDamageDefenses,resolveWeaponAttack,spellAbilityProfile,resolveSpellAttack,resolveTargetSpellSave,resolveSpellDamage,
 applyCharacterDamage,applyCharacterHealing,resolveAmount,setResolutionTarget,resolutionTarget,recordResolution,resolutionHistory
}from'../scripts/character-sheet-resolution-rules.js';

const seq=(...values)=>{let i=0;return()=>values[Math.min(i++,values.length-1)]};
const d={
 scores:{Força:16,Destreza:14,Constituição:14,Inteligência:10,Sabedoria:12,Carisma:18},pbonus:3,
 saveProficiencies:['Constituição','Carisma'],globalAbilityCheckBonus:1,globalSavingThrowBonus:1,
 skillChecks:{Atletismo:{skill:'Atletismo',ability:'Força',value:6}},initiative:2,jackOfAllTrades:{bonus:1},initiativeAdvantage:true,
 klass:{spellAbility:'Carisma'},magicItemFlags:{spellAttackBonus:1},weapon:{id:'sword'},attack:7,
 magicItemWeaponBonuses:{attack:[],damage:[]}
};
const character={sheet:{runtime:{exhaustion:2,currentHp:20,tempHp:5}},choices:{}};

assert.ok(parseDiceExpression('2d6 + 3'));
assert.equal(parseDiceExpression('2d6+texto'),null);
const crit=rollDiceExpression('1d8+3',{critical:true,rng:seq(0,.99)});
assert.equal(crit.total,12,'Crítico dobra somente o dado: 1 + 8 + 3 = 12.');
const adv=rollD20({modifier:5,advantage:true,rng:seq(0,.95)});
assert.deepEqual(adv.rolls,[1,20]);assert.equal(adv.natural,20);assert.equal(adv.total,25);
const cancel=rollD20({advantage:true,disadvantage:true,rng:seq(.45)});assert.equal(cancel.mode,'normal');assert.equal(cancel.rolls.length,1);

const skill=skillCheckModifier(d,character,'Atletismo');assert.equal(skill.total,3,'6 + Luckstone 1 - Exaustão 4 = 3.');
const save=savingThrowModifier(d,character,'Constituição');assert.equal(save.total,2,'CON +2 + PB3 + global1 - Exaustão4 = +2.');
const check=resolveSkillCheck({derived:d,character,skill:'Atletismo',dc:15,rng:seq(.74)});assert.equal(check.roll.total,18);assert.equal(check.success,true);
const saving=resolveSavingThrow({derived:d,character,ability:'Constituição',dc:15,rng:seq(.59)});assert.equal(saving.roll.total,14);assert.equal(saving.success,false);
const init=resolveInitiative({derived:d,character,rng:seq(0,.95)});assert.equal(init.roll.mode,'advantage');assert.equal(init.roll.total,20,'Iniciativa: 20 +2 +Jack1 +global1 -exaustão4 = 20.');

assert.equal(applyDamageDefenses(11,'Fogo',{resistances:['Fogo']}).effective,5);
assert.equal(applyDamageDefenses(11,'Fogo',{vulnerabilities:['Fogo']}).effective,22);
assert.equal(applyDamageDefenses(11,'Fogo',{immunities:['Fogo']}).effective,0);
assert.equal(applyDamageDefenses(11,'Fogo',{resistances:['Fogo'],vulnerabilities:['Fogo']}).effective,11,'Resistência e Vulnerabilidade ao mesmo tipo se anulam.');

const weaponProfile={available:true,attack:5,baseAttack:5,abilityMod:3,damage:'1d8',damageType:'Cortante',weapon:{id:'sword',nome:'Espada'},heavyDisadvantage:false,statusDisadvantage:false,statusAdvantage:false,mastered:false};
const weapon=resolveWeaponAttack({derived:d,profile:weaponProfile,target:{ac:15,resistances:['Cortante']},rng:seq(.95,0,.99)});
assert.equal(weapon.attackRoll.natural,20);assert.equal(weapon.hit,true);assert.equal(weapon.critical,true);assert.equal(weapon.damage.raw,12);assert.equal(weapon.damage.effective,6);
const miss=resolveWeaponAttack({derived:d,profile:{...weaponProfile,mastered:true,mastery:'Graze'},target:{ac:30},rng:seq(0)});assert.equal(miss.hit,false);assert.equal(miss.damage.graze,true);assert.equal(miss.damage.effective,3);

const caster=spellAbilityProfile(d,'Carisma');assert.equal(caster.attack,8);assert.equal(caster.dc,15);
const spell={id:'firebolt',name:'Raio de Fogo',baseDamage:'2d10',damageType:'Fogo'};
const spellAttack=resolveSpellAttack({derived:d,character,spell,ability:'Carisma',target:{ac:16},rng:seq(.7)});assert.equal(spellAttack.modifier,4,'Ataque de magia +8 recebe -4 da Exaustão.');assert.equal(spellAttack.hit,true);
const targetSave=resolveTargetSpellSave({derived:d,spell,ability:'Carisma',targetSaveModifier:2,rng:seq(.55)});assert.equal(targetSave.dc,15);assert.equal(targetSave.success,false);
const spellDamage=resolveSpellDamage({spell,target:{vulnerabilities:['Fogo']},rng:seq(0,0)});assert.equal(spellDamage.raw,2);assert.equal(spellDamage.effective,4);

const hurt={sheet:{runtime:{currentHp:20,tempHp:5}},choices:{}};
const damage=applyCharacterDamage(hurt,30,12,{type:'Frio',resistances:['Frio']});assert.equal(damage.effective,6);assert.equal(damage.absorbedByTempHp,5);assert.equal(hurt.sheet.runtime.currentHp,19);assert.equal(hurt.sheet.runtime.tempHp,0);
const heal=applyCharacterHealing(hurt,30,20);assert.equal(heal.applied,11);assert.equal(hurt.sheet.runtime.currentHp,30);
assert.equal(resolveAmount('2d4+2',{rng:seq(0,0)}).total,4);

const stateChar={sheet:{},choices:{}};setResolutionTarget(stateChar,{name:'Ogro',ac:11,resistances:['Frio']});assert.equal(resolutionTarget(stateChar).name,'Ogro');recordResolution(stateChar,{kind:'test',label:'Teste'});assert.equal(resolutionHistory(stateChar).length,1);

console.log('Bloco 11 · motor de rolagens e resolução: OK');
