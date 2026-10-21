import{imageElementHtml}from'./image-media.js?v=20261019-disclosure1';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusLabel=status=>({current:'Atual',active:'Em andamento',completed:'Concluída'}[status]||status||'');
/** Mesmo card visual, capa, selo e botão Abrir para Mestre e Jogadores. */
export function renderCampaignAdventureCard(adventure,campaignId){
 const name=String(adventure?.title||'Aventura'),status=String(adventure?.status||'');
 const href=`aventuras.html?campaign=${encodeURIComponent(campaignId)}&id=${encodeURIComponent(adventure.id)}`;
 const image=imageElementHtml(adventure.coverImage,adventure.coverImageUrl,{className:'campaign-player-story-image',alt:`Capa de ${name}`});
 const summary=String(adventure?.summary||adventure?.description||'').trim();
 const date=String(adventure?.date||'').trim();
 const badge=status?`<span class="campaign-player-story-status status-${esc(status)}">${esc(statusLabel(status))}</span>`:'';
 return `<a class="campaign-player-story-card campaign-adventure-featured-card" href="${href}" aria-label="Abrir aventura ${esc(name)}">
 ${image}<span class="campaign-player-story-content"><span class="campaign-player-story-information"><h3>${esc(name)}</h3>${badge}${date?`<span class="campaign-player-story-date">${esc(date)}</span>`:''}${summary?`<p>${esc(summary)}</p>`:''}</span>
 <span class="campaign-player-story-open">Abrir <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 5h6v6M19 5l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg></span></span></a>`;
}
