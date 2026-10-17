import{readNpcs,writeNpcs,npcMasterAuthorized}from'./character-builder/state.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const box=document.getElementById('npc-list');
function render(){
 if(!npcMasterAuthorized()){location.replace('personagens.html');return}
 document.getElementById('main-content').hidden=false;
 const rows=[...readNpcs()].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'pt-BR'));
 box.innerHTML=rows.length?rows.map(npc=>{
  const subclass=npc.refSnapshots?.subclass?.name,klass=npc.refSnapshots?.class?.name;
  const label=[klass,npc.choices?.class?.level?'Nível '+npc.choices.class.level:null,subclass].filter(Boolean).join(' · ');
  return `<article class="npc-library-card"><div><h2>${esc(npc.name||'NPC sem nome')}</h2><p>${esc(label||'Ficha de NPC')}</p></div><div class="row-actions"><a class="btn secondary" href="ficha-personagem.html?npc=1&id=${encodeURIComponent(npc.id)}">Abrir</a><a class="btn secondary" href="criacao-personagem.html?npc=1&id=${encodeURIComponent(npc.id)}">Editar</a><button type="button" class="danger" data-remove-npc="${esc(npc.id)}">Excluir</button></div></article>`
 }).join(''):'<div class="empty">Nenhum NPC cadastrado.</div>';
 box.querySelectorAll('[data-remove-npc]').forEach(button=>button.addEventListener('click',()=>{
  const rows=readNpcs(),npc=rows.find(row=>row.id===button.dataset.removeNpc);
  if(!npc||!confirm(`Excluir o NPC "${npc.name||'sem nome'}"?`))return;
  writeNpcs(rows.filter(row=>row.id!==npc.id));render();
 }))
}
window.addEventListener('storage',event=>{if(event.key==='hub-rpg:npcs:v1')render()});
render();