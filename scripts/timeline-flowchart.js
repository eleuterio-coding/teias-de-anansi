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
// Eventos principais independentes; subeventos ligados apenas ao seu pai.
// Cards com filhos alternam a ramificação. Cards vinculados sem filhos abrem a entidade.
export function timelineDisclosure(node,collapsed,view='list'){
 const id=esc(node.id),label=collapsed?'Revelar subitens':'Ocultar subitens';
 const childrenId=(view==='flowchart'?'timeline-diagram-children-':'timeline-list-children-')+id;
 return `<button type="button" class="${view==='flowchart'?'hub-diagram-collapse':'secondary timeline-collapse'} timeline-icon-toggle" data-timeline-toggle="${id}" data-timeline-count="${array(node.children).length}" aria-label="${label}" title="${label}" aria-expanded="${!collapsed}" aria-controls="${childrenId}"><span class="timeline-toggle-chevron" aria-hidden="true"></span></button>`;
}
function campaignNode(node,depth=0,collapsedIds=new Set(),ordinal=null,{readOnly=false}={}){
 const children=array(node.children),hasChildren=children.length>0,collapsed=collapsedIds.has(node.id);
 const kind=node.automatic?(node.kind==='session'?'Sessão':'Aventura'):depth?'Subevento':'Evento';
 const title=esc(node.text),id=esc(node.id);
 const linked=Boolean(node.automatic&&node.href);
 const nodeClass=`hub-diagram-node${node.automatic?' hub-diagram-node-linked':''}${hasChildren?' timeline-card-has-children':''}`;
 const interaction=hasChildren?` data-diagram-toggle="${id}" tabindex="0" role="group" aria-label="${kind}: ${title}. Enter ou Espaço para revelar ou ocultar subitens."`:'';
 const heading=linked?`<a class="hub-diagram-linked-name campaign-timeline-title-link" href="${esc(node.href)}" aria-label="Abrir ${kind}: ${title}">${title}</a>`:`<strong>${title}</strong>`;
 const controls=(readOnly||node.automatic?'':`<button type="button" class="hub-diagram-visibility" data-timeline-visibility="${id}" aria-pressed="${node.visibleToPlayers===true}">${node.visibleToPlayers===true?'Visível aos jogadores':'Oculto dos jogadores'}</button><button type="button" class="hub-diagram-edit" data-diagram-edit="${id}" aria-label="Editar evento: ${title}">Editar</button>`);
 const toggle=hasChildren?timelineDisclosure(node,collapsed,'flowchart'):'';
 return `<div class="hub-diagram-node-group" data-diagram-depth="${depth}">
 <div class="${nodeClass}" data-diagram-event="${id}"${interaction}>
 <div class="hub-diagram-event-heading"><span class="hub-diagram-kind">${kind}</span>${depth?'':`<span class="hub-diagram-order">${ordinal}</span>`}</div>
 ${heading}
 ${controls||toggle?`<div class="hub-diagram-actions">${controls}${toggle}</div>`:''}
 </div>
 ${hasChildren?`<div id="timeline-diagram-children-${id}" class="hub-diagram-children" role="group" aria-label="Subitens de ${title}" ${collapsed?'hidden':''}>${children.map(child=>campaignNode(child,depth+1,collapsedIds,null,{readOnly})).join('')}</div>`:''}
 </div>`;
}
export function renderCampaignTimelineDiagram(nodes=[],collapsedIds=new Set(),{readOnly=false}={}){
 const rows=array(nodes);
 if(!rows.length)return '<div class="hub-diagram-empty">Nenhum evento registrado.</div>';
 return `<div class="hub-diagram-scroll hub-diagram-scroll--campaign" role="region" aria-label="Fluxograma da campanha" tabindex="0">
 <div class="hub-diagram-roots">${rows.map((node,index)=>`<div class="hub-diagram-root" data-diagram-root="${esc(node.id)}" data-diagram-order="${index+1}">${campaignNode(node,0,collapsedIds,index+1,{readOnly})}</div>`).join('')}</div>
 </div>`
}
// Itens vivos das Cenas: a Linha do Tempo acompanha criação, edição e estado,
// mas não grava cópias das Cenas na coleção de eventos.
export function deriveAdventureTimelineEvents(adventure={}){
 const scenes=array(adventure?.scenes);
 const historical=array(adventure?.timelineEvents);
 const labels={planned:'Planejada',active:'Em andamento',completed:'Concluída',skipped:'Ignorada'};
 const sceneItems=scenes.map((scene,index)=>({
  id:'derived-scene-'+String(scene.id),
  sceneId:scene.id,
  type:'scene',
  virtualScene:true,
  automatic:true,
  title:scene.title||'Cena '+(index+1),
  sceneStatus:labels[scene.status]||'Planejada',
  text:scene.status==='completed'?(scene.outcome||scene.description||scene.objective||''):(scene.objective||scene.description||''),
  at:scene.createdAt||scene.updatedAt||'',
  sequence:Number.isFinite(Number(scene.order))?Number(scene.order):index+1
 }));
 // Históricos automáticos de transição de Cenas permanecem armazenados,
 // porém não competem com o registro atual da Cena na visualização.
 const log=historical.filter(event=>!(event.automatic===true&&event.type==='scene'&&
  scenes.some(scene=>scene.id===event.sceneId)));
 return [...sceneItems,...log].sort((a,b)=>{
  const ta=Date.parse(a.at||''),tb=Date.parse(b.at||'');
  if(Number.isFinite(ta)&&Number.isFinite(tb)&&ta!==tb)return ta-tb;
  if(Number.isFinite(ta)!==Number.isFinite(tb))return Number.isFinite(ta)?-1:1;
  if(a.virtualScene&&b.virtualScene)return a.sequence-b.sequence;
  return String(a.id).localeCompare(String(b.id));
 });
}
export function renderAdventureTimelineDiagram(events=[],{readOnly=false}={}){
 const rows=array(events).slice().sort((a,b)=>String(a.at||'').localeCompare(String(b.at||''))||String(a.id).localeCompare(String(b.id)));
 if(!rows.length)return '<div class="hub-diagram-empty">Nenhum registro.</div>';
 return `<div class="hub-diagram-scroll" role="region" aria-label="Fluxograma da aventura" tabindex="0">
 <ol class="hub-diagram-sequence">${rows.map((event,index)=>`<li class="hub-diagram-sequence-step">
 <div class="hub-diagram-node" data-diagram-event="${esc(event.id)}">
 <span class="hub-diagram-kind">${event.virtualScene?'Cena · '+esc(event.sceneStatus):'Evento '+(index+1)+(event.automatic?' · Automático':'')}</span>
 <strong>${esc(event.title)}</strong>
 ${safeDate(event.at)?`<time class="hub-diagram-date">${esc(safeDate(event.at))}</time>`:''}
 ${event.text?`<p>${esc(event.text)}</p>`:''}
 ${readOnly?'':`<button type="button" class="hub-diagram-edit" data-diagram-edit="${esc(event.id)}">Ver registro</button>`}
 </div></li>`).join('')}</ol>
 </div>`
}
