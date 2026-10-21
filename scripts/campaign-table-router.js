import{renderPlayerCampaign}from'./campaign-player-view.js?v=20261019-disclosure2';
import{sharedCampaignById,playerMode}from'./collaboration-view.js?v=20261016-master-preview1';
import{renderNextCampaignSession}from'./campaign-next-session-ui.js?v=20261019-session-order2';
import{readCampaigns,writeCampaigns}from'./campaign-state.js?v=20261019-session-order2';
import{imageElementHtml,hydrateMediaImages}from'./image-media.js?v=20261019-disclosure1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DM_NAME='Rafael';
const params=new URLSearchParams(location.search),campaignId=params.get('id')||'';
const roleLabel=r=>r==='player'?'Jogador':r;
const statusLabel=s=>({planned:'Planejada',active:'Em andamento',completed:'Concluída',cancelled:'Cancelada'}[s]||s),campaignStatusLabel=s=>({planned:'Planejada',current:'Em andamento',active:'Em andamento',paused:'Pausada',finished:'Concluída',cancelled:'Cancelada'}[s]||s);
function readOnlyTable(row){renderPlayerCampaign(row)}
function denied(){const root=document.getElementById('table-root');root.innerHTML='<div class="status warning"><strong>Campanha não atribuída a esta conta.</strong><br><a href="campanhas.html">Voltar para Campanhas</a></div>'}
function renderPlayerTable(){const shared=sharedCampaignById(campaignId);if(shared)readOnlyTable(shared);else denied()}
function normalizeDm(){const list=readCampaigns();if(!list.some(c=>c.dmName!==DM_NAME))return;writeCampaigns(list.map(c=>({...c,dmName:DM_NAME})))}
async function start(){if(playerMode()){renderPlayerTable();window.addEventListener('hub-rpg:remote-updated',event=>{event.detail?.claim?.();renderPlayerTable()});return}normalizeDm();await Promise.all([import('./campaign-table-ui.js?v=20261019-disclosure1'),import('./campaign-table-adventure-ui.js?v=20261016-campaign-geography1')])}
start();