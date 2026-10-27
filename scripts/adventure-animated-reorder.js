/* Arrasto unificado de Aventuras, seguindo a interação de Jogadores da Campanha:
   cópia elevada, indicador de destino, confirmação e alternativa via teclado.
   Não altera dados; a persistência pertence ao componente chamador. */
export function bindAdventureAnimatedReorder({
 container,itemSelector,idFor,handleSelector='',onMove,axis='vertical',
 allowSurface=true,allowSummaryDrag=false,confirmScope=null,lockX=false
}){
 if(!container||container.dataset.adventureAnimatedOrderBound==='true')return;
 container.dataset.adventureAnimatedOrderBound='true';
 container.dataset.sortAxis=axis;
 container.classList.add('adventure-sortable');
 // Mantém a cópia visual no contexto da lista sem torná-la um registro.
 const rows=()=>[...container.querySelectorAll(itemSelector)].filter(row=>!row.closest('[data-adventure-sort-preview]'));
 const rowFor=node=>{
  const row=node?.closest?.(itemSelector);
  return row&&container.contains(row)&&!row.closest('[data-adventure-sort-preview]')?row:null;
 };
 const keyFor=row=>row?idFor(row):'';
 const inHandle=node=>Boolean(handleSelector&&node?.closest?.(handleSelector));
 const interactive=node=>Boolean(node?.closest?.('label,input,textarea,select,a,[contenteditable="true"],button:not(.roster-grip):not(.campaign-reorder-grip):not(.explore-area-drag-handle)'))||(!allowSummaryDrag&&Boolean(node?.closest?.('summary')));
 const permitted=node=>inHandle(node)||(allowSurface&&!interactive(node));
 let pointer=null,touch=null,ghost=null,suppressClick=null;
 container.addEventListener('click',event=>{
  const blocked=suppressClick;
  if(!blocked)return;
  suppressClick=null;
  if(performance.now()-blocked.at>350)return;
  // Nunca consumir um clique posterior em outro card ou em botão de ação.
  const target=rowFor(event.target);
  if(!target||keyFor(target)!==blocked.source)return;
  event.preventDefault();event.stopImmediatePropagation();
 },true);
 const blockNextClick=source=>{
  suppressClick={source,at:performance.now()};
  setTimeout(()=>{if(suppressClick?.source===source)suppressClick=null},350);
 };
 const classes='adventure-sort-moving adventure-sort-before adventure-sort-after adventure-dragging adventure-drop-target explore-area-dragging explore-area-drop-before explore-area-drop-after';
 function clearHighlight(){
  rows().forEach(row=>{
   classes.split(' ').forEach(c=>row.classList.remove(c));
   delete row.dataset.dropPosition;
  });
 }
 function release(){
  clearHighlight();
  ghost?.node.remove();ghost=null;
 }
 function lift(row,x,y){
  if(ghost)return;
  const box=row.getBoundingClientRect(),region=container.getBoundingClientRect(),clone=row.cloneNode(true),style=getComputedStyle(row);
  clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  clone.querySelectorAll('input,select,textarea,a,button,[tabindex]').forEach(el=>el.setAttribute('tabindex','-1'));
  const hadOpenEditor=Boolean(clone.querySelector('details[open]'));
  clone.querySelectorAll('details[open]').forEach(el=>el.removeAttribute('open'));
  clone.removeAttribute('draggable');clone.removeAttribute('tabindex');
  clone.setAttribute('aria-hidden','true');clone.inert=true;
  clone.classList.remove(...classes.split(' '),'adventure-sort-confirmed');
  clone.setAttribute('data-adventure-sort-preview','');
  clone.classList.add('campaign-floating-card','adventure-floating-card');
  if(row.classList.contains('roster-player')){
   clone.classList.add('roster-floating-card','adventure-roster-floating');
  }
  // Preservar as mesmas regras CSS do card original (avatares, mapas,
  // editores recolhidos, colunas e media/container queries).
  if(getComputedStyle(container).position==='static')container.style.position='relative';
  clone.style.setProperty('position','absolute','important');
  clone.style.setProperty('display',style.display,'important');
  clone.style.gridTemplateColumns=style.gridTemplateColumns;
  clone.style.gridTemplateRows=style.gridTemplateRows;
  clone.style.gap=style.gap;
  clone.style.left=(box.left-region.left-container.clientLeft+container.scrollLeft)+'px';
  clone.style.top=(box.top-region.top-container.clientTop+container.scrollTop)+'px';
  clone.style.width=box.width+'px';clone.style.height=(hadOpenEditor?Math.min(box.height,188):box.height)+'px';
  container.appendChild(clone);
  ghost={node:clone,x,y};
 }
 function moveLift(x,y){
  // No cadastro de jogadores a direção permitida é apenas vertical.
  if(ghost)ghost.node.style.transform='translate3d('+(lockX?0:x-ghost.x)+'px,'+(y-ghost.y)+'px,0)';
 }
 function destination(source,x,y){
  const siblings=rows(),sourceIndex=siblings.findIndex(row=>keyFor(row)===source);
  if(sourceIndex<0)return null;
  const region=container.getBoundingClientRect();
  if(x<region.left-18||x>region.right+18||y<region.top-18||y>region.bottom+18)return null;
  let target=rowFor(document.elementFromPoint(x,y));
  if(!target){
   // Espaços entre cards: encontrar o destino mais próximo DENTRO da lista.
   target=siblings.filter(row=>keyFor(row)!==source).map(row=>{
    const r=row.getBoundingClientRect();
    const nearestX=Math.max(r.left,Math.min(x,r.right));
    const nearestY=Math.max(r.top,Math.min(y,r.bottom));
    return{row,d:Math.hypot(x-nearestX,y-nearestY)};
   }).sort((a,b)=>a.d-b.d)[0]?.row||null;
  }
  if(!target||keyFor(target)===source)return null;
  const to=siblings.indexOf(target);
  if(to<0)return null;
  // "Soltar neste card" o coloca no lugar do card atingido. A lógica
  // antiga usava metade superior/inferior e produzia frequentemente NO-OP
  // (ex.: arrastar o 2º item para o 1º, mas escolher "depois" do 1º).
  // A direção define o lado: subindo -> antes; descendo -> depois.
  const position=sourceIndex>to?'before':'after';
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
 // Ouvir o ponteiro no documento SOMENTE durante a operação evita perder
 // pointermove/pointerup quando o cursor sai do card ou da lista.
 const stopPointerTracking=()=>{
  document.removeEventListener('pointermove',pointerMove,true);
  document.removeEventListener('pointerup',pointerUp,true);
  document.removeEventListener('pointercancel',pointerCancel,true);
  window.removeEventListener('blur',cancelGesture);
  document.removeEventListener('visibilitychange',cancelWhenHidden);
 };
 const stopTouchTracking=()=>{
  document.removeEventListener('touchmove',touchMove,true);
  document.removeEventListener('touchend',touchEnd,true);
  document.removeEventListener('touchcancel',touchCancel,true);
  window.removeEventListener('blur',cancelGesture);
  document.removeEventListener('visibilitychange',cancelWhenHidden);
 };
 function cancelGesture(){
  const current=pointer;
  pointer=null;
  stopPointerTracking();
  if(current?.row?.hasPointerCapture?.(current.id)){
   try{current.row.releasePointerCapture(current.id)}catch{}
  }
  if(touch?.timer)clearTimeout(touch.timer);
  touch=null;stopTouchTracking();
  release();
 }
 function cancelWhenHidden(){if(document.hidden)cancelGesture()}

 function pointerMove(event){
  if(!pointer||pointer.id!==event.pointerId)return;
  if(!pointer.active&&Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)<6)return;
  if(!pointer.active){
   pointer.active=true;
   // Capturar apenas depois de reconhecer um arrasto real; o clique
   // simples no summary precisa continuar abrindo/fechando a edição.
   try{pointer.row.setPointerCapture?.(event.pointerId)}catch{}
  }
  event.preventDefault();
  lift(pointer.row,pointer.x,pointer.y);
  moveLift(event.clientX,event.clientY);
  mark(pointer.source,destination(pointer.source,event.clientX,event.clientY));
 }
 function pointerUp(event){
  if(!pointer||pointer.id!==event.pointerId)return;
  const info=pointer,drop=info.active?destination(info.source,event.clientX,event.clientY):null;
  pointer=null;stopPointerTracking();
  if(info.row.hasPointerCapture?.(event.pointerId)){
   try{info.row.releasePointerCapture(event.pointerId)}catch{}
  }
  if(info.active){blockNextClick(info.source);event.preventDefault();finish(info.source,drop)}
  else release();
 }
 function pointerCancel(event){
  if(pointer&&event.pointerId!==pointer.id)return;
  pointer=null;stopPointerTracking();release();
 }
 container.addEventListener('pointerdown',event=>{
  if(event.pointerType==='touch'||(event.pointerType==='mouse'&&event.button!==0))return;
  if(pointer)return;
  const row=rowFor(event.target);
  if(!row||!permitted(event.target))return;
  pointer={row,source:keyFor(row),id:event.pointerId,x:event.clientX,y:event.clientY,active:false};
  document.addEventListener('pointermove',pointerMove,true);
  document.addEventListener('pointerup',pointerUp,true);
  document.addEventListener('pointercancel',pointerCancel,true);
  window.addEventListener('blur',cancelGesture);
  document.addEventListener('visibilitychange',cancelWhenHidden);
  // O clique normal continua disponível em botões, links e <summary>.
  if(event.pointerType==='mouse'&&!event.target.closest?.('summary,button'))event.preventDefault();
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
  document.addEventListener('touchmove',touchMove,{capture:true,passive:false});
  document.addEventListener('touchend',touchEnd,{capture:true,passive:false});
  document.addEventListener('touchcancel',touchCancel,true);
  window.addEventListener('blur',cancelGesture);
  document.addEventListener('visibilitychange',cancelWhenHidden);
 },{passive:true});
 function touchMove(event){
  if(!touch)return;
  const p=[...event.touches].find(x=>x.identifier===touch.id);
  if(!p)return;
  if(!touch.active){
   if(Math.hypot(p.clientX-touch.x,p.clientY-touch.y)>9){
    clearTimeout(touch.timer);touch=null;stopTouchTracking();release();
   }
   return;
  }
  event.preventDefault();moveLift(p.clientX,p.clientY);
  mark(touch.source,destination(touch.source,p.clientX,p.clientY));
 }
 function touchEnd(event){
  if(!touch)return;
  const p=[...event.changedTouches].find(x=>x.identifier===touch.id);
  if(!p)return;
  const info=touch;touch=null;clearTimeout(info.timer);stopTouchTracking();
  const drop=info.active?destination(info.source,p.clientX,p.clientY):null;
  if(info.active){blockNextClick(info.source);event.preventDefault();finish(info.source,drop)}else release();
 }
 function touchCancel(){
  if(touch)clearTimeout(touch.timer);
  touch=null;stopTouchTracking();release();
 }
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
