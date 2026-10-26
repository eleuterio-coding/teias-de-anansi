/* Arrasto unificado de Aventuras, seguindo a interação de Jogadores da Campanha:
   cópia elevada, indicador de destino, confirmação e alternativa via teclado.
   Não altera dados; a persistência pertence ao componente chamador. */
export function bindAdventureAnimatedReorder({
 container,itemSelector,idFor,handleSelector='',onMove,axis='vertical',
 allowSurface=true,confirmScope=null
}){
 if(!container||container.dataset.adventureAnimatedOrderBound==='true')return;
 container.dataset.adventureAnimatedOrderBound='true';
 container.dataset.sortAxis=axis;
 const rows=()=>[...container.querySelectorAll(itemSelector)];
 const rowFor=node=>{
  const row=node?.closest?.(itemSelector);
  return row&&container.contains(row)?row:null;
 };
 const keyFor=row=>row?idFor(row):'';
 const inHandle=node=>Boolean(handleSelector&&node?.closest?.(handleSelector));
 const interactive=node=>Boolean(node?.closest?.('label,input,textarea,select,a,summary,[contenteditable="true"],button:not(.roster-grip):not(.campaign-reorder-grip):not(.explore-area-drag-handle)'));
 const permitted=node=>inHandle(node)||(allowSurface&&!interactive(node));
 let pointer=null,touch=null,ghost=null;
 const classes='adventure-sort-moving adventure-sort-before adventure-sort-after adventure-dragging adventure-drop-target explore-area-dragging explore-area-drop-before explore-area-drop-after';
 function clearHighlight(){
  rows().forEach(row=>{
   classes.split(' ').forEach(c=>row.classList.remove(c));
   delete row.dataset.dropPosition;
  });
 }
 function release(){
  clearHighlight();
  ghost?.remove();ghost=null;
 }
 function lift(row,x,y){
  if(ghost)return;
  const box=row.getBoundingClientRect(),clone=row.cloneNode(true),style=getComputedStyle(row);
  clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  clone.querySelectorAll('input,select,textarea,a,button,[tabindex]').forEach(el=>el.setAttribute('tabindex','-1'));
  clone.removeAttribute('draggable');clone.removeAttribute('tabindex');
  clone.setAttribute('aria-hidden','true');clone.inert=true;
  clone.classList.remove(...classes.split(' '));
  clone.classList.add('campaign-floating-card','adventure-floating-card');
  if(row.classList.contains('roster-player')){
   clone.classList.add('roster-floating-card','adventure-roster-floating');
  }
  clone.style.setProperty('display',style.display,'important');
  clone.style.gridTemplateColumns=style.gridTemplateColumns;
  clone.style.gridTemplateRows=style.gridTemplateRows;
  clone.style.gap=style.gap;
  clone.style.left=box.left+'px';clone.style.top=box.top+'px';
  clone.style.width=box.width+'px';clone.style.height=box.height+'px';
  document.body.appendChild(clone);
  ghost={node:clone,x,y};
 }
 function moveLift(x,y){
  if(ghost)ghost.node.style.transform='translate3d('+(x-ghost.x)+'px,'+(y-ghost.y)+'px,0) rotate(-1deg) scale(1.018)';
 }
 function destination(source,x,y){
  let target=rowFor(document.elementFromPoint(x,y));
  if(!target){
   // Aceitar espaços entre cards, nunca soltura fora da lista.
   const region=container.getBoundingClientRect();
   if(x<region.left-12||x>region.right+12||y<region.top-12||y>region.bottom+12)return null;
   const other=rows().filter(row=>keyFor(row)!==source);
   if(!other.length)return null;
   target=other.map(row=>{
    const r=row.getBoundingClientRect();
    return{row,d:Math.hypot(x-(r.left+r.width/2),y-(r.top+r.height/2))};
   }).sort((a,b)=>a.d-b.d)[0]?.row;
  }
  if(!target||keyFor(target)===source)return null;
  const r=target.getBoundingClientRect();
  const position=axis==='horizontal'?(x<r.left+r.width/2?'before':'after'):(y<r.top+r.height/2?'before':'after');
  return{row:target,id:keyFor(target),position};
 }
 function mark(source,target){
  clearHighlight();
  const current=rows().find(row=>keyFor(row)===source);
  current?.classList.add('adventure-sort-moving');
  if(!target)return;
  target.row.classList.add(target.position==='before'?'adventure-sort-before':'adventure-sort-after');
  target.row.dataset.dropPosition=target.position;
  if(axis==='horizontal')target.row.classList.add(target.position==='before'?'explore-area-drop-before':'explore-area-drop-after');
 }
 function confirm(source){
  requestAnimationFrame(()=>{
   const scope=confirmScope?document.querySelector(confirmScope):document;
   const item=[...(scope?.querySelectorAll(itemSelector)||[])].find(row=>keyFor(row)===source);
   item?.classList.add('adventure-sort-confirmed');
   const section=scope?.closest?.('section')||(scope?.matches?.('section')?scope:null);
   const heading=section?.querySelector('.roster-heading,.explore-title,.hub-timeline-heading,h2')||scope?.querySelector?.('h2');
   if(!heading)return;
   heading.querySelector('[data-reorder-confirmation]')?.remove();
   const badge=document.createElement('span');
   badge.className='adventure-sort-feedback';badge.dataset.reorderConfirmation='';
   badge.setAttribute('role','status');badge.textContent='✓ Ordem atualizada';
   heading.appendChild(badge);
   setTimeout(()=>{item?.classList.remove('adventure-sort-confirmed');badge.remove()},2200);
  });
 }
 function finish(source,drop){
  release();
  if(!source||!drop||drop.id===source)return;
  if(onMove(source,drop.id,drop.position)!==false)confirm(source);
 }
 // O DnD nativo conflita com a captura de ponteiro; toda a interação usa
 // ponteiro ou long-press, inclusive em elementos com draggable antigo.
 rows().forEach(row=>{row.draggable=false});
 container.addEventListener('dragstart',e=>{
  if(rowFor(e.target))e.preventDefault();
 });
 container.addEventListener('pointerdown',event=>{
  if(event.pointerType==='touch'||(event.pointerType==='mouse'&&event.button!==0))return;
  const row=rowFor(event.target);
  if(!row||!permitted(event.target))return;
  const info={row,source:keyFor(row),id:event.pointerId,x:event.clientX,y:event.clientY,active:false,timer:null};
  pointer=info;
  if(event.pointerType==='mouse'&&allowSurface){
   info.timer=setTimeout(()=>{
    if(pointer===info&&!info.active){info.active=true;lift(row,info.x,info.y);mark(info.source,null)}
   },160);
  }
  row.setPointerCapture?.(event.pointerId);
  if(event.pointerType==='mouse')event.preventDefault();
 });
 container.addEventListener('pointermove',event=>{
  if(!pointer||pointer.id!==event.pointerId)return;
  if(!pointer.active&&Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)<6)return;
  pointer.active=true;clearTimeout(pointer.timer);
  event.preventDefault();
  lift(pointer.row,pointer.x,pointer.y);
  moveLift(event.clientX,event.clientY);
  mark(pointer.source,destination(pointer.source,event.clientX,event.clientY));
 });
 container.addEventListener('pointerup',event=>{
  if(!pointer||pointer.id!==event.pointerId)return;
  const info=pointer,drop=info.active?destination(info.source,event.clientX,event.clientY):null;
  pointer=null;clearTimeout(info.timer);
  if(info.row.hasPointerCapture?.(event.pointerId))info.row.releasePointerCapture(event.pointerId);
  if(info.active){event.preventDefault();finish(info.source,drop)}else release();
 });
 container.addEventListener('pointercancel',()=>{
  if(pointer)clearTimeout(pointer.timer);
  pointer=null;release();
 });
 container.addEventListener('touchstart',event=>{
  if(touch||!permitted(event.target))return;
  const row=rowFor(event.target),p=event.changedTouches[0];
  if(!row||!p)return;
  const info={row,source:keyFor(row),id:p.identifier,x:p.clientX,y:p.clientY,active:false};
  info.timer=setTimeout(()=>{
   if(touch===info){info.active=true;lift(row,info.x,info.y);mark(info.source,null)}
  },280);
  touch=info;
 },{passive:true});
 container.addEventListener('touchmove',event=>{
  if(!touch)return;
  const p=[...event.touches].find(x=>x.identifier===touch.id);
  if(!p)return;
  if(!touch.active){
   if(Math.hypot(p.clientX-touch.x,p.clientY-touch.y)>9){
    clearTimeout(touch.timer);touch=null;release();
   }
   return;
  }
  event.preventDefault();moveLift(p.clientX,p.clientY);
  mark(touch.source,destination(touch.source,p.clientX,p.clientY));
 },{passive:false});
 container.addEventListener('touchend',event=>{
  if(!touch)return;
  const p=[...event.changedTouches].find(x=>x.identifier===touch.id);
  if(!p)return;
  const info=touch;touch=null;clearTimeout(info.timer);
  const drop=info.active?destination(info.source,p.clientX,p.clientY):null;
  if(info.active){event.preventDefault();finish(info.source,drop)}else release();
 },{passive:false});
 container.addEventListener('touchcancel',()=>{
  if(touch)clearTimeout(touch.timer);
  touch=null;release();
 });
 container.addEventListener('keydown',event=>{
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
  if(!inHandle(event.target)&&!event.target.matches?.(itemSelector))return;
  event.preventDefault();
  const row=rowFor(event.target),all=rows(),from=all.indexOf(row);
  const delta=['ArrowUp','ArrowLeft'].includes(event.key)?-1:1;
  const other=all[from+delta];
  if(!row||!other)return;
  const id=keyFor(row);
  if(onMove(id,keyFor(other),delta<0?'before':'after')!==false){
   confirm(id);
   requestAnimationFrame(()=>{
    const next=[...document.querySelectorAll(itemSelector)].find(x=>keyFor(x)===id);
    (handleSelector?next?.querySelector(handleSelector):next)?.focus({preventScroll:true});
   });
  }
 });
}
