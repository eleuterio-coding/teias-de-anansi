import{state,$,esc,fold}from'./state.js';
import{languageOutcome,sanitizeLanguageChoices}from'./language-mechanics.js';

let queued=false;
function ensureHost(){
 const field=$('profile-languages');if(!field)return null;
 const label=field.closest('label');if(label&&label.firstChild)label.firstChild.textContent='Idiomas adicionais / observações';
 field.placeholder='Ex.: dialeto regional, idioma concedido pelo mestre';
 let box=$('language-choices');if(!box){box=document.createElement('div');box.id='language-choices';box.className='full';label?.insertAdjacentElement('afterend',box)}
 return box
}
function optionList(pool,current,used){return`<option value="">Selecione</option>`+pool.map(x=>`<option value="${esc(x)}" ${x===current?'selected':''} ${used.has(fold(x))&&x!==current?'disabled':''}>${esc(x)}</option>`).join('')}
function render(){
 queued=false;sanitizeLanguageChoices();const box=ensureHost();if(!box)return;
 const out=languageOutcome(),fixed=out.automatic.filter(x=>!Object.values(out.choices).includes(x)),used=new Set;let html='<fieldset><legend>Idiomas</legend>';
 if(fixed.length)html+=`<p><strong>Automáticos:</strong> ${fixed.map(x=>`<span class="pill">${esc(x)}</span>`).join(' ')}</p>`;
 for(const def of out.definitions){
  for(const value of def.fixed||[])used.add(fold(value));
  if(!def.choose)continue;
  const controls=[];
  for(let i=0;i<def.choose;i++){
   const current=out.choices[`${def.key}:${i}`]||'';
   controls.push(`<label>Idioma ${i+1}<select class="language-choice" data-key="${esc(def.key)}" data-index="${i}">${optionList(def.pool,current,used)}</select></label>`);
   if(current)used.add(fold(current))
  }
  html+=`<div class="preview-block"><strong>${esc(def.label)}</strong><p class="mini">Escolha ${def.choose} idioma(s).</p><div class="choice-grid">${controls.join('')}</div></div>`
 }
 if(out.pending.length)html+=`<p class="mini"><strong>Faltam:</strong> ${out.pending.map(x=>`${x.count} em ${esc(x.label)}`).join(' · ')}</p>`;html+='</fieldset>';box.innerHTML=html;
 box.querySelectorAll('.language-choice').forEach(s=>s.addEventListener('change',e=>{const data=state.c.choices.languages||(state.c.choices.languages={choices:{}});data.choices=data.choices||{};const key=`${e.target.dataset.key}:${e.target.dataset.index}`;if(e.target.value)data.choices[key]=e.target.value;else delete data.choices[key];queueRender()}));
 document.dispatchEvent(new CustomEvent('hub:languages-changed',{detail:out}))
}
function queueRender(){if(queued)return;queued=true;queueMicrotask(render)}
export function initLanguageUi(){ensureHost();render();$('builder')?.addEventListener('change',e=>{if(e.target.closest('#language-choices'))return;if(e.target.closest('#classe,#nivel,#especie,#antecedente,#subclasse,#especie-escolhas,#talentos-escolhas'))queueRender()});$('new-character')?.addEventListener('click',()=>queueMicrotask(queueRender))}
