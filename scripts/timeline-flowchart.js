// Visualizações derivadas dos registros existentes. Nenhum dado é gravado aqui.
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[char]));
const array=value=>Array.isArray(value)?value:[];
const safeDate=value=>{const date=new Date(value);return Number.isNaN(date.getTime())?'':date.toLocaleString('pt-BR')};
export function timelineViewToggle(mode='list'){
 return `<div class="hub-timeline-view-toggle" role="group" aria-label="Modelo da linha do tempo">
 <button type="button" class="secondary" data-timeline-view="list" aria-pressed="${mode==='list'}">Lista</button>
 <button type="button" class="secondary" data-timeline-view="flowchart" aria-pressed="${mode==='flowchart'}">Fluxograma</button>
 </div>`
}
function campaignNode(node,depth=0){
 const children=array(node.children);
 return `<div class="hub-diagram-node-group">
 <div class="hub-diagram-node" data-diagram-event="${esc(node.id)}">
 <span class="hub-diagram-kind">${depth?'Subevento':'Evento'}</span>
 <strong>${esc(node.text)}</strong>
 <button type="button" class="hub-diagram-edit" data-diagram-edit="${esc(node.id)}" aria-label="Editar evento: ${esc(node.text)}">Editar</button>
 </div>
 ${children.length?`<div class="hub-diagram-children" aria-label="Subeventos">${children.map(child=>campaignNode(child,depth+1)).join('')}</div>`:''}
 </div>`
}
export function renderCampaignTimelineDiagram(nodes=[]){
 const rows=array(nodes);
 if(!rows.length)return '<div class="hub-diagram-empty">Nenhum evento registrado.</div>';
 return `<div class="hub-diagram-scroll" role="region" aria-label="Fluxograma da campanha" tabindex="0">
 <div class="hub-diagram-roots">${rows.map(node=>`<div class="hub-diagram-root">${campaignNode(node)}</div>`).join('')}</div>
 </div>`
}
export function renderAdventureTimelineDiagram(events=[]){
 const rows=array(events).slice().sort((a,b)=>String(a.at||'').localeCompare(String(b.at||''))||String(a.id).localeCompare(String(b.id)));
 if(!rows.length)return '<div class="hub-diagram-empty">Nenhum registro.</div>';
 return `<div class="hub-diagram-scroll" role="region" aria-label="Fluxograma da aventura" tabindex="0">
 <ol class="hub-diagram-sequence">${rows.map((event,index)=>`<li class="hub-diagram-sequence-step">
 <div class="hub-diagram-node" data-diagram-event="${esc(event.id)}">
 <span class="hub-diagram-kind">Evento ${index+1}${event.automatic?' · Automático':''}</span>
 <strong>${esc(event.title)}</strong>
 ${safeDate(event.at)?`<time class="hub-diagram-date">${esc(safeDate(event.at))}</time>`:''}
 ${event.text?`<p>${esc(event.text)}</p>`:''}
 <button type="button" class="hub-diagram-edit" data-diagram-edit="${esc(event.id)}">Ver registro</button>
 </div></li>`).join('')}</ol>
 </div>`
}
