const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const entries=value=>String(value||'').split(/\r?\n/).map(x=>x.trim().replace(/^[•*\-]\s*/, '')).filter(Boolean);
const clean=v=>String(v??'').trim();
const npcHref=id=>'ficha-personagem.html?npc=1&id='+encodeURIComponent(id);
const clone=nodes=>JSON.parse(JSON.stringify(Array.isArray(nodes)?nodes:[]));
const createId=()=>globalThis.crypto?.randomUUID?.()||'event-'+Date.now()+'-'+Math.random().toString(36).slice(2,9);
export function countTimelineNodes(nodes){return (nodes||[]).reduce((n,item)=>n+1+countTimelineNodes(item.children),0)}
export function flattenTimeline(nodes){return (nodes||[]).flatMap(node=>[node.text,...flattenTimeline(node.children)])}
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
 const result=clone(nodes),id=createId(),node={id,text:name,children:[]};
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
function roster(c,npcs){
 const ids=c.importantNpcIds||[],chosen=ids.map(id=>npcs.find(n=>n.id===id)||{id,name:'NPC indisponível',missing:true}),available=npcs.filter(n=>!ids.includes(n.id)).sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
 return `<section id="npcs" class="card campaign-editor-card campaign-npc-card"><div class="campaign-editor-head"><h2>NPCs importantes</h2><span class="campaign-editor-count">${ids.length}</span></div>
 <div class="campaign-add-line"><label>NPC<select id="campaign-npc-picker"><option value="">— Selecione um NPC —</option>${available.map(n=>`<option value="${esc(n.id)}">${esc(n.name||'NPC sem nome')}</option>`).join('')}</select></label><button type="button" data-add-npc>Adicionar NPC</button></div>
 <ul class="campaign-bullet-list">${chosen.length?chosen.map(n=>`<li><span class="campaign-list-marker"></span>${n.missing?`<span>${esc(n.name)}</span>`:`<a href="${npcHref(n.id)}">${esc(n.name||'NPC sem nome')}</a>`}<button type="button" class="secondary campaign-list-remove" data-del-npc="${esc(n.id)}">Remover</button></li>`).join(''):'<li class="campaign-blank-state">Nenhum NPC vinculado.</li>'}</ul>
 <a class="btn secondary campaign-npc-library-link" href="npcs.html">Abrir NPCs</a></section>`
}
function bullets(c,id,title,field){
 const values=entries(c[field]);
 return `<section id="${id}" class="card campaign-editor-card"><div class="campaign-editor-head"><h2>${esc(title)}</h2><span class="campaign-editor-count">${values.length}</span></div>
 <ul class="campaign-bullet-list campaign-editable-bullets">${values.length?values.map((v,i)=>`<li class="campaign-bullet-entry"><span class="campaign-list-marker" aria-hidden="true"></span><input type="text" data-edit-line="${field}" data-index="${i}" aria-label="${esc(title)} ${i+1}" value="${esc(v)}" maxlength="500"><button type="button" class="secondary campaign-list-remove" data-del-line="${field}" data-index="${i}" aria-label="Remover ${esc(v)}">Remover</button></li>`).join(''):'<li class="campaign-blank-state">Nenhum registro.</li>'}</ul>
 <div class="campaign-add-line"><label>Novo ${title==='Atos'?'ato':'local'}<input data-new-line="${field}" autocomplete="off" maxlength="500"></label><button type="button" data-add-line="${field}">Adicionar</button></div></section>`
}
function nodeHtml(node,index,depth=0){
 const sub=(node.children||[]);
 return `<li class="timeline-item" data-timeline-id="${esc(node.id)}" data-timeline-depth="${depth}">
  <div class="campaign-flow-step"><span class="campaign-flow-node" aria-hidden="true">${depth?'•':index+1}</span>
   <div class="campaign-flow-card">
    <button type="button" class="timeline-drag-handle" data-timeline-drag="${esc(node.id)}" draggable="true" aria-label="Arrastar evento para reorganizar" title="Mover evento">⠿</button>
    <input class="timeline-node-text" data-timeline-text="${esc(node.id)}" value="${esc(node.text)}" maxlength="2000" aria-label="Texto do evento">
    <div class="campaign-flow-actions">
      <button type="button" class="secondary timeline-add-child" data-timeline-add-child="${esc(node.id)}" aria-label="Adicionar subevento">+ Subitem</button>
      <button type="button" class="secondary" data-timeline-move="up" data-timeline-target="${esc(node.id)}" aria-label="Mover para cima">↑</button>
      <button type="button" class="secondary" data-timeline-move="down" data-timeline-target="${esc(node.id)}" aria-label="Mover para baixo">↓</button>
      <button type="button" class="secondary" data-timeline-move="indent" data-timeline-target="${esc(node.id)}" aria-label="Tornar subevento">↳</button>
      <button type="button" class="secondary" data-timeline-move="outdent" data-timeline-target="${esc(node.id)}" aria-label="Mover para nível acima">↰</button>
      <button type="button" class="secondary" data-timeline-delete="${esc(node.id)}" aria-label="Remover evento">Remover</button>
    </div>
   </div>
  </div>
  ${sub.length?`<ol class="timeline-children">${sub.map((child,i)=>nodeHtml(child,i,depth+1)).join('')}</ol>`:''}
 </li>`
}
function flow(c){
 const nodes=c.timelineNodes||[];
 return `<section id="linha-tempo" class="card campaign-editor-card campaign-timeline-section"><div class="campaign-editor-head"><h2>Linha do tempo</h2><span class="campaign-editor-count">${countTimelineNodes(nodes)} eventos</span></div>
 <ol class="campaign-timeline-flow timeline-tree">${nodes.length?nodes.map((n,i)=>nodeHtml(n,i)).join(''):'<li class="campaign-blank-state">Nenhum evento registrado.</li>'}</ol>
 <div class="campaign-add-line"><label>Novo evento<input data-new-timeline autocomplete="off" maxlength="2000"></label><button type="button" data-timeline-add-root>Adicionar evento</button></div>
 </section>`
}
export function renderStructuredSection(c,npcs,id){
 if(id==='npcs')return roster(c,npcs);
 if(id==='locais')return bullets(c,'locais','Locais importantes','importantLocations');
 if(id==='missoes')return bullets(c,'missoes','Atos','activeMissions');
 if(id==='linha-tempo')return flow(c);
 return''
}
export function renderStructuredDetails(c,npcs){return ['npcs','locais','missoes'].map(id=>renderStructuredSection(c,npcs,id)).join('')}
export function renderTimeline(c){return flow(c)}
export function bindStructuredDetails({getCampaign,getNpcs,save,feedback}){
 const sectionFor=field=>field==='importantLocations'?'locais':'missoes';
 const root=document.querySelector('.campaign-sections');if(!root)return;
 const refresh=id=>{
  const previous=document.getElementById(id);if(!previous)return;
  const template=document.createElement('template');
  template.innerHTML=renderStructuredSection(getCampaign(),getNpcs(),id);
  previous.replaceWith(template.content.firstElementChild)
 };
 const persist=(patch,id,message,render=true)=>{
  save(patch,{message});if(render)refresh(id)
 };
 const saveTree=(nodes,message)=>{
  persist({timelineNodes:nodes,timeline:flattenTimeline(nodes).join('\n')},'linha-tempo',message)
 };
 const move=(source,target,position)=>{
  const updated=moveTimelineNode(getCampaign().timelineNodes,source,target,position);
  if(updated)saveTree(updated,'Linha do tempo reorganizada.');
  else feedback('Esse movimento não é permitido.',false)
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
  const target=event.target.closest('button');if(!target)return;
  const c=getCampaign();
  if(target.matches('[data-add-npc]')){
   const id=section.querySelector('#campaign-npc-picker')?.value;
   if(!id||!getNpcs().some(n=>n.id===id))return feedback('Selecione um NPC cadastrado.',false);
   persist({importantNpcIds:[...new Set([...(c.importantNpcIds||[]),id])]},'npcs','NPC adicionado.')
  }else if(target.matches('[data-del-npc]')){
   persist({importantNpcIds:(c.importantNpcIds||[]).filter(id=>id!==target.dataset.delNpc)},'npcs','NPC removido.')
  }else if(target.matches('[data-add-line]')){
   const field=target.dataset.addLine,value=clean(section.querySelector('[data-new-line]')?.value);
   if(!value)return;
   persist({[field]:[...entries(c[field]),value].join('\n')},sectionFor(field),'Registro adicionado.')
  }else if(target.matches('[data-del-line]')){
   const field=target.dataset.delLine,values=entries(c[field]);values.splice(Number(target.dataset.index),1);
   persist({[field]:values.join('\n')},sectionFor(field),'Registro removido.')
  }else if(target.matches('[data-timeline-add-root],[data-timeline-add-child]')){
   const parent=target.dataset.timelineAddChild||null;
   let name=parent?window.prompt('Nome do subevento:'):clean(section.querySelector('[data-new-timeline]')?.value);
   if(!name)return;
   const added=addTimelineNode(c.timelineNodes,name,parent);if(!added)return;
   saveTree(added.nodes,'Evento adicionado.')
  }else if(target.matches('[data-timeline-delete]')){
   const id=target.dataset.timelineDelete,node=findNode(c.timelineNodes,id);
   if(node?.children?.length&&!confirm('Remover este evento e todos os seus subeventos?'))return;
   const updated=removeTimelineNode(c.timelineNodes,id);if(updated)saveTree(updated,'Evento removido.')
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
  if(input.matches('[data-edit-line]')){
   const field=input.dataset.editLine,values=entries(c[field]),index=Number(input.dataset.index),value=clean(input.value);
   if(!value){input.value=values[index]||'';return feedback('O nome não pode ficar vazio.',false)}
   if(values[index]===value)return;
   values[index]=value;persist({[field]:values.join('\n')},sectionFor(field),'Nome atualizado.',false)
  }else if(input.matches('[data-timeline-text]')){
   const id=input.dataset.timelineText,current=findNode(c.timelineNodes,id),value=clean(input.value);
   if(!value){input.value=current?.text||'';return feedback('O evento precisa de texto.',false)}
   if(current?.text===value)return;
   const updated=renameTimelineNode(c.timelineNodes,id,value);
   if(updated)persist({timelineNodes:updated,timeline:flattenTimeline(updated).join('\n')},'linha-tempo','Evento atualizado.',false)
  }
 });
 root.addEventListener('keydown',event=>{
  if(event.key!=='Enter'||!event.target.matches('[data-new-line],[data-new-timeline],[data-edit-line],[data-timeline-text]'))return;
  event.preventDefault();
  if(event.target.matches('[data-new-line]'))event.target.closest('section').querySelector('[data-add-line]')?.click();
  else if(event.target.matches('[data-new-timeline]'))event.target.closest('section').querySelector('[data-timeline-add-root]')?.click();
  else event.target.blur()
 });
 let dragged=null,touch=null;
 const highlight=(el,where)=>{
  clearDrag();if(el){el.classList.add('timeline-drop-target');el.dataset.dropPosition=where}
 };
 root.addEventListener('dragstart',event=>{
  const handle=event.target.closest('[data-timeline-drag]');if(!handle)return;
  dragged=handle.dataset.timelineDrag;
  if(event.dataTransfer){event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',dragged)}
  handle.closest('.timeline-item')?.classList.add('timeline-dragging')
 });
 root.addEventListener('dragover',event=>{
  if(!dragged)return;
  const item=event.target.closest('.timeline-item');if(!item)return;
  event.preventDefault();
  if(event.dataTransfer)event.dataTransfer.dropEffect='move';
  highlight(item,dropLocation(item,event.clientY))
 });
 root.addEventListener('drop',event=>{
  if(!dragged)return;
  event.preventDefault();const item=event.target.closest('.timeline-item');
  const source=dragged;dragged=null;
  const position=item?.dataset.dropPosition|| (item?dropLocation(item,event.clientY):null);
  clearDrag();
  if(item&&position)move(source,item.dataset.timelineId,position)
 });
 root.addEventListener('dragend',()=>{dragged=null;clearDrag()});
 // Touch and pen fallback: native HTML drag-and-drop is not available reliably on mobile.
 root.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse')return;
  const handle=event.target.closest('[data-timeline-drag]');if(!handle)return;
  touch={id:handle.dataset.timelineDrag,handle,x:event.clientX,y:event.clientY,moved:false};
  handle.setPointerCapture?.(event.pointerId)
 });
 root.addEventListener('pointermove',event=>{
  if(!touch)return;
  if(Math.hypot(event.clientX-touch.x,event.clientY-touch.y)>7)touch.moved=true;
  if(!touch.moved)return;
  event.preventDefault();
  const item=document.elementFromPoint(event.clientX,event.clientY)?.closest('.timeline-item');
  if(item)highlight(item,dropLocation(item,event.clientY))
 });
 root.addEventListener('pointerup',event=>{
  if(!touch)return;
  const {id,moved}=touch;touch=null;
  const item=document.elementFromPoint(event.clientX,event.clientY)?.closest('.timeline-item');
  const position=item?.dataset.dropPosition||(item?dropLocation(item,event.clientY):null);
  clearDrag();if(moved&&item&&position)move(id,item.dataset.timelineId,position)
 });
 root.addEventListener('pointercancel',()=>{touch=null;clearDrag()})
}
