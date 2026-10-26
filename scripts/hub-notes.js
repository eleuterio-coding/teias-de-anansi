// Notas discretas, publicadas individualmente. Não exponha dmNotes legado.
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function cleanNotes(list=[],legacy=''){
 const rows=Array.isArray(list)?list:(String(legacy||'').trim()?[{id:'legacy-master-note',text:legacy,visibleToPlayers:false}]:[]);
 return rows.filter(x=>x&&String(x.text||'').trim()).map((x,i)=>({id:String(x.id||'note-'+i),text:String(x.text||'').slice(0,5000),visibleToPlayers:x.visibleToPlayers===true}));
}
export function noteSection(rows=[],{readOnly=false,id='notas-mestre'}={}){
 const notes=cleanNotes(rows);
 return `<section id="${esc(id)}" class="card campaign-editor-card hub-notes-card"><h2>Notas do Mestre</h2>
 <ul class="campaign-bullet-list campaign-editable-bullets hub-note-list">${notes.length?notes.map((n,i)=>`<li class="campaign-bullet-entry hub-note-entry" data-note-id="${esc(n.id)}" draggable="${!readOnly}" tabindex="0">
 <span class="campaign-reorder-grip" aria-hidden="true">⠿</span>
 ${readOnly?`<span class="hub-note-text">${esc(n.text)}</span>`:`<textarea class="hub-note-text" data-note-text aria-label="Nota ${i+1}">${esc(n.text)}</textarea><div class="campaign-line-actions">
 <label class="campaign-disclosure-toggle"><input type="checkbox" data-note-visible ${n.visibleToPlayers?'checked':''}><span>Mostrar aos jogadores</span></label>
 <button type="button" class="secondary campaign-move-button" data-note-move="up" ${i===0?'disabled':''}>↑</button>
 <button type="button" class="secondary campaign-move-button" data-note-move="down" ${i===notes.length-1?'disabled':''}>↓</button>
 <button type="button" class="secondary campaign-list-remove" data-note-delete>Remover</button></div>`}</li>`).join(''):'<li class="campaign-blank-state">Nenhuma nota disponível.</li>'}</ul>
 ${readOnly?'':`<div class="campaign-add-line"><label>Nova nota<textarea data-new-master-note placeholder="Registrar nota"></textarea></label><button type="button" data-note-add>Adicionar nota</button></div>`}
 </section>`;
}
export function bindNoteSection(section,{read,save}){
 if(!section)return;
 const modify=fn=>{const rows=cleanNotes(read());const next=fn(rows);if(!next)return;save(next)};
 section.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-note-add')){
   const field=section.querySelector('[data-new-master-note]'),value=field?.value.trim();if(!value)return;
   modify(rows=>[...rows,{id:globalThis.crypto?.randomUUID?.()||'note-'+Date.now(),text:value,visibleToPlayers:false}]);return
  }
  const node=button.closest('[data-note-id]'),id=node?.dataset.noteId;if(!id)return;
  if(button.hasAttribute('data-note-delete')){modify(rows=>rows.filter(n=>n.id!==id));return}
  if(button.dataset.noteMove){modify(rows=>{const i=rows.findIndex(n=>n.id===id),j=i+(button.dataset.noteMove==='up'?-1:1);if(j<0||j>=rows.length)return null;[rows[i],rows[j]]=[rows[j],rows[i]];return rows})}
 });
 section.addEventListener('change',event=>{
  const input=event.target,node=input.closest('[data-note-id]'),id=node?.dataset.noteId;
  if(!id||!(input.matches('[data-note-text]')||input.matches('[data-note-visible]')))return;
  modify(rows=>rows.map(n=>n.id===id?{...n,...(input.matches('[data-note-text]')?{text:input.value}:{visibleToPlayers:input.checked})}:n))
 });
 let dragged='';
 section.addEventListener('dragstart',event=>{const row=event.target.closest('[data-note-id]');if(!row?.draggable)return;dragged=row.dataset.noteId||'';if(dragged)event.dataTransfer?.setData('text/plain',dragged)});
 section.addEventListener('dragover',event=>{if(dragged&&event.target.closest('[data-note-id]'))event.preventDefault()});
 section.addEventListener('drop',event=>{const row=event.target.closest('[data-note-id]'),id=row?.dataset.noteId;event.preventDefault();if(!dragged||!id||dragged===id)return;modify(rows=>{const from=rows.findIndex(x=>x.id===dragged),to=rows.findIndex(x=>x.id===id);if(from<0||to<0)return null;rows.splice(to,0,rows.splice(from,1)[0]);return rows})});
}
