const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const lower=value=>String(value||'').trim().toLowerCase();
const sortText=(a,b)=>String(a).localeCompare(String(b),'pt-BR',{sensitivity:'base'});
const grip='<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="8" cy="5" r="1.7"/><circle cx="16" cy="5" r="1.7"/><circle cx="8" cy="12" r="1.7"/><circle cx="16" cy="12" r="1.7"/><circle cx="8" cy="19" r="1.7"/><circle cx="16" cy="19" r="1.7"/></svg>';
const openIcon='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5h6v6M19 5l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg><span class="roster-action-label">Abrir</span>';
const trashIcon='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 6h17M9 6V4h6v2m-9 0 .8 14h10.4L18 6M10 10v6m4-6v6"/></svg><span class="roster-action-label">Remover</span>';
export function adventureMembers(campaign){
 return(campaign?.members||[]).filter(m=>m.active!==false&&m.role!=='dm'&&lower(m.username||m.name));
}
export function adventureAssignments(adventure,campaign){
 const members=adventureMembers(campaign),byUsername=new Map(members.map(m=>[lower(m.username||m.name),m]));
 const saved=adventure?.participantAssignments;
 const fallback=(adventure?.participantUsernames||[]).map(username=>{
  const member=byUsername.get(lower(username));return{username:lower(username),characterId:member?.characterId&&(adventure.characterIds||[]).includes(member.characterId)?member.characterId:null}
 });
 return(Array.isArray(saved)?saved:fallback)
  .map(row=>({username:lower(row.username),characterId:row.characterId||null}))
  .filter((row,index,rows)=>byUsername.has(row.username)&&rows.findIndex(x=>x.username===row.username)===index);
}
export function adventureRosterHtml(adventure,campaign,characters=[]){
 const members=adventureMembers(campaign),byUsername=new Map(members.map(m=>[lower(m.username||m.name),m])),rows=adventureAssignments(adventure,campaign);
 const charMap=new Map(characters.map(c=>[c.id,c]));
 const label=id=>{const c=charMap.get(id);if(!c)return id;const cls=c.refSnapshots?.class?.name,level=c.choices?.class?.level;return(c.name||'Personagem sem nome')+(cls?' · '+cls+(level?' '+level:''):'')};
 const characterOptions=(selected='',username='')=>{
  const used=new Set(rows.filter(row=>row.username!==username).map(row=>row.characterId).filter(Boolean));
  const eligible=[...new Set(members.map(member=>member.characterId).filter(Boolean))].filter(id=>!used.has(id)).sort((a,b)=>sortText(label(a),label(b)));
  return'<option value="">— Sem personagem —</option>'+eligible.map(id=>`<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(label(id))}</option>`).join('');
 };
 const userOptions='<option value="">— Selecione —</option>'+members.filter(m=>!rows.some(row=>row.username===lower(m.username||m.name)))
  .sort((a,b)=>sortText(a.name||a.username,b.name||b.username))
  .map(m=>`<option value="${esc(lower(m.username||m.name))}">${esc(m.name||m.username)}</option>`).join('');
 const list=rows.map((row,index)=>{
  const member=byUsername.get(row.username),name=member?.name||member?.username||row.username,initial=Array.from(name)[0]?.toLocaleUpperCase('pt-BR')||'J',linked=charMap.get(row.characterId);
  const open=linked?`<a class="btn secondary roster-open-button" href="ficha-personagem.html?id=${encodeURIComponent(linked.id)}" title="Abrir ficha de ${esc(linked.name||'personagem')}" aria-label="Abrir ficha de ${esc(linked.name||'personagem')}">${openIcon}</a>`:`<button type="button" class="secondary roster-open-button" disabled title="Vincule um personagem para abrir a ficha">${openIcon}</button>`;
  return`<article class="member-row roster-player" data-member-row="${esc(row.username)}" draggable="true" tabindex="0" aria-label="${esc(name)}. Arraste para reorganizar ou use as setas.">
   <button type="button" class="roster-grip" aria-label="Reordenar ${esc(name)}" title="Reordenar jogador">${grip}</button>
   <div class="roster-player-identity"><span class="roster-avatar" aria-hidden="true">${esc(initial)}</span><div class="roster-player-display"><span class="roster-player-label">Jogador</span><span class="roster-player-name">${esc(name)}</span></div></div>
   <div class="roster-player-character"><label>Personagem<select data-adventure-member-character aria-label="Personagem de ${esc(name)}">${characterOptions(row.characterId,row.username)}</select></label></div>
   <div class="row-actions roster-player-actions">
    <button type="button" class="secondary roster-move-button" data-roster-move="up" aria-label="Mover ${esc(name)} para cima" ${index===0?'disabled':''}>↑</button>
    <button type="button" class="secondary roster-move-button" data-roster-move="down" aria-label="Mover ${esc(name)} para baixo" ${index===rows.length-1?'disabled':''}>↓</button>
    ${open}<button type="button" class="danger roster-remove-button" data-adventure-remove-member="${esc(row.username)}" aria-label="Remover jogador ${esc(name)}">${trashIcon}</button>
   </div>
  </article>`;
 }).join('');
 return`<section id="participantes" class="card roster-section adventure-roster-section"><div class="roster-heading"><h2>Jogadores da Aventura</h2><span class="roster-count">${rows.length} ${rows.length===1?'jogador':'jogadores'}</span></div>
 <div id="adventure-member-list" class="list roster-list">${list||'<div class="empty">Nenhum jogador adicionado.</div>'}</div>
 <div class="roster-add-panel"><h3>Adicionar jogador</h3><div class="roster-add-fields"><label>Jogador<select id="new-adventure-member-user">${userOptions}</select></label><label>Personagem<select id="new-adventure-member-character">${characterOptions()}</select></label></div>
 <div class="row-actions roster-add-actions"><button id="add-adventure-member" type="button">Adicionar jogador</button><button type="button" class="secondary" data-save-adventure-section>Salvar</button></div></div></section>`;
}
export function bindAdventureRoster({getAdventure,getCampaign,characters=[],save,feedback}){
 const list=document.getElementById('adventure-member-list'),user=document.getElementById('new-adventure-member-user'),character=document.getElementById('new-adventure-member-character');
 if(!list)return;
 const rows=()=>adventureAssignments(getAdventure(),getCampaign());
 const persist=(next,message)=>{
  const unique=new Set(),charactersUsed=new Set();
  for(const member of next){
   if(unique.has(member.username))return feedback('Este jogador já está na Aventura.',false);
   unique.add(member.username);
   if(member.characterId&&charactersUsed.has(member.characterId))return feedback('Um personagem não pode ser atribuído a dois jogadores.',false);
   if(member.characterId)charactersUsed.add(member.characterId);
  }
  save(next,message);
 };
 const reorder=(source,target,position)=>{
  const current=rows(),from=current.findIndex(row=>row.username===source),to=current.findIndex(row=>row.username===target);
  if(from<0||to<0||from===to)return;
  const next=[...current],item=next.splice(from,1)[0];
  next.splice(to+(position==='after'?1:0)-(from<to?1:0),0,item);
  persist(next,'Ordem dos jogadores salva.');
 };
 const rowFor=target=>target?.closest?.('#adventure-member-list [data-member-row]')||null;
 const interactive=target=>Boolean(target?.closest?.('input,textarea,select,a,button:not(.roster-grip),[contenteditable="true"]'));
 const moveNeighbor=(row,direction)=>{
  const other=direction==='up'?row?.previousElementSibling:row?.nextElementSibling;
  if(row?.dataset.memberRow&&other?.dataset.memberRow)reorder(row.dataset.memberRow,other.dataset.memberRow,direction==='up'?'before':'after')
 };
 user?.addEventListener('change',()=>{
  const selected=adventureMembers(getCampaign()).find(m=>lower(m.username||m.name)===user.value),memberIds=new Set(rows().map(row=>row.characterId).filter(Boolean)),all=adventureMembers(getCampaign()).map(m=>m.characterId).filter(id=>id&&!memberIds.has(id));
  const characterMap=new Map(characters.map(c=>[c.id,c]));
  character.innerHTML='<option value="">— Sem personagem —</option>'+[...new Set(all)].map(id=>{
   const c=characterMap.get(id),label=c?(c.name||id)+(c.refSnapshots?.class?.name?' · '+c.refSnapshots.class.name+(c.choices?.class?.level?' '+c.choices.class.level:''):''):id;
   return`<option value="${esc(id)}" ${id===selected?.characterId?'selected':''}>${esc(label)}</option>`;
  }).join('');
 });
 document.getElementById('add-adventure-member')?.addEventListener('click',()=>{
  const username=lower(user?.value),member=adventureMembers(getCampaign()).find(m=>lower(m.username||m.name)===username);
  if(!member)return feedback('Selecione um jogador da Campanha.',false);
  if(rows().some(row=>row.username===username))return feedback('Jogador já adicionado.',false);
  persist([...rows(),{username,characterId:character?.value||null}],'Jogador adicionado.')
 });
 list.addEventListener('change',event=>{
  const select=event.target.closest?.('[data-adventure-member-character]'),row=rowFor(select);
  if(!select||!row)return;
  persist(rows().map(m=>m.username===row.dataset.memberRow?{...m,characterId:select.value||null}:m),'Vínculo de personagem atualizado.')
 });
 list.addEventListener('click',event=>{
  const remove=event.target.closest?.('[data-adventure-remove-member]'),move=event.target.closest?.('[data-roster-move]');
  if(remove){
   if(!confirm('Remover este jogador da Aventura? O vínculo na Campanha e a ficha serão preservados.'))return;
   persist(rows().filter(m=>m.username!==remove.dataset.adventureRemoveMember),'Jogador removido.');
  }else if(move)moveNeighbor(rowFor(move),move.dataset.rosterMove);
 });
 list.addEventListener('keydown',event=>{
  if(!['ArrowUp','ArrowDown'].includes(event.key))return;
  if(!event.target.closest('.roster-grip')&&!event.target.matches('[data-member-row]'))return;
  event.preventDefault();moveNeighbor(rowFor(event.target),event.key==='ArrowUp'?'up':'down')
 });
 let dragging=null,pointer=null,touch=null;
 const mark=(source,target)=>{
  list.querySelectorAll('.roster-order-moving,.roster-order-before,.roster-order-after').forEach(node=>node.classList.remove('roster-order-moving','roster-order-before','roster-order-after'));
  [...list.querySelectorAll('[data-member-row]')].find(row=>row.dataset.memberRow===source)?.classList.add('roster-order-moving');
  if(target?.row)target.row.classList.add(target.position==='before'?'roster-order-before':'roster-order-after');
 };
 const dropAt=(source,node,y)=>{
  const row=rowFor(node);
  if(!row||row.dataset.memberRow===source)return null;
  const bounds=row.getBoundingClientRect();
  return{row,target:row.dataset.memberRow,position:y<bounds.top+bounds.height/2?'before':'after'};
 };
 const finish=(source,target)=>{mark(null,null);if(target)reorder(source,target.target,target.position)};
 list.addEventListener('dragstart',event=>{
  const row=rowFor(event.target);
  if(!row||interactive(event.target)){event.preventDefault();return}
  dragging=row.dataset.memberRow;
  if(event.dataTransfer){event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',dragging)}
  mark(dragging,null)
 });
 list.addEventListener('dragover',event=>{
  if(!dragging)return;const drop=dropAt(dragging,event.target,event.clientY);
  if(!drop)return;event.preventDefault();mark(dragging,drop)
 });
 list.addEventListener('drop',event=>{
  if(!dragging)return;event.preventDefault();
  const source=dragging,drop=dropAt(source,event.target,event.clientY);dragging=null;finish(source,drop)
 });
 list.addEventListener('dragend',()=>{dragging=null;mark(null,null)});
 // Arraste por toque ou ponteiro: a superfície inteira funciona, sem impedir o uso dos controles.
 list.addEventListener('pointerdown',event=>{
  if(event.pointerType==='touch'||event.button!==0||interactive(event.target))return;
  const row=rowFor(event.target);if(!row)return;
  pointer={row,id:row.dataset.memberRow,pointerId:event.pointerId,x:event.clientX,y:event.clientY,active:false};
  row.setPointerCapture?.(event.pointerId);
  if(event.pointerType==='mouse')event.preventDefault();
 });
 list.addEventListener('pointermove',event=>{
  if(!pointer||pointer.pointerId!==event.pointerId)return;
  if(!pointer.active&&Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)<7)return;
  pointer.active=true;event.preventDefault();
  mark(pointer.id,dropAt(pointer.id,document.elementFromPoint(event.clientX,event.clientY),event.clientY))
 });
 list.addEventListener('pointerup',event=>{
  if(!pointer||pointer.pointerId!==event.pointerId)return;
  const{id,active}=pointer,drop=dropAt(id,document.elementFromPoint(event.clientX,event.clientY),event.clientY);
  pointer=null;if(active)finish(id,drop);else mark(null,null)
 });
 list.addEventListener('pointercancel',()=>{pointer=null;mark(null,null)});
 list.addEventListener('touchstart',event=>{
  if(touch||interactive(event.target))return;
  const row=rowFor(event.target),point=event.changedTouches[0];if(!row||!point)return;
  touch={id:row.dataset.memberRow,identifier:point.identifier,x:point.clientX,y:point.clientY,active:false};
  const current=touch;
  current.timer=setTimeout(()=>{if(touch===current){current.active=true;mark(current.id,null)}},280)
 },{passive:true});
 list.addEventListener('touchmove',event=>{
  if(!touch)return;
  const point=[...event.touches].find(t=>t.identifier===touch.identifier);if(!point)return;
  if(!touch.active){if(Math.hypot(point.clientX-touch.x,point.clientY-touch.y)>9){clearTimeout(touch.timer);touch=null}return}
  event.preventDefault();mark(touch.id,dropAt(touch.id,document.elementFromPoint(point.clientX,point.clientY),point.clientY))
 },{passive:false});
 list.addEventListener('touchend',event=>{
  if(!touch)return;
  const point=[...event.changedTouches].find(t=>t.identifier===touch.identifier);if(!point)return;
  const current=touch;clearTimeout(current.timer);touch=null;
  const drop=dropAt(current.id,document.elementFromPoint(point.clientX,point.clientY),point.clientY);
  if(current.active){event.preventDefault();finish(current.id,drop)}
 },{passive:false});
 list.addEventListener('touchcancel',()=>{if(touch)clearTimeout(touch.timer);touch=null;mark(null,null)});
}
