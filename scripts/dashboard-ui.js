import{readCampaigns,readStandaloneSessions}from'./campaign-state.js?v=20261016-current-status2';
import{readAdventures}from'./adventure-state.js?v=20261016-current-status2';
import{summarizeDashboard}from'./dashboard-state.js?v=20261016-next-only2';
import{imageElementHtml,hydrateMediaImages}from'./image-media.js?v=20260925-media2';
import{playerMode,sharedCampaignRows,sharedAdventures}from'./collaboration-view.js?v=20261016-master-preview1';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const campaignStatus=s=>({planned:'Planejada',current:'Atual',active:'Em andamento',paused:'Pausada',finished:'Concluída'}[s]||s);
const adventureStatus=s=>({planned:'Planejada',current:'Atual',active:'Em andamento',paused:'Pausada',completed:'Concluída',archived:'Arquivada'}[s]||s);
const countLabel=(value,singular,plural)=>`${value} ${value===1?singular:plural}`;
const sessionStatus=s=>({planned:'Planejada',next:'Próxima',current:'Atual',active:'Em andamento',completed:'Concluída',cancelled:'Cancelada'}[s]||s);
const fmtDate=v=>{if(!v)return'Sem data';const d=String(v).slice(0,10),m=d.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(v)};

function relationChip(kind,value){return '<span class="relationship-chip '+(kind==='Campanha'?'relation-campaign':'relation-adventure')+'"><span class="relation-label">'+esc(kind)+':</span> <strong>'+esc(value||'Sem vínculo')+'</strong></span>'}
function row({href,title,detail,status,statusKey='',relations=[],media=null,legacyUrl=""}){
 const image=imageElementHtml(media,legacyUrl,{className:'dashboard-row-cover',alt:''});
 return '<a class="dash-row '+(image?'has-cover':'')+'" href="'+esc(href)+'">'+image+'<div class="dash-row-copy"><strong>'+esc(title)+'</strong><div class="mini">'+esc(detail)+'</div>'+(relations.length?'<div class="card-relations">'+relations.map(r=>relationChip(r.kind,r.value)).join('')+'</div>':'')+'</div><div class="row-meta"><span class="badge '+esc(statusKey)+'">'+esc(status)+'</span></div></a>'
}
function renderCampaigns(rows){$('campaign-dashboard-list').innerHTML=rows.length?rows.map(c=>row({href:c.href,title:c.name,detail:[c.setting||c.system,countLabel((c.sessions||[]).length,'sessão','sessões')].filter(Boolean).join(' · '),status:campaignStatus(c.status),statusKey:c.status,media:c.coverImage,legacyUrl:c.coverImageUrl})).join(''):'<div class="empty">Nenhuma Campanha criada.</div>'}
function renderAdventures(rows){$('adventure-dashboard-list').innerHTML=rows.length?rows.map(a=>row({href:a.href,title:a.title,detail:[a.type==='oneshot'?'One-shot':a.arc].filter(Boolean).join(' · '),status:adventureStatus(a.status),statusKey:a.status,relations:[{kind:'Campanha',value:a.campaignName||'Sem Campanha'}],media:a.coverImage,legacyUrl:a.coverImageUrl})).join(''):'<div class="empty">Nenhuma Aventura criada.</div>'}
function renderSessions(rows){$('session-dashboard-list').innerHTML=rows.length?rows.map(s=>row({href:s.href,title:s.title,detail:'',status:sessionStatus(s.status),statusKey:s.status,relations:[{kind:'Campanha',value:s.campaignName||'Sem Campanha'},{kind:'Aventura',value:s.adventureName||'Sem Aventura vinculada'}],media:s.coverImage,legacyUrl:s.coverImageUrl})).join(''):'<div class="empty">Nenhuma Sessão criada.</div>'}
function focusCard(id,{badge,title,subtitle,meta,href,button='Abrir',media=null,legacyUrl='',status=''}={},emptyTitle){
 const el=$(id);if(!el)return;
 el.dataset.focusStatus=status;
 const heading=`<h2 class="focus-card-heading">${esc(badge)}</h2>`;
 if(!title){el.classList.remove('has-cover');el.innerHTML=`${heading}<div class="focus-card-empty"><p>${esc(emptyTitle)}</p></div>`;return}
 const image=imageElementHtml(media,legacyUrl,{className:'focus-card-cover',alt:''});
 el.classList.toggle('has-cover',Boolean(image));
 el.innerHTML=`${heading}<a class="focus-card-content-link" href="${esc(href)}" aria-label="${esc(button)}: ${esc(title)}">${image}<div class="focus-card-copy"><h3 class="focus-card-name">${esc(title)}</h3>${subtitle?`<p>${esc(subtitle)}</p>`:''}${meta?`<p class="mini">${esc(meta)}</p>`:''}</div><span class="btn" aria-hidden="true">${esc(button)}</span></a>`
}

function renderContext(summary){
 const next=summary.nextSession;
 focusCard('next-session',next?{badge:'Próxima sessão',status:next.session.status,title:next.session.title,subtitle:'Campanha: '+(next.campaign?.name||'Sem Campanha'),meta:'Aventura: '+(summary.adventures.find(a=>a.id===next.session.adventureId)?.title||'Sem Aventura vinculada'),href:next.campaign?`sessoes.html?campaign=${encodeURIComponent(next.campaign.id)}&id=${encodeURIComponent(next.session.id)}`:`sessoes.html?id=${encodeURIComponent(next.session.id)}`,button:'Abrir Sessão',media:next.session.coverImage,legacyUrl:next.session.coverImageUrl}:{badge:'Próxima sessão'},'Nenhuma próxima Sessão');
 const campaign=summary.currentCampaign;
 focusCard('current-campaign',campaign?{badge:'Campanha atual',status:campaign.status,title:campaign.name,subtitle:campaign.setting||campaign.system,meta:'',href:campaign.href,button:'Abrir Campanha',media:campaign.coverImage,legacyUrl:campaign.coverImageUrl}:{badge:'Campanha atual'},'Nenhuma Campanha atual');
 const adventure=summary.currentAdventure;
 focusCard('current-adventure',adventure?{badge:'Aventura atual',status:adventure.status,title:adventure.title,subtitle:'Campanha: '+(adventure.campaignName||'Sem Campanha'),meta:'',href:adventure.href,button:'Abrir Aventura',media:adventure.coverImage,legacyUrl:adventure.coverImageUrl}:{badge:'Aventura atual'},'Nenhuma Aventura atual');
 const current=summary.currentSession;
 focusCard('current-session',current?{badge:'Sessão atual',status:current.session.status,title:current.session.title,subtitle:'Campanha: '+(current.campaign?.name||'Sem Campanha'),meta:'Aventura: '+(summary.adventures.find(a=>a.id===current.session.adventureId)?.title||'Sem Aventura vinculada'),href:current.href,button:'Abrir Sessão',media:current.session.coverImage,legacyUrl:current.session.coverImageUrl}:{badge:'Sessão atual'},'Nenhuma Sessão atual')
}

// A página Início usa rolagem vertical como as demais áreas do Hub.
// Não ocultar cards ou registros por paginação vinculada à altura da janela.
const isE2EFixtureCampaign=c=>c?.id==='e2e-explicit-player-access';
function init(){const restricted=playerMode(),campaigns=(restricted?sharedCampaignRows().map(row=>row.campaign):readCampaigns()).filter(c=>!isE2EFixtureCampaign(c)),adventures=(restricted?sharedAdventures():readAdventures()).filter(a=>a?.campaignId!=='e2e-explicit-player-access'),standaloneSessions=(restricted?[]:readStandaloneSessions()).filter(s=>s?.campaignId!=='e2e-explicit-player-access'),summary=summarizeDashboard({campaigns,adventures,standaloneSessions,now:new Date()});renderCampaigns(summary.campaigns);renderAdventures(summary.adventures);renderSessions(summary.sessions);renderContext(summary);hydrateMediaImages(document).catch(()=>{})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
