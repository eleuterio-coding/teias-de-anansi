import{state,$,AB,arr,num,fold}from'./state.js';
import{applyHouseRules,derive,selected}from'./rules.js?v=20260831-tasha-metamagic1';

let initialized=false,queued=false,enforcing=false;
const clone=v=>structuredClone(v);
const featById=id=>state.catalogs.feats.find(f=>f.id===id)||null;
const progression=()=>arr(selected().klass?._houseFeatProgression);
const entryBySlot=slot=>progression().find(entry=>entry.slot===slot)||null;

function contextAt(level,slot){
 const saved=clone(state.c.choices);
 try{
  state.c.choices.class=state.c.choices.class||{};
  state.c.choices.class.level=level;
  state.c.choices.feats=state.c.choices.feats||{};
  delete state.c.choices.feats[slot];
  applyHouseRules();
  return derive()
 }finally{
  state.c.choices=saved;
  applyHouseRules()
 }
}
function minimumLevel(feat){
 const p=fold(feat?.prereq||'');
 const match=p.match(/(?:nivel|level)\s*(\d+)\s*\+?/);
 if(match)return num(match[1]);
 return fold(feat?.category)==='geral'?4:1
}
function hasTraining(d,kind){
 const raw=fold([...arr(d.klass?.proficiencies),...arr(d.klass?.proficienciesRaw)].join(' '));
 const armor=arr(d.featMechanics?.armorTraining).map(fold),k=fold(kind);
 if(k==='escudo')return/shield|escudo/.test(raw)||!!d.featMechanics?.shieldTraining;
 const aliases={leve:['light armor','armadura leve'],media:['medium armor','armadura media'],pesada:['heavy armor','armadura pesada']};
 const tokens=aliases[k]||[];
 return/all armor|todas as armaduras/.test(raw)||tokens.some(t=>raw.includes(t))||armor.includes(k)
}
function abilityPrereqOk(prereq,d){
 if(!/13\+/.test(prereq))return true;
 const mentioned=AB.filter(a=>prereq.includes(fold(a)));
 if(!mentioned.length)return true;
 return mentioned.some(a=>num(d.scores?.[a])>=13)
}
function prereqOk(feat,entry,d){
 const p=fold(feat?.prereq||'');
 if(entry.level<minimumLevel(feat))return false;
 if(!abilityPrereqOk(p,d))return false;
 if((p.includes('conjuracao')||p.includes('spellcasting')||p.includes('magia de pacto')||p.includes('pact magic'))&&!d.klass?.spellAbility)return false;
 if((p.includes('armadura media')||p.includes('medium armor'))&&!hasTraining(d,'media'))return false;
 if((p.includes('armadura pesada')||p.includes('heavy armor'))&&!hasTraining(d,'pesada'))return false;
 if((p.includes('armadura leve')||p.includes('light armor'))&&!hasTraining(d,'leve'))return false;
 if((p.includes('treinamento com escudo')||p.includes('shield training'))&&!hasTraining(d,'escudo'))return false;
 return true
}
function eligible(feat,entry,d){
 if(!feat||!entry)return false;
 const category=fold(feat.category);
 if(!['origem','geral'].includes(category))return false;
 const name=fold(feat.name);
 if(entry.kind==='house'&&(/ability score improvement/.test(name)||/melhoria.*atribut/.test(name)||/aumento.*atribut/.test(name)))return false;
 return prereqOk(feat,entry,d)
}
function removeMechanics(slot){if(state.c?.choices?.featMechanics)delete state.c.choices.featMechanics[`class:${slot}`]}
function usedFeatIds(excludeSlot){
 const used=new Set,origin=state.c?.choices?.background?.originFeat;
 if(origin)used.add(origin);
 for(const[id,value]of Object.entries(state.c?.choices?.species?.traitChoices||{})){
  if(typeof value==='string'&&featById(value))used.add(value);
  if(Array.isArray(value))for(const v of value)if(featById(v))used.add(v)
 }
 for(const[slot,id]of Object.entries(state.c?.choices?.feats||{}))if(slot!==excludeSlot&&featById(id))used.add(id);
 return used
}
function enforce(){
 queued=false;if(enforcing||!state.c)return;const box=$('talentos-escolhas');if(!box)return;
 enforcing=true;let changed=false;
 try{
  state.c.choices.feats=state.c.choices.feats||{};
  for(const select of box.querySelectorAll('.house-feat-select')){
   const slot=select.dataset.key,entry=entryBySlot(slot);if(!entry)continue;
   const d=contextAt(entry.level,slot),used=usedFeatIds(slot),current=state.c.choices.feats[slot]||'';
   const currentFeat=featById(current),currentDuplicate=!!currentFeat&&!currentFeat.repeatable&&used.has(current);
   if(current&&(!eligible(currentFeat,entry,d)||currentDuplicate)){
    delete state.c.choices.feats[slot];removeMechanics(slot);select.value='';changed=true
   }
   for(const option of [...select.options]){
    if(!option.value)continue;const feat=featById(option.value);
    if(!eligible(feat,entry,d)){option.remove();continue}
    if(feat&&!feat.repeatable&&used.has(feat.id)&&feat.id!==state.c.choices.feats[slot])option.disabled=true
   }
   if(!state.c.choices.feats[slot])select.value=''
  }
  if(changed){applyHouseRules();$('nome')?.dispatchEvent(new Event('input'));document.dispatchEvent(new CustomEvent('hub:progression-context-changed',{detail:{source:'feat-prerequisite-enforcement'}}))}
 }finally{enforcing=false}
}
function queue(){if(queued)return;queued=true;queueMicrotask(enforce)}
function bind(){
 const box=$('talentos-escolhas');if(box)new MutationObserver(queue).observe(box,{childList:true,subtree:true});
 for(const event of['hub:class-context-changed','hub:origin-context-changed','hub:origin-house-changed','hub:species-context-changed','hub:species-choices-changed','hub:abilities-context-changed','hub:progression-context-changed'])document.addEventListener(event,queue);
 $('new-character')?.addEventListener('click',()=>queueMicrotask(queue))
}
export function initHouseFeatPrereqUi(){if(initialized)return;initialized=true;bind();queue()}
