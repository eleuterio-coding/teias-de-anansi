import{state,$,arr,num,esc}from'./state.js';
import{selected}from'./rules.js';
import{spellProgressionCandidates,spellProgressionState}from'./spell-progression-rules.js?v=20260825-spell-progression1';

let initialized=false,decorating=false,queued=false;
const spellById=id=>arr(state.catalogs.spells).find(spell=>spell.id===id)||null;
const spellName=id=>spellById(id)?.name||'Magia indisponível';
function klass(){return selected().klass||null}
function level(){return Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1))}
function option(spell,current=''){return`<option value="${esc(spell.id)}" ${spell.id===current?'selected':''}>${esc(spell.name)} · ${num(spell.level)}º círculo</option>`}
function stepForActive(root){
 const active=root.querySelector('[data-progression-active]'),k=klass();if(!active||!k)return null;
 const activeLevel=num(active.dataset.progressionActive),progress=spellProgressionState(k,level());
 return{progress,step:progress.steps.find(row=>row.level===activeLevel)||null,active,k}
}
function swapMarkup(k,step){
 const change=step.stored?.spellChange,enabled=change?.decision==='replace',out=change?.out||'',inId=change?.in||'',current=new Set(step.afterLeveled||[]);
 const candidates=spellProgressionCandidates(k,step.level,{kind:'leveled'}).filter(spell=>!current.has(spell.id)||spell.id===out||spell.id===inId);
 return`<h4>Substituição de magia</h4><label class="checkline"><input type="checkbox" data-progression-toggle="spell" ${enabled?'checked':''}> <strong>Substituir 1 magia adquirida anteriormente</strong></label><p class="mini">Opcional. Escolha uma magia aprendida em um nível anterior e troque-a por outra magia válida para este nível. Ao concluir a troca, a magia antiga será desmarcada automaticamente e a nova será marcada no círculo correspondente.</p>${enabled?`<div class="choice-grid"><label>Magia que sai<select data-progression-out="spell"><option value="">Selecione</option>${step.beforeLeveled.map(id=>`<option value="${esc(id)}" ${id===out?'selected':''}>${esc(spellName(id))}</option>`).join('')}</select></label><label>Magia que entra<select data-progression-in="spell"><option value="">Selecione</option>${candidates.filter(spell=>spell.id!==out).map(spell=>option(spell,inId)).join('')}</select></label></div>`:''}`
}
function insertFirst(active,section){
 const search=active.querySelector('[data-progression-search]'),anchor=search?.closest('label');
 if(anchor)anchor.insertAdjacentElement('afterend',section);else active.prepend(section)
}
function decorate(){
 if(decorating)return;decorating=true;
 try{
  const root=$('magias-escolhas')?.querySelector('[data-spell-progression-ui]');if(!root)return;
  const ctx=stepForActive(root);if(!ctx?.step)return;
  const{step,active,k}=ctx,eligible=!!step.spellSwap&&step.beforeLeveled.length>0;
  let section=active.querySelector('section:has([data-progression-toggle="spell"])');
  if(!eligible){section?.remove();return}
  if(section){section.dataset.prominentSpellSwap='';if(!section.querySelector('h4')){const title=document.createElement('h4');title.textContent='Substituição de magia';section.prepend(title)}const p=section.querySelector('.mini');if(p)p.textContent='Opcional. Escolha uma magia aprendida em um nível anterior e troque-a por outra magia válida para este nível. Ao concluir a troca, a magia antiga será desmarcada automaticamente e a nova será marcada no círculo correspondente.';insertFirst(active,section);return}
  section=document.createElement('section');section.dataset.prominentSpellSwap='';section.innerHTML=swapMarkup(k,step);insertFirst(active,section)
 }finally{decorating=false}
}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;decorate()})}
export function initSpellSwapUi(){
 if(initialized)return;initialized=true;const box=$('magias-escolhas');if(!box)return;
 new MutationObserver(schedule).observe(box,{childList:true,subtree:true});
 box.addEventListener('change',event=>{if(event.target.closest('[data-progression-toggle="spell"],[data-progression-out="spell"],[data-progression-in="spell"]'))queueMicrotask(schedule)},true);
 document.addEventListener('hub:spell-selection-changed',schedule);
 $('classe')?.addEventListener('change',schedule);$('nivel')?.addEventListener('change',schedule);$('new-character')?.addEventListener('click',schedule);
 schedule()
}
