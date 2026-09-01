import{arr,num,fold}from'./character-builder/state.js';
import{HOUSE_ABILITY_LEVELS,HOUSE_FEAT_LEVELS,subclassLevel,spellProgress,spellSelectionQuota}from'./character-builder/rules.js?v=20260901-level-up1';

const clampLevel=value=>Math.max(1,Math.min(20,num(value)||1));
const replacedAbilityFeature=feature=>/ability score improvement|melhoria.*atribut|aumento.*atribut/.test(fold(feature?.name||''));

export function ensureProgressionState(character){
 if(!character)return null;
 character.sheet=character.sheet||{};
 const current=clampLevel(character?.choices?.class?.level);
 const old=character.sheet.progression&&typeof character.sheet.progression==='object'?character.sheet.progression:{};
 const history=arr(old.history).filter(row=>row&&num(row.from)>=1&&num(row.to)>=1);
 const startingLevel=clampLevel(old.startingLevel||history[0]?.from||current);
 character.sheet.progression={...old,startingLevel,history,draft:null};
 return character.sheet.progression
}

export function featEntriesAtLevel(klass,level){
 const target=clampLevel(level),detailed=arr(klass?._houseFeatProgression);
 if(detailed.length)return detailed.filter(entry=>num(entry.level)===target).map(entry=>({...entry}));
 return arr(klass?.featSlots).map((value,index)=>({level:num(value),slot:`slot-${value}-${index}`,kind:'class'})).filter(entry=>entry.level===target)
}

export function levelUpPlan(character,klass,subclass=null,targetLevel=null){
 const currentLevel=clampLevel(character?.choices?.class?.level),target=clampLevel(targetLevel||currentLevel+1),validTarget=target===currentLevel+1&&currentLevel<20;
 const classFeatures=arr(klass?.features).filter(feature=>num(feature.level)===target&&!replacedAbilityFeature(feature));
 const featEntries=featEntriesAtLevel(klass,target),abilityMilestone=HOUSE_ABILITY_LEVELS.includes(target),featMilestone=HOUSE_FEAT_LEVELS.includes(target)||featEntries.length>0;
 const currentSpell=spellProgress(klass,currentLevel),targetSpell=spellProgress(klass,target),currentQuota=spellSelectionQuota(klass,currentLevel),targetQuota=spellSelectionQuota(klass,target);
 const currentArcanum=new Set(arr(currentSpell.arcanumLevels)),newArcanum=arr(targetSpell.arcanumLevels).filter(level=>!currentArcanum.has(level));
 const slotChanges=[];const levels=new Set([...arr(currentSpell.slots).map(s=>s.level),...arr(targetSpell.slots).map(s=>s.level)]);
 for(const level of[...levels].sort((a,b)=>a-b)){const before=arr(currentSpell.slots).find(s=>s.level===level)?.count||0,after=arr(targetSpell.slots).find(s=>s.level===level)?.count||0;if(before!==after)slotChanges.push({level,before,after})}
 const needsSubclass=!!klass&&target>=subclassLevel(klass)&&!subclass;
 return{validTarget,currentLevel,targetLevel:target,atCap:currentLevel>=20,classFeatures,featEntries,featMilestone,abilityMilestone,needsSubclass,spell:{current:currentSpell,target:targetSpell,currentQuota,targetQuota,addedCantrips:Math.max(0,num(targetSpell.cantrips)-num(currentSpell.cantrips)),addedSelections:Math.max(0,num(targetQuota.total)-num(currentQuota.total)),newArcanum,slotChanges},economy:{wealthGrantedCp:0,reapplyStartingPackages:false,reapplyCreationBudget:false}}
}

export function preserveDamageOnLevelUp(currentHp,oldMaxHp,newMaxHp){
 const oldMax=Math.max(0,num(oldMaxHp)),nextMax=Math.max(0,num(newMaxHp)),current=currentHp==null?oldMax:Math.max(0,num(currentHp));
 if(currentHp!=null&&current<=0)return 0;
 const damage=Math.max(0,oldMax-current);
 return Math.max(0,Math.min(nextMax,nextMax-damage))
}

export function recordLevelUp(character,{from,to,maxHpBefore,maxHpAfter,currentHpBefore,currentHpAfter,summary=[]}={}){
 const progression=ensureProgressionState(character);if(!progression)return null;
 const entry={from:clampLevel(from),to:clampLevel(to),at:new Date().toISOString(),maxHpBefore:Math.max(0,num(maxHpBefore)),maxHpAfter:Math.max(0,num(maxHpAfter)),currentHpBefore:Math.max(0,num(currentHpBefore)),currentHpAfter:Math.max(0,num(currentHpAfter)),wealthGrantedCp:0,startingPackagesReapplied:false,creationBudgetReapplied:false,summary:arr(summary).filter(Boolean)};
 progression.history=[...arr(progression.history),entry];progression.draft=null;return entry
}

export function progressionLabel(character){const state=ensureProgressionState(character),current=clampLevel(character?.choices?.class?.level);return{startingLevel:state?.startingLevel||current,currentLevel:current,levelsGained:arr(state?.history).length,history:arr(state?.history)}}
