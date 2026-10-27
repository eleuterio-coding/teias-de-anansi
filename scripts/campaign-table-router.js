import{renderPlayerCampaign}from'./campaign-player-view.js?v=20261023-title-links4';
import{sharedCampaignById,playerMode}from'./collaboration-view.js?v=20261016-master-preview1';
import{renderNextCampaignSession}from'./campaign-next-session-ui.js?v=20261022-chronicles-final3';
import{readCampaigns,writeCampaigns}from'./campaign-state.js?v=20261022-chronicles-final3';
import{imageElementHtml,hydrateMediaImages}from'./image-media.js?v=20261019-disclosure1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DM_NAME='Rafael';
const params=new URLSearchParams(location.search),campaignId=params.get('id')||'';
const roleLabel=r=>r==='player'?'Jogador':r;
const statusLabel=s=>({planned:'Planejada',active:'Em andamento',completed:'Concluída',cancelled:'Cancelada'}[s]||s),campaignStatusLabel=s=>({planned:'Planejada',current:'Em andamento',active:'Em andamento',paused:'Pausada',finished:'Concluída',cancelled:'Cancelada'}[s]||s);
function readOnlyTable(row){renderPlayerCampaign(row)}
function denied(){const root=document.getElementById('table-root');root.innerHTML='<div class="status warning"><strong>Campanha não atribuída a esta conta.</strong><br><a href="campanhas.html">Voltar para Campanhas</a></div>'}
let lastPlayerSnapshot='';
function renderPlayerTable(){
 const shared=sharedCampaignById(campaignId);
 if(!shared){lastPlayerSnapshot='';denied();return}
 const snapshot=JSON.stringify({campaign:shared.campaign,membership:shared.membership,adventures:shared.adventures,characters:shared.characters,participants:shared.participants});
 if(snapshot===lastPlayerSnapshot&&document.getElementById('table-root')?.dataset.campaignAccess==='player')return;
 lastPlayerSnapshot=snapshot;readOnlyTable(shared)
}
function normalizeDm(){const list=readCampaigns();if(!list.some(c=>c.dmName!==DM_NAME))return;writeCampaigns(list.map(c=>({...c,dmName:DM_NAME})))}
async function start(){if(playerMode()){renderPlayerTable();window.addEventListener('hub-rpg:remote-updated',event=>{event.detail?.claim?.();renderPlayerTable()});return}normalizeDm();await Promise.all([import('./campaign-table-ui.js?v=20261027-roster-drag-fix2'),import('./campaign-table-adventure-ui.js?v=20261022-chronicles-final3')])}
start();