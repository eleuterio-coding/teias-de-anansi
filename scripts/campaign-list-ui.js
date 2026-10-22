import{readCampaigns,writeCampaigns,updateCampaign,removeCampaign}from'./campaign-state.js?v=20261022-directories1';
import{readAdventures,writeAdventures,removeAdventuresForCampaign}from'./adventure-state.js?v=20261016-current-status2';
import{deleteImage,imageElementHtml,hydrateMediaImages}from'./image-media.js?v=20260925-media2';
import{playerMode,sharedCampaignRows}from'./collaboration-view.js?v=20261016-master-preview1';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DM_NAME='Rafael',SYSTEM_NAME='D&D 5.5e';
let campaigns=[],readOnly=false,visibleAdventures=[];
function persist(list){campaigns=writeCampaigns(list);render()}
function statusLabel(status){return({planned:'Planejada',active:'Em andamento',paused:'Pausada',finished:'Concluída',cancelled:'Cancelada'}[status]||status)}

const CAMPAIGN_STATUSES=['active','paused','finished','cancelled','planned'];
const statusPriority=status=>{const rank=CAMPAIGN_STATUSES.indexOf(status);return rank<0?CAMPAIGN_STATUSES.length:rank};
const amount=(count,singular,plural)=>`${count} ${count===1?singular:plural}`;
function card(c){
 const sessions=Array.isArray(c.sessions)?c.sessions:[];
 const active=sessions.find(s=>s.id===c.activeSessionId);
 const players=(c.members||[]).length,characters=(c.members||[]).filter(m=>m.characterId).length;
 const adventureCount=visibleAdventures.filter(row=>row.campaignId===c.id).length;
 const cover=imageElementHtml(c.coverImage,c.coverImageUrl,{className:'campaign-card-cover',alt:''});
 const npcCount=readOnly?new Set([...(c.npcPublicEntries||[]),...(c.importantNpcEntries||[])].map(n=>n.id).filter(Boolean)).size:new Set([...(c.npcDirectory||[]),...(c.npcs||[]),...(c.importantNpcIds||[]).map(id=>({id}))].map(n=>n.id).filter(Boolean)).size;
 const counts=[amount(players,'jogador','jogadores'),amount(characters,'personagem','personagens'),amount(npcCount,'NPC','NPCs'),amount(adventureCount,'aventura','aventuras'),amount(sessions.length,'sessão','sessões')].join(' · ');
 const status=CAMPAIGN_STATUSES.includes(c.status)?c.status:'planned';
 const statusControl=readOnly
  ?`<span class="campaign-status-value" aria-label="Status da campanha: ${esc(statusLabel(status))}">${esc(statusLabel(status))}</span>`
  :`<details class="campaign-status-disclosure" data-status-disclosure="${esc(c.id)}">
     <summary class="campaign-status-trigger" data-campaign-status-trigger="${esc(c.id)}" aria-label="Alterar status da campanha ${esc(c.name)}: ${esc(statusLabel(status))}">
      <span>${esc(statusLabel(status))}</span><span class="campaign-status-chevron" aria-hidden="true"></span>
     </summary>
     <div class="campaign-status-menu" role="group" aria-label="Escolher status da campanha ${esc(c.name)}">
      ${CAMPAIGN_STATUSES.map(value=>`<button type="button" class="campaign-status-option status-${value}" data-campaign-status="${esc(c.id)}" data-next-status="${value}" aria-pressed="${status===value}">${esc(statusLabel(value))}</button>`).join('')}
     </div>
    </details>`;
 return `<article class="campaign-card" data-campaign-card="${esc(c.id)}"><a class="campaign-card-stretched-link" href="mesa.html?id=${encodeURIComponent(c.id)}" aria-label="Abrir campanha ${esc(c.name)}"></a>
  <div class="campaign-card-status status-${esc(status)}">${statusControl}</div>
  <div class="campaign-card-main">${cover}<div class="campaign-card-details">
   <h2>${esc(c.name)}</h2>
   ${c.description?`<p>${esc(c.description)}</p>`:''}
   <p class="mini">${esc(counts)}${active?` · <strong>Em andamento: ${esc(active.title)}</strong>`:''}</p>
  </div></div>
  <div class="row-actions campaign-card-actions">
   <a class="btn" href="mesa.html?id=${encodeURIComponent(c.id)}">Abrir</a>
   <a class="btn secondary" href="lista-personagens.html?mode=campanhas&campaign=${encodeURIComponent(c.id)}">Personagens</a>
   <a class="btn secondary" href="lista-npcs.html?mode=campanhas&campaign=${encodeURIComponent(c.id)}">NPCs</a>
   ${readOnly?'':`<button type="button" class="danger" data-delete="${esc(c.id)}">Excluir</button>`}
  </div>
 </article>`
}
function createTile(){
 return '<a class="campaign-card campaign-create-tile" id="open-campaign-create" href="nova-campanha.html" aria-label="Nova campanha"><span class="campaign-create-plus" aria-hidden="true">+</span><span class="campaign-create-tile-label">Nova campanha</span></a>'
}
function render(){
 const box=$('campaign-list');if(!box)return;
 const choice=$('campaign-status-filter')?.value||'all';
 const ordered=[...campaigns]
  .filter(c=>choice==='all'||c.status===choice)
  .sort((a,b)=>statusPriority(a.status)-statusPriority(b.status)||String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))||String(a.name||'').localeCompare(String(b.name||''),'pt-BR'));
 box.innerHTML=ordered.length||!readOnly
  ? `<div class="list campaign-list-grid">${ordered.map(card).join('')}${readOnly?'':createTile()}</div>`
  : '<div class="empty">Nenhuma campanha atribuída.</div>';
 if(!ordered.length&&choice!=='all'){
  box.insertAdjacentHTML('afterbegin','<div class="empty campaign-filter-empty">Nenhuma campanha com esse status.</div>');
 }
 if(readOnly){hydrateMediaImages(box).catch(()=>{});return}
 box.querySelectorAll('[data-status-disclosure]').forEach(disclosure=>disclosure.addEventListener('toggle',()=>{
  if(!disclosure.open)return;
  box.querySelectorAll('[data-status-disclosure][open]').forEach(other=>{if(other!==disclosure)other.open=false})
 }));
 box.querySelectorAll('[data-next-status]').forEach(button=>button.addEventListener('click',()=>{
  const status=button.dataset.nextStatus,campaignId=button.dataset.campaignStatus;
  const previous=campaigns.find(row=>row.id===campaignId)?.status||'planned';
  if(!CAMPAIGN_STATUSES.includes(status))return;
  if(status===previous){button.closest('details')?.removeAttribute('open');return}
  const result=updateCampaign(campaigns,campaignId,{status});
  if(result.ok){
   persist(result.list);
   [...box.querySelectorAll('[data-campaign-status-trigger]')].find(item=>item.dataset.campaignStatusTrigger===campaignId)?.focus()
  }else{
   const note=$('storage-note');if(note)note.textContent=result.reason||'Não foi possível alterar o status.'
  }
 }));
 box.querySelectorAll('[data-delete]').forEach(button=>button.addEventListener('click',()=>{
  if(!confirm('Excluir esta campanha? Os personagens não serão excluídos. As aventuras vinculadas a esta campanha também serão removidas.'))return;
  const campaignId=button.dataset.delete,target=campaigns.find(row=>row.id===campaignId),linkedAdventures=readAdventures().filter(row=>row.campaignId===campaignId),result=removeCampaign(campaigns,campaignId);
  if(result.ok){
   writeAdventures(removeAdventuresForCampaign(readAdventures(),campaignId));
   persist(result.list);
   [target?.coverImage,...(target?.sessions||[]).map(row=>row.coverImage),...linkedAdventures.map(row=>row.coverImage)].filter(Boolean).forEach(media=>deleteImage(media).catch(()=>{}))
  }
 }));
 hydrateMediaImages(box).catch(()=>{})
}
function normalizeLocalCampaigns(){const list=readCampaigns();if(!list.some(c=>c.dmName!==DM_NAME))return list;return writeCampaigns(list.map(c=>c.dmName===DM_NAME?c:{...c,dmName:DM_NAME}))}
function loadVisibleCampaigns(){
 readOnly=playerMode();
 if(readOnly){
  const rows=sharedCampaignRows();
  campaigns=rows.map(row=>({...row.campaign,status:row.campaign.status==='current'?'active':row.campaign.status})).filter(row=>row.id!=='e2e-explicit-player-access');
  visibleAdventures=rows.flatMap(row=>(Array.isArray(row.adventures)?row.adventures:[]).map(adventure=>({...adventure,campaignId:adventure.campaignId||row.campaign.id}))).filter(row=>row.campaignId!=='e2e-explicit-player-access')
 }else{
  campaigns=normalizeLocalCampaigns().filter(row=>row.id!=='e2e-explicit-player-access');
  visibleAdventures=readAdventures().filter(row=>row.campaignId!=='e2e-explicit-player-access')
 }
 const note=$('storage-note');if(note)note.textContent=readOnly?'Somente leitura.':''
}
function refreshFromRemote(event){event.detail?.claim?.();loadVisibleCampaigns();render()}
function init(){
 loadVisibleCampaigns();
 $('campaign-status-filter')?.addEventListener('change',render);
 render();
 document.addEventListener('pointerdown',event=>{
  if(event.target.closest?.('[data-status-disclosure]'))return;
  document.querySelectorAll('#campaign-list [data-status-disclosure][open]').forEach(item=>item.open=false)
 });
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  const open=document.querySelector('#campaign-list [data-status-disclosure][open]');
  if(!open)return;
  open.open=false;open.querySelector('summary')?.focus();event.stopPropagation()
 });
 window.addEventListener('hub-rpg:remote-updated',refreshFromRemote)
}
init();