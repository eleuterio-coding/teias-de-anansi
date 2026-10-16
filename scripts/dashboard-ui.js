import{readCampaigns,readStandaloneSessions}from'./campaign-state.js?v=20261016-current-status2';
import{readAdventures}from'./adventure-state.js?v=20261016-current-status2';
import{summarizeDashboard}from'./dashboard-state.js?v=20261016-next1';
import{imageElementHtml,hydrateMediaImages}from'./image-media.js?v=20260925-media2';
import{playerMode,sharedCampaignRows,sharedAdventures}from'./collaboration-view.js?v=20261016-master-preview1';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const campaignStatus=s=>({planned:'Planejada',current:'Atual',active:'Em andamento',paused:'Pausada',finished:'Concluída'}[s]||s);
const adventureStatus=s=>({planned:'Planejada',current:'Atual',active:'Em andamento',paused:'Pausada',completed:'Concluída',archived:'Arquivada'}[s]||s);
const sessionStatus=s=>({planned:'Planejada',next:'Próxima',current:'Atual',active:'Em andamento',completed:'Concluída',cancelled:'Cancelada'}[s]||s);
const fmtDate=v=>{if(!v)return'Sem data';const d=String(v).slice(0,10),m=d.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(v)};

function relationChip(kind,value){return '<span class="relationship-chip '+(kind==='Campanha'?'relation-campaign':'relation-adventure')+'"><span class="relation-label">'+esc(kind)+':</span> <strong>'+esc(value||'Sem vínculo')+'</strong></span>'}
function row({href,title,detail,status,statusKey='',relations=[],media=null,legacyUrl=""}){
 const image=imageElementHtml(media,legacyUrl,{className:'dashboard-row-cover',alt:''});
 return '<a class="dash-row '+(image?'has-cover':'')+'" href="'+esc(href)+'">'+image+'<div class="dash-row-copy"><strong>'+esc(title)+'</strong><div class="mini">'+esc(detail)+'</div>'+(relations.length?'<div class="card-relations">'+relations.map(r=>relationChip(r.kind,r.value)).join('')+'</div>':'')+'</div><div class="row-meta"><span class="badge '+esc(statusKey)+'">'+esc(status)+'</span></div></a>'
}
function renderCampaigns(rows){$('campaign-dashboard-list').innerHTML=rows.length?rows.map(c=>row({href:c.href,title:c.name,detail:[c.setting||c.system,((c.sessions||[]).length)+' sessão(ões)'].filter(Boolean).join(' · '),status:campaignStatus(c.status),statusKey:c.status,media:c.coverImage,legacyUrl:c.coverImageUrl})).join(''):'<div class="empty">Nenhuma Campanha criada.</div>'}
function renderAdventures(rows){$('adventure-dashboard-list').innerHTML=rows.length?rows.map(a=>row({href:a.href,title:a.title,detail:[a.type==='oneshot'?'One-shot':a.arc].filter(Boolean).join(' · '),status:adventureStatus(a.status),statusKey:a.status,relations:[{kind:'Campanha',value:a.campaignName||'Sem Campanha'}],media:a.coverImage,legacyUrl:a.coverImageUrl})).join(''):'<div class="empty">Nenhuma Aventura criada.</div>'}
function renderSessions(rows){$('session-dashboard-list').innerHTML=rows.length?rows.map(s=>row({href:s.href,title:s.title,detail:fmtDate(s.date),status:sessionStatus(s.status),statusKey:s.status,relations:[{kind:'Campanha',value:s.campaignName||'Sem Campanha'},{kind:'Aventura',value:s.adventureName||'Sem Aventura vinculada'}],media:s.coverImage,legacyUrl:s.coverImageUrl})).join(''):'<div class="empty">Nenhuma Sessão criada.</div>'}
function focusCard(id,{badge,title,subtitle,meta,href,button='Abrir',media=null,legacyUrl=''}={},emptyTitle){
 const el=$(id);if(!el)return;
 if(!title){el.innerHTML=`<div><span class="badge">${esc(badge)}</span><h2>${esc(emptyTitle)}</h2></div>`;return}
 const image=imageElementHtml(media,legacyUrl,{className:'focus-card-cover',alt:''});el.classList.toggle('has-cover',Boolean(image));el.innerHTML=`${image}<div class="focus-card-copy"><span class="badge ${badge==='Próxima sessão'?'next':'live'}">${esc(badge)}</span><h2>${esc(title)}</h2>${subtitle?`<p>${esc(subtitle)}</p>`:''}${meta?`<p class="mini">${esc(meta)}</p>`:''}</div><a class="btn" href="${esc(href)}">${esc(button)}</a>`
}
function renderContext(summary){
 const next=summary.nextSession;
 focusCard('next-session',next?{badge:'Próxima sessão',title:next.session.title,subtitle:'Campanha: '+(next.campaign?.name||'Sem Campanha'),meta:['Aventura: '+(summary.adventures.find(a=>a.id===next.session.adventureId)?.title||'Sem Aventura vinculada'),fmtDate(next.session.date),sessionStatus(next.session.status)].join(' · '),href:next.campaign?`sessoes.html?campaign=${encodeURIComponent(next.campaign.id)}&id=${encodeURIComponent(next.session.id)}`:`sessoes.html?id=${encodeURIComponent(next.session.id)}`,button:'Abrir Sessão',media:next.session.coverImage,legacyUrl:next.session.coverImageUrl}:{badge:'Próxima sessão'},'Nenhuma próxima Sessão');
 const campaign=summary.currentCampaign;
 focusCard('current-campaign',campaign?{badge:'Campanha atual',title:campaign.name,subtitle:campaign.setting||campaign.system,meta:campaignStatus(campaign.status),href:campaign.href,button:'Abrir Campanha',media:campaign.coverImage,legacyUrl:campaign.coverImageUrl}:{badge:'Campanha atual'},'Nenhuma Campanha atual');
 const adventure=summary.currentAdventure;
 focusCard('current-adventure',adventure?{badge:'Aventura atual',title:adventure.title,subtitle:'Campanha: '+(adventure.campaignName||'Sem Campanha'),meta:adventureStatus(adventure.status),href:adventure.href,button:'Abrir Aventura',media:adventure.coverImage,legacyUrl:adventure.coverImageUrl}:{badge:'Aventura atual'},'Nenhuma Aventura atual');
 const current=summary.currentSession;
 focusCard('current-session',current?{badge:'Sessão atual',title:current.session.title,subtitle:'Campanha: '+(current.campaign?.name||'Sem Campanha'),meta:['Aventura: '+(summary.adventures.find(a=>a.id===current.session.adventureId)?.title||'Sem Aventura vinculada'),fmtDate(current.session.date),sessionStatus(current.session.status)].join(' · '),href:current.href,button:'Abrir Sessão',media:current.session.coverImage,legacyUrl:current.session.coverImageUrl}:{badge:'Sessão atual'},'Nenhuma Sessão atual')
}

const DASHBOARD_TILES=[
 {selector:'.dashboard-collections > .dashboard-card:nth-child(1)',label:'Campanhas',kind:'collections'},
 {selector:'.dashboard-collections > .dashboard-card:nth-child(2)',label:'Aventuras',kind:'collections'},
 {selector:'.dashboard-collections > .dashboard-card:nth-child(3)',label:'Sessões',kind:'collections'},
 {selector:'#current-session',label:'Sessão atual',kind:'context'},
 {selector:'#next-session',label:'Próxima sessão',kind:'context'},
 {selector:'#current-campaign',label:'Campanha atual',kind:'context'},
 {selector:'#current-adventure',label:'Aventura atual',kind:'context'}
];
const listPages=new WeakMap();
let viewportMode='',viewportPage=0,viewportFrame=0;
function setupCollectionPagers(){
 document.querySelectorAll('.dashboard-card .dashboard-list').forEach(list=>{
  if(list.nextElementSibling?.classList.contains('dashboard-list-pager'))return;
  const pager=document.createElement('nav');
  pager.className='dashboard-list-pager';
  pager.setAttribute('aria-label','Páginas de '+(list.closest('.dashboard-card')?.querySelector('h2')?.textContent||'cards'));
  pager.innerHTML='<button type="button" data-list-prev aria-label="Itens anteriores">‹</button><span aria-live="polite"></span><button type="button" data-list-next aria-label="Próximos itens">›</button>';
  pager.hidden=true;list.after(pager);
  const state={page:0,capacity:1};listPages.set(list,state);
  pager.querySelector('[data-list-prev]').addEventListener('click',()=>{state.page=Math.max(0,state.page-1);updateCollectionPager(list)});
  pager.querySelector('[data-list-next]').addEventListener('click',()=>{state.page++;updateCollectionPager(list)});
 });
}
function updateCollectionPager(list){
 const pager=list.nextElementSibling,rows=[...list.querySelectorAll('.dash-row')],state=listPages.get(list);
 if(!pager||!state)return;
 if(!rows.length){pager.hidden=true;return}
 // Inactive dashboard pages are not measurable. Recompute on activation.
 if(list.closest('[hidden]'))return;
 rows.forEach(item=>{item.hidden=false});
 // Reserve the controls before measuring available card height.
 pager.hidden=rows.length<2;
 const gap=parseFloat(getComputedStyle(list).gap)||7;
 const rowHeight=Math.max(60,...rows.map(item=>item.getBoundingClientRect().height));
 const capacity=Math.max(1,Math.floor((list.clientHeight+gap)/(rowHeight+gap)));
 state.capacity=capacity;
 if(rows.length<=capacity){
  state.page=0;pager.hidden=true;return;
 }
 pager.hidden=false;
 const total=Math.ceil(rows.length/capacity);
 state.page=Math.max(0,Math.min(total-1,state.page));
 const start=state.page*capacity;
 rows.forEach((item,index)=>{item.hidden=index<start||index>=start+capacity});
 pager.querySelector('[data-list-prev]').disabled=state.page===0;
 pager.querySelector('[data-list-next]').disabled=state.page===total-1;
 pager.querySelector('[aria-live]').textContent=(state.page+1)+' / '+total;
}
function dashboardPagesFor(mode){
 if(mode==='full')return[{label:'Painel Geral',indexes:[0,1,2,3,4,5,6]}];
 if(mode==='group')return[
  {label:'Campanhas, Aventuras e Sessões',indexes:[0,1,2]},
  {label:'Contexto atual',indexes:[3,4,5,6]}
 ];
 return DASHBOARD_TILES.map((tile,index)=>({label:tile.label,indexes:[index]}));
}
function updateDashboardViewport(){
 const content=document.querySelector('.hub-app-content');
 const width=content?.clientWidth||window.innerWidth,height=window.innerHeight;
 // The full seven-card view is only used when both axes allow legible cards.
 const mode=width>=1000&&height>=720?'full':width>=680&&height>=550?'group':'single';
 if(mode!==viewportMode){viewportMode=mode;viewportPage=0}
 document.body.dataset.dashboardMode=mode;
 const pages=dashboardPagesFor(mode);
 viewportPage=Math.min(viewportPage,pages.length-1);
 const active=new Set(pages[viewportPage].indexes);
 const collections=document.querySelector('.dashboard-collections'),context=document.querySelector('.dashboard-context');
 collections.hidden=![0,1,2].some(index=>active.has(index));
 context.hidden=![3,4,5,6].some(index=>active.has(index));
 DASHBOARD_TILES.forEach((tile,index)=>{
  const el=document.querySelector(tile.selector);if(el)el.hidden=!active.has(index)
 });
 document.querySelectorAll('.dashboard-context-column').forEach(column=>{
  column.hidden=![...column.querySelectorAll('.focus-card')].some(card=>!card.hidden)
 });
 const pager=$('dashboard-pagination');
 pager.hidden=pages.length===1;
 $('dashboard-page-status').textContent='Página '+(viewportPage+1)+' de '+pages.length+' · '+pages[viewportPage].label;
 pager.querySelector('[data-dashboard-previous]').disabled=viewportPage===0;
 pager.querySelector('[data-dashboard-next]').disabled=viewportPage===pages.length-1;
 document.querySelectorAll('.dashboard-list').forEach(updateCollectionPager);
}
function scheduleDashboardViewport(){
 if(viewportFrame)cancelAnimationFrame(viewportFrame);
 viewportFrame=requestAnimationFrame(()=>{viewportFrame=0;updateDashboardViewport()});
}
function initDashboardViewport(){
 setupCollectionPagers();
 $('dashboard-pagination').querySelector('[data-dashboard-previous]').addEventListener('click',()=>{
  viewportPage=Math.max(0,viewportPage-1);scheduleDashboardViewport()
 });
 $('dashboard-pagination').querySelector('[data-dashboard-next]').addEventListener('click',()=>{
  viewportPage++;scheduleDashboardViewport()
 });
 window.addEventListener('resize',scheduleDashboardViewport,{passive:true});
 document.fonts?.ready?.then(scheduleDashboardViewport);
 scheduleDashboardViewport();
}

const isE2EFixtureCampaign=c=>c?.id==='e2e-explicit-player-access';
function init(){const restricted=playerMode(),campaigns=(restricted?sharedCampaignRows().map(row=>row.campaign):readCampaigns()).filter(c=>!isE2EFixtureCampaign(c)),adventures=(restricted?sharedAdventures():readAdventures()).filter(a=>a?.campaignId!=='e2e-explicit-player-access'),standaloneSessions=(restricted?[]:readStandaloneSessions()).filter(s=>s?.campaignId!=='e2e-explicit-player-access'),summary=summarizeDashboard({campaigns,adventures,standaloneSessions,now:new Date()});renderCampaigns(summary.campaigns);renderAdventures(summary.adventures);renderSessions(summary.sessions);renderContext(summary);initDashboardViewport();hydrateMediaImages(document).then(scheduleDashboardViewport).catch(()=>{})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
