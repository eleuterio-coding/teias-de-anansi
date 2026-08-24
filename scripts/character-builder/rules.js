import * as base from './rules-base.js?v=20260823-rules-audit1';
import{state,AB,arr,num,fold}from'./state.js';
import{isCompatible55}from'./compatibility.js';
export * from './rules-base.js?v=20260823-rules-audit1';

export const HOUSE_FEAT_LEVELS=[1,3,6,9,12,15,18];
export const HOUSE_ABILITY_LEVELS=[4,8,12,16,20];
const STANDARD_CLASS_FEAT_LEVELS=new Set([4,8,12,16,19]);
const clone=v=>v==null?v:structuredClone(v);
const featByName=name=>state.catalogs.feats.find(f=>fold(f.name)===fold(name))||null;
const featById=id=>state.catalogs.feats.find(f=>f.id===id)||null;

function prepareClasses(){
 for(const klass of state.catalogs.classes||[]){
  if(!Array.isArray(klass._houseOriginalFeatSlots))klass._houseOriginalFeatSlots=[...arr(klass.featSlots).map(num).filter(Boolean)];
  const extras=klass._houseOriginalFeatSlots.filter(level=>!STANDARD_CLASS_FEAT_LEVELS.has(num(level)));
  const progression=[...HOUSE_FEAT_LEVELS.map(level=>({level,kind:'house'})),...extras.map((level,order)=>({level:num(level),kind:'class-extra',order}))].sort((a,b)=>a.level-b.level||(a.kind==='house'?-1:1)||(a.order||0)-(b.order||0));
  klass._houseFeatProgression=progression.map((entry,index)=>({...entry,index,slot:`slot-${entry.level}-${index}`}));
  klass.featSlots=progression.map(entry=>entry.level)
 }
}

function prepareBackgrounds(){
 for(const bg of state.catalogs.backgrounds||[]){
  if(!Object.prototype.hasOwnProperty.call(bg,'_houseOriginalFeat'))bg._houseOriginalFeat=clone(bg.feat||null);
  if(!Array.isArray(bg._houseOriginalAbilities))bg._houseOriginalAbilities=[...arr(bg.abilities)];
  bg.abilities=[...AB];
  bg.feat=clone(bg._houseOriginalFeat)
 }
 const bg=(state.catalogs.backgrounds||[]).find(x=>x.id===state.c?.refs?.background);if(!bg||!state.c?.choices)return;
 const ch=state.c.choices.background||(state.c.choices.background={});
 ch.abilityMode='2+1';ch.plusOnes=[];
 if(!AB.includes(ch.plus2))ch.plus2=AB[0];
 if(!AB.includes(ch.plus1)||ch.plus1===ch.plus2)ch.plus1=AB.find(a=>a!==ch.plus2)||AB[1];
 if(!Object.prototype.hasOwnProperty.call(ch,'originFeat')){const original=featByName(bg._houseOriginalFeat?.name);ch.originFeat=original?.category==='Origem'?original.id:null}
 const chosen=featById(ch.originFeat);bg.feat=chosen?.category==='Origem'?{name:chosen.name,choice:''}:null
}

function restoreSpeciesBonuses(){for(const species of state.catalogs.species||[]){if(!Array.isArray(species._houseOriginalAbilityBonuses))species._houseOriginalAbilityBonuses=clone(arr(species.abilityBonuses));species.abilityBonuses=clone(species._houseOriginalAbilityBonuses)||[]}}
function applyHouseAbilityBonuses(){restoreSpeciesBonuses();if(!state.c?.choices)return;const level=Math.max(1,Math.min(20,num(state.c.choices.class?.level)||1)),choices=state.c.choices.houseAbilities||(state.c.choices.houseAbilities={}),species=(state.catalogs.species||[]).find(x=>x.id===state.c.refs?.species);if(!species)return;for(const milestone of HOUSE_ABILITY_LEVELS){if(milestone>level)continue;const ability=choices[String(milestone)]||choices[milestone];if(AB.includes(ability))species.abilityBonuses.push({ability,bonus:1,source:'Regra da Casa',level:milestone})}}

export function applyHouseRules(){if(!state.c||!state.catalogs)return;prepareClasses();prepareBackgrounds();applyHouseAbilityBonuses()}
export function compatible(k){return(state.catalogs[k]||[]).filter(isCompatible55)}
export function selected(){applyHouseRules();return base.selected()}
function withLegacyCompatibility(fn){const changed=[];for(const key of['species','backgrounds','subclasses','feats'])for(const x of state.catalogs[key]||[])if(x.ruleset==='5e'&&isCompatible55(x)){changed.push(x);x.ruleset='5.5e'}try{return fn()}finally{for(const x of changed)x.ruleset='5e'}}
export function sanitizeSelections(){applyHouseRules();const result=withLegacyCompatibility(()=>base.sanitizeSelections());applyHouseRules();return result}

function isReplacedClassFeat(feature){if(!STANDARD_CLASS_FEAT_LEVELS.has(num(feature?.level)))return false;const name=fold(feature?.name||'');return/ability score improvement|melhoria.*atribut|aumento.*atribut/.test(name)}
function sourceForInstance(inst,klass){if(inst.key==='background')return'Talento de Origem · Antecedente';if(!inst.key?.startsWith('class:'))return inst.source;const slot=inst.key.slice(6),entry=arr(klass?._houseFeatProgression).find(x=>x.slot===slot);if(!entry)return inst.source;return entry.kind==='house'?`Regra da Casa · nível ${entry.level}`:`Classe · nível ${entry.level} · talento adicional`}

export function derive(){applyHouseRules();const d=base.derive();d.classFeatures=arr(d.classFeatures).filter(feature=>!isReplacedClassFeat(feature));d.houseFeatProgression=arr(d.klass?._houseFeatProgression).filter(entry=>entry.level<=d.level).map(entry=>({...entry}));const choices=state.c.choices.houseAbilities||{};d.houseAbilityProgression=HOUSE_ABILITY_LEVELS.filter(level=>level<=d.level).map(level=>({level,ability:choices[String(level)]||choices[level]||null}));if(d.featMechanics){d.featMechanics.instances=arr(d.featMechanics.instances).map(inst=>({...inst,source:sourceForInstance(inst,d.klass)}));d.featMechanics.houseAbilityProgression=d.houseAbilityProgression}return d}

/* Compatibilidade da auditoria mecânica do módulo-base:
subclassLevel trainedArmor spellProgress spellOptions k.hitDie+con
ch.plusOnes=bg.abilities.slice(0,3) for(const a of bg.abilities.slice(0,3))
speciesTraitChoiceDefs sanitizeSpeciesTraitChoices spellCreditState
*/
