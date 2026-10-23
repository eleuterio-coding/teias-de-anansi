import{timelineViewToggle,renderCampaignTimelineDiagram,timelineDisclosure}from'./timeline-flowchart.js?v=20261023-title-links4';
import{projectCampaignTimeline}from'./campaign-timeline-projection.js?v=20261023-linked-timeline1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
import{locationPatch,reorderLocationRows,locationThumbnail,bindLocationImages}from'./campaign-important-location-ui.js?v=20261019-location-images1';
import{hydrateMediaImages}from'./image-media.js?v=20261019-disclosure1';
export const entries=value=>String(value||'').split(/\r?\n/).map(x=>x.trim().replace(/^[•*\-]\s*/, '')).filter(Boolean);
const clean=v=>String(v??'').trim();
const npcHref=id=>'ficha-personagem.html?npc=1&id='+encodeURIComponent(id);
const clone=nodes=>JSON.parse(JSON.stringify(Array.isArray(nodes)?nodes:[]));
const createId=()=>globalThis.crypto?.randomUUID?.()||'event-'+Date.now()+'-'+Math.random().toString(36).slice(2,9);
export function countTimelineNodes(nodes){return (nodes||[]).reduce((n,item)=>n+1+countTimelineNodes(item.children),0)}
export function flattenTimeline(nodes){return (nodes||[]).flatMap(node=>[node.text,...flattenTimeline(node.children)])}
export function reorderLineValues(value,sourceIndex,targetIndex,position='before'){
 const values=entries(value),from=Number(sourceIndex),to=Number(targetIndex);
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=values.length||to>=values.length||from===to||!['before','after'].includes(position))return null;
 const reordered=[...values],item=reordered.splice(from,1)[0],insertion=to+(position==='after'?1:0)-(from<to?1:0);
 reordered.splice(insertion,0,item);
 return reordered.join('\n')
}
function findNode(nodes,id){
 for(const item of nodes||[]){
  if(item.id===id)return item;
  const found=findNode(item.children,id);if(found)return found;
 }
 return null
}
function locationOf(nodes,id,parent=null){
 for(let index=0;index<nodes.length;index++){
  if(nodes[index].id===id)return{list:nodes,index,parent};
  const found=locationOf(nodes[index].children||[],id,nodes[index]);if(found)return found;
 }
 return null
}
export function moveTimelineNode(nodes,sourceId,targetId,position='before'){
 if(!['before','after','child'].includes(position)||sourceId===targetId)return null;
 const result=clone(nodes);
 const source=findNode(result,sourceId),target=findNode(result,targetId);
 if(!source||!target||findNode(source.children,targetId))return null;
 const origin=locationOf(result,sourceId);
 origin.list.splice(origin.index,1);
 const dest=locationOf(result,targetId);
 if(!dest)return null;
 if(position==='child'){dest.list[dest.index].children.push(source)}
 else dest.list.splice(dest.index+(position==='after'?1:0),0,source);
 return result
}
export function addTimelineNode(nodes,text,parentId=null){
 const name=clean(text);if(!name)return null;
 const result=clone(nodes),id=createId(),node={id,text:name,visibleToPlayers:false,children:[]};
 if(parentId){
  const parent=findNode(result,parentId);if(!parent)return null;
  parent.children.push(node)
 }else result.push(node);
 return{nodes:result,id}
}
export function renameTimelineNode(nodes,id,text){
 const name=clean(text);if(!name)return null;
 const result=clone(nodes),node=findNode(result,id);if(!node)return null;
 node.text=name;return result
}
export function removeTimelineNode(nodes,id){
 const result=clone(nodes),location=locationOf(result,id);if(!location)return null;
 location.list.splice(location.index,1);return result
}
function roster(c,npcs,{readOnly=false}={}){
 if(readOnly){
  const rows=Array.isArray(c.importantNpcEntries)?c.importantNpcEntries:[];
  return `<section id="npcs" class="card campaign-editor-card campaign-npc-card"><div class="campaign-editor-head"><h2>NPCs importantes</h2></div>
   <ul class="campaign-bullet-list">${rows.length?rows.map(n=>`<li><span class="campaign-list-marker"></span><span>${esc(n.name||'NPC sem nome')}</span></li>`).join(''):'<li class="campaign-blank-state">Nenhum NPC disponível.</li>'}</ul></section>`;
 }
 const ids=c.importantNpcIds||[],chosen=ids.map(id=>npcs.find(n=>n.id===id)||{id,name:'NPC indisponível',missing:true}),available=npcs.filter(n=>!ids.includes(n.id)).sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
 return `<section id="npcs" class="card campaign-editor-card campaign-npc-card"><div class="campaign-editor-head"><h2>NPCs importantes</h2></div>
 <div class="campaign-add-line"><label>NPC<select id="campaign-npc-picker"><option value="">— Selecione um NPC —</option>${available.map(n=>`<option value="${esc(n.id)}">${esc(n.name||'NPC sem nome')}</option>`).join('')}</select></label><button type="button" data-add-npc>Adicionar NPC</button></div>
 <ul class="campaign-bullet-list">${chosen.length?chosen.map(n=>`<li><span class="campaign-list-marker"></span>${n.missing?`<span>${esc(n.name)}</span>`:`<a href="${npcHref(n.id)}">${esc(n.name||'NPC sem nome')}</a>`}<label class="campaign-disclosure-toggle"><input type="checkbox" data-visible-npc="${esc(n.id)}" ${c.importantNpcVisibility?.[n.id]===true?'checked':''}><span>Mostrar aos jogadores</span></label><button type="button" class="secondary campaign-list-remove" data-del-npc="${esc(n.id)}">Remover</button></li>`).join(''):'<li class="campaign-blank-state">Nenhum NPC vinculado.</li>'}</ul>
 <a class="btn secondary campaign-npc-library-link" href="npcs.html">Abrir NPCs</a></section>`
}
function bullets(c,id,title,field,{readOnly=false}={}){
 if(readOnly){
  const rows=Array.isArray(c.importantLocationEntries)?c.importantLocationEntries:[];
  return `<section id="locais" class="card campaign-editor-card"><div class="campaign-editor-head"><h2>Locais importantes</h2></div>
   <ul class="campaign-bullet-list">${rows.length?rows.map(row=>`<li class="campaign-readonly-location">
   ${row.image?.id?`<button type="button" class="campaign-player-location-thumb" data-player-location-preview="${esc(row.id)}" aria-label="Ampliar imagem de ${esc(row.name)}"><img data-hub-media-id="${esc(row.image.id)}" alt="Imagem de ${esc(row.name)}"></button>`:''}
   <span class="campaign-list-marker"></span><span>${esc(row.name)}</span></li>`).join(''):'<li class="campaign-blank-state">Nenhum local disponível.</li>'}</ul></section>`;
 }
 const values=entries(c[field]),locationRows=c.importantLocationEntries||[];
 return `<section id="${id}" class="card campaign-editor-card"><div class="campaign-editor-head"><h2>${esc(title)}</h2></div>
 <ul class="campaign-bullet-list campaign-editable-bullets">${values.length?values.map((v,i)=>`<li class="campaign-bullet-entry" data-line-drag="${field}" data-line-index="${i}" draggable="true" tabindex="0" aria-label="${esc(v)}. Arraste para reorganizar ou use as setas."><span class="campaign-reorder-grip" aria-hidden="true" title="Segure e arraste para mover">⠿</span>${field==='importantLocations'?locationThumbnail(locationRows[i]||{id:'old-'+i,name:v}):''}<span class="campaign-list-marker" aria-hidden="true"></span><input type="text" data-edit-line="${field}" data-index="${i}" aria-label="${esc(title)} ${i+1}" value="${esc(v)}" maxlength="500"><div class="campaign-line-actions">${field==='importantLocations'?`<label class="campaign-disclosure-toggle"><input type="checkbox" data-visible-location="${esc(locationRows[i]?.id||'')}" ${locationRows[i]?.visibleToPlayers===true?'checked':''}><span>Mostrar aos jogadores</span></label>`:''}<button type="button" class="secondary campaign-move-button" data-line-move="up" data-line-field="${field}" data-move-index="${i}" aria-label="Mover ${esc(v)} para cima" ${i===0?'disabled':''}>↑</button><button type="button" class="secondary campaign-move-button" data-line-move="down" data-line-field="${field}" data-move-index="${i}" aria-label="Mover ${esc(v)} para baixo" ${i===values.length-1?'disabled':''}>↓</button><button type="button" class="secondary campaign-list-remove" data-del-line="${field}" data-index="${i}" aria-label="Remover ${esc(v)}">Remover</button></div></li>`).join(''):'<li class="campaign-blank-state">Nenhum registro.</li>'}</ul>
 <div class="campaign-add-line"><label>Novo ${title==='Atos'?'ato':'local'}<input data-new-line="${field}" autocomplete="off" maxlength="500"></label><button type="button" data-add-line="${field}">Adicionar</button></div></section>`
}
function linkedTimelineHtml(node,index,depth=0,collapsedIds=new Set()){
 const sub=node.children||[],hasChildren=sub.length>0,collapsed=collapsedIds.has(node.id);
 const kind=node.kind==='session'?'Sessão':'Aventura',id=esc(node.id);
 const title=`<span class="campaign-linked-title"><span class="campaign-linked-kind">${kind}</span><a class="campaign-linked-name campaign-timeline-title-link" href="${esc(node.href)}" aria-label="Abrir ${kind}: ${esc(node.text)}">${esc(node.text)}</a></span>`;
 // O título abre a entidade; a superfície do card com filhos alterna a ramificação.
 const card=hasChildren
  ?`<div class="campaign-flow-card campaign-linked-card timeline-card-has-children" data-timeline-card-toggle="${id}" tabindex="0" role="group" aria-label="${kind}: ${esc(node.text)}. Pressione Enter ou Espaço para revelar subitens.">${title}${timelineDisclosure(node,collapsed)}</div>`
  :`<div class="campaign-flow-card campaign-linked-card">${title}</div>`;
 return `<li class="timeline-item timeline-item-linked" data-timeline-id="${id}" data-timeline-depth="${depth}" data-timeline-automatic="true">
 <div class="campaign-flow-step campaign-linked-step"><span class="campaign-flow-node" aria-hidden="true">${depth?'•':index+1}</span>${card}</div>
 ${hasChildren?`<ol class="timeline-children" id="timeline-list-children-${id}" aria-label="Sessões de ${esc(node.text)}" ${collapsed?'hidden':''}>${sub.map((child,i)=>linkedTimelineHtml(child,i,depth+1,collapsedIds)).join('')}</ol>`:''}
 </li>`;
}
function nodeHtml(node,index,depth=0,collapsedIds=new Set()){
 if(node.automatic)return linkedTimelineHtml(node,index,depth,collapsedIds);
 const sub=node.children||[],hasChildren=sub.length>0,collapsed=collapsedIds.has(node.id),id=esc(node.id);
 return `<li class="timeline-item" data-timeline-id="${id}" data-timeline-depth="${depth}">
  <div class="campaign-flow-step" draggable="true" data-timeline-drag="${id}"><span class="campaign-flow-node" aria-hidden="true">${depth?'•':index+1}</span>
   <div class="campaign-flow-card${hasChildren?' timeline-card-has-children':''}"${hasChildren?` data-timeline-card-toggle="${id}" tabindex="0" role="group" aria-label="Evento: ${esc(node.text)}. Pressione Enter ou Espaço para revelar subitens."`:''}>
    <span class="campaign-reorder-grip timeline-reorder-grip" aria-hidden="true" title="Segure e arraste para mover">⠿</span>
    <input class="timeline-node-text" data-timeline-text="${id}" value="${esc(node.text)}" maxlength="2000" aria-label="Texto do evento">
    
    <div class="campaign-flow-actions">
      <label class="campaign-disclosure-toggle"><input type="checkbox" data-visible-event="${id}" ${node.visibleToPlayers===true?'checked':''}><span>Mostrar aos jogadores</span></label>
      ${hasChildren?timelineDisclosure(node,collapsed):''}
      <button type="button" class="secondary" data-timeline-move="up" data-timeline-target="${id}" aria-label="Mover para cima">↑</button>
      <button type="button" class="secondary" data-timeline-move="down" data-timeline-target="${id}" aria-label="Mover para baixo">↓</button>
      <button type="button" class="secondary" data-timeline-move="indent" data-timeline-target="${id}" aria-label="Tornar subevento">↳</button>
      <button type="button" class="secondary" data-timeline-move="outdent" data-timeline-target="${id}" aria-label="Mover para nível acima">↰</button>
      <button type="button" class="secondary" data-timeline-delete="${id}" aria-label="Remover evento">Remover</button>
    </div>
   </div>
  </div>
  ${hasChildren?`<ol class="timeline-children" id="timeline-list-children-${id}" aria-label="Subeventos de ${esc(node.text)}" ${collapsed?'hidden':''}>${sub.map((child,i)=>nodeHtml(child,i,depth+1,collapsedIds)).join('')}</ol>`:''}
 </li>`;
}
function defaultCollapsedTimelineIds(nodes=[]){
 const hidden=new Set();
 const visit=rows=>{for(const node of rows){if(node.children?.length){hidden.add(node.id);visit(node.children)}}};
 visit(nodes);return hidden
}
export function campaignTimelineCollapsedIds(c,adventures=[]){
 return defaultCollapsedTimelineIds(projectCampaignTimeline(c,adventures));
}
function readonlyTimelineNode(node,index,depth=0,collapsedIds=new Set()){
 if(node.automatic)return linkedTimelineHtml(node,index,depth,collapsedIds);
 const sub=node.children||[],hasChildren=sub.length>0,collapsed=collapsedIds.has(node.id),id=esc(node.id);
 return `<li class="timeline-item" data-timeline-id="${id}"><div class="campaign-flow-step"><span class="campaign-flow-node" aria-hidden="true">${depth?'•':index+1}</span>
 <div class="campaign-flow-card${hasChildren?' timeline-card-has-children':''}"${hasChildren?` data-timeline-card-toggle="${id}" tabindex="0" role="group" aria-label="Evento: ${esc(node.text)}. Pressione Enter ou Espaço para revelar subitens."`:''}>
 <span class="timeline-node-text campaign-readonly-timeline-text">${esc(node.text)}</span>
 ${hasChildren?`<div class="campaign-flow-actions">${timelineDisclosure(node,collapsed)}</div>`:''}</div></div>
 ${hasChildren?`<ol class="timeline-children" id="timeline-list-children-${id}" ${collapsed?'hidden':''}>${sub.map((child,i)=>readonlyTimelineNode(child,i,depth+1,collapsedIds)).join('')}</ol>`:''}</li>`;
}
function flow(c,view='list',collapsedIds=null,{readOnly=false,adventures=[]}={}){
 const nodes=projectCampaignTimeline(c,adventures),mode=view==='flowchart'?'flowchart':'list';
 // Todo grupo começa recolhido, tanto automático quanto manual.
 collapsedIds=collapsedIds??defaultCollapsedTimelineIds(nodes);
 return `<section id="linha-tempo" class="card campaign-editor-card campaign-timeline-section"><div class="campaign-editor-head hub-timeline-heading"><div class="hub-timeline-title-group"><h2>Linha do tempo</h2></div>${timelineViewToggle(mode)}</div>
 ${mode==='flowchart'?renderCampaignTimelineDiagram(nodes,collapsedIds,{readOnly}):`<ol class="campaign-timeline-flow timeline-tree">${nodes.length?nodes.map((n,i)=>readOnly?readonlyTimelineNode(n,i,0,collapsedIds):nodeHtml(n,i,0,collapsedIds)).join(''):'<li class="campaign-blank-state">Nenhum evento registrado.</li>'}</ol>`}
 
 </section>`
}
export function renderStructuredSection(c,npcs,id,view='list',collapsedIds=null,{readOnly=false,adventures=[]}={}){
 if(id==='npcs')return roster(c,npcs,{readOnly});
 if(id==='locais')return bullets(c,'locais','Locais importantes','importantLocations',{readOnly});

 if(id==='linha-tempo')return flow(c,view,collapsedIds,{readOnly,adventures});
 return''
}
export function renderStructuredDetails(c,npcs,{readOnly=false}={}){
 // Pilhas independentes para NPCs e Locais; os Atos permanecem apenas nas Aventuras.
 return `<div class="campaign-structured-columns">
  <div class="campaign-structured-column">
   ${renderStructuredSection(c,npcs,'npcs','list',null,{readOnly})}
  </div>
  <div class="campaign-structured-column">
   ${renderStructuredSection(c,npcs,'locais','list',null,{readOnly})}
  </div>
 </div>`
}
export function renderTimeline(c,view='list',collapsedIds=null,{readOnly=false,adventures=[]}={}){return flow(c,view,collapsedIds,{readOnly,adventures})}
export function bindStructuredDetails({getCampaign,getNpcs,getAdventures=()=>[],save,feedback}){
 let timelineView='list';
 const collapsedTimelineIds=campaignTimelineCollapsedIds(getCampaign(),getAdventures());
 const sectionFor=field=>field==='importantLocations'?'locais':'missoes';
 const root=document.querySelector('.campaign-sections');if(!root)return;
 const refresh=id=>{
  const previous=document.getElementById(id);if(!previous)return;
  const template=document.createElement('template');
  template.innerHTML=renderStructuredSection(getCampaign(),getNpcs(),id,id==='linha-tempo'?timelineView:'list',collapsedTimelineIds,{adventures:getAdventures()});
  const next=template.content.firstElementChild;previous.replaceWith(next);hydrateMediaImages(next).catch(()=>{})
 };
 const persist=(patch,id,message,render=true)=>{
  save(patch,{message});if(render)refresh(id)
 };
 const saveTree=(nodes,message)=>{
  persist({timelineNodes:nodes,timeline:flattenTimeline(nodes).join('\n')},'linha-tempo',message)
 };
 const move=(source,target,position)=>{
  const previous=getCampaign().timelineNodes,updated=moveTimelineNode(previous,source,target,position);
  if(updated&&JSON.stringify(updated)!==JSON.stringify(previous)){
   if(position==='child')collapsedTimelineIds.delete(target);
   saveTree(updated,'Linha do tempo reorganizada.');return true
  }
  if(!updated)feedback('Esse movimento não é permitido.',false);
  return false
 };
 const clearDrag=()=>{
  root.querySelectorAll('.timeline-drop-target,.timeline-dragging').forEach(el=>{
   el.classList.remove('timeline-drop-target','timeline-dragging');delete el.dataset.dropPosition
  })
 };
 const dropLocation=(item,y)=>{
  const card=item.querySelector(':scope > .campaign-flow-step > .campaign-flow-card')||item;
  const box=card.getBoundingClientRect(),portion=(y-box.top)/Math.max(box.height,1);
  return portion<.28?'before':portion>.72?'after':'child'
 };
 root.addEventListener('click',event=>{
  const section=event.target.closest('#npcs,#locais,#missoes,#linha-tempo');
  if(!section)return;
  // Qualquer ponto não interativo de um card com filhos revela/recolhe os subitens.
  // Links integrais das Sessões não interceptam a navegação.
  const expandable=event.target.closest('.campaign-flow-card[data-timeline-card-toggle],.hub-diagram-node[data-diagram-toggle]');
  if(section.id==='linha-tempo'&&expandable&&!event.target.closest('button,a,input,textarea,select,label,[contenteditable="true"]')){
   expandable.querySelector('[data-timeline-toggle]')?.click();
   return;
  }
  const target=event.target.closest('button');if(!target)return;
  const c=getCampaign();
  if(target.matches('[data-timeline-visibility]')){
    const updated=clone(c.timelineNodes),node=findNode(updated,target.dataset.timelineVisibility);
    if(node){node.visibleToPlayers=node.visibleToPlayers!==true;saveTree(updated,'Visibilidade do evento atualizada.')}
    return
   }else if(target.matches('[data-timeline-toggle]')){
   // Modifica só a ramificação: não recria campos, não perde o foco
   // e preserva o estado ao alternar Lista / Fluxograma.
   const id=target.dataset.timelineToggle;
   const container=target.closest('.timeline-item,.hub-diagram-node-group');
   const children=container?.querySelector(':scope > .timeline-children, :scope > .hub-diagram-children');
   if(!children)return;
   const closing=target.getAttribute('aria-expanded')==='true';
   children.hidden=closing;
   if(closing)collapsedTimelineIds.add(id);else collapsedTimelineIds.delete(id);
   target.setAttribute('aria-expanded',String(!closing));
   const label=closing?'Revelar subitens':'Ocultar subitens';
   target.setAttribute('aria-label',label);target.title=label;
   return
  }else if(target.matches('[data-timeline-view]')){
   timelineView=target.dataset.timelineView==='flowchart'?'flowchart':'list';
   refresh('linha-tempo');
   return
  }else if(target.matches('[data-diagram-edit]')){
   const selected=target.dataset.diagramEdit;
   timelineView='list';refresh('linha-tempo');
   const input=[...root.querySelectorAll('#linha-tempo [data-timeline-text]')].find(el=>el.dataset.timelineText===selected);
   input?.scrollIntoView({block:'nearest'});input?.focus();
   return
  }else if(target.matches('[data-add-npc]')){
   const id=section.querySelector('#campaign-npc-picker')?.value;
   if(!id||!getNpcs().some(n=>n.id===id))return feedback('Selecione um NPC cadastrado.',false);
   persist({importantNpcIds:[...new Set([...(c.importantNpcIds||[]),id])],importantNpcPublicNames:{...(c.importantNpcPublicNames||{}),[id]:getNpcs().find(n=>n.id===id)?.name||'NPC'}},'npcs','NPC adicionado.')
  }else if(target.matches('[data-del-npc]')){
   persist({importantNpcIds:(c.importantNpcIds||[]).filter(id=>id!==target.dataset.delNpc)},'npcs','NPC removido.')
  }else if(target.matches('[data-add-line]')){
   const field=target.dataset.addLine,value=clean(section.querySelector('[data-new-line]')?.value);
   if(!value)return;
   if(field==='importantLocations'){
     const rows=[...(c.importantLocationEntries||[]),{id:globalThis.crypto?.randomUUID?.()||'important-location-'+Date.now(),name:value,image:null}];
     persist(locationPatch(rows),'locais','Registro adicionado.')
    }else persist({[field]:[...entries(c[field]),value].join('\n')},sectionFor(field),'Registro adicionado.')
  }else if(target.matches('[data-del-line]')){
   const field=target.dataset.delLine,values=entries(c[field]);values.splice(Number(target.dataset.index),1);
   if(field==='importantLocations'){
     const rows=[...(c.importantLocationEntries||[])],removed=rows.splice(Number(target.dataset.index),1)[0];
     persist(locationPatch(rows),'locais','Registro removido.');
     if(removed?.image?.id)void import('./image-media.js?v=20261019-important-locations1').then(({persistCampaignMediaState,deleteImage})=>persistCampaignMediaState(c.id,{entityType:'campaign',entityId:c.id}).then(()=>deleteImage(removed.image))).catch(error=>feedback(error?.message||'Falha ao sincronizar imagem removida.',false));
    }else persist({[field]:values.join('\n')},sectionFor(field),'Registro removido.')
  }else if(target.matches('[data-line-move]')){
   const field=target.dataset.lineField,index=Number(target.dataset.moveIndex);
   const values=entries(c[field]),direction=target.dataset.lineMove;
   if(!['importantLocations','activeMissions'].includes(field)||!Number.isInteger(index)||!['up','down'].includes(direction))return;
   const adjacent=index+(direction==='up'?-1:1);
   if(adjacent<0||adjacent>=values.length)return;
   const reordered=field==='importantLocations'
     ?reorderLocationRows(c.importantLocationEntries||[],index,adjacent,direction==='up'?'before':'after')
     :reorderLineValues(c[field],index,adjacent,direction==='up'?'before':'after');
   if(reordered===null||reordered===c[field])return;
   const id=sectionFor(field);
   persist(field==='importantLocations'?locationPatch(reordered):{[field]:reordered},id,'Ordem atualizada.');
   const moved=document.querySelector('#'+id+' [data-line-index="'+adjacent+'"]');
   showReorderConfirmation(id,moved);
  }else if(target.matches('[data-timeline-delete]')){
   const id=target.dataset.timelineDelete,node=findNode(c.timelineNodes,id);
   if(node?.children?.length&&!confirm('Remover este evento e todos os seus subeventos?'))return;
   const updated=removeTimelineNode(c.timelineNodes,id);if(updated){collapsedTimelineIds.delete(id);saveTree(updated,'Evento removido.')}
  }else if(target.matches('[data-timeline-move]')){
   const id=target.dataset.timelineTarget,loc=locationOf(c.timelineNodes,id);
   if(!loc)return;
   const direction=target.dataset.timelineMove;
   if(direction==='up'&&loc.index>0)move(id,loc.list[loc.index-1].id,'before');
   else if(direction==='down'&&loc.index<loc.list.length-1)move(id,loc.list[loc.index+1].id,'after');
   else if(direction==='indent'&&loc.index>0)move(id,loc.list[loc.index-1].id,'child');
   else if(direction==='outdent'&&loc.parent)move(id,loc.parent.id,'after');
  }
 });
 root.addEventListener('change',event=>{
  const input=event.target,c=getCampaign();
  if(input.matches('[data-visible-npc]')){
    persist({importantNpcVisibility:{...(c.importantNpcVisibility||{}),[input.dataset.visibleNpc]:input.checked},importantNpcPublicNames:{...(c.importantNpcPublicNames||{}),[input.dataset.visibleNpc]:getNpcs().find(n=>n.id===input.dataset.visibleNpc)?.name||c.importantNpcPublicNames?.[input.dataset.visibleNpc]||'NPC'}},'npcs','Visibilidade do NPC atualizada.',false)
   }else if(input.matches('[data-visible-location]')){
    const rows=(c.importantLocationEntries||[]).map(row=>row.id===input.dataset.visibleLocation?{...row,visibleToPlayers:input.checked}:row);
    persist(locationPatch(rows),'locais','Visibilidade do local atualizada.',false)
   }else if(input.matches('[data-visible-event]')){
    const updated=clone(c.timelineNodes),node=findNode(updated,input.dataset.visibleEvent);
    if(node){node.visibleToPlayers=input.checked;saveTree(updated,'Visibilidade do evento atualizada.')}
   }else if(input.matches('[data-edit-line]')){
   const field=input.dataset.editLine,values=entries(c[field]),index=Number(input.dataset.index),value=clean(input.value);
   if(!value){input.value=values[index]||'';return feedback('O nome não pode ficar vazio.',false)}
   if(values[index]===value)return;
   values[index]=value;
    const patch=field==='importantLocations'
     ?locationPatch((c.importantLocationEntries||[]).map((row,i)=>i===index?{...row,name:value}:row))
     :{[field]:values.join('\n')};
    persist(patch,sectionFor(field),'Nome atualizado.',false)
  }else if(input.matches('[data-timeline-text]')){
   const id=input.dataset.timelineText,current=findNode(c.timelineNodes,id),value=clean(input.value);
   if(!value){input.value=current?.text||'';return feedback('O evento precisa de texto.',false)}
   if(current?.text===value)return;
   const updated=renameTimelineNode(c.timelineNodes,id,value);
   if(updated)persist({timelineNodes:updated,timeline:flattenTimeline(updated).join('\n')},'linha-tempo','Evento atualizado.',false)
  }
 });
 root.addEventListener('keydown',event=>{
  // O cartão também funciona com teclado sem interceptar Editar/Mostrar.
  const diagramCard=event.target.closest?.('.hub-diagram-node[data-diagram-toggle],.campaign-flow-card[data-timeline-card-toggle]');
  if(diagramCard&&event.target===diagramCard&&['Enter',' '].includes(event.key)){
   event.preventDefault();
   diagramCard.querySelector('[data-timeline-toggle]')?.click();
   return;
  }
  if(event.key!=='Enter'||!event.target.matches('[data-new-line],[data-edit-line],[data-timeline-text]'))return;
  event.preventDefault();
  if(event.target.matches('[data-new-line]'))event.target.closest('section').querySelector('[data-add-line]')?.click();
  else event.target.blur()
 });
 let dragging=null,touch=null,pen=null,mouse=null,floating=null;
 const interactive=target=>Boolean(target.closest('input,textarea,select,button,a,[contenteditable="true"]')||(target.closest('.campaign-flow-card[data-timeline-card-toggle]')&&!target.closest('.campaign-reorder-grip')));
 const findSurface=target=>target?.closest?.('[data-timeline-drag],[data-line-drag]')||null;
 const dragInfo=surface=>surface?.hasAttribute('data-timeline-drag')
  ?{kind:'timeline',id:surface.dataset.timelineDrag,surface}
  :surface?.hasAttribute('data-line-drag')
   ?{kind:'line',field:surface.dataset.lineDrag,index:Number(surface.dataset.lineIndex),surface}
   :null;
 const releaseLift=()=>{
  if(!floating)return;
  floating.element.remove();
  floating=null
 };
 const moveLift=(x,y)=>{
  if(!floating)return;
  floating.element.style.transform='translate3d('+(x-floating.x)+'px,'+(y-floating.y)+'px,0) rotate(-1deg) scale(1.018)'
 };
 const liftCard=(info,x,y)=>{
  if(!info||floating)return;
  const surface=info.surface,rect=surface.getBoundingClientRect();
  const clone=surface.cloneNode(true);
  clone.querySelectorAll('[id]').forEach(element=>element.removeAttribute('id'));
  clone.querySelectorAll('input,textarea,select,button,a').forEach(element=>{
   element.tabIndex=-1;element.setAttribute('aria-hidden','true')
  });
  clone.removeAttribute('draggable');
  clone.removeAttribute('tabindex');
  clone.classList.add('campaign-floating-card');
  clone.setAttribute('aria-hidden','true');
  clone.style.width=rect.width+'px';
  clone.style.minHeight=rect.height+'px';
  clone.style.left=rect.left+'px';
  clone.style.top=rect.top+'px';
  document.body.appendChild(clone);
  floating={element:clone,x,y};
  moveLift(x,y)
 };
 const clearHighlight=()=>{
  root.querySelectorAll('.timeline-drop-target,.timeline-dragging,.campaign-line-drop-target,.campaign-line-dragging').forEach(element=>{
   element.classList.remove('timeline-drop-target','timeline-dragging','campaign-line-drop-target','campaign-line-dragging');
   delete element.dataset.dropPosition
  })
 };
 const targetFor=(info,target,y)=>{
  if(!info||!target)return null;
  if(info.kind==='timeline'){
   const item=target.closest('.timeline-item');
   if(!item||!item.closest('#linha-tempo')||item.dataset.timelineAutomatic==='true')return null;
   return{item,position:dropLocation(item,y),id:item.dataset.timelineId}
  }
  const item=target.closest('.campaign-bullet-entry');
  if(!item||item.dataset.lineDrag!==info.field)return null;
  const bounds=item.getBoundingClientRect();
  return{item,position:y<bounds.top+bounds.height/2?'before':'after',index:Number(item.dataset.lineIndex)}
 };
 const showReorderConfirmation=(sectionId,moved)=>{
  const section=document.getElementById(sectionId);
  if(!section)return;
  moved?.classList.add('campaign-reorder-confirmed');
  const heading=section.querySelector('.campaign-editor-head');
  if(!heading)return;
  heading.querySelector('[data-reorder-confirmation]')?.remove();
  const message=document.createElement('span');
  message.className='campaign-reorder-feedback';
  message.dataset.reorderConfirmation='';
  message.setAttribute('role','status');
  message.textContent='✓ Ordem atualizada';
  heading.appendChild(message);
  window.setTimeout(()=>{
   moved?.classList.remove('campaign-reorder-confirmed');
   message.remove()
  },2200)
 };
 const mark=(info,drop)=>{
  clearHighlight();
  if(!info)return;
  const source=info.kind==='timeline'?info.surface.closest('.timeline-item'):info.surface;
  source?.classList.add(info.kind==='timeline'?'timeline-dragging':'campaign-line-dragging');
  if(!drop||drop.item===source)return;
  drop.item.classList.add(info.kind==='timeline'?'timeline-drop-target':'campaign-line-drop-target');
  drop.item.dataset.dropPosition=drop.position
 };
 const applyDrop=(info,drop)=>{
  if(!info||!drop)return;
  if(info.kind==='timeline'){
   if(move(info.id,drop.id,drop.position)){
    const row=[...root.querySelectorAll('#linha-tempo [data-timeline-id]')].find(element=>element.dataset.timelineId===info.id);
    showReorderConfirmation('linha-tempo',row)
   }
   return
  }
  const field=info.field,id=field==='importantLocations'?'locais':'missoes';
  const reordered=field==='importantLocations'
    ?reorderLocationRows(getCampaign().importantLocationEntries||[],info.index,drop.index,drop.position)
    :reorderLineValues(getCampaign()[field],info.index,drop.index,drop.position);
  if(reordered!==null&&reordered!==getCampaign()[field]){
   const newIndex=drop.index+(drop.position==='after'?1:0)-(info.index<drop.index?1:0);
   persist(field==='importantLocations'?locationPatch(reordered):{[field]:reordered},id,'Ordem atualizada.');
   showReorderConfirmation(id,document.querySelector('#'+id+' [data-line-index="'+newIndex+'"]'))
  }
 };
 // Mouse: captura o ponteiro na superfície inteira; não depende do DnD nativo,
 // que pode perder o evento de soltura próximo às bordas dos inputs.
 const clearMouse=()=>{
  if(!mouse)return;
  const surface=mouse.surface,pointerId=mouse.pointerId;
  clearTimeout(mouse.timer);mouse=null;surface.draggable=true;releaseLift();
  if(surface.hasPointerCapture?.(pointerId))surface.releasePointerCapture(pointerId);
  clearHighlight()
 };
 root.addEventListener('pointerdown',event=>{
  if(event.pointerType!=='mouse'||event.button!==0||interactive(event.target))return;
  const info=dragInfo(findSurface(event.target));
  if(!info)return;
  mouse={...info,pointerId:event.pointerId,x:event.clientX,y:event.clientY,active:false};
  mouse.timer=setTimeout(()=>{
   if(mouse?.pointerId===event.pointerId&&!mouse.active){
    mouse.active=true;liftCard(mouse,mouse.x,mouse.y);mark(mouse,null)
   }
  },160);
  info.surface.draggable=false;
  info.surface.setPointerCapture?.(event.pointerId);
  event.preventDefault()
 });
 root.addEventListener('pointermove',event=>{
  if(!mouse||mouse.pointerId!==event.pointerId)return;
  if(!mouse.active&&Math.hypot(event.clientX-mouse.x,event.clientY-mouse.y)<6)return;
  mouse.active=true;event.preventDefault();
  liftCard(mouse,mouse.x,mouse.y);
  moveLift(event.clientX,event.clientY);
  mark(mouse,targetFor(mouse,document.elementFromPoint(event.clientX,event.clientY),event.clientY))
 });
 root.addEventListener('pointerup',event=>{
  if(!mouse||mouse.pointerId!==event.pointerId)return;
  const info=mouse,drop=targetFor(info,document.elementFromPoint(event.clientX,event.clientY),event.clientY);
  const shouldMove=info.active;clearMouse();
  if(shouldMove)applyDrop(info,drop)
 });
 root.addEventListener('pointercancel',clearMouse);
 root.addEventListener('dragstart',event=>{
  const surface=findSurface(event.target);
  if(!surface)return;
  if(mouse){event.preventDefault();return}
  dragging=dragInfo(surface);
  if(!dragging)return;
  if(event.dataTransfer){event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',dragging.kind==='timeline'?dragging.id:String(dragging.index))}
  mark(dragging,null)
 });
 root.addEventListener('dragover',event=>{
  if(!dragging)return;
  const drop=targetFor(dragging,event.target,event.clientY);
  if(!drop)return;
  event.preventDefault();
  if(event.dataTransfer)event.dataTransfer.dropEffect='move';
  mark(dragging,drop)
 });
 root.addEventListener('drop',event=>{
  if(!dragging)return;
  event.preventDefault();
  const info=dragging,drop=targetFor(info,event.target,event.clientY);
  dragging=null;clearHighlight();applyDrop(info,drop)
 });
 root.addEventListener('dragend',()=>{dragging=null;clearHighlight()});
 // No toque, segurar o item brevemente ativa o arraste; deslizar normalmente continua rolando a página.
 const clearTouch=()=>{if(touch?.timer)clearTimeout(touch.timer);touch=null;releaseLift();clearHighlight()};
 root.addEventListener('touchstart',event=>{
  if(touch||interactive(event.target))return;
  const surface=findSurface(event.target),point=event.changedTouches[0],info=dragInfo(surface);
  if(!info||!point)return;
  touch={...info,identifier:point.identifier,x:point.clientX,y:point.clientY,active:false,timer:setTimeout(()=>{
   if(touch&&touch.identifier===point.identifier){touch.active=true;liftCard(touch,touch.x,touch.y);mark(touch,null)}
  },280)}
 },{passive:true});
 root.addEventListener('touchmove',event=>{
  if(!touch)return;
  const point=[...event.touches].find(t=>t.identifier===touch.identifier);
  if(!point)return;
  if(!touch.active){
   if(Math.hypot(point.clientX-touch.x,point.clientY-touch.y)>9)clearTouch();
   return
  }
  event.preventDefault();
  moveLift(point.clientX,point.clientY);
  const target=document.elementFromPoint(point.clientX,point.clientY);
  mark(touch,targetFor(touch,target,point.clientY))
 },{passive:false});
 root.addEventListener('touchend',event=>{
  if(!touch)return;
  const point=[...event.changedTouches].find(t=>t.identifier===touch.identifier);
  if(!point)return;
  const info=touch,active=info.active;
  const target=document.elementFromPoint(point.clientX,point.clientY),drop=targetFor(info,target,point.clientY);
  clearTouch();
  if(active){event.preventDefault();applyDrop(info,drop)}
 },{passive:false});
 root.addEventListener('touchcancel',clearTouch);
 // Canetas digitais utilizam o mesmo item inteiro, sem depender de uma alça.
 root.addEventListener('pointerdown',event=>{
  if(event.pointerType!=='pen'||interactive(event.target))return;
  pen={...dragInfo(findSurface(event.target)),pointerId:event.pointerId,active:false,x:event.clientX,y:event.clientY};
  if(!pen.kind){pen=null;return}
  event.target.setPointerCapture?.(event.pointerId)
 });
 root.addEventListener('pointermove',event=>{
  if(!pen||event.pointerId!==pen.pointerId)return;
  if(!pen.active&&Math.hypot(event.clientX-pen.x,event.clientY-pen.y)<7)return;
  pen.active=true;event.preventDefault();
  liftCard(pen,pen.x,pen.y);moveLift(event.clientX,event.clientY);
  mark(pen,targetFor(pen,document.elementFromPoint(event.clientX,event.clientY),event.clientY))
 });
 root.addEventListener('pointerup',event=>{
  if(!pen||event.pointerId!==pen.pointerId)return;
  const info=pen,drop=targetFor(info,document.elementFromPoint(event.clientX,event.clientY),event.clientY);
  pen=null;releaseLift();clearHighlight();if(info.active)applyDrop(info,drop)
 });
 root.addEventListener('pointercancel',()=>{pen=null;releaseLift();clearHighlight()});
  bindLocationImages({root,getCampaign,save,refresh,feedback})
}
