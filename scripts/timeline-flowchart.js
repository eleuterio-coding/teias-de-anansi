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
// Eventos principais independentes; conexões limitadas à hierarquia de cada evento.
function campaignNode(node,depth=0,collapsedIds=new Set(),ordinal=null){
 const children=array(node.children),collapsed=collapsedIds.has(node.id);
 const toggle=children.length
  ?`<button type="button" class="hub-diagram-collapse" data-timeline-toggle="${esc(node.id)}" data-timeline-count="${children.length}" aria-expanded="${!collapsed}" aria-controls="timeline-diagram-children-${esc(node.id)}">${collapsed?'Mostrar':'Ocultar'} ${children.length} ${children.length===1?'subitem':'subitens'}</button>`
  :'';
 return `<div class="hub-diagram-node-group" data-diagram-depth="${depth}">
 <div class="hub-diagram-node" data-diagram-event="${esc(node.id)}"${children.length?` data-diagram-toggle="${esc(node.id)}" tabindex="0" role="group" aria-label="Evento: ${esc(node.text)}. Pressione Enter ou Espaço para expandir ou recolher os subitens."`:``}>
 <div class="hub-diagram-event-heading"><span class="hub-diagram-kind">${depth?'Subevento':'Evento'}</span>${depth?'':`<span class="hub-diagram-order">${ordinal}</span>`}</div>
 <strong>${esc(node.text)}</strong>
 <div class="hub-diagram-actions">
 <button type="button" class="hub-diagram-edit" data-diagram-edit="${esc(node.id)}" aria-label="Editar evento: ${esc(node.text)}">Editar</button>${toggle}
 </div>
 </div>
 ${children.length?`<div id="timeline-diagram-children-${esc(node.id)}" class="hub-diagram-children" role="group" aria-label="Subeventos de ${esc(node.text)}" ${collapsed?'hidden':''}>${children.map(child=>campaignNode(child,depth+1,collapsedIds)).join('')}</div>`:''}
 </div>`
}
export function renderCampaignTimelineDiagram(nodes=[],collapsedIds=new Set()){
 const rows=array(nodes);
 if(!rows.length)return '<div class="hub-diagram-empty">Nenhum evento registrado.</div>';
 return `<div class="hub-diagram-scroll hub-diagram-scroll--campaign" role="region" aria-label="Fluxograma da campanha" tabindex="0">
 <div class="hub-diagram-roots">${rows.map((node,index)=>`<div class="hub-diagram-root" data-diagram-root="${esc(node.id)}" data-diagram-order="${index+1}">${campaignNode(node,0,collapsedIds,index+1)}</div>`).join('')}</div>
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
