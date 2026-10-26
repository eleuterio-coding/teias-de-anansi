import{renderCampaignSessionCard}from'./campaign-session-card.js';
import{renderNextCampaignSession}from'./campaign-next-session-ui.js?v=20261022-chronicles-final3';
import{renderAdventureTimelineDiagram,deriveAdventureTimelineEvents}from'./timeline-flowchart.js?v=20261023-adventure-library7';
import{noteSection}from'./hub-notes.js?v=20261022-chronicles-final3';
import{updateAppShellContext}from'./app-shell.js?v=20261022-chronicles-final3';
import{numberedAdventureTitle,numberedSessionTitle}from'./narrative-labels.js';
import{playerMode,sharedCampaignRows,sharedAdventures}from'./collaboration-view.js?v=20261016-master-preview1';
import{imageElementHtml,hydrateMediaImages}from'./image-media.js?v=20260925-media2';
import{adventureListCard}from'./adventure-list-card.js?v=20261023-status-context12';
import{rememberAvatars,playerAvatarHtml,characterAvatarHtml}from'./profile-images.js?v=20261021-user1';
import{campaignAvatarHtml,bindCampaignAvatarPreviews}from'./campaign-avatar-preview.js?v=20261021-roster-zoom1';
import{adventureFiltersHtml,adventureGroupsHtml,bindAdventureGroupScroll}from'./adventure-list-groups.js?v=20261023-status-context12';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=v=>String(v??'').trim(),arr=v=>Array.isArray(v)?v:[];
const params=new URLSearchParams(location.search),requestedCampaign=params.get('campaign')||'',requestedAdventure=params.get('id')||'';
let listCampaignFilter=requestedCampaign||'all',listStatusFilter='all';
const advStatus=s=>({planned:'Planejada',active:'Em andamento',paused:'Pausada',completed:'Concluída',archived:'Arquivada'}[s]||s),missionStatus=s=>({active:'Ativa',completed:'Concluída',failed:'Falhou',abandoned:'Abandonada'}[s]||s),clueStatus=s=>({discovered:'Descoberta',resolved:'Resolvida'}[s]||s);
function simpleSection(title,rows,render){return`<section class="card"><h3>${esc(title)}</h3><div class="story-list">${rows.length?rows.map(render).join(''):'<div class="story-empty">Nenhum registro.</div>'}</div></section>`}
function readOnly(){
 const rows=sharedCampaignRows(),campaignId=requestedCampaign||rows[0]?.campaign.id||'',campaignRow=rows.find(r=>r.campaign.id===campaignId),adventures=sharedAdventures().filter(a=>a.campaignId===campaignId),active=adventures.find(a=>a.id===requestedAdventure)||adventures[0]||null,root=document.getElementById('adventure-root');
 if(!requestedAdventure){
  const choices=rows.map(r=>r.campaign),allowedIds=new Set(choices.map(c=>c.id));
  const accessible=sharedAdventures().filter(a=>allowedIds.has(a.campaignId));
  root.innerHTML=`<div class="top hub-collection-top"><header><h1>Aventuras</h1></header></div>
   <section class="hub-collection-section adventure-list-section">
    <div class="top campaign-list-heading"><h2>Lista de Aventuras</h2></div>
    ${adventureFiltersHtml(choices,{campaign:listCampaignFilter,status:listStatusFilter})}
    <div id="adventure-list"><div class="adventure-campaign-groups">
     ${adventureGroupsHtml(accessible,choices,{campaign:listCampaignFilter,status:listStatusFilter,readOnly:true})}
    </div></div>
   </section>`;
  root.querySelector('#adventure-status-filter')?.addEventListener('change',event=>{listStatusFilter=event.target.value;readOnly()});
  root.querySelector('#adventure-campaign-filter')?.addEventListener('change',event=>{listCampaignFilter=event.target.value;readOnly()});
  bindAdventureGroupScroll(root.querySelector('#adventure-list'));
  hydrateMediaImages(root).catch(()=>{});
  return
 }
 if(!campaignRow){root.innerHTML='<div class="status warning"><strong>Nenhuma Aventura atribuída a esta conta.</strong><br><a href="campanhas.html">Voltar para Campanhas</a></div>';return}
 const participantMap=new Map(arr(campaignRow.participants).map(p=>[String(p.username||'').toLowerCase(),p])),characterMap=new Map(arr(campaignRow.characters).map(c=>[text(c.id),c]));
 const players=active?arr(active.participantUsernames).map(u=>participantMap.get(String(u).toLowerCase())).filter(Boolean):[],characters=active?arr(active.characterIds).map(id=>characterMap.get(text(id))).filter(Boolean):[],sessions=active?arr(campaignRow.campaign.sessions).filter(s=>arr(active.sessionIds).includes(s.id)):[];
 root.innerHTML=`<div class="top"><div><p class="mini">Hub / Aventuras · somente leitura</p><h1 style="margin:.1em 0">Aventuras</h1></div><div class="hero-actions"><a class="btn secondary" href="campanhas.html">Campanhas</a><a class="btn secondary" href="mesa.html?id=${encodeURIComponent(campaignId)}">Abrir Campanha</a></div></div><section class="card"><label>Campanha<select id="shared-adventure-campaign">${rows.map(r=>`<option value="${esc(r.campaign.id)}" ${r.campaign.id===campaignId?'selected':''}>${esc(r.campaign.name)}</option>`).join('')}</select></label></section><section class="card" style="margin-top:12px"><h2>Lista de Aventuras</h2><div id="adventure-list"><div class="list campaign-list-grid">${adventures.length?adventures.map(a=>adventureListCard(a,{parentName:campaignRow.campaign.name,readOnly:true,sessions:campaignRow.campaign.sessions||[]})).join(''):'<div class="story-empty">Nenhuma Aventura atribuída nesta Campanha.</div>'}</div></div></section>${active?`<section class="card adventure-player-overview" style="margin-top:12px">${imageElementHtml(active.coverImage,active.coverImageUrl,{className:'adventure-cover',alt:''})}<div class="top"><div><p class="mini">${esc(campaignRow.campaign.name)}</p><h2>${esc(numberedAdventureTitle(active))}</h2></div><span class="badge">${esc(advStatus(active.status))}</span></div>${active.description?`<p>${esc(active.description)}</p>`:''}${active.summary?`<p><strong>Resumo:</strong> ${esc(active.summary)}</p>`:''}${active.currentSituation?`<p><strong>Situação atual:</strong> ${esc(active.currentSituation)}</p>`:''}${active.nextStep?`<p><strong>Próximo passo:</strong> ${esc(active.nextStep)}</p>`:''}</section><div class="story-grid player-adventure-grid">${simpleSection('Jogadores',players,p=>`<article class="story-card"><strong>${esc(p.displayName||p.username)}</strong></article>`)}${simpleSection('Personagens',characters,c=>`<article class="story-card"><strong>${esc(c.name||'Personagem')}</strong></article>`)}${simpleSection('Missões / Objetivos',arr(active.missions),m=>`<article class="story-card"><strong>${esc(m.title)}</strong> <span class="badge">${esc(missionStatus(m.status))}</span>${m.description?`<p>${esc(m.description)}</p>`:''}${m.reward?`<p><strong>Recompensa:</strong> ${esc(m.reward)}</p>`:''}${m.consequence?`<p><strong>Consequência:</strong> ${esc(m.consequence)}</p>`:''}</article>`)}${simpleSection('NPCs',arr(active.npcs),n=>`<article class="story-card"><strong>${esc(n.name)}</strong>${n.role?` <span class="badge">${esc(n.role)}</span>`:''}${n.description?`<p>${esc(n.description)}</p>`:''}</article>`)}${simpleSection('Locais',arr(active.locations),l=>`<article class="story-card"><strong>${esc(l.name)}</strong>${l.type?` <span class="badge">${esc(l.type)}</span>`:''}${l.description?`<p>${esc(l.description)}</p>`:''}</article>`)}${simpleSection('Pistas reveladas',arr(active.clues),c=>`<article class="story-card"><strong>${esc(c.title)}</strong> <span class="badge">${esc(clueStatus(c.status))}</span><p>${esc(c.text)}</p></article>`)}${simpleSection('Materiais para os Jogadores',arr(active.materials||active.handouts),h=>`<article class="story-card"><strong>${esc(h.title)}</strong>${h.content?`<p>${esc(h.content)}</p>`:''}${h.url?`<p><a href="${esc(h.url)}" target="_blank" rel="noopener">Abrir material</a></p>`:''}</article>`)}${simpleSection('Mapas',arr(active.exploration?.levels),level=>`<article class="story-card adventure-published-map"><strong>${esc(level.name)}</strong>${imageElementHtml(level.mapImage,level.mapUrl,{className:'adventure-shared-map-image',alt:'Mapa de '+level.name})}</article>`)}${simpleSection('Locais',arr(active.exploration?.areas),area=>`<article class="story-card"><strong>${esc((area.code?area.code+' — ':'')+area.name)}</strong> <span class="badge">${esc(({discovered:'Descoberta',visited:'Visitada',resolved:'Resolvida',blocked:'Bloqueada'})[area.status]||area.status)}</span>${area.description?`<p>${esc(area.description)}</p>`:''}</article>`)}${simpleSection('Facções',arr(active.exploration?.factions),f=>`<article class="story-card"><strong>${esc(f.name)}</strong>${f.description?`<p>${esc(f.description)}</p>`:''}</article>`)}${simpleSection('Crônica da exploração',arr(active.exploration?.history),h=>`<article class="story-card"><span class="mini">${esc(h.at?new Date(h.at).toLocaleDateString('pt-BR'):'')}</span><p>${esc(h.text||'A área foi atualizada.')}</p></article>`)}${simpleSection('Sessões da Aventura',sessions,s=>`<article class="story-card"><div class="top"><div><strong>${esc(numberedSessionTitle(s))}</strong></div><a class="btn secondary" href="sessoes.html?campaign=${encodeURIComponent(campaignId)}&id=${encodeURIComponent(s.id)}">Abrir</a></div></article>`)}</div>`:''}`;
 alignReadOnlyAdventure(root,active,campaignRow,players,characters,sessions);
 document.getElementById('shared-adventure-campaign')?.addEventListener('change',event=>{location.href=`aventuras.html?campaign=${encodeURIComponent(event.target.value)}`})
 hydrateMediaImages(root).catch(()=>{});
}

/* Mesma hierarquia visual da Campanha na visão de Jogador.
   Reorganiza exclusivamente os campos JÁ publicados nesta visualização. */
function alignReadOnlyAdventure(root,active,campaignRow,players,characters,sessions){
 if(!root||!active)return;
 const overview=root.querySelector('.adventure-player-overview');
 const list=root.querySelector('#adventure-list')?.closest('section');
 const picker=root.querySelector('#shared-adventure-campaign')?.closest('section');
 const detailGrid=root.querySelector('.player-adventure-grid');
 if(!overview||!detailGrid)return;
 const wrapper=document.createElement('div');
 wrapper.className='hub-detail-page adventure-detail-readonly';
 const image=overview.querySelector('.adventure-cover');
 image?.classList.add('campaign-product-hero-media');
 const header=overview.querySelector('.top');
 if(header){
  header.className='campaign-product-hero-content';
  const context=header.querySelector('.mini');
  if(context){context.className='campaign-product-kicker';context.textContent='Campanha · '+campaignRow.campaign.name}
  const heading=header.querySelector('h2');
  if(heading){const h1=document.createElement('h1');h1.textContent=heading.textContent;heading.replaceWith(h1)}
  const titleRow=document.createElement('div');titleRow.className='campaign-product-title-row';
  const title=header.querySelector('h1'),badge=header.querySelector('.badge');
  if(title)titleRow.append(title);
  if(badge)titleRow.append(badge);
  header.append(titleRow);
  for(const p of [...overview.querySelectorAll(':scope > p')]){p.classList.add('campaign-product-description');header.append(p)}
  const badges=document.createElement('div');badges.className='campaign-product-meta';
  badges.innerHTML='<span class="badge">Aventura</span><span class="badge">'+players.length+' '+(players.length===1?'jogador':'jogadores')+'</span><span class="badge">'+sessions.length+' '+(sessions.length===1?'sessão':'sessões')+'</span>';
  header.append(badges);
 }
 overview.classList.remove('card','adventure-player-overview');
 overview.classList.add('campaign-product-hero');
 overview.removeAttribute('style');
 const actions=document.createElement('div');actions.className='campaign-product-actions';
 const campaignLink=document.createElement('a');campaignLink.className='btn campaign-product-create-action';
 campaignLink.href='mesa.html?id='+encodeURIComponent(campaignRow.campaign.id);campaignLink.textContent='Abrir Campanha';
 const sessionsLink=document.createElement('a');sessionsLink.className='btn campaign-product-create-action';
 sessionsLink.href='sessoes.html?campaign='+encodeURIComponent(campaignRow.campaign.id);
 sessionsLink.textContent='Abrir Sessões';
 actions.append(campaignLink,sessionsLink);
 overview.insertBefore(actions,overview.querySelector('.campaign-product-hero-content'));
 const summary=document.createElement('div');summary.className='campaign-product-summary';
 const statistics=[['Status',advStatus(active.status)],['Jogadores',players.length],['Personagens',characters.length],['Missões',arr(active.missions).length],['Sessões',sessions.length]];
 for(const [name,value]of statistics){const metric=document.createElement('div');metric.className='metric';const label=document.createElement('span');label.textContent=name;const count=document.createElement('strong');count.textContent=String(value);metric.append(label,count);summary.append(metric)}
 const planTemplate=document.createElement('template');planTemplate.innerHTML=renderNextCampaignSession(campaignRow.campaign,{canPlan:false,adventures:sharedAdventures()});const plan=planTemplate.content.firstElementChild;
 detailGrid.classList.remove('story-grid','player-adventure-grid');detailGrid.classList.add('campaign-sections','campaign-editor-grid','hub-detail-grid');
 const sectionNames={'Jogadores':'participantes','Personagens':'personagens','Missões / Objetivos':'missoes','NPCs':'npcs','Locais':'locais','Mapas':'mapas','Áreas conhecidas':'locais','Facções':'faccoes','Crônica da exploração':'cronica-exploracao','Pistas reveladas':'pistas','Materiais para os Jogadores':'materiais','Sessões da Aventura':'sessoes'};
 for(const section of detailGrid.querySelectorAll(':scope > section')){
  const title=section.querySelector('h3')?.textContent?.trim()||'';
  section.id=sectionNames[title]||'';section.classList.add('campaign-editor-card');
  const heading=section.querySelector('h3');
  if(heading){const h2=document.createElement('h2');h2.textContent=heading.textContent;heading.replaceWith(h2)}
 }
 rememberAvatars(campaignRow.participants);
 const npcSection=detailGrid.querySelector('#npcs');
 const factionSection=detailGrid.querySelector('#faccoes');
 if(npcSection&&factionSection)npcSection.after(factionSection);
 const playerSection=detailGrid.querySelector('#participantes');
 const characterSection=detailGrid.querySelector('#personagens');
 const sessionsSection=detailGrid.querySelector('#sessoes');
 if(sessionsSection){
  sessionsSection.innerHTML='<h2>Sessões da Aventura</h2><div class="list campaign-player-story-grid">'+
   (sessions.length?sessions.map(s=>renderCampaignSessionCard(s,campaignRow.campaign.id)).join(''):'<div class="empty">Nenhuma sessão disponível nesta Aventura.</div>')+'</div>';
 }

 arr(players).forEach((player,i)=>{
  const card=playerSection?.querySelectorAll('.story-card')[i];if(!card)return;
  const name=player.displayName||player.username||'Jogador';
  card.classList.add('hub-detail-avatar-row');
  card.innerHTML=campaignAvatarHtml(playerAvatarHtml(player.username||name,campaignRow.participants),name)+'<strong>'+esc(name)+'</strong>';
 });
 arr(characters).forEach((character,i)=>{
  const card=characterSection?.querySelectorAll('.story-card')[i];if(!card)return;
  card.classList.add('hub-detail-avatar-row');
  card.innerHTML=campaignAvatarHtml(characterAvatarHtml(character),character.name||'Personagem')+'<strong>'+esc(character.name||'Personagem')+'</strong>';
 });
 const extras=[
  ['Cenas','cenas',arr(active.scenes),sc=>`<article class="story-card"><strong>${esc(sc.title)}</strong></article>`],
 ];
 for(const [heading,id,rows,renderer] of extras){
  const tpl=document.createElement('template');tpl.innerHTML=simpleSection(heading,rows,renderer);
  const section=tpl.content.firstElementChild;section.id=id;section.classList.add('campaign-editor-card');
  const h=section.querySelector('h3');if(h){const h2=document.createElement('h2');h2.textContent=h.textContent;h.replaceWith(h2)}
  detailGrid.append(section)
 }
 const shownEvents=deriveAdventureTimelineEvents(active);
 const timeline=document.createElement('template');
 timeline.innerHTML='<section id="linha-tempo" class="card campaign-editor-card"><h2>Linha do Tempo</h2>'+
  (shownEvents.length?renderAdventureTimelineDiagram(shownEvents,{readOnly:true}):'<div class="story-empty">Nenhum evento publicado nesta Aventura.</div>')+'</section>';
 if(timeline.content.firstElementChild)detailGrid.append(timeline.content.firstElementChild);
 if(active.dmNoteEntries?.length){const notes=document.createElement('template');notes.innerHTML=noteSection(active.dmNoteEntries,{readOnly:true});detailGrid.append(notes.content.firstElementChild)}
 for(const id of['pistas','materiais','tesouros','capitulos'])detailGrid.querySelector('#'+id)?.remove();
 if(list){list.id='outras-aventuras';list.classList.add('campaign-editor-card');list.removeAttribute('style');detailGrid.append(list)}
 if(picker){picker.id='campanhas-disponiveis';picker.classList.add('campaign-editor-card');picker.removeAttribute('style');detailGrid.append(picker)}
 const nav=document.createElement('nav');nav.className='section-nav adventure-nav hub-detail-nav';nav.setAttribute('aria-label','Seções da Aventura');
 const navLinks=[['participantes','Participantes'],['personagens','Personagens'],['locais','Locais'],['mapas','Mapas'],['npcs','NPCs'],['faccoes','Facções'],['missoes','Objetivos'],['cenas','Cenas'],['sessoes','Sessões'],['linha-tempo','Linha do tempo'],['notas-mestre','Notas do Mestre'],['outras-aventuras','Outras Aventuras']];
 for(const [id,label] of navLinks){if(!detailGrid.querySelector('#'+id))continue;const a=document.createElement('a');a.href='#'+id;a.textContent=label;nav.append(a)}
 wrapper.append(overview,summary,plan,nav,detailGrid);
 root.replaceChildren(wrapper);
 bindCampaignAvatarPreviews(root);
 root.querySelectorAll('[data-timeline-toggle]').forEach(b=>b.addEventListener('click',()=>{const list=b.closest('.timeline-item')?.querySelector(':scope > .timeline-children');if(list){list.hidden=!list.hidden;b.setAttribute('aria-expanded',String(!list.hidden))}}));
 updateAppShellContext();
}

async function start(){if(playerMode()){readOnly();window.addEventListener('hub-rpg:remote-updated',event=>{event.detail?.claim?.();readOnly()});return}await import('./adventure-integrity-ui.js?v=20261022-chronicles-final3');await import('./adventure-ui.js?v=20261026-unified3')}
start();