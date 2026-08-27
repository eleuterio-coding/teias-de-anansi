import{arr,fold,mod,SKILL_AB}from'./state.js';

export function applyRangerSubclassRuleDetails(d){
 if(d?.klass?.slug!=='ranger'||!d?.subclassMechanics)return d;const out=d.subclassMechanics,name=fold(out.name),wis=mod(d.scores?.Sabedoria);
 if(name==='fey wanderer'){
  d.subclassAbilityCheckBonuses={...(d.subclassAbilityCheckBonuses||{}),Carisma:(d.subclassAbilityCheckBonuses?.Carisma||0)+wis};
  d.subclassSkillBonuses={...(d.subclassSkillBonuses||{})};for(const[skill,ability]of Object.entries(SKILL_AB))if(ability==='Carisma')d.subclassSkillBonuses[skill]=(d.subclassSkillBonuses[skill]||0)+wis
 }
 if(name==='gloom stalker'){
  d.initiative=Number(d.initiative||0)+wis;const vision=arr(out.senses).find(x=>x.name==='Darkvision');if(vision)d.subclassDarkvision={range:vision.range,stack:vision.stack||''}
 }
 return d
}
