import{state,$,esc,fold,json}from'./state.js';

let DATA=null,rendering=false,queued=false;
const choice=()=>state.c?.choices?.species||(state.c.choices.species={size:null,lineage:null});
const currentSpecies=()=>state.catalogs.species.find(x=>x.id===state.c?.refs?.species)||null;
const isTiefling=()=>fold(currentSpecies()?.name)==='tiefling';
const byId=(rows,id)=>rows?.find(x=>x.id===id)||null;

function eberronOptions(current){return`<option value="">Nenhuma / outro cenário</option>`+(DATA?.eberron||[]).map(x=>`<option value="${esc(x.id)}" ${x.id===current?'selected':''}>${esc(x.nome)}</option>`).join('')}
function originSummary(v){return v?`<div class="preview-block"><strong>Origem de Eberron: ${esc(v.nome)}</strong><p>${esc(v.descricao)}</p><p class="mini">Esta é uma origem narrativa e não altera o Legado Tiefling escolhido acima.</p></div>`:''}
function renderSheet(){const host=$('species-features');if(!host)return;host.querySelector('[data-tiefling-sheet]')?.remove();if(!isTiefling())return;const origin=byId(DATA?.eberron,choice().tieflingOrigin);if(!origin)return;const wrap=document.createElement('div');wrap.dataset.tieflingSheet='';wrap.className='feature';wrap.innerHTML=`<p><strong>Origem de Eberron:</strong> ${esc(origin.nome)}</p><p>${esc(origin.descricao)}</p>`;host.prepend(wrap)}
function render(){if(rendering||!DATA)return;rendering=true;try{const box=$('especie-escolhas');if(!box)return;box.querySelector('[data-tiefling-controls]')?.remove();if(!isTiefling()){renderSheet();return}const c=choice(),origin=byId(DATA.eberron,c.tieflingOrigin),wrap=document.createElement('fieldset');wrap.dataset.tieflingControls='';wrap.innerHTML=`<legend>Origem narrativa de Tiefling</legend><label>Origem de Eberron (opcional)<select data-tiefling-origin>${eberronOptions(c.tieflingOrigin)}</select></label>${originSummary(origin)}`;box.appendChild(wrap);renderSheet()}finally{rendering=false}}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;render()})}
function bind(){const box=$('especie-escolhas');box?.addEventListener('change',e=>{if(e.target.matches('[data-tiefling-origin]')){choice().tieflingOrigin=e.target.value||null;render()}});const species=$('especie');species?.addEventListener('change',()=>queueMicrotask(schedule));if(species)new MutationObserver(schedule).observe(species,{childList:true,subtree:true});$('nivel')?.addEventListener('change',()=>queueMicrotask(schedule));$('new-character')?.addEventListener('click',()=>queueMicrotask(schedule));setTimeout(schedule,500)}
export async function initTieflingUi(){try{DATA=await json('dados/tiefling-variantes.json')}catch(error){console.error('[tiefling-ui]',error);return}render();bind()}
