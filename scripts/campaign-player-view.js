import{imageElementHtml,hydrateMediaImages}from'./image-media.js?v=20261019-disclosure1';
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const arr=value=>Array.isArray(value)?value:[];
const titleCase=name=>{const text=String(name||'').trim();return Array.from(text)[0]?.toLocaleUpperCase('pt-BR')||'J'};
const section=(id,title,content,count=null)=>`<section id="${id}" class="card campaign-player-section"><div class="campaign-editor-head"><h2>${esc(title)}</h2>${count===null?'':`<span class="campaign-editor-count">${count}</span>`}</div>${content}</section>`;
const empty=message=>`<div class="campaign-player-empty">${esc(message)}</div>`;
const media=(media,legacyUrl,alt,className)=>imageElementHtml(media,legacyUrl,{className,alt});
function players(c,characters){
 const members=arr(c.members).filter(row=>row?.active!==false&&row.role!=='dm');
 const byId=new Map(arr(characters).map(char=>[char.id,char]));
 const rows=members.map(member=>{
  const name=member.name||member.username||'Jogador',character=byId.get(member.characterId);
  const snapshots=character?.refSnapshots||{},level=character?.choices?.class?.level;
  const characterLabel=character?`${character.name||'Personagem sem nome'}${snapshots.class?.name?` · ${snapshots.class.name}${level?' '+level:''}`:''}`:'— Sem personagem —';
  const link=member.characterId?`<a class="campaign-player-character-link" href="ficha-personagem.html?id=${encodeURIComponent(member.characterId)}" aria-label="Abrir ficha de ${esc(character?.name||name)}" title="Abrir ficha">${esc(characterLabel)}<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13 5h6v6M19 5l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg></a>`:`<span class="campaign-player-empty-character">${esc(characterLabel)}</span>`;
  return`<article class="campaign-player-roster-row"><span class="roster-avatar" aria-hidden="true">${esc(titleCase(name))}</span><div class="campaign-player-roster-field"><span class="roster-player-label">Jogador</span><div class="roster-player-name">${esc(name)}</div></div><div class="campaign-player-roster-field"><span class="roster-player-label">Personagem</span>${link}</div></article>`;
 });
 return section('jogadores','Jogadores participantes',`<div class="campaign-player-roster">${rows.join('')||empty('Nenhum jogador participante.')}</div>`,rows.length);
}
function backgroundCard(item,kind,campaignId){
 const isAdventure=kind==='adventure',name=String(isAdventure?item.title:item.title||'Sessão'),href=isAdventure?`aventuras.html?campaign=${encodeURIComponent(campaignId)}&id=${encodeURIComponent(item.id)}`:`sessoes.html?campaign=${encodeURIComponent(campaignId)}&id=${encodeURIComponent(item.id)}`;
 const heading=isAdventure?name:`Sessão ${Number(item.number)||1} · ${name}`;
 const picture=media(item.coverImage,item.coverImageUrl,`Capa de ${heading}`,'campaign-player-story-image');
 return`<a class="campaign-player-story-card" href="${href}" aria-label="Abrir ${esc(heading)}">
 ${picture}<span class="campaign-player-story-content"><h3>${esc(heading)}</h3><span class="campaign-player-story-open">Abrir <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 5h6v6M19 5l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg></span></span></a>`;
}
function stories(id,title,rows,kind,campaignId){
 return section(id,title,`<div class="campaign-player-story-grid">${rows.length?rows.map(item=>backgroundCard(item,kind,campaignId)).join(''):empty(kind==='adventure'?'Nenhuma aventura disponível.':'Nenhuma sessão disponível.')}</div>`,rows.length);
}
function npcs(c){
 const rows=arr(c.importantNpcEntries);
 return section('npcs','NPCs importantes',`<ul class="campaign-bullet-list campaign-player-static-list">${rows.length?rows.map(row=>`<li class="campaign-player-important-card"><span class="campaign-list-marker" aria-hidden="true"></span><strong>${esc(row.name)}</strong></li>`).join(''):`<li class="campaign-blank-state">Nenhum NPC disponível.</li>`}</ul>`,rows.length);
}
function locations(c){
 const rows=arr(c.importantLocationEntries);
 return section('locais','Locais importantes',`<ul class="campaign-bullet-list campaign-player-static-list">${rows.length?rows.map(row=>`<li class="campaign-player-important-card">${row.image?.id?`<button type="button" class="campaign-player-location-thumb" data-player-location-preview="${esc(row.id)}" aria-label="Ampliar imagem de ${esc(row.name)}">${media(row.image,'',`Imagem de ${row.name}`,'campaign-player-location-img')}</button>`:`<span class="campaign-player-location-placeholder" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="9" r="1.5"/><path d="m3 18 6-6 4 4 3-3 5 5"/></svg></span>`}<span class="campaign-list-marker" aria-hidden="true"></span><strong>${esc(row.name)}</strong></li>`).join(''):`<li class="campaign-blank-state">Nenhum local disponível.</li>`}</ul>`,rows.length);
}
function eventRows(nodes,depth=0){
 return arr(nodes).map((node,index)=>`<li class="campaign-player-event-item"><div class="campaign-flow-step"><span class="campaign-flow-node" aria-hidden="true">${depth?'•':index+1}</span><div class="campaign-flow-card campaign-player-event-card"><strong>${esc(node.text)}</strong></div></div>${arr(node.children).length?`<ol class="campaign-player-event-children">${eventRows(node.children,depth+1)}</ol>`:''}</li>`).join('');
}
function countEvents(nodes){return arr(nodes).reduce((sum,node)=>sum+1+countEvents(node.children),0)}
function timeline(c){
 const nodes=arr(c.timelineNodes),total=countEvents(nodes);
 return section('linha-tempo','Linha do tempo',nodes.length?`<ol class="campaign-player-event-list">${eventRows(nodes)}</ol>`:empty('Nenhum evento disponível.'),total);
}
export function renderPlayerCampaign(row){
 const root=document.getElementById('table-root');if(!root)return;
 const c=row.campaign,m=row.membership||{},adventures=arr(row.adventures),sessions=arr(c.sessions),characters=arr(row.characters);
 document.title=`${c.name} - Campanha - Teias de Anansi`;
 root.innerHTML=`<div class="campaign-player-page"><div class="top campaign-player-top"><div><h1>${esc(c.name)}</h1><span class="campaign-player-readonly">Somente leitura</span></div><div class="hero-actions"><a class="btn secondary" href="campanhas.html">Campanhas</a><a class="btn secondary" href="aventuras.html?campaign=${encodeURIComponent(c.id)}">Aventuras</a><a class="btn secondary" href="sessoes.html?campaign=${encodeURIComponent(c.id)}">Sessões</a>${m.characterId?`<a class="btn" href="ficha-personagem.html?id=${encodeURIComponent(m.characterId)}">Minha ficha</a>`:''}</div></div>
 <div class="campaign-player-grid">
 ${section('campanha','Campanha',`<div class="campaign-player-campaign-overview">${media(c.coverImage,c.coverImageUrl,`Capa de ${c.name}`,'campaign-player-campaign-cover')}<p>${esc(c.description||'')}</p>${c.sharedNotes?`<p class="campaign-player-shared-notes">${esc(c.sharedNotes)}</p>`:''} </div>`)}
 ${players(c,characters)}
 ${stories('aventuras','Aventuras da campanha',adventures,'adventure',c.id)}
 ${stories('sessoes','Sessões da campanha',sessions,'session',c.id)}
 <div class="campaign-player-structured">${npcs(c)}${locations(c)}</div>
 ${timeline(c)}
 </div></div>`;
 root.querySelectorAll('[data-player-location-preview]').forEach(button=>button.addEventListener('click',()=>{
  const item=arr(c.importantLocationEntries).find(row=>row.id===button.dataset.playerLocationPreview);
  if(!item?.image?.id)return;
  const dialog=document.createElement('dialog');dialog.className='campaign-location-lightbox';
  dialog.innerHTML=`<div class="campaign-location-lightbox-head"><strong>${esc(item.name)}</strong><button type="button" class="secondary" data-close-image>Fechar</button></div>${media(item.image,'',`Imagem de ${item.name}`,'campaign-player-image-large')}`;
  document.body.appendChild(dialog);
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  dialog.querySelector('[data-close-image]')?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  dialog.showModal();void hydrateMediaImages(dialog).catch(()=>{});
 }));
 void hydrateMediaImages(root).catch(()=>{});
}
