const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusLabels={planned:'Planejada',next:'Próxima',current:'Atual',active:'Em andamento'};
const statusPriority={active:0,current:1,next:2,planned:3};
export function findNextCampaignSession(campaign){
 const sessions=Array.isArray(campaign?.sessions)?campaign.sessions:[];
 return sessions.filter(s=>s&&!['completed','cancelled'].includes(s.status)).sort((a,b)=>{
  const pa=statusPriority[a.status]??4,pb=statusPriority[b.status]??4;
  if(pa!==pb)return pa-pb;
  const da=/^\d{4}-\d{2}-\d{2}$/.test(a.date||'')?a.date:'9999-12-31';
  const db=/^\d{4}-\d{2}-\d{2}$/.test(b.date||'')?b.date:'9999-12-31';
  return da.localeCompare(db)||(Number(a.number)||0)-(Number(b.number)||0)
 })[0]||null
}
/** Última sessão concluída, anterior à sessão atual/próxima.
 * Não apresenta sessões planejadas como se já tivessem ocorrido. */
export function findPreviousCampaignSession(campaign){
 const sessions=Array.isArray(campaign?.sessions)?campaign.sessions:[];
 const featured=findNextCampaignSession(campaign);
 const completed=sessions.filter(session=>session?.status==='completed'&&(!featured||Number(session.number)<Number(featured.number)));
 return completed.sort((a,b)=>Number(b.number)-Number(a.number)||String(b.date||'').localeCompare(String(a.date||'')))[0]||null;
}
export function readableSessionDate(raw){
 const matched=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(raw||''));
 if(!matched)return'';
 const y=Number(matched[1]),m=Number(matched[2]),d=Number(matched[3]);
 const date=new Date(y,m-1,d);
 if(date.getFullYear()!==y||date.getMonth()!==m-1||date.getDate()!==d)return'';
 return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'long',year:'numeric'}).format(date)
}
// A capa da sessão é decorativa e usa o mesmo contrato de mídia do Hub.
 // IDs privados são hidratados por hydrateMediaImages após o render.
function nextSessionBackdrop(session){
 const mediaId=String(session?.coverImage?.id||'').trim();
 const fallback=String(session?.coverImageUrl||'').trim();
 if(mediaId)return `<img class="campaign-next-backdrop" data-hub-media-id="${escapeHtml(mediaId)}"${fallback?` data-fallback-src="${escapeHtml(fallback)}"`:''} alt="" aria-hidden="true">`;
 if(fallback)return `<img class="campaign-next-backdrop" src="${escapeHtml(fallback)}" alt="" aria-hidden="true">`;
 return'';
}
export function renderNextCampaignSession(campaign,{canPlan=false}={}){
 const next=findNextCampaignSession(campaign),id=encodeURIComponent(campaign?.id||''),base='sessoes.html?campaign='+id;
 if(!next)return`<section id="proxima-sessao" class="card campaign-next-highlight" aria-labelledby="proxima-sessao-titulo">
  <div class="campaign-next-content"><span class="campaign-next-kicker">PLANEJAMENTO DA MESA</span><h2 id="proxima-sessao-titulo">Próxima sessão</h2>
  <p class="campaign-next-empty">Nenhuma próxima sessão definida.</p></div><a class="btn campaign-next-action" href="${base}">${canPlan?'Planejar sessão':'Ver sessões'}</a>
 </section>`;
 const date=readableSessionDate(next.date),backdrop=nextSessionBackdrop(next);
 return`<section id="proxima-sessao" class="card campaign-next-highlight" aria-labelledby="proxima-sessao-titulo"${backdrop?' data-has-session-cover="true"':''}>
  ${backdrop}<div class="campaign-next-content"><span class="campaign-next-kicker">PLANEJAMENTO DA MESA</span><h2 id="proxima-sessao-titulo">Próxima sessão</h2>
  <p class="campaign-next-name">Sessão ${Number(next.number)||1} · ${escapeHtml(next.title||'Sem título')}</p>
  <div class="campaign-next-meta"><span class="campaign-next-status">${escapeHtml(statusLabels[next.status]||'Planejada')}</span>${date?`<span class="campaign-next-date"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg><time datetime="${escapeHtml(next.date)}">${escapeHtml(date)}</time></span>`:''}</div>
  </div><a class="btn campaign-next-action" href="${base}&id=${encodeURIComponent(next.id||'')}"><span class="campaign-next-action-copy"><span class="campaign-next-action-kicker">ACESSAR</span><strong>Abrir sessão</strong></span><span class="campaign-next-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a>
 </section>`
}
