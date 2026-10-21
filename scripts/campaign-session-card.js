import{imageElementHtml}from'./image-media.js?v=20261019-disclosure1';
import{numberedSessionTitle}from'./narrative-labels.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={planned:'Planejada',next:'Próxima',current:'Atual',active:'Em andamento',completed:'Concluída',cancelled:'Cancelada'};
/** Card de sessão compartilhado entre o mestre e o jogador. */
export function renderCampaignSessionCard(session,campaignId,{featured=false}={}){
 const title=numberedSessionTitle(session),href=`sessoes.html?campaign=${encodeURIComponent(campaignId)}&id=${encodeURIComponent(session.id)}`;
 const picture=imageElementHtml(session.coverImage,session.coverImageUrl,{className:'campaign-player-story-image',alt:`Capa de ${title}`});
 const status=labels[session.status]||session.status||'',summary=String(session.summary||session.objective||'').trim(),date=String(session.date||'').trim();
 const badge=status?`<span class="campaign-player-story-status status-${esc(session.status||'planned')}">${esc(status)}</span>`:'';
 return `<a class="campaign-player-story-card${featured?' campaign-player-story-card-featured':''}" href="${href}" aria-label="Abrir ${esc(title)}">
 ${picture}<span class="campaign-player-story-content"><span class="campaign-player-story-information"><h3>${esc(title)}</h3>${date?`<span class="campaign-player-story-date">${esc(date)}</span>`:''}${summary?`<p>${esc(summary)}</p>`:''}</span>
 <span class="campaign-player-story-footer">${badge}<span class="campaign-player-story-open">Abrir <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 5h6v6M19 5l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg></span></span></span></a>`;
}
