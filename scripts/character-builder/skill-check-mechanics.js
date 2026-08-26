import{SKILL_AB,arr,fold,mod}from'./state.js';

const JACK_NAMES=/jack of all trades|pau para toda obra/;

export function hasJackOfAllTrades(d={}){
 return d.klass?.slug==='bard'&&arr(d.classFeatures).some(feature=>JACK_NAMES.test(fold(feature?.name||'')))
}

export function deriveSkillCheckMechanics(d={}){
 const pbonus=Math.max(0,Number(d.pbonus)||0),jackActive=hasJackOfAllTrades(d),jackBonus=jackActive?Math.floor(pbonus/2):0,skills=arr(d.skills),expertise=arr(d.expertiseSkills),checks={};
 for(const[skill,ability]of Object.entries(SKILL_AB)){
  const expert=expertise.includes(skill),proficient=expert||skills.includes(skill),jackOfAllTrades=!proficient&&jackBonus>0,proficiencyContribution=expert?pbonus*2:proficient?pbonus:jackOfAllTrades?jackBonus:0;
  checks[skill]={skill,ability,expertise:expert,proficient,jackOfAllTrades,proficiencyContribution,value:mod(d.scores?.[ability])+proficiencyContribution}
 }
 const perception=checks['Percepção'];
 return{jackOfAllTrades:{active:jackActive,bonus:jackBonus},checks,passivePerception:10+(perception?.value||0)}
}
