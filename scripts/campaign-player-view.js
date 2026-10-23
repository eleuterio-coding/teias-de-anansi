import{noteSection}from'./hub-notes.js?v=20261022-chronicles-final3';
import{renderCampaignOverview,renderCampaignSettings,renderCampaignAdventuresSection,renderCampaignSessionsSection}from'./campaign-shared-layout.js?v=20261023-summary-covers4';
import{renderTimeline}from'./campaign-structured-ui.js?v=20261023-linked-timeline1';
import{renderNextCampaignSession,findCurrentCampaignSession}from'./campaign-next-session-ui.js?v=20261022-chronicles-final3';
import{rememberAvatars,playerTerm,playerAvatarHtml,characterAvatarHtml}from'./profile-images.js?v=20261021-user1';
import{campaignAvatarHtml,bindCampaignAvatarPreviews}from'./campaign-avatar-preview.js?v=20261021-roster-zoom1';
import{hydrateMediaImages}from'./image-media.js?v=20261019-disclosure1';
import{canOpenCharacter}from'./collaboration-view.js?v=20261021-ficha-permissao3';
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const arr=value=>Array.isArray(value)?value:[];
const sheetHref=id=>`ficha-personagem.html?v=20261021-fichas-auth3&id=${encodeURIComponent(id)}`;
/** A mesma árvore de cards e grid do Mestre, omitindo somente ferramentas que exigem permissão de escrita. */
function playerRoster(c,characters,profiles=[],username=''){
 const byId=new Map(arr(characters).map(character=>[String(character.id),character]));
 const rows=arr(c.members).filter(member=>member?.active!==false&&member?.role!=='dm');
 const entries=rows.map(member=>{
  const name=member.name||member.username||'Jogador',profile=profiles.find(p=>p.username===member.username),display=profile?.displayName||name,character=byId.get(String(member.characterId||'')),characterId=member.characterId;
  const person=character?.name||'Personagem atribuído',permitted=Boolean(characterId&&canOpenCharacter(characterId));
  const own=String(member.username||'').toLowerCase()===String(username||'').toLowerCase(),profileUrl=`usuario.html?campaign=${encodeURIComponent(c.id)}`;
  const profileLink=own?`<a class="roster-player-profile-link" href="${profileUrl}" title="Abrir meu perfil" aria-label="Abrir meu perfil">↗</a>`:'';
  const characterLabel=characterId?esc(person):'— Sem personagem —';
  const characterLink=permitted
   ?`<a class="roster-player-profile-link" href="${sheetHref(characterId)}" title="Abrir ficha de ${esc(person)}" aria-label="Abrir ficha de ${esc(person)}">↗</a>`
   :'';
  return `<article class="member-row roster-player campaign-roster-readonly">
  <div class="roster-player-identity">${campaignAvatarHtml(playerAvatarHtml(member.username||name,profiles),display)}
   <div class="roster-player-display"><span class="roster-player-label">${esc(playerTerm(member.username||name))}</span>
   <div class="roster-player-name-line"><span class="roster-player-name">${esc(display)}</span>${profileLink}</div></div></div>
  <div class="roster-player-character">
   <div class="roster-character-photo">${campaignAvatarHtml(characterAvatarHtml(character),character?.name||'personagem')}</div>
   <div class="roster-player-display roster-character-display"><span class="roster-player-label">Personagem</span>
    <div class="roster-player-name-line"><span class="roster-player-name">${characterLabel}</span>${characterLink}</div></div>
  </div>
  </article>`;
 }).join('');
 return `<section id="jogadores" class="card roster-section"><div class="roster-heading"><h2>Jogadores da Campanha</h2></div>
 <div id="member-list" class="list roster-list">${entries||'<div class="empty">Nenhum jogador adicionado.</div>'}</div></section>`;
}
function readonlyText(id,title,value){
 return `<section id="${id}" class="card campaign-editor-card"><h2>${title}</h2>
 <textarea class="campaign-large-text" aria-label="${title}" readonly>${esc(value||'')}</textarea></section>`;
}
function navigation(c){
 const links=[['proxima-sessao',findCurrentCampaignSession(c)?'Sessão Atual':'Próxima Sessão'],['campanha','Campanha'],['jogadores','Jogadores'],['aventuras','Aventuras'],['sessoes','Sessões'],['historia','História'],['linha-tempo','Linha do tempo']];
 if(c.sharedNotes)links.push(['notas-compartilhadas','Notas compartilhadas']);
 return `<nav class="section-nav">${links.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}</nav>`;
}
function bindReadOnly(root,c,adventures=[]){
 root.onclick=event=>{
  const view=event.target.closest('[data-timeline-view]');
  if(view){
   const mode=view.dataset.timelineView==='flowchart'?'flowchart':'list',old=root.querySelector('#linha-tempo'),temp=document.createElement('template');
   temp.innerHTML=renderTimeline(c,mode,null,{readOnly:true,adventures});old?.replaceWith(temp.content.firstElementChild);
   return;
  }
  const location=event.target.closest('[data-player-location-preview]');
  if(location){
   const item=arr(c.importantLocationEntries).find(x=>x.id===location.dataset.playerLocationPreview);
   if(!item?.image?.id)return;
   const dialog=document.createElement('dialog');dialog.className='campaign-location-lightbox';
   dialog.innerHTML=`<div class="campaign-location-lightbox-head"><strong>${esc(item.name)}</strong><button type="button" class="secondary" data-close-image>Fechar</button></div><img data-hub-media-id="${esc(item.image.id)}" class="campaign-player-image-large" alt="Imagem de ${esc(item.name)}">`;
   document.body.appendChild(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});
   dialog.querySelector('[data-close-image]')?.addEventListener('click',()=>dialog.close());
   dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
   dialog.showModal();void hydrateMediaImages(dialog).catch(()=>{});
   return;
  }
  const diagram=event.target.closest('[data-diagram-toggle]');
  if(diagram&&!event.target.closest('button,a,input')){
   diagram.querySelector('[data-timeline-toggle]')?.click();return
  }
  const toggle=event.target.closest('[data-timeline-toggle]');
  if(!toggle)return;
  const container=toggle.closest('.timeline-item,.hub-diagram-node-group');
  const children=container?.querySelector(':scope > .timeline-children, :scope > .hub-diagram-children');
  if(!children)return;
  children.hidden=!children.hidden;
  toggle.setAttribute('aria-expanded',String(!children.hidden));
  const count=Number(toggle.dataset.timelineCount)||children.children.length;
  toggle.textContent=`${children.hidden?'Mostrar':'Ocultar'} ${count} ${count===1?'subitem':'subitens'}`;
 };
 root.onkeydown=event=>{
  if(!['Enter',' '].includes(event.key))return;
  const node=event.target.closest('[data-diagram-toggle]');
  if(!node)return;
  const button=node.querySelector('[data-timeline-toggle]');
  if(button){event.preventDefault();button.click()}
 };
}
/** Usa os dados já filtrados pelo servidor para esta conta; não consulta originais privados. */
export function renderPlayerCampaign(row){
 const root=document.getElementById('table-root');if(!root||!row?.campaign)return;
 const c=row.campaign,profiles=arr(row.participants),adventures=arr(row.adventures),characters=arr(row.characters);
 rememberAvatars(profiles);
 document.title=`${c.name} - Campanha - Teias de Anansi`;
 root.dataset.campaignAccess='player';
 root.innerHTML=`${renderCampaignOverview(c,adventures,{readOnly:true})}
 ${renderNextCampaignSession(c,{canPlan:false,adventures})}${navigation(c)}
 <div id="table-feedback" class="status" hidden></div>
 <div class="campaign-sections campaign-editor-grid">
 ${renderCampaignSettings(c,{readOnly:true})}
 ${playerRoster(c,characters,profiles,row.membership?.username||'')}
 ${renderCampaignAdventuresSection(c.id,adventures,{readOnly:true})}
 ${renderCampaignSessionsSection(c,adventures,{readOnly:true})}
 ${renderTimeline(c,'list',null,{readOnly:true,adventures})}
 ${c.sharedNotes?readonlyText('notas-compartilhadas','Notas compartilhadas',c.sharedNotes):''}
 ${c.dmNoteEntries?.length?noteSection(c.dmNoteEntries,{readOnly:true}):''}
 </div>`;
 bindReadOnly(root,c,adventures);
 bindCampaignAvatarPreviews(root);
 void hydrateMediaImages(root).catch(()=>{});
}
