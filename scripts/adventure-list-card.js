import{numberedAdventureTitle}from'./narrative-labels.js';
import{imageElementHtml}from'./image-media.js?v=20260925-media2';
import{cardMetricIcon,cardOpenArrow,cardDeleteIcon}from'./campaign-card-icons.js?v=20261023-panoramic1';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const arr=value=>Array.isArray(value)?value:[];
const amount=(count,singular,plural)=>`${count} ${count===1?singular:plural}`;
export const ADVENTURE_STATUSES=['active','paused','completed','archived','planned'];
const labels={active:'Em andamento',paused:'Pausada',completed:'Concluída',archived:'Arquivada',planned:'Planejada'};
const types={main:'Aventura principal',side:'Aventura secundária',oneshot:'One-shot',secondary:'Arco secundário'};

export function adventureListCard(adventure,{parentName='',readOnly=false,sessions=[]}={}){
 const a=adventure;
 const name=String(a.title||'Aventura'),heading=numberedAdventureTitle(a);
 const status=ADVENTURE_STATUSES.includes(a.status)?a.status:'planned';
 const href=`aventuras.html?campaign=${encodeURIComponent(a.campaignId)}&id=${encodeURIComponent(a.id)}`;
 const sessionCount=(Array.isArray(sessions)?sessions:[]).filter(s=>String(s?.adventureId||'')===String(a.id)).length;
 const cover=imageElementHtml(a.coverImage,a.coverImageUrl,{className:'campaign-card-cover',alt:''});
 const description=a.description||a.summary||a.pitch||'';
 const statusControl=readOnly
  ?`<span class="campaign-status-value" aria-label="Status da aventura: ${esc(labels[status])}">${esc(labels[status])}</span>`
  :`<details class="campaign-status-disclosure" data-status-disclosure="${esc(a.id)}">
     <summary class="campaign-status-trigger" data-adventure-status-trigger="${esc(a.id)}" aria-label="Alterar status da aventura ${esc(name)}: ${esc(labels[status])}">
      <span>${esc(labels[status])}</span><span class="campaign-status-chevron" aria-hidden="true"></span>
     </summary>
     <div class="campaign-status-menu" role="group" aria-label="Escolher status da aventura ${esc(name)}">
      ${ADVENTURE_STATUSES.map(value=>`<button type="button" class="campaign-status-option status-${value}" data-adventure-status-id="${esc(a.id)}" data-next-adventure-status="${value}" aria-pressed="${status===value}">${esc(labels[value])}</button>`).join('')}
     </div>
    </details>`;
 return `<article class="campaign-card campaign-card-featured" data-adventure-card="${esc(a.id)}">
  <a class="campaign-card-stretched-link" href="${href}" aria-label="Abrir ${esc(heading)}"></a>
  <div class="campaign-card-status status-${esc(status)}">${statusControl}</div>
  <div class="campaign-card-main">
   <div class="campaign-card-art">${cover||'<div class="campaign-card-cover-placeholder" aria-hidden="true"><span class="campaign-cover-crest">✦</span><span class="campaign-cover-caption">Teias de Anansi</span></div>'}</div>
   <div class="campaign-card-details">
    <div class="campaign-card-intro">
     <h2>${esc(heading)}</h2>
     ${description?`<p class="campaign-card-description">${esc(description)}</p>`:''}
     <div class="mini hub-ancestry adventure-card-campaign" role="group" aria-label="Campanha vinculada"><span class="hub-parent-link hub-ancestry-campaign"><span>Campanha</span>${parentName?`<strong>${esc(parentName)}</strong>`:'<strong>Campanha não encontrada</strong>'}</span></div>
    </div>
    <div class="campaign-card-metrics campaign-card-metrics-single" role="group" aria-label="Sessões da aventura">
     <div class="campaign-card-stat">${cardMetricIcon("scenes")}<span class="campaign-card-stat-copy"><strong>${sessionCount}</strong><span>${sessionCount===1?'Sessão':'Sessões'}</span></span></div>
    </div>
   </div>
  </div>
  <div class="row-actions campaign-card-actions">
   <a class="btn" href="${href}">Abrir ${cardOpenArrow}</a>
   ${readOnly?'':`<button type="button" class="danger" data-delete-adventure="${esc(a.id)}">${cardDeleteIcon} Excluir</button>`}
  </div>
 </article>`;
}
export function adventureCreateTile(open){
 return `<a class="campaign-card campaign-create-tile" href="aventuras.html?new=1" id="open-adventure-create" aria-label="Nova aventura" aria-controls="adventure-create-card" aria-expanded="${Boolean(open)}"><span class="campaign-create-plus" aria-hidden="true">+</span><span class="campaign-create-tile-label">Nova aventura</span></a>`;
}
