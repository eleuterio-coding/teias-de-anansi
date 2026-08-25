import{state,arr,num,fold,uniq}from'./state.js';
import{spellClassPolicy,usesLeveledProgression,usesCurrentLeveledList,usesCantripProgression,usesCurrentCantripList,levelUpSpellSwap,levelUpCantripSwap}from'./spell-class-policy.js?v=20260825-spell-policy1';

export const SPELL_PROGRESSION_VERSION=2;
const CLASS_NAMES={
 bard:['Bardo','Bard'],cleric:['Clérigo','Cleric'],druid:['Druida','Druid'],paladin:['Paladino','Paladin'],ranger:['Patrulheiro','Ranger'],
 sorcerer:['Feiticeiro','Sorcerer'],warlock:['Bruxo','Warlock'],wizard:['Mago','Wizard'],artificer:['Artífice','Artificer']
};
const WARLOCK_ARCANUM={11:6,13:7,15:8,17:9};

function classLevelRow(klass,level){return arr(klass?.levels).find(row=>num(row.level)===num(level))||null}
export function classSpellData(klass,level){
 const row=classLevelRow(klass,level),s=row?.spellcasting||row?.class_specific?.spellcasting||{},specific=row?.class_specific||{},slots=[];let maxLevel=0;
 for(let i=1;i<=9;i++){const count=num(s[`spell_slots_level_${i}`]);if(count){slots.push({level:i,count});maxLevel=Math.max(maxLevel,i)}}
 if(!maxLevel&&klass?.slug==='warlock')maxLevel=num(s.slot_level??specific.slot_level??specific.spell_slot_level);
 return{cantrips:num(s.cantrips_known??s.cantrips),prepared:num(s.spells_prepared??s.prepared_spells??s.magias_preparadas??s.spells_known),slots,maxLevel}
}
function normalClassMatch(klass,spell){
 const wanted=new Set([klass?.name,...arr(CLASS_NAMES[klass?.slug])].filter(Boolean).map(fold));
 return arr(spell?.classes).some(name=>wanted.has(fold(name)))
}
function bardMagicalSecretsMatch(klass,spell,classLevel){
 if(klass?.slug!=='bard'||num(classLevel)<10)return normalClassMatch(klass,spell);
 const wanted=new Set(['Bardo','Bard','Clérigo','Cleric','Druida','Druid','Mago','Wizard'].map(fold));
 return arr(spell?.classes).some(name=>wanted.has(fold(name)))
}
export function spellProgressionCandidates(klass,classLevel,{kind='leveled',exactLevel=null}={}){
 const progress=classSpellData(klass,classLevel),isCantrip=kind==='cantrip',isArcanum=kind==='arcanum';
 return arr(state.catalogs.spells).filter(spell=>{
  const level=num(spell.level);
  if(isCantrip){if(level!==0||!normalClassMatch(klass,spell))return false}
  else if(isArcanum){if(level!==num(exactLevel)||!normalClassMatch(klass,spell))return false}
  else if(level<1||level>progress.maxLevel||!bardMagicalSecretsMatch(klass,spell,classLevel))return false;
  return exactLevel==null||level===num(exactLevel)
 }).sort((a,b)=>num(a.level)-num(b.level)||String(a.name).localeCompare(String(b.name),'pt-BR'))
}

export function spellProgressionSteps(klass,targetLevel){
 const target=Math.max(1,Math.min(20,num(targetLevel)||1)),steps=[];let previousPrepared=0,previousCantrips=0;
 for(let level=1;level<=target;level++){
  const p=classSpellData(klass,level),leveledGain=usesLeveledProgression(klass)?(klass?.slug==='wizard'?(level===1?6:2):Math.max(0,p.prepared-previousPrepared)):0,cantripGain=usesCantripProgression(klass)?Math.max(0,p.cantrips-previousCantrips):0,arcanumLevel=klass?.slug==='warlock'?num(WARLOCK_ARCANUM[level]):0;
  previousPrepared=p.prepared;previousCantrips=p.cantrips;
  const spellSwap=level>1&&levelUpSpellSwap(klass),cantripSwap=level>1&&levelUpCantripSwap(klass),arcanumSwap=klass?.slug==='warlock'&&level>11;
  steps.push({level,maxSpellLevel:p.maxLevel,prepared:p.prepared,cantrips:p.cantrips,leveledGain,cantripGain,spellSwap,cantripSwap,arcanumLevel,arcanumSwap,hasSpellcasting:!!(p.maxLevel||p.cantrips||arcanumLevel)})
 }
 return steps
}

function blankStep(){return{cantrips:[],leveled:[],cantripChange:null,spellChange:null,arcanum:null,arcanumChange:null}}
function freshProgression(klass,targetLevel){return{version:SPELL_PROGRESSION_VERSION,classId:klass?.id||null,classSlug:klass?.slug||null,targetLevel:num(targetLevel),steps:{}}}
function normalizeChange(value){
 if(!value||typeof value!=='object')return null;
 const decision=value.decision==='replace'?'replace':'keep';return{decision,out:value.out||null,in:value.in||null,level:num(value.level)||null}
}
function normalizeStoredStep(raw){const x=raw&&typeof raw==='object'?raw:{};return{cantrips:uniq(arr(x.cantrips)),leveled:uniq(arr(x.leveled)),cantripChange:normalizeChange(x.cantripChange),spellChange:normalizeChange(x.spellChange),arcanum:x.arcanum||null,arcanumChange:normalizeChange(x.arcanumChange)}}
function itemSpell(id){return arr(state.catalogs.spells).find(spell=>spell.id===id)||null}
function validCandidateId(klass,classLevel,id,kind='leveled',exactLevel=null){return !!spellProgressionCandidates(klass,classLevel,{kind,exactLevel}).find(spell=>spell.id===id)}
function removeOne(list,id){let removed=false;return arr(list).filter(value=>{if(!removed&&value===id){removed=true;return false}return true})}
function applyChange({klass,level,before,current,change,kind='leveled'}){
 if(!change||change.decision!=='replace')return{list:current,change:change?.decision==='keep'?{decision:'keep',out:null,in:null,level:null}:null,valid:true};
 const out=change.out,inId=change.in;if(!out||!inId||!before.includes(out)||out===inId)return{list:current,change:{...change},valid:false};
 const exactLevel=kind==='arcanum'?num(itemSpell(out)?.level):null;
 if(!validCandidateId(klass,level,inId,kind,exactLevel)||current.includes(inId))return{list:current,change:{...change},valid:false};
 if(kind==='arcanum')return{list:current,change:{decision:'replace',out,in:inId,level:exactLevel},valid:true};
 const next=removeOne(current,out);next.push(inId);return{list:uniq(next),change:{decision:'replace',out,in:inId,level:null},valid:true}
}

function legacyAllocate(klass,targetLevel,progression,legacy){
 const defs=spellProgressionSteps(klass,targetLevel),levelSlots=[],assigned={};
 if(usesLeveledProgression(klass))for(const def of defs)for(let i=0;i<def.leveledGain;i++)levelSlots.push({level:def.level,cap:def.maxSpellLevel});
 const selected=uniq(arr(legacy?.leveled)).map((id,index)=>({id,index,level:num(itemSpell(id)?.level)})).filter(row=>row.level>0).sort((a,b)=>b.level-a.level||a.index-b.index),remaining=[...levelSlots].sort((a,b)=>a.cap-b.cap||a.level-b.level);
 for(const row of selected){const i=remaining.findIndex(slot=>slot.cap>=row.level&&validCandidateId(klass,slot.level,row.id));if(i<0)continue;const slot=remaining.splice(i,1)[0];(assigned[slot.level]||(assigned[slot.level]=[])).push(row.id)}
 const cantripSlots=[];if(usesCantripProgression(klass))for(const def of defs)for(let i=0;i<def.cantripGain;i++)cantripSlots.push(def.level);
 uniq(arr(legacy?.cantrips)).forEach((id,index)=>{const level=cantripSlots[index];if(level&&validCandidateId(klass,level,id,'cantrip'))(assigned[`c${level}`]||(assigned[`c${level}`]=[])).push(id)});
 for(const def of defs){const step=blankStep();step.leveled=assigned[def.level]||[];step.cantrips=assigned[`c${def.level}`]||[];if(def.spellSwap)step.spellChange={decision:'keep',out:null,in:null};if(def.cantripSwap)step.cantripChange={decision:'keep',out:null,in:null};if(def.arcanumLevel){const id=legacy?.arcanum?.[def.arcanumLevel];if(id&&validCandidateId(klass,def.level,id,'arcanum',def.arcanumLevel))step.arcanum=id}if(def.arcanumSwap)step.arcanumChange={decision:'keep',out:null,in:null};progression.steps[String(def.level)]=step}
 return progression
}
export function ensureSpellProgression(klass,targetLevel){
 const spells=state.c?.choices?.spells||(state.c.choices.spells={cantrips:[],leveled:[],arcanum:{}}),target=Math.max(1,Math.min(20,num(targetLevel)||1));let p=spells.progression;
 if(p&&p.classId===klass?.id&&num(p.version)===1){p.version=SPELL_PROGRESSION_VERSION;p.classSlug=klass?.slug||null}
 if(!p||p.version!==SPELL_PROGRESSION_VERSION||p.classId!==klass?.id){
  const legacy={cantrips:arr(spells.cantrips),leveled:arr(spells.leveled),arcanum:{...(spells.arcanum||{})}};p=freshProgression(klass,target);
  if(legacy.cantrips.length||legacy.leveled.length||Object.keys(legacy.arcanum).length)p=legacyAllocate(klass,target,p,legacy);
  spells.progression=p
 }
 p.targetLevel=target;p.classSlug=klass?.slug||null;p.steps=p.steps&&typeof p.steps==='object'?p.steps:{};return p
}

export function spellCurrentListState(klass,targetLevel){
 const target=Math.max(1,Math.min(20,num(targetLevel)||1)),p=classSpellData(klass,target),spells=state.c?.choices?.spells||{},result={cantrips:null,leveled:null,complete:true};
 if(usesCurrentCantripList(klass)){
  const allowed=new Set(spellProgressionCandidates(klass,target,{kind:'cantrip'}).map(s=>s.id)),selected=uniq(arr(spells.cantrips)).filter(id=>allowed.has(id)).slice(0,p.cantrips);
  result.cantrips={selected,required:p.cantrips,missing:Math.max(0,p.cantrips-selected.length),change:spellClassPolicy(klass).cantripChange};result.complete=result.complete&&!result.cantrips.missing
 }
 if(usesCurrentLeveledList(klass)){
  const allowed=new Set(spellProgressionCandidates(klass,target,{kind:'leveled'}).map(s=>s.id)),selected=uniq(arr(spells.leveled)).filter(id=>allowed.has(id)).slice(0,p.prepared);
  result.leveled={selected,required:p.prepared,missing:Math.max(0,p.prepared-selected.length),change:spellClassPolicy(klass).preparedChange};result.complete=result.complete&&!result.leveled.missing
 }
 return result
}

export function spellProgressionState(klass,targetLevel){
 const target=Math.max(1,Math.min(20,num(targetLevel)||1)),progression=ensureSpellProgression(klass,target),defs=spellProgressionSteps(klass,target),snapshots=[];let cantrips=[],leveled=[],arcanum={},firstIncompleteLevel=null;
 for(const def of defs){
  const key=String(def.level),stored=normalizeStoredStep(progression.steps[key]),beforeCantrips=[...cantrips],beforeLeveled=[...leveled],beforeArcanum={...arcanum};
  if(firstIncompleteLevel!=null){progression.steps[key]=stored;snapshots.push({...def,beforeCantrips,beforeLeveled,beforeArcanum,afterCantrips:[...cantrips],afterLeveled:[...leveled],afterArcanum:{...arcanum},stored,complete:false,locked:true});continue}
  stored.cantrips=stored.cantrips.filter(id=>validCandidateId(klass,def.level,id,'cantrip')&&!beforeCantrips.includes(id)).slice(0,def.cantripGain);
  stored.leveled=stored.leveled.filter(id=>validCandidateId(klass,def.level,id,'leveled')&&!beforeLeveled.includes(id)).slice(0,def.leveledGain);
  cantrips=uniq([...cantrips,...stored.cantrips]);leveled=uniq([...leveled,...stored.leveled]);
  let cantripChangeValid=true,spellChangeValid=true,arcanumChangeValid=true;
  if(def.cantripSwap&&beforeCantrips.length){const result=applyChange({klass,level:def.level,before:beforeCantrips,current:cantrips,change:stored.cantripChange,kind:'cantrip'});cantrips=result.list;stored.cantripChange=result.change;cantripChangeValid=result.valid}else stored.cantripChange=null;
  if(def.spellSwap&&beforeLeveled.length){const result=applyChange({klass,level:def.level,before:beforeLeveled,current:leveled,change:stored.spellChange,kind:'leveled'});leveled=result.list;stored.spellChange=result.change;spellChangeValid=result.valid}else stored.spellChange=null;
  if(def.arcanumLevel){if(stored.arcanum&&validCandidateId(klass,def.level,stored.arcanum,'arcanum',def.arcanumLevel)&&!Object.values(arcanum).includes(stored.arcanum))arcanum[def.arcanumLevel]=stored.arcanum;else stored.arcanum=null}
  if(def.arcanumSwap&&Object.keys(beforeArcanum).length){
   const change=stored.arcanumChange;if(change?.decision==='replace'){
    const out=change.out,oldLevel=num(itemSpell(out)?.level),inId=change.in;if(!out||!inId||!Object.values(beforeArcanum).includes(out)||!oldLevel||!validCandidateId(klass,def.level,inId,'arcanum',oldLevel)||Object.values(arcanum).includes(inId)){arcanumChangeValid=false}else{const slot=Object.keys(arcanum).find(l=>arcanum[l]===out);if(slot)arcanum[slot]=inId;stored.arcanumChange={decision:'replace',out,in:inId,level:oldLevel}}
   }else stored.arcanumChange=change?.decision==='keep'?{decision:'keep',out:null,in:null,level:null}:null
  }else stored.arcanumChange=null;
  const complete=stored.cantrips.length===def.cantripGain&&stored.leveled.length===def.leveledGain&&(!def.arcanumLevel||!!stored.arcanum)&&cantripChangeValid&&spellChangeValid&&arcanumChangeValid;
  if(!complete)firstIncompleteLevel=def.level;
  progression.steps[key]=stored;
  snapshots.push({...def,beforeCantrips,beforeLeveled,beforeArcanum,afterCantrips:[...cantrips],afterLeveled:[...leveled],afterArcanum:{...arcanum},stored,complete,locked:false})
 }
 const spells=state.c.choices.spells;if(usesCantripProgression(klass))spells.cantrips=[...cantrips];if(usesLeveledProgression(klass))spells.leveled=[...leveled];spells.arcanum={...arcanum};spells.progression=progression;
 const current=spellCurrentListState(klass,target),finalCantrips=usesCantripProgression(klass)?[...cantrips]:arr(spells.cantrips),finalLeveled=usesLeveledProgression(klass)?[...leveled]:arr(spells.leveled),historyComplete=firstIncompleteLevel==null;
 return{progression,steps:snapshots,cantrips:finalCantrips,leveled:finalLeveled,arcanum:{...arcanum},current,firstIncompleteLevel,historyComplete,complete:historyComplete&&current.complete}
}

export function resetSpellProgression(){if(!state.c?.choices)return;state.c.choices.spells={cantrips:[],leveled:[],arcanum:{},progression:null}}
export function spellProgressionPending(klass,targetLevel){
 const s=spellProgressionState(klass,targetLevel),out=[];for(const step of s.steps){if(step.locked)break;if(step.stored.cantrips.length<step.cantripGain)out.push(`Nível ${step.level}: escolha ${step.cantripGain-step.stored.cantrips.length} truque(s).`);if(step.stored.leveled.length<step.leveledGain)out.push(`Nível ${step.level}: escolha ${step.leveledGain-step.stored.leveled.length} magia(s).`);if(step.arcanumLevel&&!step.stored.arcanum)out.push(`Nível ${step.level}: escolha o Arcano Místico de ${step.arcanumLevel}º círculo.`);if(step.stored.cantripChange?.decision==='replace'&&(!step.stored.cantripChange.out||!step.stored.cantripChange.in))out.push(`Nível ${step.level}: conclua a substituição de truque.`);if(step.stored.spellChange?.decision==='replace'&&(!step.stored.spellChange.out||!step.stored.spellChange.in))out.push(`Nível ${step.level}: conclua a substituição de magia.`);if(step.stored.arcanumChange?.decision==='replace'&&(!step.stored.arcanumChange.out||!step.stored.arcanumChange.in))out.push(`Nível ${step.level}: conclua a substituição de Arcano Místico.`);if(!step.complete)break}
 if(s.current.cantrips?.missing)out.push(`Lista atual: escolha ${s.current.cantrips.missing} truque(s).`);
 if(s.current.leveled?.missing)out.push(`Lista atual: escolha ${s.current.leveled.missing} magia(s) preparada(s).`);
 return out
}
