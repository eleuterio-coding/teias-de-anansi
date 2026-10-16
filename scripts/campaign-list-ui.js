import{readCampaigns,writeCampaigns,updateCampaign,removeCampaign}from'./campaign-state.js?v=20261016-current-status2';
import{readAdventures,writeAdventures,removeAdventuresForCampaign}from'./adventure-state.js?v=20261016-current-status2';
import{deleteImage,imageElementHtml,hydrateMediaImages}from'./image-media.js?v=20260925-media2';
import{playerMode,sharedCampaignRows}from'./collaboration-view.js?v=20261016-master-preview1';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DM_NAME='Rafael',SYSTEM_NAME='D&D 5.5e';
let campaigns=[],readOnly=false,visibleAdventures=[];
function persist(list){campaigns=writeCampaigns(list);render()}
function statusLabel(status){return({planned:'Planejada',current:'Atual',active:'Em andamento',paused:'Pausada',finished:'Concluída'}[status]||status)}

const CAMPAIGN_STATUSES=['planned','current','active','paused','finished'];
const amount=(count,singular,plural)=>`${count} ${count===1?singular:plural}`;
function card(c){
 const sessions=Array.isArray(c.sessions)?c.sessions:[];
 const active=sessions.find(s=>s.id===c.activeSessionId);
 const players=(c.members||[]).length,characters=(c.members||[]).filter(m=>m.characterId).length;
 const adventureCount=visibleAdventures.filter(row=>row.campaignId===c.id).length;
 const cover=imageElementHtml(c.coverImage,c.coverImageUrl,{className:'campaign-card-cover',alt:''});
 const counts=[amount(players,'jogador','jogadores'),amount(characters,'personagem','personagens'),amount(adventureCount,'aventura','aventuras'),amount(sessions.length,'sessão','sessões')].join(' · ');
 const status=CAMPAIGN_STATUSES.includes(c.status)?c.status:'planned';
 const statusControl=readOnly
  ?`<span class="campaign-status-value" aria-label="Status da campanha: ${esc(statusLabel(status))}">${esc(statusLabel(status))}</span>`
  :`<select class="campaign-status-select" data-campaign-status="${esc(c.id)}" aria-label="Status da campanha ${esc(c.name)}" title="Alterar status de ${esc(c.name)}">
    ${CAMPAIGN_STATUSES.map(value=>`<option value="${value}" ${status===value?'selected':''}>${esc(statusLabel(value))}</option>`).join('')}
   </select>`;
 return `<article class="campaign-card" data-campaign-card="${esc(c.id)}">
  <div class="campaign-card-status status-${esc(status)}">${statusControl}</div>
  <div class="campaign-card-main">${cover}<div class="campaign-card-details">
   <h2>${esc(c.name)}</h2>
   ${readOnly?'<span class="badge">Somente leitura</span>':''}
   ${c.description?`<p>${esc(c.description)}</p>`:''}
   <p class="mini">${esc(counts)}${active?` · <strong>Em andamento: ${esc(active.title)}</strong>`:''}</p>
  </div></div>
  <div class="row-actions campaign-card-actions">
   <a class="btn" href="mesa.html?id=${encodeURIComponent(c.id)}">Abrir</a>
   ${readOnly?'':`<button type="button" class="danger" data-delete="${esc(c.id)}">Excluir</button>`}
  </div>
 </article>`
}
function createTile(){
 return '<a class="campaign-card campaign-create-tile" id="open-campaign-create" href="nova-campanha.html" aria-label="Nova campanha"><span class="campaign-create-plus" aria-hidden="true">+</span><span class="campaign-create-tile-label">Nova campanha</span></a>'
}
function render(){
 const box=$('campaign-list');if(!box)return;
 const ordered=[...campaigns].sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
 box.innerHTML=ordered.length||!readOnly
  ? `<div class="list campaign-list-grid">${ordered.map(card).join('')}${readOnly?'':createTile()}</div>`
  : '<div class="empty">Nenhuma campanha atribuída.</div>';
 if(readOnly){hydrateMediaImages(box).catch(()=>{});return}
 box.querySelectorAll('[data-campaign-status]').forEach(select=>select.addEventListener('change',()=>{
  const status=select.value,campaignId=select.dataset.campaignStatus;
  const previous=campaigns.find(row=>row.id===campaignId)?.status||'planned';
  if(!CAMPAIGN_STATUSES.includes(status)){select.value=previous;return}
  if(status===previous)return;
  const result=updateCampaign(campaigns,campaignId,{status});
  if(result.ok)persist(result.list);
  else {select.value=previous;const note=$('storage-note');if(note)note.textContent=result.reason||'Não foi possível alterar o status.'}
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
  campaigns=rows.map(row=>row.campaign).filter(row=>row.id!=='e2e-explicit-player-access');
  visibleAdventures=rows.flatMap(row=>Array.isArray(row.adventures)?row.adventures:[]).filter(row=>row.campaignId!=='e2e-explicit-player-access')
 }else{
  campaigns=normalizeLocalCampaigns().filter(row=>row.id!=='e2e-explicit-player-access');
  visibleAdventures=readAdventures().filter(row=>row.campaignId!=='e2e-explicit-player-access')
 }
 const note=$('storage-note');if(note)note.textContent=readOnly?'Somente leitura.':''
}
function refreshFromRemote(event){event.detail?.claim?.();loadVisibleCampaigns();render()}
function init(){
 loadVisibleCampaigns();
 render();
 window.addEventListener('hub-rpg:remote-updated',refreshFromRemote)
}
init();