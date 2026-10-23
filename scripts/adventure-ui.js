import{updateAppShellContext}from'./app-shell.js?v=20261022-chronicles-final3';
import{noteSection,bindNoteSection}from'./hub-notes.js?v=20261022-chronicles-final3';
import{renderNextCampaignSession}from'./campaign-next-session-ui.js?v=20261022-chronicles-final3';
import{renderTimeline,bindStructuredDetails}from'./campaign-structured-ui.js?v=20261022-chronicles-final3';
import{renderCampaignSessionCard}from'./campaign-session-card.js';
import{loadEncounterMonsterIndex,loadEncounterMonsterDetail}from'./monster-catalog.js?v=20260902-encounters1';
import{numberedAdventureTitle,numberedSessionTitle}from'./narrative-labels.js';
import{timelineViewToggle,renderAdventureTimelineDiagram}from'./timeline-flowchart.js?v=20261019-flowchart1';
import{readCampaigns,writeCampaigns,campaignById,addCampaignNpc,updateCampaignNpc,removeCampaignNpc,addCampaignLocation,updateCampaignLocation,removeCampaignLocation,updateCampaignSession,updateSessionScene}from'./campaign-state.js?v=20261022-chronicles-final3';
import{read as readCharacters,write as writeCharacters,readNpcs as readRegisteredNpcs}from'./character-builder/state.js';
import{readAdventures,writeAdventures,adventureById,adventuresForCampaign,createAdventure,updateAdventure,reassignAdventureCampaign,removeAdventure,addAdventureChapter,addAdventureScene,addAdventureClue,addAdventureHandout,addAdventureTreasure,addAdventureMission,addAdventureMonster,addAdventureTimelineEntry,updateAdventureEntity,removeAdventureEntity,unlinkAdventureCampaignEntity,startAdventureScene,completeAdventureScene,skipAdventureScene,setAdventureClueStatus,setAdventureHandoutRevealed,setAdventureTreasureStatus,setAdventureMissionStatus}from'./adventure-state.js?v=20261023-simplified3';
import{reconcileAdventureCampaignRefs}from'./adventure-integrity.js?v=20261016-current-status2';
import{uploadImage,copyAdventureCoverToCampaign,deleteImage,persistCampaignMediaState,persistAdventureCampaignReassignment,imageElementHtml,imagePickerHtml,bindImagePicker,hydrateMediaImages}from'./image-media.js?v=20261023-simplified3';

import{renderAdventureExploration,renderAdventureFactions,bindAdventureExploration}from'./adventure-exploration-ui.js?v=20261023-split-cards1';
import{explorationProgress}from'./adventure-exploration-state.js?v=20261023-simplified3';
import{adventureRosterHtml,adventureMembers,bindAdventureRoster}from'./adventure-roster-ui.js?v=20261019-gender1';
import{adventureCreateTile,ADVENTURE_STATUSES}from'./adventure-list-card.js?v=20261023-status-context12';
import{adventureFiltersHtml,adventureGroupsHtml,bindAdventureGroupScroll}from'./adventure-list-groups.js?v=20261023-status-context12';

const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search);let campaigns=readCampaigns(),adventures=readAdventures().filter(a=>a.campaignId!=='e2e-explicit-player-access'),characters=readCharacters(),campaignId=params.get('campaign')||campaigns[0]?.id||'',adventureId=params.get('id')||'',saveTimer=null,magicItems=[],adventureTimelineView='list',createPanelOpen=params.get('new')==='1',listCampaignFilter=params.get('campaign')||'all',listStatusFilter='all';
const advStatus=s=>({planned:'Planejada',active:'Em andamento',paused:'Pausada',completed:'Concluída',archived:'Arquivada'}[s]||s),advType=s=>({main:'Aventura principal',side:'Aventura secundária',oneshot:'One-shot',secondary:'Arco secundário'}[s]||s),sceneStatus=s=>({planned:'Planejada',active:'Em cena',completed:'Concluída',skipped:'Ignorada'}[s]||s),clueStatus=s=>({hidden:'Oculta',discovered:'Descoberta',resolved:'Resolvida'}[s]||s),treasureStatus=s=>({planned:'Planejado',found:'Encontrado',claimed:'Distribuído'}[s]||s),missionStatus=s=>({hidden:'Não descoberta',active:'Ativa',completed:'Concluída',failed:'Falhou',abandoned:'Abandonada'}[s]||s);
const campaign=()=>campaignById(campaigns,campaignId),adventure=()=>adventureById(adventures,adventureId);
let monsterCatalog=[],monsterCatalogReady=false;
const expandedSceneIds=new Set();
const visibleToggle=(kind,id,visible)=>`<label class="campaign-disclosure-toggle"><input type="checkbox" data-adventure-visible="${esc(kind)}" data-visible-id="${esc(id)}" ${visible?'checked':''}><span>Mostrar aos jogadores</span></label>`;
const moveTools=(kind,id,i,length)=>`<button type="button" class="campaign-reorder-grip" data-adventure-grip="${esc(id)}" aria-label="Arrastar para reorganizar" title="Arrastar para reorganizar" style="touch-action:none">⠿</button><button type="button" class="secondary campaign-move-button" data-adventure-move="up" data-kind="${esc(kind)}" data-id="${esc(id)}" ${i===0?'disabled':''}>↑</button><button type="button" class="secondary campaign-move-button" data-adventure-move="down" data-kind="${esc(kind)}" data-id="${esc(id)}" ${i===length-1?'disabled':''}>↓</button>`;
const ordered=(rows=[])=>[...rows].sort((a,b)=>(a.order||0)-(b.order||0));
const chapterOptions=(a,current='')=>entitySelect(ordered(a.chapters),current,'— Sem capítulo —');
const objectiveOptions=(a,current='')=>entitySelect(ordered(a.missions),current,'— Sem objetivo —');
const npcOptions=a=>entitySelect((campaign()?.npcs||[]).filter(n=>a.npcIds.includes(n.id)),'','— Sem NPC —');
const monsterOptions=a=>entitySelect(ordered(a.monsters||[]),'','— Sem monstro —');
function option(value,label,current){return`<option value="${esc(value)}" ${String(value)===String(current)?'selected':''}>${esc(label)}</option>`}
function feedback(message,ok=true){const box=$('adventure-feedback');if(!box)return;box.hidden=false;box.className=`status ${ok?'ok':'warning'}`;box.textContent=message;clearTimeout(feedback.timer);feedback.timer=setTimeout(()=>box.hidden=true,3200)}
function syncUrl(){const q=new URLSearchParams;if(campaignId)q.set('campaign',campaignId);if(adventureId)q.set('id',adventureId);history.replaceState(null,'',`aventuras.html${q.toString()?`?${q}`:''}`)}
function normalizeRefs(){const c=campaign();if(!c)return;const result=reconcileAdventureCampaignRefs(adventures,c);if(!result.changed)return;adventures=writeAdventures(result.list);if(result.campaign){campaigns=writeCampaigns(campaigns.map(row=>row.id===c.id?result.campaign:row))}}
function commit(result,message='Aventura salva.'){if(!result?.ok)return feedback(result?.reason||'Não foi possível salvar.',false);adventures=writeAdventures(result.list);if(result.adventure)adventureId=result.adventure.id;syncUrl();render();feedback(message,true)}
function commitCampaign(result,message='Campanha atualizada.'){if(!result?.ok)return feedback(result?.reason||'Não foi possível atualizar a Campanha.',false);campaigns=writeCampaigns(result.list);normalizeRefs();render();feedback(message,true)}
function campaignOptions(selected=campaignId){return campaigns.map(c=>option(c.id,c.name,selected)).join('')}
function topHtml(){
 return `<div class="top hub-collection-top"><header><h1>Aventuras</h1></header></div>`
}
function nextAdventureOrder(targetCampaignId){
 return adventures.filter(row=>row.campaignId===targetCampaignId).reduce((max,row)=>Math.max(max,Number(row.order)||0),0)+1;
}
function selectorHtml(){
 if(!campaigns.length)return '<div class="status warning">Crie uma Campanha antes de criar uma Aventura. <a href="campanhas.html">Abrir Campanhas</a></div>';
 return `<section id="adventure-create-card" class="card hub-collection-create-panel" ${createPanelOpen?'':'hidden'}><div class="campaign-create-header"><h2>Nova aventura</h2><button type="button" class="secondary" id="cancel-adventure-create">Fechar</button></div>
 <div class="form-grid two"><label>Campanha da aventura<select id="adventure-campaign">${campaignOptions()}</select></label><label>Nome da aventura<input id="new-adventure-title"></label><label>Status<select id="new-adventure-status"><option value="planned">Planejada</option><option value="active">Em andamento</option></select></label><label>Ordem da aventura<input id="new-adventure-order" type="number" min="1" value="${nextAdventureOrder(campaignId)}" readonly aria-label="Próxima ordem da aventura na Campanha"></label></div>
 <div class="row-actions" style="margin-top:12px"><button id="create-adventure" type="button">Criar aventura</button></div></section>`
}
function listHtml(){
 const choices=campaigns.filter(c=>c.id!=='e2e-explicit-player-access');
 return `<section class="hub-collection-section adventure-list-section">
  <div class="top campaign-list-heading"><h2>Lista de Aventuras</h2></div>
  ${adventureFiltersHtml(choices,{campaign:listCampaignFilter,status:listStatusFilter})}
  ${selectorHtml()}
  <div id="adventure-list">
   <div class="adventure-campaign-groups">
    ${adventureGroupsHtml(adventures,choices,{campaign:listCampaignFilter,status:listStatusFilter})}
   </div>
   ${choices.length?`<div class="adventure-create-tile-row">${adventureCreateTile(createPanelOpen)}</div>`:''}
  </div>
 </section>`
}
function entitySelect(rows,current,empty='— Nenhum —'){return`<option value="">${esc(empty)}</option>${rows.map(x=>option(x.id,x.title||x.name,current)).join('')}`}
function libraryItemSelect(current){let html='<option value="">— Sem item da Biblioteca —</option>';if(current&&!magicItems.some(x=>x.id===current))html+=option(current,current,current);return html+magicItems.map(x=>option(x.id,x.name,current)).join('')}
async function loadMagicItems(){const manifestUrl=new URL('dados/itens-magicos/manifest.json',document.baseURI);manifestUrl.searchParams.set('v','20260922-adventure-workspace2');const manifest=await fetch(manifestUrl,{cache:'default'}).then(r=>{if(!r.ok)throw new Error('Biblioteca de itens mágicos indisponível.');return r.json()}),parts=await Promise.allSettled((manifest.chunks||[]).map(async path=>{const url=new URL(path,document.baseURI);url.searchParams.set('v','20260922-adventure-workspace2');const r=await fetch(url,{cache:'default'});if(!r.ok)throw new Error(path);return r.json()})),seen=new Set(),rows=[];for(const part of parts)if(part.status==='fulfilled'&&Array.isArray(part.value))for(const item of part.value){if(!item?.id||!item?.nome||seen.has(item.id))continue;seen.add(item.id);rows.push({id:String(item.id),name:String(item.nome)})}magicItems=rows.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));return magicItems}
function charLabel(id){const c=characters.find(x=>x.id===id);return c?.name||id}
function memberName(m){return m.name||m.username||'Jogador'}
function progress(a){const total=a.scenes.length,done=a.scenes.filter(s=>['completed','skipped'].includes(s.status)).length;return total?`${done}/${total} cenas`:'Sem cenas'}
function operationalHtml(a){
 const c=campaign(),chapter=a.chapters.find(x=>x.id===a.currentChapterId),active=a.scenes.find(x=>x.id===a.activeSceneId),next=a.scenes.find(x=>x.status==='planned');
 const activeMissions=a.missions.filter(m=>m.status==='active').length,hiddenClues=a.clues.filter(x=>x.status==='hidden').length;
 const focus=a.exploration?.areas?.find(area=>area.id===a.exploration.activeAreaId);
  const metrics=[['Capítulo atual',chapter?.title||'—'],['Cena atual',active?.title||'—'],['Área atual',focus?.name||'—'],['Próxima cena',next?.title||'—'],['Progresso narrativo',progress(a)],['Exploração',(()=>{const p=explorationProgress(a.exploration);return p.visited+'/'+p.total+' áreas'})()],['Jogadores',String(a.participantUsernames.length)],['Missões ativas',String(activeMissions)],['Pistas ocultas',String(hiddenClues)]];
 return `<section class="campaign-product-hero adventure-product-hero">
 ${imageElementHtml(a.coverImage,a.coverImageUrl,{className:'campaign-product-hero-media',alt:''})}
 <div class="campaign-product-actions"><a class="btn campaign-product-create-action" href="mesa.html?id=${encodeURIComponent(a.campaignId)}">Abrir Campanha</a><a class="btn campaign-product-create-action" href="sessoes.html?campaign=${encodeURIComponent(a.campaignId)}&adventure=${encodeURIComponent(a.id)}">Abrir Sessões</a></div>
 <div class="campaign-product-hero-content"><div class="campaign-product-kicker">Campanha · ${esc(c?.name||'Campanha')}</div>
 <div class="campaign-product-title-row"><h1>${esc(numberedAdventureTitle(a))}</h1><span class="badge ${esc(a.status)}">${esc(advStatus(a.status))}</span></div>
 <p class="campaign-product-description">${esc(a.description||a.summary||'Resumo da Aventura')}</p>
 <div class="campaign-product-meta"><span class="badge">${esc(advType(a.type))}</span><span class="badge">${a.participantUsernames.length} ${a.participantUsernames.length===1?'jogador':'jogadores'}</span><span class="badge">${a.scenes.length} ${a.scenes.length===1?'cena':'cenas'}</span></div>
 </div></section><div class="campaign-product-summary">${metrics.map(([label,value])=>`<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>`;
}
function basicsHtml(a){return`<section id="visao-geral" class="card adventure-editor campaign-editor-card"><h2>Visão geral</h2><div class="form-grid">
<label>Campanha da aventura<select id="adventure-assignment">${campaignOptions(a.campaignId)}</select></label>
<label>Nome da Aventura<input data-adventure-field="title" value="${esc(a.title)}"></label>
<label>Status<select data-adventure-field="status">${['planned','active','paused','completed','archived'].map(v=>option(v,advStatus(v),a.status)).join('')}</select></label>
<label>Ordem<input data-adventure-field="order" type="number" min="1" step="1" value="${a.order}"></label>
<label>Tipo<select data-adventure-field="type">${['main','side','oneshot','secondary'].map(v=>option(v,advType(v),a.type)).join('')}</select></label>
<label class="wide">Resumo da Aventura<textarea data-adventure-field="description" maxlength="5000">${esc(a.description||a.summary||'')}</textarea></label>
<div class="wide"><strong>Capa / imagem</strong>${imagePickerHtml({media:a.coverImage,legacyUrl:a.coverImageUrl,alt:`Capa de ${a.title}`,className:'adventure-cover'})}</div>
</div><div class="row-actions"><button type="button" data-save-adventure-section>Salvar</button></div></section>`}
function participantsHtml(a){return adventureRosterHtml(a,campaign(),characters)}
function newAdventureData(){
 const inherit=Boolean(params.get('campaign')&&params.get('campaign')===campaignId);
 const participantAssignments=(inherit?adventureMembers(campaign()):[]).map(member=>({username:String(member.username||member.name).toLowerCase(),characterId:member.characterId||null}));
 return{campaignId,title:$('new-adventure-title')?.value||'Nova Aventura',status:$('new-adventure-status')?.value||'planned',
  ...(inherit?{participantAssignments,participantUsernames:participantAssignments.map(row=>row.username),
   characterIds:[...new Set(participantAssignments.map(row=>row.characterId).filter(Boolean))],participantAccessConfigured:true}:{})};
}
function chapterCard(row,i=0,list=[]){return`<article class="story-card campaign-bullet-entry" draggable="true" tabindex="0" data-reorder-adventure="chapters" data-entity-row="${esc(row.id)}" data-entity-key="chapters"><div class="compact-grid">
<label>Título<input data-entity-field="title" value="${esc(row.title)}"></label>
<label>Capítulo<input data-entity-field="arc" value="${esc(row.arc)}"></label></div>
<div class="campaign-line-actions">${visibleToggle('chapters',row.id,row.visibleToPlayers)}${moveTools('chapters',row.id,i,list.length)}
<button type="button" class="danger campaign-list-remove" data-remove-entity="${esc(row.id)}" data-key="chapters">Excluir</button></div></article>`}
function missionCard(row,a,i=0){const rows=ordered(a.missions);return`<article class="story-card campaign-bullet-entry" draggable="true" tabindex="0" data-reorder-adventure="missions" data-entity-row="${esc(row.id)}" data-entity-key="missions">
<div class="compact-grid"><label>Título<input data-entity-field="title" value="${esc(row.title)}"></label><label>Descrição<input data-entity-field="description" value="${esc(row.description)}"></label></div>
<div class="campaign-line-actions">${visibleToggle('missions',row.id,row.visibleToPlayers)}${moveTools('missions',row.id,i,rows.length)}
<button type="button" class="danger campaign-list-remove" data-remove-entity="${esc(row.id)}" data-key="missions">Excluir</button></div></article>`}
function npcCard(row,a,c,i=0){const rows=a.npcIds;return`<article class="story-card campaign-bullet-entry" data-reorder-adventure="npcs" draggable="true" tabindex="0" data-campaign-npc="${esc(row.id)}">
<div class="compact-grid"><label>Nome<input data-campaign-npc-field="name" value="${esc(row.name)}"></label><label>Papel<input data-campaign-npc-field="role" value="${esc(row.role)}"></label></div>
<div class="campaign-line-actions">${visibleToggle('npcs',row.id,a.npcVisibility?.[row.id])}${moveTools('npcs',row.id,i,rows.length)}
${row.sheetId?`<a class="btn secondary" href="ficha-personagem.html?npc=1&id=${encodeURIComponent(row.sheetId)}">Abrir ficha</a>`:'' }<button type="button" class="danger campaign-list-remove" data-delete-campaign-npc="${esc(row.id)}">Excluir</button></div></article>`}
function locationCard(row,a,i=0){const rows=a.locationIds;return`<article class="story-card campaign-bullet-entry" data-reorder-adventure="locations" draggable="true" tabindex="0" data-campaign-location="${esc(row.id)}">
<div class="compact-grid"><label>Nome<input data-campaign-location-field="name" value="${esc(row.name)}"></label><label>Tipo<input data-campaign-location-field="type" value="${esc(row.type)}"></label></div>
<div class="campaign-line-actions">${visibleToggle('locations',row.id,a.locationVisibility?.[row.id])}${moveTools('locations',row.id,i,rows.length)}
<button type="button" class="danger campaign-list-remove" data-delete-campaign-location="${esc(row.id)}">Excluir</button></div></article>`}
function clueCard(row,a){return`<article class="story-card" data-entity-row="${esc(row.id)}" data-entity-key="clues"><div class="compact-grid"><label>Título<input data-entity-field="title" value="${esc(row.title)}"></label><label>Status<select data-clue-status>${['hidden','discovered','resolved'].map(v=>option(v,clueStatus(v),row.status)).join('')}</select></label><label>Local<select data-entity-field="locationId">${entitySelect((campaign()?.locations||[]).filter(l=>a.locationIds.includes(l.id)),row.locationId)}</select></label><label>NPC<select data-entity-field="npcId">${entitySelect((campaign()?.npcs||[]).filter(n=>a.npcIds.includes(n.id)),row.npcId)}</select></label><label>Cena<select data-entity-field="sceneId">${entitySelect(a.scenes,row.sceneId)}</select></label><label>Descoberta na sessão<select data-entity-field="discoveredSessionId">${sessionOptionsFromCampaign(row.discoveredSessionId)}</select></label></div><label>Conteúdo<textarea data-entity-field="text">${esc(row.text)}</textarea></label><label>Notas do Mestre<textarea data-entity-field="notes">${esc(row.notes)}</textarea></label><div class="row-actions"><button class="danger" data-remove-entity="${esc(row.id)}" data-key="clues">Excluir pista</button></div></article>`}
function materialCard(row,a){return`<article class="story-card" data-entity-row="${esc(row.id)}" data-entity-key="handouts"><div class="compact-grid"><label>Título<input data-entity-field="title" value="${esc(row.title)}"></label><label>Tipo<select data-entity-field="type">${['text','image','map','document','link'].map(v=>option(v,{text:'Texto',image:'Imagem',map:'Mapa',document:'Documento',link:'Link'}[v],row.type)).join('')}</select></label><label>Cena<select data-entity-field="sceneId">${entitySelect(a.scenes,row.sceneId)}</select></label><label>Revelado<select data-material-revealed>${option('false','Não',String(row.revealed))}${option('true','Sim',String(row.revealed))}</select></label><label>Sessão da revelação<select data-entity-field="revealedSessionId">${sessionOptionsFromCampaign(row.revealedSessionId)}</select></label></div><label>Texto / conteúdo<textarea data-entity-field="content">${esc(row.content)}</textarea></label><label>URL<input data-entity-field="url" value="${esc(row.url)}"></label><label>Notas do Mestre<textarea data-entity-field="notes">${esc(row.notes)}</textarea></label><div class="row-actions"><button class="danger" data-remove-entity="${esc(row.id)}" data-key="handouts">Excluir material</button></div></article>`}
function treasureCard(row,a){return`<article class="story-card" data-entity-row="${esc(row.id)}" data-entity-key="treasures"><div class="compact-grid"><label>Nome<input data-entity-field="name" value="${esc(row.name)}"></label><label>Quantidade<input type="number" min="1" data-entity-field="quantity" value="${row.quantity}"></label><label>Tipo<select data-entity-field="type">${option('magic-item','Item mágico',row.type)}${option('item','Item',row.type)}${option('coin','Moedas',row.type)}${option('other','Outro',row.type)}</select></label><label>Status<select data-treasure-status>${['planned','found','claimed'].map(v=>option(v,treasureStatus(v),row.status)).join('')}</select></label><label>Item da Biblioteca<select data-entity-field="libraryItemId">${libraryItemSelect(row.libraryItemId)}</select></label><label>Cena<select data-entity-field="sceneId">${entitySelect(a.scenes,row.sceneId)}</select></label><label>Local<select data-entity-field="locationId">${entitySelect((campaign()?.locations||[]).filter(l=>a.locationIds.includes(l.id)),row.locationId)}</select></label><label>Destinatário<select data-entity-field="recipientCharacterId">${entitySelect(a.characterIds.map(id=>({id,name:charLabel(id)})),row.recipientCharacterId,'— Não definido —')}</select></label></div><label>Descrição<textarea data-entity-field="description">${esc(row.description)}</textarea></label><label>Notas do Mestre<textarea data-entity-field="notes">${esc(row.notes)}</textarea></label><div class="row-actions">${row.libraryItemId?`<a class="btn secondary" href="itens-magicos.html?ref=${encodeURIComponent(row.libraryItemId)}" target="_blank" rel="noopener">Abrir na Biblioteca</a>`:''}${row.recipientCharacterId&&row.status!=='claimed'&&row.type!=='coin'?`<button data-deliver-treasure="${esc(row.id)}">Entregar ao personagem</button>`:''}<button class="danger" data-remove-entity="${esc(row.id)}" data-key="treasures">Excluir tesouro</button></div></article>`}
function sessionOptionsFromCampaign(current){const rows=campaign()?.sessions||[];return entitySelect(rows.map(s=>({id:s.id,title:numberedSessionTitle(s)})),current,'— Sem sessão —')}
function sessionSceneOptionsForAdventure(a,scene){const linkedIds=new Set(a.scenes.map(s=>s.sessionId).filter(Boolean)),rows=(campaign()?.sessions||[]).filter(s=>s.adventureId===a.id||linkedIds.has(s.id)).flatMap(s=>(s.scenes||[]).map(ss=>({value:`${s.id}::${ss.id}`,label:`Sessão ${s.order??s.number} · ${ss.title}`}))),current=scene.sessionId&&scene.sessionSceneId?`${scene.sessionId}::${scene.sessionSceneId}`:'';return`<option value="">— Sem vínculo —</option>${rows.map(r=>option(r.value,r.label,current)).join('')}`}
function syncAdventureSceneToSessionScene(sceneId,value){
 const a=adventure(),scene=a?.scenes.find(s=>s.id===sceneId);if(!a||!scene)return;
 const oldSessionId=scene.sessionId,oldSessionSceneId=scene.sessionSceneId;
 if(oldSessionId&&oldSessionSceneId){
  const oldSession=campaign()?.sessions.find(s=>s.id===oldSessionId),oldScene=oldSession?.scenes.find(s=>s.id===oldSessionSceneId);
  if(oldSession&&oldScene&&oldScene.adventureSceneId===sceneId){
   updateSessionScene(oldSession,oldScene.id,{adventureSceneId:null});
   const result=updateCampaignSession(campaigns,campaignId,oldSession.id,{scenes:oldSession.scenes});
   if(result.ok)campaigns=writeCampaigns(result.list)
  }
 }
 let sessionId=null,sessionSceneId=null;
 if(value){
  [sessionId,sessionSceneId]=String(value).split('::');
  const targetSession=campaign()?.sessions.find(s=>s.id===sessionId),targetScene=targetSession?.scenes.find(s=>s.id===sessionSceneId);
  if(!targetSession||!targetScene)return feedback('Cena da sessão não encontrada.',false);
  if(targetScene.adventureSceneId&&targetScene.adventureSceneId!==sceneId){
   const other=a.scenes.find(s=>s.id===targetScene.adventureSceneId);
   if(other){
    const cleared=updateAdventureEntity(adventures,a.id,'scenes',other.id,{sessionId:null,sessionSceneId:null});
    if(cleared.ok)adventures=writeAdventures(cleared.list)
   }
  }
  updateSessionScene(targetSession,targetScene.id,{adventureSceneId:sceneId});
  const saved=updateCampaignSession(campaigns,campaignId,targetSession.id,{scenes:targetSession.scenes});
  if(saved.ok)campaigns=writeCampaigns(saved.list)
 }
 const patch={sessionId:sessionId||null,sessionSceneId:sessionSceneId||null,encounterRef:{sessionId:sessionId||null,encounterId:null}};
 const result=updateAdventureEntity(adventures,a.id,'scenes',sceneId,patch);
 if(!result.ok)return feedback(result.reason,false);
 adventures=writeAdventures(result.list);render();feedback(value?'Cena da Aventura vinculada à Cena da Sessão.':'Vínculo de cenas removido.')
}
function encounterOptions(scene){const session=campaign()?.sessions?.find(s=>s.id===scene.sessionId),rows=(session?.encounters||[]).map(e=>({id:e.id,title:e.title}));return entitySelect(rows,scene.encounterRef?.encounterId,'— Sem encontro —')}
function checks(rows,selected,type){const set=new Set(selected||[]);return rows.length?rows.map(x=>`<label><input type="checkbox" data-scene-link="${type}" value="${esc(x.id)}" ${set.has(x.id)?'checked':''}>${esc(x.title||x.name)}</label>`).join(''):'<span class="mini">Nenhum registro.</span>'}
function sceneCard(scene,a,i=0){
 const linkedNpcs=(campaign()?.npcs||[]).filter(n=>a.npcIds.includes(n.id));
 const linkedLocations=(campaign()?.locations||[]).filter(l=>a.locationIds.includes(l.id));
 return`<article class="story-card campaign-bullet-entry adventure-scene-record" data-reorder-adventure="scenes" draggable="true" tabindex="0" data-scene-row="${esc(scene.id)}">
 <div class="adventure-scene-record-main"><strong>${esc(scene.title)}</strong><span class="mini">${esc(sceneStatus(scene.status))} · ${esc(a.chapters.find(c=>c.id===scene.chapterId)?.title||'Sem capítulo')}${scene.missionIds?.length?' · '+esc(a.missions.find(m=>m.id===scene.missionIds[0])?.title||''):''}</span></div>
 <div class="campaign-line-actions">${visibleToggle('scenes',scene.id,scene.visibleToPlayers)}${moveTools('scenes',scene.id,i,a.scenes.length)}
 ${scene.status==='planned'? `<button type="button" data-start-scene="${esc(scene.id)}">Iniciar</button><button type="button" class="secondary" data-skip-scene="${esc(scene.id)}">Ignorar</button>`:''}
 ${scene.status==='active'?`<button type="button" data-complete-scene="${esc(scene.id)}">Concluir</button>`:''}
 <button type="button" class="danger campaign-list-remove" data-remove-entity="${esc(scene.id)}" data-key="scenes">Excluir cena</button></div>
 <details class="hub-scene-editor" data-scene-editor ${expandedSceneIds.has(scene.id)?'open':''}>
 <summary>Editar cena e vínculos</summary>
 <div class="form-grid two">
 <label>Nome<input data-scene-field="title" value="${esc(scene.title)}"></label>
 <label>Capítulo<select data-scene-field="chapterId">${chapterOptions(a,scene.chapterId)}</select></label>
 <label>Local<select data-scene-field="locationId">${entitySelect(linkedLocations,scene.locationId,'— Sem local —')}</select></label>
  <label>Área de exploração<select data-scene-field="areaId">${entitySelect(a.exploration?.areas||[],scene.areaId,'— Sem área —')}</select></label>
 <label>Cena da sessão<select data-scene-session-scene>${sessionSceneOptionsForAdventure(a,scene)}</select></label>
 <label>Encontro<select data-scene-encounter>${encounterOptions(scene)}</select></label>
 <label>Objetivo da cena<input data-scene-field="objective" value="${esc(scene.objective)}"></label>
 <label class="wide">Descrição<textarea data-scene-field="description">${esc(scene.description)}</textarea></label>
 <label class="wide">Desfecho<textarea data-scene-field="outcome">${esc(scene.outcome)}</textarea></label>
 <label class="wide">Notas do Mestre<textarea data-scene-field="notes">${esc(scene.notes)}</textarea></label>
 </div>
 <div class="form-grid two">
 <fieldset><legend>NPCs</legend><div class="entity-checks">${checks(linkedNpcs,scene.npcIds,'npcIds')}</div></fieldset>
 <fieldset><legend>Monstros</legend><div class="entity-checks">${checks(a.monsters||[],scene.monsterIds,'monsterIds')}</div></fieldset>
 <fieldset><legend>Objetivos</legend><div class="entity-checks">${checks(a.missions||[],scene.missionIds,'missionIds')}</div></fieldset>
 </div>
 </details></article>`
}
function timelineCard(row){return`<article class="story-card timeline-row" data-entity-row="${esc(row.id)}" data-entity-key="timelineEvents"><div><strong>${esc(row.title)}</strong> <span class="badge">${esc(new Date(row.at).toLocaleString('pt-BR'))}</span>${row.automatic?'<span class="badge">Automático</span>':''}</div>${row.text?`<p>${esc(row.text)}</p>`:''}${row.automatic?'':`<div class="row-actions"><button class="danger" data-remove-entity="${esc(row.id)}" data-key="timelineEvents">Excluir registro</button></div>`}</article>`}
function adventureTimelineHtml(a){
 const flowchart=adventureTimelineView==='flowchart';
 const body=flowchart?renderAdventureTimelineDiagram(a.timelineEvents):`<div class="story-list">${a.timelineEvents.length?a.timelineEvents.map(timelineCard).join(''):'<div class="story-empty">Nenhum registro.</div>'}</div>`;
 return `<section id="linha-tempo" class="card adventure-timeline-section">
 <div class="hub-timeline-heading"><h2>Linha do tempo</h2>${timelineViewToggle(adventureTimelineView)}</div>
 ${body}
 <div class="form-grid" style="margin-top:10px"><label>Título<input id="new-timeline-title"></label><label>Registro<input id="new-timeline-text"></label><div style="align-self:end"><button id="add-timeline" type="button">Adicionar registro</button></div></div>
 <div class="row-actions" style="margin-top:10px"><button type="button" data-save-adventure-section>Salvar</button></div>
 </section>`
}
function linkedSessionsHtml(a){
 const ids=new Set(a.scenes.map(s=>s.sessionId).filter(Boolean));
 const rows=(campaign()?.sessions||[]).filter(s=>s.adventureId===a.id||ids.has(s.id)).sort((x,y)=>(x.order||x.number)-(y.order||y.number));
 return`<section id="sessoes" class="card campaign-editor-card"><h2>Sessões da Aventura</h2>
 <div class="list campaign-player-story-grid">${rows.length?rows.map(s=>renderCampaignSessionCard(s,a.campaignId)).join(''):'<div class="empty">Nenhuma sessão vinculada à Aventura.</div>'}</div></section>`;
}
function monstersHtml(a){return section('Monstros','monstros',ordered(a.monsters||[]).map((monster,i,rows)=>`<article class="story-card campaign-bullet-entry" draggable="true" tabindex="0" data-reorder-adventure="monsters">
<div><strong>${esc(monster.name)}</strong><p class="mini">${esc(monster.source||'Monstro da Aventura')}</p></div><div class="campaign-line-actions">
${visibleToggle('monsters',monster.id,monster.visibleToPlayers)}${moveTools('monsters',monster.id,i,rows.length)}
<button type="button" class="danger" data-remove-entity="${esc(monster.id)}" data-key="monsters">Excluir</button></div></article>`).join(''),
`<div class="form-grid two"><label>Monstro da Biblioteca<select id="new-adventure-monster"><option value="">${monsterCatalogReady?'— Selecione —':'Carregando Biblioteca...'}</option>${monsterCatalog.map(m=>option(m.id,m.name+' · '+(m.sourceTitle||m.sourceId||''),'')).join('')}</select></label>
<div class="row-actions"><button type="button" id="add-adventure-monster">Adicionar monstro</button></div></div>`)}
function section(title,id,body,form=''){return`<section id="${id}" class="card"><h2>${esc(title)}</h2><div class="story-list">${body||'<div class="story-empty">Nenhum registro.</div>'}</div>${form}<div class="row-actions" style="margin-top:10px"><button type="button" data-save-adventure-section>Salvar</button></div></section>`}
function workspaceHtml(a){
 const c=campaign(),npcs=(c?.npcs||[]).filter(n=>a.npcIds.includes(n.id)).sort((x,y)=>a.npcIds.indexOf(x.id)-a.npcIds.indexOf(y.id)),locations=(c?.locations||[]).filter(l=>a.locationIds.includes(l.id)).sort((x,y)=>a.locationIds.indexOf(x.id)-a.locationIds.indexOf(y.id));
 const nav=[['visao-geral','Visão geral'],['participantes','Participantes'],['exploracao','Áreas e Salas'],['mapas','Mapas e Níveis'],['criar-area','Adicionar área'],['criar-mapa','Adicionar mapa'],['npcs','NPCs'],['faccoes','Facções'],['missoes','Objetivos'],['monstros','Monstros'],['cenas','Cenas'],['sessoes','Sessões'],['linha-tempo','Linha do tempo'],['notas-mestre','Notas do Mestre']];
 const objectives=section('Objetivos','missoes',ordered(a.missions).map((m,i)=>missionCard(m,a,i)).join(''),`<div class="form-grid two"><label>Objetivo<input id="new-mission-title"></label><label>Descrição<input id="new-mission-description"></label><button type="button" id="add-mission">Adicionar objetivo</button></div>`);
 const npcPanel=section('NPCs','npcs',npcs.map((n,i)=>npcCard(n,a,c,i)).join(''),`<div class="form-grid two"><label>Nome<input id="new-npc-name"></label><label>Papel<input id="new-npc-role"></label><button type="button" id="add-campaign-npc">Adicionar NPC</button><a class="btn secondary" href="criacao-personagem.html?npc=1">Criar NPC</a>
 <label>NPC cadastrado<select id="attach-existing-npc"><option value="">— Selecione um NPC —</option>${readRegisteredNpcs().filter(n=>!(c?.npcs||[]).some(row=>row.sheetId===n.id)).map(n=>option(n.id,n.name||'NPC sem nome','')).join('')}</select></label><button type="button" id="add-registered-npc">Vincular NPC</button></div>`);
 const scenes=section('Cenas','cenas',ordered(a.scenes).map((scene,i)=>sceneCard(scene,a,i)).join(''),`<div class="form-grid two"><label>Nome da cena<input id="new-scene-title"></label>
 <label>Capítulo<select id="new-scene-chapter">${chapterOptions(a)}</select></label>
 <label>Objetivo<select id="new-scene-objective">${objectiveOptions(a)}</select></label>
 <label>Local<select id="new-scene-location">${entitySelect(locations,'','— Sem local —')}</select></label>
  <label>Área da exploração<select id="new-scene-area">${entitySelect(a.exploration?.areas||[],'','— Sem área —')}</select></label>
 <label>NPC<select id="new-scene-npc">${npcOptions(a)}</select></label>
 <label>Monstro<select id="new-scene-monster">${monsterOptions(a)}</select></label>
 <button type="button" id="add-scene">Criar cena</button></div>`);
 return`${operationalHtml(a)}
 ${renderNextCampaignSession(c,{canPlan:true,adventures:adventuresForCampaign(adventures,c.id)})}
 <nav class="section-nav adventure-nav hub-detail-nav">${nav.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}</nav>
 <div class="campaign-sections campaign-editor-grid hub-detail-grid">${basicsHtml(a)}${participantsHtml(a)}
 ${renderAdventureExploration(a,c)}${npcPanel}${renderAdventureFactions(a,c)}${objectives}${monstersHtml(a)}${scenes}
 ${linkedSessionsHtml(a)}${renderTimeline(a)}${noteSection(a.dmNoteEntries)}</div>`;
}

function render(){const root=$('adventure-root');if(!root)return;campaigns=readCampaigns();characters=readCharacters();if(campaignId&&!campaignById(campaigns,campaignId))campaignId=campaigns[0]?.id||'';normalizeRefs();if(adventureId&&!adventureById(adventures,adventureId)){adventureId='';expandedSceneIds.clear()}const a=adventure();if(a)campaignId=a.campaignId;root.innerHTML=`${a?"":topHtml()}<div id="adventure-feedback" class="status" hidden></div><div class="adventure-shell ${a?"hub-detail-page":""}">${a?`${workspaceHtml(a)}`:listHtml()}</div>`;bind();updateAppShellContext();hydrateMediaImages(root).catch(()=>{})}
function bindAdventureFields(){document.querySelectorAll('[data-adventure-field]').forEach(input=>{const eventName=input.tagName==='TEXTAREA'||input.type==='text'||input.type==='url'?'input':'change';input.addEventListener(eventName,()=>{clearTimeout(saveTimer);saveTimer=setTimeout(()=>commit(updateAdventure(adventures,adventureId,{[input.dataset.adventureField]:input.type==='number'?Number(input.value):input.value}),'Aventura salva.'),eventName==='input'?350:0)})})}
function bindAdventureCover(){const picker=document.querySelector('#visao-geral [data-image-picker]'),a=adventure();if(!picker||!a)return;bindImagePicker(picker,{onSelect:async file=>{const before=adventures,previous=a.coverImage,media=await uploadImage({campaignId:a.campaignId,entityType:'adventure',entityId:a.id,file}),result=updateAdventure(adventures,a.id,{coverImage:media,coverImageUrl:''});if(!result.ok){deleteImage(media).catch(()=>{});throw new Error(result.reason)}adventures=writeAdventures(result.list);try{await persistCampaignMediaState(a.campaignId,{entityType:'adventure',entityId:a.id})}catch(error){adventures=writeAdventures(before);await deleteImage(media).catch(()=>{});render();throw new Error('A imagem não pôde ser sincronizada. A capa anterior foi preservada.')}render();feedback('Imagem salva e sincronizada.',true);if(previous?.id&&previous.id!==media.id)await deleteImage(previous).catch(()=>{})},onRemove:async()=>{const before=adventures,previous=a.coverImage,result=updateAdventure(adventures,a.id,{coverImage:null,coverImageUrl:''});if(!result.ok)throw new Error(result.reason);adventures=writeAdventures(result.list);try{await persistCampaignMediaState(a.campaignId,{entityType:'adventure',entityId:a.id})}catch(error){adventures=writeAdventures(before);render();throw new Error('A remoção não pôde ser sincronizada. A imagem foi preservada.')}render();feedback('Imagem removida e sincronizada.',true);if(previous?.id)await deleteImage(previous).catch(()=>{})},onError:error=>feedback(error?.message||'Não foi possível salvar a imagem.',false)})}
function bindParticipants(){
 bindAdventureRoster({getAdventure:adventure,getCampaign:campaign,characters,feedback,
  save:(rows,message)=>commit(updateAdventure(adventures,adventureId,{
   participantAssignments:rows,
   participantUsernames:rows.map(row=>row.username),
   characterIds:[...new Set(rows.map(row=>row.characterId).filter(Boolean))],
   participantAccessConfigured:true
  }),message)})
}
function bindEntityRows(){document.querySelectorAll('[data-entity-row]').forEach(row=>{const id=row.dataset.entityRow,key=row.dataset.entityKey;row.querySelectorAll('[data-entity-field]').forEach(input=>input.addEventListener('change',()=>commit(updateAdventureEntity(adventures,adventureId,key,id,{[input.dataset.entityField]:input.type==='number'?Number(input.value):input.value}),'Registro atualizado.')));row.querySelector('[data-clue-status]')?.addEventListener('change',e=>commit(setAdventureClueStatus(adventures,adventureId,id,e.target.value),'Pista atualizada.'));row.querySelector('[data-material-revealed]')?.addEventListener('change',e=>commit(setAdventureHandoutRevealed(adventures,adventureId,id,e.target.value==='true'),'Material atualizado.'));row.querySelector('[data-treasure-status]')?.addEventListener('change',e=>commit(setAdventureTreasureStatus(adventures,adventureId,id,e.target.value),'Tesouro atualizado.'));row.querySelector('[data-mission-status]')?.addEventListener('change',e=>commit(setAdventureMissionStatus(adventures,adventureId,id,e.target.value),'Missão atualizada.'));row.querySelectorAll('[data-mission-character]').forEach(input=>input.addEventListener('change',()=>{const characterIds=[...row.querySelectorAll('[data-mission-character]:checked')].map(el=>el.dataset.missionCharacter);commit(updateAdventureEntity(adventures,adventureId,'missions',id,{characterIds}),'Missão atualizada.')}))})}
function bindScenes(){document.querySelectorAll('[data-scene-row]').forEach(row=>{const id=row.dataset.sceneRow;row.querySelector('[data-scene-editor]')?.addEventListener('toggle',event=>{if(event.target.open)expandedSceneIds.add(id);else expandedSceneIds.delete(id)});row.querySelectorAll('[data-scene-field]').forEach(input=>input.addEventListener('change',()=>{const field=input.dataset.sceneField,value=input.type==='number'?Number(input.value):input.value;commit(updateAdventureEntity(adventures,adventureId,'scenes',id,{[field]:value}),'Cena atualizada.')}));row.querySelector('[data-scene-session-scene]')?.addEventListener('change',e=>syncAdventureSceneToSessionScene(id,e.target.value));row.querySelector('[data-scene-encounter]')?.addEventListener('change',e=>{const scene=adventure()?.scenes.find(s=>s.id===id);commit(updateAdventureEntity(adventures,adventureId,'scenes',id,{encounterRef:{sessionId:scene?.sessionId||null,encounterId:e.target.value||null}}),'Encontro vinculado à cena.')});row.querySelectorAll('[data-scene-link]').forEach(input=>input.addEventListener('change',()=>{const field=input.dataset.sceneLink,ids=[...row.querySelectorAll(`[data-scene-link="${field}"]:checked`)].map(el=>el.value);commit(updateAdventureEntity(adventures,adventureId,'scenes',id,{[field]:ids}),'Cena atualizada.')}))})}
function bindCampaignEntities(){document.querySelectorAll('[data-campaign-npc]').forEach(row=>{const id=row.dataset.campaignNpc;row.querySelectorAll('[data-campaign-npc-field]').forEach(input=>input.addEventListener('change',()=>commitCampaign(updateCampaignNpc(campaigns,campaignId,id,{[input.dataset.campaignNpcField]:input.value}),'NPC atualizado.')))});document.querySelectorAll('[data-campaign-location]').forEach(row=>{const id=row.dataset.campaignLocation;row.querySelectorAll('[data-campaign-location-field]').forEach(input=>input.addEventListener('change',()=>commitCampaign(updateCampaignLocation(campaigns,campaignId,id,{[input.dataset.campaignLocationField]:input.value}),'Local atualizado.')))});document.querySelectorAll('[data-use-campaign-npc]').forEach(input=>input.addEventListener('change',()=>{const a=adventure(),id=input.dataset.useCampaignNpc,npcIds=input.checked?[...new Set([...a.npcIds,id])]:a.npcIds.filter(x=>x!==id);commit(input.checked?updateAdventure(adventures,adventureId,{npcIds}):unlinkAdventureCampaignEntity(adventures,adventureId,'npc',id),'NPCs da Aventura atualizados.')}));document.querySelectorAll('[data-use-campaign-location]').forEach(input=>input.addEventListener('change',()=>{const a=adventure(),id=input.dataset.useCampaignLocation,locationIds=input.checked?[...new Set([...a.locationIds,id])]:a.locationIds.filter(x=>x!==id);commit(input.checked?updateAdventure(adventures,adventureId,{locationIds}):unlinkAdventureCampaignEntity(adventures,adventureId,'location',id),'Locais da Aventura atualizados.')}))}
function removeCampaignEntityRefs(type,id){let next=adventures;for(const a of adventuresForCampaign(next,campaignId)){const result=unlinkAdventureCampaignEntity(next,a.id,type,id);if(result.ok)next=result.list}adventures=writeAdventures(next)}
function deliverTreasure(id){const a=adventure(),item=a?.treasures.find(x=>x.id===id),character=characters.find(x=>x.id===item?.recipientCharacterId);if(!item||!character)return feedback('Selecione um personagem destinatário.',false);character.sheet=character.sheet||{};character.sheet.inventory={cp:0,sp:0,ep:0,gp:0,pp:0,notes:'',magicItems:'',otherHoldings:'',...(character.sheet.inventory||{})};const field=item.type==='magic-item'?'magicItems':'otherHoldings',entry=`${item.quantity>1?`${item.quantity}× `:''}${item.name}`,current=String(character.sheet.inventory[field]||'').trim();character.sheet.inventory[field]=current?`${current}\n${entry}`:entry;character.updatedAt=new Date().toISOString();writeCharacters(characters);commit(setAdventureTreasureStatus(adventures,adventureId,id,'claimed'),`${item.name} entregue a ${character.name||'personagem'}.`)}
function saveAdventureSection(section){
 clearTimeout(saveTimer);
 let nextAdventures=adventures,nextCampaigns=campaigns,changedAdventure=false,changedCampaign=false;
 const fields=[...section.querySelectorAll('[data-adventure-field]')];
 if(fields.length){
  const patch=Object.fromEntries(fields.map(input=>[input.dataset.adventureField,input.value]));
  const result=updateAdventure(nextAdventures,adventureId,patch);
  if(!result.ok)return feedback(result.reason,false);nextAdventures=result.list;changedAdventure=true
 }
 // O elenco é salvo ao adicionar, remover, vincular ou reorganizar jogadores.
 for(const row of section.querySelectorAll('[data-entity-row]')){
  const patch={};
  for(const input of row.querySelectorAll('[data-entity-field]'))patch[input.dataset.entityField]=input.type==='number'?Number(input.value):input.value;
  if(!Object.keys(patch).length)continue;
  const result=updateAdventureEntity(nextAdventures,adventureId,row.dataset.entityKey,row.dataset.entityRow,patch);
  if(!result.ok)return feedback(result.reason,false);nextAdventures=result.list;changedAdventure=true
 }
 for(const row of section.querySelectorAll('[data-scene-row]')){
  const patch={};
  for(const input of row.querySelectorAll('[data-scene-field]'))patch[input.dataset.sceneField]=input.type==='number'?Number(input.value):input.value;
  for(const input of row.querySelectorAll('[data-scene-link]')){
   const key=input.dataset.sceneLink;if(key in patch)continue;
   patch[key]=[...row.querySelectorAll(`[data-scene-link="${key}"]:checked`)].map(el=>el.value)
  }
  if(!Object.keys(patch).length)continue;
  const result=updateAdventureEntity(nextAdventures,adventureId,'scenes',row.dataset.sceneRow,patch);
  if(!result.ok)return feedback(result.reason,false);nextAdventures=result.list;changedAdventure=true
 }
 for(const row of section.querySelectorAll('[data-campaign-npc]')){
  const patch=Object.fromEntries([...row.querySelectorAll('[data-campaign-npc-field]')].map(input=>[input.dataset.campaignNpcField,input.value]));
  if(!Object.keys(patch).length)continue;
  const result=updateCampaignNpc(nextCampaigns,campaignId,row.dataset.campaignNpc,patch);
  if(!result.ok)return feedback(result.reason,false);nextCampaigns=result.list;changedCampaign=true
 }
 for(const row of section.querySelectorAll('[data-campaign-location]')){
  const patch=Object.fromEntries([...row.querySelectorAll('[data-campaign-location-field]')].map(input=>[input.dataset.campaignLocationField,input.value]));
  if(!Object.keys(patch).length)continue;
  const result=updateCampaignLocation(nextCampaigns,campaignId,row.dataset.campaignLocation,patch);
  if(!result.ok)return feedback(result.reason,false);nextCampaigns=result.list;changedCampaign=true
 }
 if(changedCampaign)campaigns=writeCampaigns(nextCampaigns);
 if(changedAdventure)adventures=writeAdventures(nextAdventures);
 else adventures=writeAdventures(adventures);
 render();feedback('Etapa salva.',true)
}
function bindAdventureSaveButtons(){
 document.querySelectorAll('[data-save-adventure-section]').forEach(button=>button.addEventListener('click',event=>{
  event.preventDefault();const section=button.closest('section');if(section)saveAdventureSection(section)
 }))
}
async function reassignSelectedAdventure(destinationId){
 const current=adventure(),previousId=current?.campaignId;
 if(!current||!destinationId||destinationId===previousId){render();return}
 const dependent=current.scenes.some(scene=>scene.sessionId||scene.sessionSceneId||scene.encounterRef?.encounterId)
  ||(campaign()?.sessions||[]).some(session=>session.adventureId===current.id||session.scenes.some(scene=>current.scenes.some(row=>row.id===scene.adventureSceneId)))
  ||current.participantUsernames.length>0||current.characterIds.length>0||current.npcIds.length>0||current.locationIds.length>0;
 if(dependent&&!confirm('Mudar a Campanha desta Aventura? Seus capítulos, cenas, missões e demais conteúdos serão preservados. Vínculos exclusivos da campanha anterior (sessões, jogadores, personagens, NPCs e locais) serão desvinculados quando não pertencerem à nova Campanha.')){render();return}
 clearTimeout(saveTimer);
 const input=$('adventure-assignment');if(input)input.disabled=true;
 const oldCampaigns=campaigns,oldAdventures=adventures;
 let newCover=null;
 try{
  if(current.coverImage?.id&&current.coverImage.campaignId!==destinationId){
   newCover=await copyAdventureCoverToCampaign(current.coverImage,destinationId,current.id);
  }
  let result=reassignAdventureCampaign(adventures,campaigns,current.id,destinationId);
  if(!result.ok)throw new Error(result.reason);
  if(newCover){
   const updated=updateAdventure(result.list,current.id,{coverImage:newCover});
   if(!updated.ok)throw new Error(updated.reason);
   result={...result,list:updated.list,adventure:updated.adventure}
  }
  campaigns=writeCampaigns(result.campaigns);
  adventures=writeAdventures(result.list);
  campaignId=destinationId;adventureId=current.id;syncUrl();
  try{await persistAdventureCampaignReassignment(previousId,destinationId)}
  catch(error){
   if(!newCover){
    render();feedback('Aventura reatribuída neste dispositivo. Sincronização online pendente: '+(error?.message||'indisponível'),false);return
   }
   throw error
  }
  if(newCover)await deleteImage(current.coverImage).catch(()=>{});
  render();feedback('Aventura atribuída à nova Campanha, sem criar outra.',true)
 }catch(error){
  campaigns=writeCampaigns(oldCampaigns);adventures=writeAdventures(oldAdventures);
  campaignId=previousId;adventureId=current.id;syncUrl();
  if(newCover){await deleteImage(newCover).catch(()=>{});await persistAdventureCampaignReassignment(previousId,destinationId).catch(()=>{})}
  render();feedback(error?.message||'Não foi possível alterar a Campanha da Aventura.',false)
 }
}
function bindAdventureVisibilityAndOrder(){
 const a=adventure();if(!a)return;
 const saveList=(key,items,message)=>{
  if(['npcs','locations'].includes(key)){
   const patch=key==='npcs'?{npcIds:items}:{locationIds:items};
   commit(updateAdventure(adventures,adventureId,patch),message);return
  }
  const result=updateAdventure(adventures,adventureId,{[key]:items.map((item,i)=>({...item,order:i+1}))});
  commit(result,message)
 };
 const move=(kind,id,direction,targetId='')=>{
  const current=adventure();if(!current)return;
  const rows=['npcs','locations'].includes(kind)?[...(kind==='npcs'?current.npcIds:current.locationIds)]:ordered(current[kind]||[]).map(x=>x.id);
  const from=rows.indexOf(id),to=targetId?rows.indexOf(targetId):from+(direction==='up'?-1:1);
  if(from<0||to<0||to>=rows.length||from===to)return;
  rows.splice(to,0,rows.splice(from,1)[0]);
  const items=['npcs','locations'].includes(kind)?rows:rows.map(rowId=>current[kind].find(x=>x.id===rowId)).filter(Boolean);
  saveList(kind,items,'Ordem atualizada.');
 };
 document.querySelectorAll('[data-adventure-visible]').forEach(input=>input.addEventListener('change',()=>{
  const a=adventure(),id=input.dataset.visibleId,key=input.dataset.adventureVisible,on=input.checked;
  if(key==='npcs'||key==='locations'){
   const mapKey=key==='npcs'?'npcVisibility':'locationVisibility',patch={[mapKey]:{...(a[mapKey]||{}),[id]:on}};
   commit(updateAdventure(adventures,adventureId,patch),'Visibilidade atualizada.');
  }else commit(updateAdventureEntity(adventures,adventureId,key,id,{visibleToPlayers:on}),'Visibilidade atualizada.')
 }));
 document.querySelectorAll('[data-adventure-move]').forEach(button=>button.addEventListener('click',()=>move(button.dataset.kind,button.dataset.id,button.dataset.adventureMove)));
 let drag=null;
 const root=$('adventure-root');
 root?.querySelectorAll('[data-reorder-adventure]').forEach(row=>{
  row.addEventListener('dragstart',event=>{drag={kind:row.dataset.reorderAdventure,id:row.dataset.entityRow||row.dataset.campaignNpc||row.dataset.campaignLocation||row.querySelector('[data-id]')?.dataset.id};if(!drag.id)drag.id=row.querySelector('[data-visible-id]')?.dataset.visibleId;if(event.dataTransfer)event.dataTransfer.effectAllowed='move'});
  row.addEventListener('dragover',event=>{if(drag?.kind===row.dataset.reorderAdventure)event.preventDefault()});
  row.addEventListener('drop',event=>{event.preventDefault();const kind=row.dataset.reorderAdventure,target=row.dataset.entityRow||row.dataset.campaignNpc||row.dataset.campaignLocation||row.querySelector('[data-visible-id]')?.dataset.visibleId;if(drag&&kind===drag.kind&&target&&drag.id!==target)move(kind,drag.id,'down',target);drag=null});
  row.addEventListener('dragend',()=>{drag=null})
 });
 // O mesmo padrão de arrastar por toque/mouse dos Locais importantes:
 // ação iniciada na alça, sem interceptar a edição de campos.
 let lifted=null;
 const rowId=node=>node?.dataset.entityRow||node?.dataset.campaignNpc||node?.dataset.campaignLocation||node?.dataset.sceneRow||node?.querySelector('[data-visible-id]')?.dataset.visibleId||'';
 const clearTargets=()=>root?.querySelectorAll('.adventure-drop-target,.adventure-dragging').forEach(node=>node.classList.remove('adventure-drop-target','adventure-dragging'));
 for(const grip of root?.querySelectorAll('[data-adventure-grip]')||[]){
  grip.addEventListener('pointerdown',event=>{
   if(event.pointerType==='mouse'&&event.button!==0)return;
   const node=grip.closest('[data-reorder-adventure]');if(!node)return;
   lifted={kind:node.dataset.reorderAdventure,id:rowId(node),pointerId:event.pointerId,startY:event.clientY,target:null,moved:false};
   grip.setPointerCapture?.(event.pointerId);
  });
  grip.addEventListener('pointermove',event=>{
   if(!lifted||event.pointerId!==lifted.pointerId)return;
   if(!lifted.moved&&Math.abs(event.clientY-lifted.startY)<7)return;
   lifted.moved=true;clearTargets();
   const node=grip.closest('[data-reorder-adventure]');node?.classList.add('adventure-dragging');
   const candidate=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-reorder-adventure]');
   lifted.target=candidate&&candidate.dataset.reorderAdventure===lifted.kind&&rowId(candidate)!==lifted.id?rowId(candidate):null;
   if(lifted.target)candidate.classList.add('adventure-drop-target');
  });
  grip.addEventListener('pointerup',event=>{
   if(!lifted||event.pointerId!==lifted.pointerId)return;
   const info=lifted;lifted=null;clearTargets();
   if(info.moved&&info.target){event.preventDefault();move(info.kind,info.id,'down',info.target)}
  });
  grip.addEventListener('pointercancel',()=>{lifted=null;clearTargets()});
 }
 $('add-adventure-monster')?.addEventListener('click',async()=>{
  const id=$('new-adventure-monster')?.value,row=monsterCatalog.find(x=>x.id===id);
  if(!row)return feedback('Selecione um monstro da Biblioteca.',false);
  try{
   const monster=await loadEncounterMonsterDetail(row);
   commit(addAdventureMonster(adventures,adventureId,{name:monster.name,monsterId:monster.id||row.id,source:monster.source,ac:monster.ac,maxHp:monster.maxHp,initiativeModifier:monster.initiativeModifier}),'Monstro adicionado à Aventura.')
  }catch(error){feedback(error?.message||'Falha ao carregar monstro.',false)}
 });
 bindStructuredDetails({getCampaign:()=>adventure(),getNpcs:()=>[],save:(patch,{message}={})=>commit(updateAdventure(adventures,adventureId,patch),message||'Linha do tempo atualizada.'),feedback})
}

function bindAdventureNotes(){
 const section=document.getElementById('notas-mestre');
 bindNoteSection(section,{
  read:()=>adventure()?.dmNoteEntries||[],
  save:rows=>commit(updateAdventure(adventures,adventureId,{dmNoteEntries:rows}),'Notas da Aventura atualizadas.')
 });
}
function bind(){const c=campaign();
 const list=$('adventure-list');
 list?.querySelectorAll('[data-status-disclosure]').forEach(disclosure=>disclosure.addEventListener('toggle',()=>{
  if(!disclosure.open)return;
  list.querySelectorAll('[data-status-disclosure][open]').forEach(other=>{if(other!==disclosure)other.open=false})
 }));
 list?.querySelectorAll('[data-next-adventure-status]').forEach(button=>button.addEventListener('click',()=>{
  const status=button.dataset.nextAdventureStatus,id=button.dataset.adventureStatusId;
  const previous=adventures.find(a=>a.id===id)?.status||'planned';
  if(!ADVENTURE_STATUSES.includes(status))return;
  if(status===previous){button.closest('details')?.removeAttribute('open');return}
  const result=updateAdventure(adventures,id,{status});
  if(!result.ok){feedback(result.reason||'Não foi possível alterar o status.',false);return}
  adventures=writeAdventures(result.list);render();
  [...document.querySelectorAll('#adventure-list [data-adventure-status-trigger]')].find(el=>el.dataset.adventureStatusTrigger===id)?.focus()
 }));
 $('adventure-status-filter')?.addEventListener('change',event=>{listStatusFilter=event.target.value;render()});
 $('adventure-campaign-filter')?.addEventListener('change',event=>{listCampaignFilter=event.target.value;render()});
 bindAdventureGroupScroll(list);
 $('open-adventure-create')?.addEventListener('click',event=>{event.preventDefault();createPanelOpen=true;if(listCampaignFilter!=='all')campaignId=listCampaignFilter;render();$('new-adventure-title')?.focus()});
 $('cancel-adventure-create')?.addEventListener('click',()=>{createPanelOpen=false;render()});

 
$('adventure-assignment')?.addEventListener('change',event=>{void reassignSelectedAdventure(event.target.value)});$('adventure-campaign')?.addEventListener('change',e=>{campaignId=e.target.value;adventureId='';syncUrl();render()});$('create-adventure')?.addEventListener('click',()=>commit(createAdventure(adventures,newAdventureData()),'Aventura criada.'));document.querySelectorAll('[data-open-adventure]').forEach(b=>b.addEventListener('click',()=>{adventureId=b.dataset.openAdventure;const selected=adventure();if(selected)campaignId=selected.campaignId;syncUrl();render()}));document.querySelectorAll('[data-delete-adventure]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Excluir esta Aventura?'))return;const target=adventures.find(row=>row.id===b.dataset.deleteAdventure),result=removeAdventure(adventures,b.dataset.deleteAdventure);if(result.ok){adventures=writeAdventures(result.list);if(adventureId===b.dataset.deleteAdventure)adventureId='';render();feedback('Aventura excluída.');if(target?.coverImage)deleteImage(target.coverImage).catch(()=>{})}}));if(!adventure())return;bindAdventureExploration({getAdventure:adventure,getCampaign:campaign,feedback,save:(exploration,message,rerenderOnly=false)=>{if(rerenderOnly){render();return}commit(updateAdventure(adventures,adventureId,{exploration}),message)}});bindAdventureFields();bindAdventureCover();bindParticipants();bindEntityRows();bindScenes();bindCampaignEntities();bindAdventureSaveButtons();bindAdventureNotes();bindAdventureVisibilityAndOrder();document.querySelectorAll('[data-remove-entity]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Excluir este registro da Aventura?'))return;commit(removeAdventureEntity(adventures,adventureId,b.dataset.key,b.dataset.removeEntity),'Registro excluído.')}));document.querySelectorAll('[data-start-scene]').forEach(b=>b.addEventListener('click',()=>commit(startAdventureScene(adventures,adventureId,b.dataset.startScene),'Cena iniciada.')));document.querySelectorAll('[data-complete-scene]').forEach(b=>b.addEventListener('click',()=>commit(completeAdventureScene(adventures,adventureId,b.dataset.completeScene),'Cena concluída.')));document.querySelectorAll('[data-skip-scene]').forEach(b=>b.addEventListener('click',()=>commit(skipAdventureScene(adventures,adventureId,b.dataset.skipScene),'Cena ignorada.')));$('add-chapter')?.addEventListener('click',()=>commit(addAdventureChapter(adventures,adventureId,{title:$('new-chapter-title')?.value,arc:$('new-chapter-arc')?.value}),'Capítulo adicionado.'));$('add-mission')?.addEventListener('click',()=>commit(addAdventureMission(adventures,adventureId,{title:$('new-mission-title')?.value,kind:'side',description:$('new-mission-description')?.value}),'Missão adicionada.'));$('add-clue')?.addEventListener('click',()=>commit(addAdventureClue(adventures,adventureId,{title:$('new-clue-title')?.value,text:$('new-clue-text')?.value}),'Pista adicionada.'));$('add-material')?.addEventListener('click',()=>commit(addAdventureHandout(adventures,adventureId,{title:$('new-material-title')?.value,content:$('new-material-content')?.value}),'Material adicionado.'));$('add-treasure')?.addEventListener('click',()=>commit(addAdventureTreasure(adventures,adventureId,{name:$('new-treasure-name')?.value,description:$('new-treasure-description')?.value,type:'magic-item'}),'Tesouro adicionado.'));$('add-scene')?.addEventListener('click',()=>commit(addAdventureScene(adventures,adventureId,{title:$('new-scene-title')?.value,chapterId:$('new-scene-chapter')?.value||null,locationId:$('new-scene-location')?.value||null,areaId:$('new-scene-area')?.value||null,missionIds:[$('new-scene-objective')?.value].filter(Boolean),npcIds:[$('new-scene-npc')?.value].filter(Boolean),monsterIds:[$('new-scene-monster')?.value].filter(Boolean)}),'Cena adicionada.'));$('add-timeline')?.addEventListener('click',()=>commit(addAdventureTimelineEntry(adventures,adventureId,{title:$('new-timeline-title')?.value,text:$('new-timeline-text')?.value}),'Registro adicionado.'));$('add-registered-npc')?.addEventListener('click',()=>{
 const selected=$('attach-existing-npc')?.value,entry=readRegisteredNpcs().find(x=>x.id===selected);
 if(!entry)return feedback('Selecione um NPC cadastrado.',false);
 const existing=campaign()?.npcs?.find(x=>x.sheetId===entry.id);
 if(existing){if(adventure()?.npcIds.includes(existing.id))return feedback('NPC já vinculado à Aventura.',false);return commit(updateAdventure(adventures,adventureId,{npcIds:[...adventure().npcIds,existing.id]}),'NPC vinculado.')}
 const result=addCampaignNpc(campaigns,campaignId,{name:entry.name||'NPC',sheetId:entry.id,role:entry.role||''});
 if(!result.ok)return feedback(result.reason,false);campaigns=writeCampaigns(result.list);
 commit(updateAdventure(adventures,adventureId,{npcIds:[...new Set([...adventure().npcIds,result.entity.id])]}),'NPC cadastrado vinculado à Campanha e à Aventura.')
 });$('add-campaign-npc')?.addEventListener('click',()=>{const result=addCampaignNpc(campaigns,campaignId,{name:$('new-npc-name')?.value,role:$('new-npc-role')?.value});if(!result.ok)return feedback(result.reason,false);campaigns=writeCampaigns(result.list);commit(updateAdventure(adventures,adventureId,{npcIds:[...new Set([...adventure().npcIds,result.entity.id])]}),'NPC adicionado à Campanha e à Aventura.')});$('add-campaign-location')?.addEventListener('click',()=>{const result=addCampaignLocation(campaigns,campaignId,{name:$('new-location-name')?.value,type:$('new-location-type')?.value});if(!result.ok)return feedback(result.reason,false);campaigns=writeCampaigns(result.list);commit(updateAdventure(adventures,adventureId,{locationIds:[...new Set([...adventure().locationIds,result.entity.id])]}),'Local adicionado à Campanha e à Aventura.')});document.querySelectorAll('[data-delete-campaign-npc]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Excluir este NPC da Campanha e remover seus vínculos em todas as Aventuras?'))return;removeCampaignEntityRefs('npc',b.dataset.deleteCampaignNpc);commitCampaign(removeCampaignNpc(campaigns,campaignId,b.dataset.deleteCampaignNpc),'NPC excluído da Campanha.')}));document.querySelectorAll('[data-delete-campaign-location]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Excluir este Local da Campanha e remover seus vínculos em todas as Aventuras?'))return;removeCampaignEntityRefs('location',b.dataset.deleteCampaignLocation);commitCampaign(removeCampaignLocation(campaigns,campaignId,b.dataset.deleteCampaignLocation),'Local excluído da Campanha.')}));document.querySelectorAll('[data-deliver-treasure]').forEach(b=>b.addEventListener('click',()=>deliverTreasure(b.dataset.deliverTreasure)))}
normalizeRefs();render();
document.addEventListener('pointerdown',event=>{
 if(event.target.closest?.('#adventure-list [data-status-disclosure]'))return;
 document.querySelectorAll('#adventure-list [data-status-disclosure][open]').forEach(el=>el.open=false)
});
document.addEventListener('keydown',event=>{
 if(event.key!=='Escape')return;
 const open=document.querySelector('#adventure-list [data-status-disclosure][open]');
 if(!open)return;
 open.open=false;open.querySelector('summary')?.focus();event.stopPropagation()
});
if(params.get('new')==='1')requestAnimationFrame(()=>{
 const form=$('adventure-create-card');
 if(form){form.scrollIntoView({block:'start'});$('new-adventure-title')?.focus({preventScroll:true})}
});
loadMagicItems().then(()=>{if(adventure())render()}).catch(()=>{});
loadEncounterMonsterIndex().then(rows=>{monsterCatalog=rows;monsterCatalogReady=true;if(adventure())render()}).catch(error=>{monsterCatalogReady=true;console.warn('Catálogo de monstros indisponível:',error)})