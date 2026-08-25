import{state,$,SKILL_AB,arr,esc,fold}from'./state.js';

const ALL_SKILLS=Object.keys(SKILL_AB);
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
function rowsFor(target){return arr(featData(target.dataset.instance)[target.dataset.field])}
function setRows(target,rows){featData(target.dataset.instance)[target.dataset.field]=rows}
function usedSkills(rows,index){return new Set(rows.flatMap((row,i)=>i!==index&&row?.type==='skill'&&row.value?[row.value]:[]))}
function option(value,current,disabled=false){return`<option value="${esc(value)}" ${value===current?'selected':''} ${disabled?'disabled':''}>${esc(value)}</option>`}
function controlLabel(grid){let label=grid.querySelector('[data-skilled-value-control]');if(label)return label;label=document.createElement('label');label.dataset.skilledValueControl='';grid.appendChild(label);return label}
function renderValueControl(typeSelect){
 const grid=typeSelect.closest('.choice-grid');if(!grid)return;
 grid.querySelector('[data-skilled-value-control]')?.remove();
 const type=typeSelect.value,index=Number(typeSelect.dataset.index),rows=rowsFor(typeSelect),row=rows[index]||{},label=controlLabel(grid);
 if(type==='skill'){
  const used=usedSkills(rows,index);
  label.innerHTML=`Perícia<select data-feat-mixed="value" data-mixed-kind="skill" data-instance="${esc(typeSelect.dataset.instance)}" data-field="${esc(typeSelect.dataset.field)}" data-index="${index}"><option value="">Selecione</option>${ALL_SKILLS.map(skill=>option(skill,row.value,used.has(skill))).join('')}</select>`;
 }else if(type==='tool'){
  label.innerHTML=`Ferramenta<input data-feat-mixed="value" data-mixed-kind="tool" data-instance="${esc(typeSelect.dataset.instance)}" data-field="${esc(typeSelect.dataset.field)}" data-index="${index}" value="${esc(row.value||'')}" placeholder="Nome da ferramenta">`;
 }else label.remove()
}
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
function onChange(event){
 const target=event.target.closest('[data-feat-mixed]'),box=$('talentos-escolhas');if(!target||!box?.contains(target))return;
 const card=target.closest('[data-feat-instance-card]');if(!card||!/^skilled$/i.test(card.querySelector('strong')?.textContent?.trim()||''))return;
 event.stopImmediatePropagation();event.stopPropagation();
 const index=Number(target.dataset.index),rows=rowsFor(target);
 if(target.dataset.featMixed==='type'){
  const next=setSkilledDraftRow(rows,index,target.value,'');setRows(target,next);renderValueControl(target);refreshCounter(target);return
 }
 const type=target.dataset.mixedKind,value=type==='tool'?String(target.value||'').trim():target.value||'';
 if(duplicateValue(rows,index,type,value)){target.value='';return}
 const next=setSkilledDraftRow(rows,index,type,value);setRows(target,next);refreshCounter(target);
 if(skilledRowComplete(next[index]))forceFeatRefresh()
}
function restoreDraftControls(){
 const box=$('talentos-escolhas');if(!box)return;
 for(const select of box.querySelectorAll('[data-feat-instance-card] [data-feat-mixed="type"]')){
  const card=select.closest('[data-feat-instance-card]');if(!/^skilled$/i.test(card?.querySelector('strong')?.textContent?.trim()||''))continue;
  const row=rowsFor(select)[Number(select.dataset.index)];if(row?.type&&!select.value)select.value=row.type;
  if(select.value&&!select.closest('.choice-grid')?.querySelector('[data-skilled-value-control]')&&!select.closest('.choice-grid')?.querySelector('[data-feat-mixed="value"]'))renderValueControl(select)
 }
}
export function initSkilledFeatUi(){
 if(initialized)return;initialized=true;const box=$('talentos-escolhas');if(!box)return;
 box.addEventListener('change',onChange,true);
 new MutationObserver(()=>queueMicrotask(restoreDraftControls)).observe(box,{childList:true,subtree:true});
 queueMicrotask(restoreDraftControls)
}
