import{state,$,arr,num}from'./state.js';
import{selected,spellOptions,canSelectLeveledSpell}from'./rules.js';

function refreshSheet(){const name=$('nome');if(name)name.dispatchEvent(new Event('input'))}
function notifyQuota(){document.dispatchEvent(new CustomEvent('hub:spell-selection-changed'))}

function onSpellChange(event){
 const input=event.target.closest('input[data-kind]'),box=$('magias-escolhas');
 if(!input||!box?.contains(input))return;
 event.stopImmediatePropagation();
 const{klass}=selected();if(!klass)return;
 const level=Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1)),opts=spellOptions(klass,level),sel=state.c.choices.spells;
 const key=input.dataset.kind==='cantrip'?'cantrips':'leveled',current=arr(sel[key]);
 if(input.checked){
  if(key==='cantrips'){
   if(current.length>=opts.progress.cantrips){input.checked=false;return}
   sel[key]=[...current,input.value]
  }else{
   if(!canSelectLeveledSpell(klass,level,current,input.value)){input.checked=false;return}
   sel[key]=[...current,input.value]
  }
 }else sel[key]=current.filter(id=>id!==input.value);
 refreshSheet();notifyQuota()
}

export function initSpellSelectionUi(){
 const box=$('magias-escolhas');if(!box)return;
 box.addEventListener('change',onSpellChange,true)
}
