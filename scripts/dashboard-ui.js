import{readCampaigns,readStandaloneSessions}from'./campaign-state.js?v=20260901-campaign1';
import{readAdventures}from'./adventure-state.js?v=20260902-adventures1';
import{summarizeDashboard}from'./dashboard-state.js?v=20261016-dashboard2';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const campaignStatus=s=>({planned:'Planejada',active:'Em andamento',paused:'Pausada',finished:'Concluída'}[s]||s);
const adventureStatus=s=>({planned:'Planejada',active:'Em andamento',paused:'Pausada',completed:'Concluída',archived:'Arquivada'}[s]||s);
const sessionStatus=s=>({planned:'Planejada',active:'Atual',completed:'Concluída',cancelled:'Cancelada'}[s]||s);
const fmtDate=v=>{if(!v)return'Sem data';const d=String(v).slice(0,10),m=d.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(v)};
function row({href,title,detail,status,live=false}){return`<a class="dash-row" href="${esc(href)}"><div><strong>${esc(title)}</strong><div class="mini">${esc(detail)}</div></div><div class="row-meta"><span class="badge ${live?'live':''}">${esc(status)}</span></div></a>`}
function renderCampaigns(rows){$('campaign-dashboard-list').innerHTML=rows.length?rows.map(c=>row({href:c.href,title:c.name,detail:[c.setting||c.system,`${(c.sessions||[]).length} sessão(ões)`].filter(Boolean).join(' · '),status:campaignStatus(c.status),live:c.status==='active'})).join(''):'<div class="empty">Nenhuma Campanha criada.</div>'}
function renderAdventures(rows){$('adventure-dashboard-list').innerHTML=rows.length?rows.map(a=>row({href:a.href,title:a.title,detail:[a.campaignName,a.type==='oneshot'?'One-shot':a.arc].filter(Boolean).join(' · ')||'Sem Campanha vinculada',status:adventureStatus(a.status),live:a.status==='active'})).join(''):'<div class="empty">Nenhuma Aventura criada.</div>'}
function renderSessions(rows){$('session-dashboard-list').innerHTML=rows.length?rows.map(s=>row({href:s.href,title:s.title,detail:[s.campaignName,fmtDate(s.date)].filter(Boolean).join(' · '),status:sessionStatus(s.status),live:s.status==='active'})).join(''):'<div class="empty">Nenhuma Sessão criada.</div>'}
function focusCard(id,{badge,title,subtitle,meta,href,button='Abrir'}={},emptyTitle){
 const el=$(id);if(!el)return;
 if(!title){el.innerHTML=`<div><span class="badge">${esc(badge)}</span><h2>${esc(emptyTitle)}</h2></div>`;return}
 el.innerHTML=`<div><span class="badge ${badge==='Próxima sessão'?'next':'live'}">${esc(badge)}</span><h2>${esc(title)}</h2>${subtitle?`<p>${esc(subtitle)}</p>`:''}${meta?`<p class="mini">${esc(meta)}</p>`:''}</div><a class="btn" href="${esc(href)}">${esc(button)}</a>`
}
function renderContext(summary){
 const next=summary.nextSession;
 focusCard('next-session',next?{badge:'Próxima sessão',title:next.session.title,subtitle:next.campaign?.name||'Sessão avulsa',meta:[fmtDate(next.session.date),sessionStatus(next.session.status)].join(' · '),href:next.campaign?`sessoes.html?campaign=${encodeURIComponent(next.campaign.id)}&id=${encodeURIComponent(next.session.id)}`:`sessoes.html?id=${encodeURIComponent(next.session.id)}`,button:'Abrir Sessão'}:{badge:'Próxima sessão'},'Nenhuma próxima Sessão');
 const campaign=summary.currentCampaign;
 focusCard('current-campaign',campaign?{badge:'Campanha atual',title:campaign.name,subtitle:campaign.setting||campaign.system,meta:campaignStatus(campaign.status),href:campaign.href,button:'Abrir Campanha'}:{badge:'Campanha atual'},'Nenhuma Campanha atual');
 const adventure=summary.currentAdventure;
 focusCard('current-adventure',adventure?{badge:'Aventura atual',title:adventure.title,subtitle:adventure.campaignName,meta:adventureStatus(adventure.status),href:adventure.href,button:'Abrir Aventura'}:{badge:'Aventura atual'},'Nenhuma Aventura atual');
 const current=summary.currentSession;
 focusCard('current-session',current?{badge:'Sessão atual',title:current.session.title,subtitle:current.campaign?.name||'Sessão avulsa',meta:[fmtDate(current.session.date),sessionStatus(current.session.status)].join(' · '),href:current.href,button:'Abrir Sessão'}:{badge:'Sessão atual'},'Nenhuma Sessão atual')
}
function init(){const summary=summarizeDashboard({campaigns:readCampaigns(),adventures:readAdventures(),standaloneSessions:readStandaloneSessions(),now:new Date()});renderCampaigns(summary.campaigns);renderAdventures(summary.adventures);renderSessions(summary.sessions);renderContext(summary)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
