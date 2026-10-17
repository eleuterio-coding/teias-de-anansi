const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const entries=value=>String(value||'').split(/\r?\n/).map(x=>x.trim().replace(/^[•*\-]\s*/, '')).filter(Boolean);
const clean=v=>String(v??'').trim();
const npcHref=id=>'ficha-personagem.html?npc=1&id='+encodeURIComponent(id);
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
 <ul class="campaign-bullet-list">${values.length?values.map((v,i)=>`<li><span class="campaign-list-marker"></span><span>${esc(v)}</span><button type="button" class="secondary campaign-list-remove" data-del-line="${field}" data-index="${i}">Remover</button></li>`).join(''):'<li class="campaign-blank-state">Nenhum registro.</li>'}</ul>
 <div class="campaign-add-line"><label>Novo registro<input data-new-line="${field}" autocomplete="off"></label><button type="button" data-add-line="${field}">Adicionar</button></div></section>`
}
function flow(c){
 const values=entries(c.timeline);
 return `<section id="linha-tempo" class="card campaign-editor-card campaign-timeline-section"><div class="campaign-editor-head"><h2>Linha do tempo</h2><span class="campaign-editor-count">${values.length} eventos</span></div>
 <ol class="campaign-timeline-flow">${values.length?values.map((v,i)=>`<li class="campaign-flow-step"><span class="campaign-flow-node">${i+1}</span><div class="campaign-flow-card"><strong>${esc(v)}</strong><div class="campaign-flow-actions"><button class="secondary" type="button" data-move-line="${i}" data-direction="-1" ${!i?'disabled':''} aria-label="Subir evento">↑</button><button class="secondary" type="button" data-move-line="${i}" data-direction="1" ${i===values.length-1?'disabled':''} aria-label="Descer evento">↓</button><button class="secondary" type="button" data-del-line="timeline" data-index="${i}">Remover</button></div></div></li>`).join(''):'<li class="campaign-blank-state">Nenhum evento registrado.</li>'}</ol>
 <div class="campaign-add-line"><label>Novo evento<input data-new-line="timeline" autocomplete="off"></label><button type="button" data-add-line="timeline">Adicionar evento</button></div></section>`
}
export function renderStructuredSection(c,npcs,id){
 if(id==='npcs')return roster(c,npcs);
 if(id==='locais')return bullets(c,'locais','Locais importantes','importantLocations');
 if(id==='missoes')return bullets(c,'missoes','Missões e objetivos','activeMissions');
 if(id==='linha-tempo')return flow(c);
 return''
}
export function renderStructuredDetails(c,npcs){
 return ['npcs','locais','missoes'].map(id=>renderStructuredSection(c,npcs,id)).join('')
}
export function renderTimeline(c){return flow(c)}
export function bindStructuredDetails({getCampaign,getNpcs,save,feedback}){
 const sectionFor=field=>field==='timeline'?'linha-tempo':field==='importantLocations'?'locais':'missoes';
 const refresh=id=>{
  const previous=document.getElementById(id);if(!previous)return;
  const template=document.createElement('template');
  template.innerHTML=renderStructuredSection(getCampaign(),getNpcs(),id);
  previous.replaceWith(template.content.firstElementChild);
 };
 const persist=(patch,id,message)=>{
  save(patch,{message});
  refresh(id)
 };
 const root=document.querySelector('.campaign-sections');if(!root)return;
 root.addEventListener('click',event=>{
  const section=event.target.closest('#npcs,#locais,#missoes,#linha-tempo');if(!section)return;
  const target=event.target.closest('button');if(!target)return;
  const c=getCampaign();
  if(target.matches('[data-add-npc]')){
   const id=section.querySelector('#campaign-npc-picker')?.value;
   if(!id||!getNpcs().some(n=>n.id===id))return feedback('Selecione um NPC cadastrado.',false);
   persist({importantNpcIds:[...new Set([...(c.importantNpcIds||[]),id])]},'npcs','NPC adicionado.');
  }else if(target.matches('[data-del-npc]')){
   persist({importantNpcIds:(c.importantNpcIds||[]).filter(id=>id!==target.dataset.delNpc)},'npcs','NPC removido.');
  }else if(target.matches('[data-add-line]')){
   const field=target.dataset.addLine,input=section.querySelector('[data-new-line]'),value=clean(input?.value);
   if(!value)return;
   persist({[field]:[...entries(c[field]),value].join('\n')},sectionFor(field),'Registro adicionado.');
  }else if(target.matches('[data-del-line]')){
   const field=target.dataset.delLine,values=entries(c[field]);values.splice(Number(target.dataset.index),1);
   persist({[field]:values.join('\n')},sectionFor(field),'Registro removido.');
  }else if(target.matches('[data-move-line]')){
   const values=entries(c.timeline),index=Number(target.dataset.moveLine),next=index+Number(target.dataset.direction);
   if(next<0||next>=values.length)return;
   [values[index],values[next]]=[values[next],values[index]];
   persist({timeline:values.join('\n')},'linha-tempo','Linha do tempo reorganizada.');
  }
 });
 root.addEventListener('keydown',event=>{
  const section=event.target.closest('#npcs,#locais,#missoes,#linha-tempo');
  if(section&&event.target.matches('[data-new-line]')&&event.key==='Enter'){
   event.preventDefault();section.querySelector('[data-add-line]')?.click()
  }
 });
}
