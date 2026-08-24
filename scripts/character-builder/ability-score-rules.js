export const BASE_ABILITY_POINT_BUDGET=72;
export const BASE_ABILITY_MIN=10;
export const BASE_ABILITY_MAX=18;

const finite=v=>Number.isFinite(Number(v));
const integer=v=>Math.trunc(Number(v));

export function clampBaseAbility(value){
 const n=finite(value)?integer(value):BASE_ABILITY_MIN;
 return Math.max(BASE_ABILITY_MIN,Math.min(BASE_ABILITY_MAX,n));
}

export function baseAbilityModifier(value){
 return Math.floor((clampBaseAbility(value)-10)/2)
}

export function normalizeBaseAbilities(scores,abilities){
 return Object.fromEntries(abilities.map(ability=>[ability,clampBaseAbility(scores?.[ability])]))
}

export function baseAbilityTotal(scores,abilities){
 return abilities.reduce((sum,ability)=>sum+clampBaseAbility(scores?.[ability]),0)
}

export function baseAbilityRemaining(scores,abilities){
 return BASE_ABILITY_POINT_BUDGET-baseAbilityTotal(scores,abilities)
}

export function maxBaseAbilityFor(scores,abilities,ability){
 const otherTotal=abilities.reduce((sum,key)=>key===ability?sum:sum+clampBaseAbility(scores?.[key]),0);
 return Math.max(BASE_ABILITY_MIN,Math.min(BASE_ABILITY_MAX,BASE_ABILITY_POINT_BUDGET-otherTotal))
}

export function applyBaseAbilityChange(scores,abilities,ability,requested){
 const current=normalizeBaseAbilities(scores,abilities),maxAllowed=maxBaseAbilityFor(current,abilities,ability),value=Math.max(BASE_ABILITY_MIN,Math.min(maxAllowed,clampBaseAbility(requested)));
 current[ability]=value;
 return{scores:current,value,total:baseAbilityTotal(current,abilities),remaining:baseAbilityRemaining(current,abilities),maxAllowed}
}

export function baseAbilityValidation(scores,abilities){
 const raw=abilities.map(ability=>Number(scores?.[ability])),rangeValid=raw.every(value=>Number.isInteger(value)&&value>=BASE_ABILITY_MIN&&value<=BASE_ABILITY_MAX),total=raw.reduce((sum,value)=>sum+(Number.isFinite(value)?value:0),0);
 return{rangeValid,total,remaining:BASE_ABILITY_POINT_BUDGET-total,complete:rangeValid&&total===BASE_ABILITY_POINT_BUDGET}
}
