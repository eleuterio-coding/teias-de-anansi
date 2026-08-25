import * as base from './rules-base.js?v=20260824-race-variants1';
import{state,AB,arr,num,fold,uniq,mod}from'./state.js';
import{isCompatible55}from'./compatibility.js?v=20260823-character-builder26';
import{spellClassPolicy,usesLeveledProgression,usesCurrentLeveledList,usesCantripProgression,usesCurrentCantripList}from'./spell-class-policy.js?v=20260825-spell-policy1';
import{spellProgressionCandidates,spellProgressionState}from'./spell-progression-rules.js?v=20260825-spell-progression2';
export * from './rules-base.js?v=20260824-race-variants1';

export const HOUSE_FEAT_LEVELS=[1,3,6,9,12,15,18];
export const HOUSE_ABILITY_LEVELS=[4,8,12,16,20];
const STANDARD_CLASS_FEAT_LEVELS=new Set([4,8,12,16,19]);
const clone=v=>v==null?v:structuredClone(v);
const featByName=name=>state.catalogs.feats.find(f=>fold(f.name)===fold(name))||null;
const featById=id=>state.catalogs.feats.find(f=>f.id===id)||null;

function stableFeatSlot(entry){
 return entry.kind==='house'?`house-${entry.level}`:`class-extra-${entry.level}-${entry.order||0}`
}
function prepareClasses(){
 for(const klass of state.catalogs.classes||[]){
  if(!Array.isArray(klass._houseOriginalFeatSlots))klass._houseOriginalFeatSlots=[...arr(klass.featSlots).map(num).filter(Boolean)];
  const extras=klass._houseOriginalFeatSlots.filter(level=>!STANDARD_CLASS_FEAT_LEVELS.has(num(level)));
  const progression=[...HOUSE_FEAT_LEVELS.map(level=>({level,kind:'house'})),...extras.map((level,order)=>({level:num(level),kind:'class-extra',order}))].sort((a,b)=>a.level-b.level||(a.kind==='house'?-1:1)||(a.order||0)-(b.order||0));
  klass._houseFeatProgression=progression.map((entry,index)=>({...entry,index,slot:stableFeatSlot(entry),legacySlot:`slot-${entry.level}-${index}`}));
  klass.featSlots=progression.map(entry=>entry.level)
 }
}
function migrateSelectedProgressionSlots(){
 const klass=(state.catalogs.classes||[]).find(x=>x.id===state.c?.refs?.class);if(!klass||!state.c?.choices)return;
 const choices=state.c.choices.feats||(state.c.choices.feats={}),mechanics=state.c.choices.featMechanics||(state.c.choices.featMechanics={});
 for(const entry of arr(klass._houseFeatProgression)){
  if(choices[entry.slot]==null&&choices[entry.legacySlot]!=null)choices[entry.slot]=choices[entry.legacySlot];
  const oldKey=`class:${entry.legacySlot}`,newKey=`class:${entry.slot}`;
  if(mechanics[newKey]==null&&mechanics[oldKey]!=null)mechanics[newKey]=mechanics[oldKey]
 }
}
function prepareBackgroundCatalogs(){
 for(const bg of state.catalogs.backgrounds||[]){
  if(!Object.prototype.hasOwnProperty.call(bg,'_houseOriginalFeat'))bg._houseOriginalFeat=clone(bg.feat||null);
  if(!Array.isArray(bg._houseOriginalAbilities))bg._houseOriginalAbilities=[...arr(bg.abilities)];
  bg.abilities=[...AB];
  bg.feat=clone(bg._houseOriginalFeat)
 }
 const bg=(state.catalogs.backgrounds||[]).find(x=>x.id===state.c?.refs?.background);if(!bg||!state.c?.choices)return;
 const chosen=featById(state.c.choices.background?.originFeat);
 // Projeção do estado na ficha: nunca inicializa ou reescreve a escolha do usuário.
 bg.feat=chosen?.category==='Origem'?{name:chosen.name,choice:''}:null
}
export function initializeHouseBackgroundChoices(){
 const bg=(state.catalogs.backgrounds||[]).find(x=>x.id===state.c?.refs?.background);if(!bg||!state.c?.choices)return;
 const ch=state.c.choices.background||(state.c.choices.background={});
 ch.abilityMode='2+1';ch.plusOnes=[];
 if(!AB.includes(ch.plus2))ch.plus2=AB[0];
 if(!AB.includes(ch.plus1)||ch.plus1===ch.plus2)ch.plus1=AB.find(a=>a!==ch.plus2)||AB[1];
 if(!Object.prototype.hasOwnProperty.call(ch,'originFeat')){
  const original=featByName(bg._houseOriginalFeat?.name);ch.originFeat=original?.category==='Origem'?original.id:null
 }
 prepareBackgroundCatalogs()
}

function restoreSpeciesBonuses(){for(const species of state.catalogs.species||[]){if(!Array.isArray(species._houseOriginalAbilityBonuses))species._houseOriginalAbilityBonuses=clone(arr(species.abilityBonuses));species.abilityBonuses=clone(species._houseOriginalAbilityBonuses)||[]}}
function applyHouseAbilityBonuses(){restoreSpeciesBonuses();if(!state.c?.choices)return;const level=Math.max(1,Math.min(20,num(state.c.choices.class?.level)||1)),choices=state.c.choices.houseAbilities||(state.c.choices.houseAbilities={}),species=(state.catalogs.species||[]).find(x=>x.id===state.c.refs?.species);if(!species)return;for(const milestone of HOUSE_ABILITY_LEVELS){if(milestone>level)continue;const ability=choices[String(milestone)]||choices[milestone];if(AB.includes(ability))species.abilityBonuses.push({ability,bonus:1,source:'Regra da Casa',level:milestone})}}

export function applyHouseRules(){if(!state.c||!state.catalogs)return;prepareClasses();migrateSelectedProgressionSlots();prepareBackgroundCatalogs();applyHouseAbilityBonuses()}
export function compatible(k){return(state.catalogs[k]||[]).filter(isCompatible55)}
export function selected(){applyHouseRules();return base.selected()}
function currentLineagePackage(){const species=(state.catalogs.species||[]).find(x=>x.id===state.c?.refs?.species)||null,lineage=species?.lineages?.find(x=>x.name===state.c?.choices?.species?.lineage)||null;return{species,lineage}}
function withLineagePackage(fn){
 const{species,lineage}=currentLineagePackage();if(!species||!lineage)return fn();
 const replaceAll=!!lineage.replaceBaseTraits,replaceNames=new Set(arr(lineage.replaceTraitNames).map(fold));if(!replaceAll&&!replaceNames.size)return fn();
 const originalSpeciesTraits=species.traits,originalLineageTraits=lineage.traits,originalSpeed=species.speed,originalSizes=species.sizes;
 if(replaceAll){species.traits=arr(lineage.traits);lineage.traits=[]}
 else species.traits=arr(species.traits).filter(t=>!replaceNames.has(fold(t?.originalName||t?.name||''))&&!replaceNames.has(fold(t?.name||'')));
 if(num(lineage.speed))species.speed=num(lineage.speed);if(arr(lineage.sizes).length)species.sizes=[...lineage.sizes];
 try{return fn()}finally{species.traits=originalSpeciesTraits;lineage.traits=originalLineageTraits;species.speed=originalSpeed;species.sizes=originalSizes}
}
function withLegacyCompatibility(fn){const changed=[];for(const key of['species','backgrounds','subclasses','feats'])for(const x of state.catalogs[key]||[])if(x.ruleset==='5e'&&isCompatible55(x)){changed.push(x);x.ruleset='5.5e'}try{return fn()}finally{for(const x of changed)x.ruleset='5e'}}
export function speciesTraitChoiceDefs(speciesArg=null,lineageArg=null){applyHouseRules();return withLineagePackage(()=>base.speciesTraitChoiceDefs(speciesArg,lineageArg))}
export function sanitizeSpeciesTraitChoices(){applyHouseRules();return withLineagePackage(()=>base.sanitizeSpeciesTraitChoices())}

function sanitizeCurrentSpellLists(klass,level,raw){
 const spells=state.c.choices.spells||(state.c.choices.spells={cantrips:[],leveled:[],arcanum:{}}),progress=base.spellProgress(klass,level);
 if(usesCurrentCantripList(klass)){
  const allowed=new Set(spellProgressionCandidates(klass,level,{kind:'cantrip'}).map(s=>s.id));spells.cantrips=uniq(arr(raw?.cantrips)).filter(id=>allowed.has(id)).slice(0,progress.cantrips)
 }
 if(usesCurrentLeveledList(klass)){
  const allowed=new Set(spellProgressionCandidates(klass,level,{kind:'leveled'}).map(s=>s.id));spells.leveled=uniq(arr(raw?.leveled)).filter(id=>allowed.has(id)).slice(0,progress.prepared)
 }
}
export function sanitizeSelections(){
 applyHouseRules();const klass=base.selected().klass,level=Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1)),raw=clone(state.c?.choices?.spells||{});
 const result=withLineagePackage(()=>withLegacyCompatibility(()=>base.sanitizeSelections()));
 if(klass?.spellAbility){sanitizeCurrentSpellLists(klass,level,raw);if(usesLeveledProgression(klass)||usesCantripProgression(klass)||klass.slug==='warlock')spellProgressionState(klass,level)}
 applyHouseRules();return result
}

export function spellSelectionQuota(k,l){
 const policy=spellClassPolicy(k),progress=base.spellProgress(k,l);if(!k?.spellAbility)return{total:0,byLevel:{},label:'Magias',mode:'none'};
 if(usesCurrentLeveledList(k)){const total=progress.prepared,byLevel=progress.maxLevel&&total?{[progress.maxLevel]:total}:{};return{total,byLevel,label:policy.label,mode:'current-list'}}
 const q=base.spellSelectionQuota(k,l);return{...q,label:policy.label||q.label}
}
export function spellCreditState(k,l,ids){
 const q=spellSelectionQuota(k,l),progress=base.spellProgress(k,l),hasProgression=state.c?.choices?.spells?.progression?.classId===k?.id;
 if(usesCurrentLeveledList(k)||(hasProgression&&usesLeveledProgression(k))){const byLevel=progress.maxLevel&&q.total?{[progress.maxLevel]:q.total}:{};const levels=arr(ids).map(id=>base.item('spells',id)).filter(Boolean).map(s=>num(s.level));return base.allocateSpellCredits(byLevel,levels)}
 return base.spellCreditState(k,l,ids)
}
export function spellOptions(k,l){const opts=base.spellOptions(k,l),q=spellSelectionQuota(k,l);opts.progress={...opts.progress,prepared:q.total,selectionTotal:q.total,selectionByLevel:q.byLevel,selectionCreditsByLevel:q.byLevel,selectionLabel:q.label,selectionMode:q.mode};return opts}
export function canSelectLeveledSpell(k,l,ids,candidateId){const current=arr(ids);if(current.includes(candidateId))return true;const opts=spellOptions(k,l),candidate=opts.leveled.find(spell=>spell.id===candidateId);if(!candidate||current.length>=opts.progress.selectionTotal)return false;return spellCreditState(k,l,[...current,candidateId]).valid}

function isReplacedClassFeat(feature){if(!STANDARD_CLASS_FEAT_LEVELS.has(num(feature?.level)))return false;const name=fold(feature?.name||'');return/ability score improvement|melhoria.*atribut|aumento.*atribut/.test(name)}
function sourceForInstance(inst,klass){if(inst.key==='background')return'Talento de Origem · Antecedente';if(!inst.key?.startsWith('class:'))return inst.source;const slot=inst.key.slice(6),entry=arr(klass?._houseFeatProgression).find(x=>x.slot===slot);if(!entry)return inst.source;return entry.kind==='house'?`Regra da Casa · nível ${entry.level}`:`Classe · nível ${entry.level} · talento adicional`}
function applyLineagePackageEffects(d){
 const fixed=arr(d.lineage?.fixedSkills);if(fixed.length){d.skills=uniq([...arr(d.skills),...fixed]);d.expertiseSkills=uniq(arr(d.expertiseSkills).filter(x=>d.skills.includes(x)));d.passive=10+mod(d.scores.Sabedoria)+(d.skills.includes('Percepção')?d.pbonus:0)+(d.expertiseSkills.includes('Percepção')?d.pbonus:0)}
 const ability=d.lineage?.spellAbilityFixed;if(ability&&!d.speciesSpellAbility&&d.scores?.[ability]!=null){const m=mod(d.scores[ability]);d.speciesSpellAbility=ability;d.speciesSpellDC=8+d.pbonus+m;d.speciesSpellAttack=d.pbonus+m}
 return d
}

export function derive(){applyHouseRules();const d=applyLineagePackageEffects(withLineagePackage(()=>base.derive()));d.classFeatures=arr(d.classFeatures).filter(feature=>!isReplacedClassFeat(feature));d.houseFeatProgression=arr(d.klass?._houseFeatProgression).filter(entry=>entry.level<=d.level).map(entry=>({...entry}));const choices=state.c.choices.houseAbilities||{};d.houseAbilityProgression=HOUSE_ABILITY_LEVELS.filter(level=>level<=d.level).map(level=>({level,ability:choices[String(level)]||choices[level]||null}));if(d.featMechanics){d.featMechanics.instances=arr(d.featMechanics.instances).map(inst=>({...inst,source:sourceForInstance(inst,d.klass)}));d.featMechanics.houseAbilityProgression=d.houseAbilityProgression}return d}

/* Compatibilidade das auditorias mecânicas do módulo-base:
subclassLevel trainedArmor spellProgress spellOptions k.hitDie+con
speciesTraitChoiceDefs sanitizeSpeciesTraitChoices spellCreditState
*/
