import{imageElementHtml}from'./image-media.js?v=20261019-disclosure1';
import{numberedSessionTitle}from'./narrative-labels.js';
import{findPreviousCampaignSession,findUpcomingCampaignSession}from'./campaign-next-session-ui.js?v=20261022-chronicles-final3';
import{featuredCampaignAdventures,recentCampaignSessions}from'./campaign-recent-items.js?v=20261021-adventure-featured2';
import{renderCampaignAdventureCard}from'./campaign-adventure-card.js?v=20261021-shared-order1';
import{renderCampaignSessionCard}from'./campaign-session-card.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const count=(number,singular,plural)=>`${number} ${number===1?singular:plural}`;
export const campaignStatusLabel=status=>({planned:'Planejada',current:'Atual',active:'Em andamento',paused:'Pausada',finished:'Concluída',cancelled:'Cancelada'}[status]||status||'');
const metric=(label,value,href='')=>{const inner=`<span>${esc(label)}</span><strong>${esc(value)}</strong>`;return href?`<a class="metric campaign-summary-link" href="${esc(href)}" aria-label="${esc(label)}: ${esc(value)}">${inner}</a>`:`<div class="metric">${inner}</div>`};
/** A mesma árvore de elementos do cabeçalho para Mestre e Jogador. As ações de criação são exclusivas do Mestre. */
export function renderCampaignOverview(campaign,adventures=[],{readOnly=false}={}){
 const cid=encodeURIComponent(campaign.id),previous=findPreviousCampaignSession(campaign),upcoming=findUpcomingCampaignSession(campaign);
 const href=entry=>entry?`sessoes.html?campaign=${cid}&id=${encodeURIComponent(entry.id)}`:'';
 const cover=imageElementHtml(campaign.coverImage,campaign.coverImageUrl,{className:'campaign-product-hero-media',alt:''});
 const links=readOnly
  ?`<div class="campaign-product-actions"><a class="btn campaign-product-create-action" href="aventuras.html?campaign=${cid}">Abrir Aventuras</a><a class="btn campaign-product-create-action" href="sessoes.html?campaign=${cid}">Abrir Sessões</a></div>`
  :`<div class="campaign-product-actions"><a class="btn campaign-product-create-action" href="aventuras.html?campaign=${cid}&new=1#adventure-create-card">Nova Aventura</a><a class="btn campaign-product-create-action" href="sessoes.html?campaign=${cid}&new=1#session-create-card">Nova Sessão</a></div>`;
 const linked=(campaign.members||[]).filter(m=>m.characterId).length;
 return `<section class="campaign-product-hero">${cover}${links}<div class="campaign-product-hero-content">
 <div class="campaign-product-kicker">Contexto da Campanha · ${esc(campaign.system||'D&D 5.5e')}</div>
 <div class="campaign-product-title-row"><h1>${esc(campaign.name)}</h1><span class="badge ${esc(campaign.status)}">${esc(campaignStatusLabel(campaign.status))}</span></div>
 <p class="campaign-product-description">${esc(campaign.historySummary||campaign.description||'Organize aventuras, sessões, personagens e o mundo desta campanha.')}</p>
 <div class="campaign-product-meta"><span class="badge">${esc(campaign.setting||campaign.system||'D&D 5.5e')}</span><span class="badge">${count((campaign.members||[]).length,'jogador','jogadores')}</span><span class="badge">${count(adventures.length,'aventura','aventuras')}</span></div>
 </div></section><div class="campaign-product-summary">${metric('Status',campaignStatusLabel(campaign.status))}${metric('Sessões',(campaign.sessions||[]).length,'#sessoes')}${metric('Personagens',linked,'#jogadores')}${metric('Sessão Anterior',previous?numberedSessionTitle(previous):'Nenhuma sessão anterior',href(previous))}${metric('Próxima Sessão',upcoming?numberedSessionTitle(upcoming):'Nenhuma próxima sessão',href(upcoming))}</div>`;
}
/** Mesma geometria de labels, linhas e capa. Jogador recebe campos somente de leitura, nunca data-campaign-field. */
export function renderCampaignSettings(c,{readOnly=false,imagePickerHtml=null}={}){
 const input=(name,value,{wide=false,maxlength=160}={})=>`<label class="${wide?'wide':''}">${name}<input ${readOnly?'readonly':''} ${readOnly?'':'data-campaign-field="'+({ 'Nome da campanha':'name','Cenário de Campanha':'setting','Mundo / Plano':'worldPlane','Principal Continente / Região':'mainRegion'}[name]||'')+'"'} maxlength="${maxlength}" value="${esc(value||'')}"></label>`;
 // Preserva o campo antigo para registros legados, mas prioriza o resumo histórico.
 const description=`<label id="historia" class="wide campaign-history-summary">Resumo da Campanha<textarea maxlength="4000" ${readOnly?'readonly':'data-campaign-field="historySummary"'}>${esc(c.historySummary||c.description||'')}</textarea></label>`;
 const cover=readOnly?`<div class="image-picker campaign-readonly-picker"><div class="image-picker-preview">${imageElementHtml(c.coverImage,c.coverImageUrl,{className:'campaign-cover-image',alt:`Capa de ${c.name}`})||'<span class="mini">Sem imagem</span>'}</div></div>`:imagePickerHtml?.({media:c.coverImage,legacyUrl:c.coverImageUrl,alt:`Capa de ${c.name}`,className:'campaign-cover-image'})||'';
 const status=readOnly?`<input value="${esc(campaignStatusLabel(c.status))}" aria-label="Status" readonly>`:`<select data-campaign-field="status">${[['planned','Planejada'],['active','Em andamento'],['paused','Pausada'],['finished','Concluída'],['cancelled','Cancelada']].map(([value,label])=>`<option value="${value}" ${c.status===value?'selected':''}>${label}</option>`).join('')}</select>`;
 return `<section id="campanha" class="card campaign-editor-card">
  <h2>Visão geral</h2><div class="campaign-settings-layout"><div class="campaign-settings-primary">
  ${input('Nome da campanha',c.name)}<div class="campaign-settings-cover"><strong>Imagem/capa</strong>${cover}</div>
  </div><div class="campaign-settings-details form-grid two">
  ${description}${input('Cenário de Campanha',c.setting,{wide:true})}
  ${input('Mundo / Plano',c.worldPlane)}
  ${input('Principal Continente / Região',c.mainRegion)}
  <div class="campaign-settings-status-row wide"><label>Status${status}</label>
  ${readOnly?'':'<div class="row-actions campaign-settings-save"><button type="button" data-save-campaign-section>Salvar</button></div>'}
  </div></div></div></section>`;
}
const section=(id,title,action,content,extra='')=>`<section id="${id}" class="card campaign-editor-card campaign-reference-section ${extra}"><div class="top campaign-reference-head"><h2>${title}</h2>${action}</div>${content}</section>`;
/** Card, cabeçalho, espaçamento e classe de grid idênticos para as duas contas. */
export function renderCampaignAdventuresSection(campaignId,allAdventures=[],{readOnly=false}={}){
 const adventures=featuredCampaignAdventures(allAdventures);
 const cid=encodeURIComponent(campaignId),listHref=`aventuras.html?campaign=${cid}`;
 const action=readOnly?`<a class="btn secondary campaign-reference-header-action" href="${listHref}">Abrir Aventuras</a>`:`<a class="btn secondary campaign-reference-header-action" href="${listHref}&new=1#adventure-create-card">Planejar Aventura</a>`;
 const content=`<div class="list campaign-player-story-grid campaign-adventures-feature-grid">${adventures.length?adventures.map(a=>renderCampaignAdventureCard(a,campaignId)).join(''):'<div class="empty">Nenhuma aventura em andamento ou concluída nesta Campanha.</div>'}</div>`;
 return section('aventuras',`<a class="campaign-reference-title-link" href="${listHref}">Aventuras da Campanha</a>`,action,content);
}
export function renderCampaignSessionsSection(campaign,allAdventures=[],{readOnly=false}={}){
 const running=allAdventures.filter(a=>['active','current'].includes(a.status));
 const sessions=recentCampaignSessions(campaign.sessions||[],{limit:5,activeAdventureIds:new Set(running.map(a=>a.id))});
 const cid=encodeURIComponent(campaign.id),action=readOnly?`<a class="btn secondary campaign-reference-header-action" href="sessoes.html?campaign=${cid}">Abrir Sessões</a>`:`<a class="btn secondary campaign-reference-header-action" href="sessoes.html?campaign=${cid}&new=1#session-create-card">Planejar Sessão</a>`;
 const cards=sessions.length?sessions.map((s,i)=>renderCampaignSessionCard(s,campaign.id,{featured:i===0&&s.status==='current'})).join(''):'<div class="empty">Nenhuma sessão próxima ou concluída vinculada a uma Aventura em andamento.</div>';
 return section('sessoes',`<a class="campaign-reference-title-link" href="sessoes.html?campaign=${cid}">Sessões da Campanha</a>`,action,`<div class="campaign-player-story-grid campaign-player-sessions-grid">${cards}</div>`);
}
