import{state,$,SKILL_AB,arr,esc,fold}from'./state.js';

const ALL_SKILLS=Object.keys(SKILL_AB);
const TOOL_VALUE='__tool__';
let initialized=false;

export function setSkilledDraftRow(rows,index,type,value=''){
 const next=arr(rows).slice(),kind=type==='skill'||type==='tool'?type:'',raw=kind==='tool'?String(value||'').trim():String(value||'');
 next[index]={type:kind,value:raw};
 return next
}

export function skilledRowComplete(row){
 if(row?.type==='skill')return ALL_SKILLS.includes(row.value);
 if(row?.type==='tool')return !!String(row.value||'').trim();
 return false
}

function featData(instance){
 state.c.choices.featMechanics=state.c.choices.featMechanics||{};
 return state.c.choices.featMechanics[instance]||(state.c.choices.featMechanics[instance]={})
}
function rowsFor(target){return arr(featData(target.dataset.skilledInstance)[target.dataset.skilledField])}
function setRows(target,rows){featData(target.dataset.skilledInstance)[target.dataset.skilledField]=rows}
function usedSkills(rows,index){return new Set(rows.flatMap((row,i)=>i!==index&&row?.type==='skill'&&row.value?[row.value]:[]))}
function option(value,label,current,disabled=false){return`<option value="${esc(value)}" ${value===current?'selected':''} ${disabled?'disabled':''}>${esc(label)}</option>`}
function validCount(rows){return rows.filter(skilledRowComplete).length}
function refreshCounter(target){
 const card=target.closest('.trait-choice');if(!card)return;const rows=rowsFor(target),mini=card.querySelector(':scope > .mini');if(mini)mini.textContent=`· faltam ${Math.max(0,3-validCount(rows))}`
}
function duplicateValue(rows,index,type,value){if(!value)return false;const token=`${type}:${fold(value)}`;return rows.some((row,i)=>i!==index&&row?.value&&`${row.type}:${fold(row.value)}`===token)}
function forceFeatRefresh(){
 $('nome')?.dispatchEvent(new Event('input'));
 document.querySelector('[data-feat-mechanics-controls]')?.remove();
 document.dispatchEvent(new CustomEvent('hub:skilled-changed'))
}
function directOptions(rows,index,row){
 const used=usedSkills(rows,index),current=row?.type==='skill'?row.value:row?.type==='tool'?TOOL_VALUE:'';
 return`<option value="">Escolha uma perícia ou ferramenta</option><optgroup label="Perícias">${ALL_SKILLS.map(skill=>option(skill,skill,current,used.has(skill)&&skill!==current)).join('')}</optgroup>${option(TOOL_VALUE,'Ferramenta…',current)}`
}
function removeOldValueControl(grid){
 for(const el of grid.querySelectorAll('[data-feat-mixed="value"],[data-skilled-value-control]')){
  const label=el.closest('label');if(label&&grid.contains(label))label.remove();else el.remove()
 }
}
function renderDirectControl(typeSelect){
 const grid=typeSelect.closest('.choice-grid');if(!grid)return;
 const instance=typeSelect.dataset.instance,field=typeSelect.dataset.field,index=Number(typeSelect.dataset.index),rows=arr(featData(instance)[field]),row=rows[index]||{};
 removeOldValueControl(grid);
 const label=typeSelect.closest('label');if(label){label.childNodes[0].textContent=`Escolha ${index+1} · Perícia ou ferramenta`;}
 typeSelect.removeAttribute('data-feat-mixed');typeSelect.removeAttribute('data-instance');typeSelect.removeAttribute('data-field');typeSelect.removeAttribute('data-index');
 typeSelect.dataset.skilledDirect='';typeSelect.dataset.skilledInstance=instance;typeSelect.dataset.skilledField=field;typeSelect.dataset.skilledIndex=String(index);typeSelect.innerHTML=directOptions(rows,index,row);
 if(row.type==='tool'){
  const toolLabel=document.createElement('label');toolLabel.dataset.skilledToolControl='';toolLabel.innerHTML=`Ferramenta escolhida<input data-skilled-tool data-skilled-instance="${esc(instance)}" data-skilled-field="${esc(field)}" data-skilled-index="${index}" value="${esc(row.value||'')}" placeholder="Nome da ferramenta">`;grid.appendChild(toolLabel)
 }
}
function onChange(event){
 const target=event.target.closest('[data-skilled-direct],[data-skilled-tool]'),box=$('talentos-escolhas');if(!target||!box?.contains(target))return;
 const card=target.closest('[data-feat-instance-card]');if(!card||!/^skilled$/i.test(card.querySelector('strong')?.textContent?.trim()||''))return;
 event.stopImmediatePropagation();event.stopPropagation();
 const index=Number(target.dataset.skilledIndex),rows=rowsFor(target),previous=rows[index]||{};
 if(target.hasAttribute('data-skilled-direct')){
  if(target.value===TOOL_VALUE){
   const next=setSkilledDraftRow(rows,index,'tool',previous.type==='tool'?previous.value:'');setRows(target,next);const grid=target.closest('.choice-grid');grid?.querySelector('[data-skilled-tool-control]')?.remove();const label=document.createElement('label');label.dataset.skilledToolControl='';label.innerHTML=`Ferramenta escolhida<input data-skilled-tool data-skilled-instance="${esc(target.dataset.skilledInstance)}" data-skilled-field="${esc(target.dataset.skilledField)}" data-skilled-index="${index}" value="${esc(next[index].value||'')}" placeholder="Nome da ferramenta">`;grid?.appendChild(label);refreshCounter(target);return
  }
  const value=target.value||'';
  if(value&&duplicateValue(rows,index,'skill',value)){target.value='';return}
  const next=setSkilledDraftRow(rows,index,value?'skill':'',value);setRows(target,next);refreshCounter(target);forceFeatRefresh();return
 }
 const value=String(target.value||'').trim();
 if(value&&duplicateValue(rows,index,'tool',value)){target.value='';return}
 const next=setSkilledDraftRow(rows,index,value?'tool':'',value);setRows(target,next);refreshCounter(target);forceFeatRefresh()
}
function restoreDirectControls(){
 const box=$('talentos-escolhas');if(!box)return;
 for(const select of box.querySelectorAll('[data-feat-instance-card] [data-feat-mixed="type"]')){
  const card=select.closest('[data-feat-instance-card]');if(!/^skilled$/i.test(card?.querySelector('strong')?.textContent?.trim()||''))continue;
  renderDirectControl(select)
 }
}
export function initSkilledFeatUi(){
 if(initialized)return;initialized=true;const box=$('talentos-escolhas');if(!box)return;
 box.addEventListener('change',onChange,true);
 new MutationObserver(()=>queueMicrotask(restoreDirectControls)).observe(box,{childList:true,subtree:true});
 queueMicrotask(restoreDirectControls)
}
