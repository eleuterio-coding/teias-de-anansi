export const BASE_ABILITY_POINT_BUDGET=72;
export const BASE_ABILITY_DEFAULT=10;
export const BASE_ABILITY_MIN=8;
export const BASE_ABILITY_MAX=18;

const finite=v=>Number.isFinite(Number(v));
const integer=v=>Math.trunc(Number(v));

export function clampBaseAbility(value){
 const n=finite(value)?integer(value):BASE_ABILITY_DEFAULT;
 return Math.max(BASE_ABILITY_MIN,Math.min(BASE_ABILITY_MAX,n));
}

export function baseAbilityModifier(value){
 return Math.floor((clampBaseAbility(value)-10)/2)
}

export function abilityDisplayState(baseValue,finalValue=baseValue){
 const base=clampBaseAbility(baseValue),final=finite(finalValue)?integer(finalValue):base,bonus=final-base;
 return{base,final,bonus,modifier:Math.floor((final-10)/2)}
}

export function normalizeBaseAbilities(scores,abilities){
 return Object.fromEntries(abilities.map(ability=>[ability,clampBaseAbility(scores?.[ability])]))
}

export function baseAbilityReductionState(scores,abilities){
 const values=abilities.map(ability=>clampBaseAbility(scores?.[ability])),at8=values.filter(v=>v===8).length,at9=values.filter(v=>v===9).length,below10=values.filter(v=>v<10).length;
 const patternValid=(at8===0&&at9<=2)||(at8===1&&at9===0&&below10===1);
 const credit=patternValid?values.reduce((sum,value)=>sum+Math.max(0,BASE_ABILITY_DEFAULT-value),0):0;
 return{at8,at9,below10,patternValid,credit,budget:BASE_ABILITY_POINT_BUDGET+credit}
}

export function baseAbilityTotal(scores,abilities){
 return abilities.reduce((sum,ability)=>sum+clampBaseAbility(scores?.[ability]),0)
}

export function baseAbilityBudget(scores,abilities){
 return baseAbilityReductionState(scores,abilities).budget
}

export function baseAbilityRemaining(scores,abilities){
 return baseAbilityBudget(scores,abilities)-baseAbilityTotal(scores,abilities)
}

function candidateValid(scores,abilities){return baseAbilityReductionState(scores,abilities).patternValid}

export function maxBaseAbilityFor(scores,abilities,ability){
 const current=normalizeBaseAbilities(scores,abilities),original=current[ability];let max=BASE_ABILITY_MIN;
 for(let value=BASE_ABILITY_MIN;value<=BASE_ABILITY_MAX;value++){
  const candidate={...current,[ability]:value};
  if(!candidateValid(candidate,abilities))continue;
  if(baseAbilityTotal(candidate,abilities)<=baseAbilityBudget(candidate,abilities))max=value
 }
 return Math.max(BASE_ABILITY_MIN,Math.min(BASE_ABILITY_MAX,max||original))
}

export function applyBaseAbilityChange(scores,abilities,ability,requested){
 const current=normalizeBaseAbilities(scores,abilities),previous=current[ability],wanted=clampBaseAbility(requested),candidate={...current,[ability]:wanted};
 let value=wanted;
 if(!candidateValid(candidate,abilities))value=previous;
 else if(baseAbilityTotal(candidate,abilities)>baseAbilityBudget(candidate,abilities))value=maxBaseAbilityFor(current,abilities,ability);
 current[ability]=value;
 const reduction=baseAbilityReductionState(current,abilities),total=baseAbilityTotal(current,abilities),remaining=reduction.budget-total;
 return{scores:current,value,total,remaining,maxAllowed:maxBaseAbilityFor(current,abilities,ability),budget:reduction.budget,credit:reduction.credit,reduction}
}

export function baseAbilityValidation(scores,abilities){
 const raw=abilities.map(ability=>Number(scores?.[ability])),rangeValid=raw.every(value=>Number.isInteger(value)&&value>=BASE_ABILITY_MIN&&value<=BASE_ABILITY_MAX),reduction=baseAbilityReductionState(scores,abilities),total=raw.reduce((sum,value)=>sum+(Number.isFinite(value)?value:0),0),budget=reduction.budget,remaining=budget-total;
 return{rangeValid,patternValid:reduction.patternValid,total,budget,credit:reduction.credit,reduction,remaining,complete:rangeValid&&reduction.patternValid&&total===budget}
}