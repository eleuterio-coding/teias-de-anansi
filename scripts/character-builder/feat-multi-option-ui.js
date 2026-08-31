import{state,$,arr,num,esc}from'./state.js';
import{featChoiceDefs,sanitizeFeatChoices}from'./feat-mechanics.js';

let initialized=false,rendering=false,scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render()})}
function store(){state.c.choices.featMechanics=state.c.choices.featMechanics||{};return state.c.choices.featMechanics}
function refreshSheet(){const name=$('nome');if(name)name.dispatchEvent(new Event('input'))}
function optionHtml(def,current,taken){return`<option value="">Selecione</option>${arr(def.options).map(value=>`<option value="${esc(value)}" ${value===current?'selected':''} ${taken.has(value)&&value!==current?'disabled':''}>${esc(value)}</option>`).join('')}`}
function cardFor(box,key){return[...box.querySelectorAll('[data-feat-instance-card]')].find(card=>card.dataset.featInstanceCard===key)||null}
function expectedKeys(box){return new Set(featChoiceDefs().filter(x=>x.type==='options_multi'&&cardFor(box,x.instanceKey)).map(x=>x.key))}
function needsRender(box){const expected=expectedKeys(box),actual=new Set([...box.querySelectorAll('[data-feat-multi-option]')].map(x=>x.dataset.featMultiOption));return expected.size!==actual.size||[...expected].some(key=>!actual.has(key))}
function render(){
 if(rendering||!state.c)return;const box=$('talentos-escolhas');if(!box)return;rendering=true;
 try{for(const old of box.querySelectorAll('[data-feat-multi-option]'))old.remove();const data=store();for(const def of featChoiceDefs().filter(x=>x.type==='options_multi')){const card=cardFor(box,def.instanceKey);if(!card)continue;const values=arr(data[def.instanceKey]?.[def.id]),need=Math.max(1,num(def.count)||1),wrap=document.createElement('div');wrap.className='trait-choice';wrap.dataset.featMultiOption=def.key;wrap.innerHTML=`<strong>${esc(def.label)}</strong><div class="choice-grid">${Array.from({length:need},(_,i)=>{const current=values[i]||'',taken=new Set(values.filter((_,j)=>j!==i));return`<label>Escolha ${i+1}<select data-feat-multi-instance="${esc(def.instanceKey)}" data-feat-multi-field="${esc(def.id)}" data-feat-multi-index="${i}">${optionHtml(def,current,taken)}</select></label>`}).join('')}</div>`;card.appendChild(wrap)}}finally{rendering=false}
}
function onChange(e){const select=e.target.closest('select[data-feat-multi-instance]');if(!select)return;const instance=select.dataset.featMultiInstance,field=select.dataset.featMultiField,index=num(select.dataset.featMultiIndex),data=store();data[instance]=data[instance]||{};const values=arr(data[instance][field]).slice();values[index]=select.value||null;data[instance][field]=values;sanitizeFeatChoices();refreshSheet();schedule();document.dispatchEvent(new CustomEvent('hub:feat-mechanics-changed',{detail:{instance,field}}))}
export function initFeatMultiOptionUi(){if(initialized)return;initialized=true;const box=$('talentos-escolhas');if(!box)return;box.addEventListener('change',onChange);new MutationObserver(()=>{if(!rendering&&needsRender(box))schedule()}).observe(box,{childList:true,subtree:true});for(const event of['hub:class-feature-feat-changed','hub:progression-context-changed','hub:origin-context-changed','hub:species-context-changed'])document.addEventListener(event,schedule);schedule()}
