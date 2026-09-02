import assert from'node:assert/strict';
import{weaponResolutionContext,resolveWeaponAttackWithContext}from'../scripts/character-sheet-resolution-combat-modifiers.js';

const seq=(...values)=>{let i=0;return()=>values[Math.min(i++,values.length-1)]};
const baseProfile={available:true,attack:5,baseAttack:5,abilityMod:3,damage:'1d8',damageType:'Cortante',weapon:{id:'sword',nome:'Espada',categoria:'Arma Marcial Corpo a Corpo',propriedades:[]},props:{ammunition:false},hand:{offhand:false},grip:'one',statusAdvantage:false,statusDisadvantage:false,heavyDisadvantage:false,mastered:false};
let derived={weapon:{id:'sword'},attack:5,featMechanics:{combatFlags:['duelingDamage2'],rangedAttackBonus:0},magicItemWeaponBonuses:{attack:[],damage:[],conditionalAttack:[],conditionalDamage:[]}};
let context=weaponResolutionContext(derived,baseProfile);assert.equal(context.damageBonus,2,'Dueling deve aplicar +2 automaticamente.');

const bow={...baseProfile,weapon:{id:'bow',nome:'Arco',categoria:'Arma Marcial à Distância',propriedades:['Munição']},props:{ammunition:{type:'Flecha'}},damageType:'Perfurante'};derived={...derived,weapon:{id:'bow'},featMechanics:{combatFlags:[],rangedAttackBonus:2},magicItemWeaponBonuses:{attack:[],damage:[],conditionalAttack:[{scope:'attack-with-this-ammunition',value:1}],conditionalDamage:[{scope:'damage-with-this-ammunition',value:1}]}};context=weaponResolutionContext(derived,bow);assert.equal(context.attackBonus,3,'Archery +2 e munição mágica +1 devem somar automaticamente.');assert.equal(context.damageBonus,1);

const thrown={...baseProfile,mode:'thrown',weapon:{...baseProfile.weapon,propriedades:['Arremesso']}};derived={...derived,weapon:{id:'sword'},featMechanics:{combatFlags:['thrownWeaponDamage2'],rangedAttackBonus:0},magicItemWeaponBonuses:{attack:[],damage:[],conditionalAttack:[],conditionalDamage:[]}};context=weaponResolutionContext(derived,thrown);assert.equal(context.damageBonus,2);

const offhand={...baseProfile,hand:{offhand:true}};derived={...derived,featMechanics:{combatFlags:[],rangedAttackBonus:0}};context=weaponResolutionContext(derived,offhand,{lightExtra:true});assert.equal(context.suppressPositiveAbilityDamage,true);derived.featMechanics.combatFlags=['twoWeaponAbilityModifier'];context=weaponResolutionContext(derived,offhand,{lightExtra:true});assert.equal(context.suppressPositiveAbilityDamage,false,'Two-Weapon Fighting restaura o modificador positivo no ataque extra Leve.');

const great={...baseProfile,grip:'two',weapon:{...baseProfile.weapon,propriedades:['Duas Mãos']}};derived={...derived,featMechanics:{combatFlags:['greatWeaponDamageFloor3'],rangedAttackBonus:0}};let result=resolveWeaponAttackWithContext({derived,profile:great,target:{ac:1},rng:seq(.5,0)});assert.equal(result.damage.dice.rolls[0],3,'Great Weapon Fighting trata resultado 1 ou 2 do dado de dano como 3.');

derived={...derived,featMechanics:{combatFlags:['ignoreBpsResistance'],rangedAttackBonus:0}};result=resolveWeaponAttackWithContext({derived,profile:baseProfile,target:{ac:1,resistances:['Cortante']},rng:seq(.5,.5)});assert.equal(result.context.ignoreBpsResistance,true);assert.equal(result.damage.effective,result.damage.raw,'Boon of Irresistible Offense ignora resistência física compatível.');

console.log('Bloco 11 · modificadores condicionais de ataque e dano: OK');
