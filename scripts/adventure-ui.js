import{updateAppShellContext}from'./app-shell.js?v=20261022-chronicles-final3';
import{noteSection,bindNoteSection}from'./hub-notes.js?v=20261026-drag-fix1';
import{renderNextCampaignSession}from'./campaign-next-session-ui.js?v=20261022-chronicles-final3';
import{bindStructuredDetails}from'./campaign-structured-ui.js?v=20261022-chronicles-final3';
import{renderCampaignSessionCard}from'./campaign-session-card.js';
import{loadEncounterMonsterIndex,loadEncounterMonsterDetail}from'./monster-catalog.js?v=20261023-adventure-library7';
import{numberedAdventureTitle,numberedSessionTitle}from'./narrative-labels.js';
import{timelineViewToggle,renderCampaignTimelineDiagram}from'./timeline-flowchart.js?v=20261027-scenes-timeline1';
import{readCampaigns,writeCampaigns,campaignById,addCampaignNpc,updateCampaignNpc,removeCampaignNpc,addCampaignLocation,updateCampaignLocation,removeCampaignLocation,updateCampaignSession,updateSessionScene}from'./campaign-state.js?v=20261022-chronicles-final3';
import{read as readCharacters,write as writeCharacters,readNpcs as readRegisteredNpcs}from'./character-builder/state.js';
import{readAdventures,writeAdventures,adventureById,adventuresForCampaign,createAdventure,updateAdventure,reassignAdventureCampaign,removeAdventure,addAdventureChapter,addAdventureScene,addAdventureClue,addAdventureHandout,addAdventureTreasure,addAdventureMission,addAdventureMonster,addAdventureTimelineEntry,updateAdventureEntity,removeAdventureEntity,unlinkAdventureCampaignEntity,startAdventureScene,completeAdventureScene,skipAdventureScene,setAdventureClueStatus,setAdventureHandoutRevealed,setAdventureTreasureStatus,setAdventureMissionStatus}from'./adventure-state.js?v=20261027-scenes-cast-v1';
import{reconcileAdventureCampaignRefs}from'./adventure-integrity.js?v=20261016-current-status2';
import{uploadImage,copyAdventureCoverToCampaign,deleteImage,persistCampaignMediaState,persistAdventureCampaignReassignment,imageElementHtml,imagePickerHtml,bindImagePicker,hydrateMediaImages}from'./image-media.js?v=20261023-simplified3';

import{renderAdventureExploration,renderAdventureFactions,bindAdventureExploration}from'./adventure-exploration-ui.js?v=20261027-scenes-cast-v2';
import{bindAdventureAnimatedReorder}from'./adventure-animated-reorder.js?v=20261027-release-reset3';
import{explorationProgress}from'./adventure-exploration-state.js?v=20261027-scenes-cast-v1';
import{adventureRosterHtml,adventureMembers,bindAdventureRoster}from'./adventure-roster-ui.js?v=20261027-release-reset3';
import{adventureCreateTile,ADVENTURE_STATUSES}from'./adventure-list-card.js?v=20261023-status-context12';
import{adventureFiltersHtml,adventureGroupsHtml,bindAdventureGroupScroll}from'./adventure-list-groups.js?v=20261023-status-context12';

const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search);let attachedMonstersExpanded=false;
let campaigns=readCampaigns(),adventures=readAdventures().filter(a=>a.campaignId!=='e2e-explicit-player-access'),characters=readCharacters(),campaignId=params.get('campaign')||campaigns[0]?.id||'',adventureId=params.get('id')||'',saveTimer=null,magicItems=[],adventureTimelineView='list',createPanelOpen=params.get('new')==='1',listCampaignFilter=params.get('campaign')||'all',listStatusFilter='all';
const advStatus=s=>({planned:'Planejada',active:'Em andamento',paused:'Pausada',completed:'Concluída',archived:'Arquivada'}[s]||s),advType=s=>({main:'Aventura principal',side:'Aventura secundária',oneshot:'One-shot',secondary:'Arco secundário'}[s]||s),sceneStatus=s=>({planned:'Planejada',active:'Em cena',completed:'Concluída',skipped:'Ignorada'}[s]||s),clueStatus=s=>({hidden:'Oculta',discovered:'Descoberta',resolved:'Resolvida'}[s]||s),treasureStatus=s=>({planned:'Planejado',found:'Encontrado',claimed:'Distribuído'}[s]||s),missionStatus=s=>({hidden:'Não descoberta',active:'Ativa',completed:'Concluída',failed:'Falhou',abandoned:'Abandonada'}[s]||s);
const campaign=()=>campaignById(campaigns,campaignId),adventure=()=>adventureById(adventures,adventureId);
let monsterCatalog=[],monsterCatalogReady=false;
const expandedSceneIds=new Set(),attachedSectionsExpanded=new Set();
const visibleToggle=(kind,id,visible)=>`<label class="campaign-disclosure-toggle"><input type="checkbox" data-adventure-visible="${esc(kind)}" data-visible-id="${esc(id)}" ${visible?'checked':''}><span>Mostrar aos jogadores</span></label>`;
const moveTools=(kind,id,i,length)=>`<button type="button" class="campaign-reorder-grip" data-adventure-grip="${esc(id)}" aria-label="Arrastar para reorganizar" title="Arrastar para reorganizar" style="touch-action:none">⠿</button><button type="button" class="secondary campaign-move-button" data-adventure-move="up" data-kind="${esc(kind)}" data-id="${esc(id)}" ${i===0?'disabled':''}>↑</button><button type="button" class="secondary campaign-move-button" data-adventure-move="down" data-kind="${esc(kind)}" data-id="${esc(id)}" ${i===length-1?'disabled':''}>↓</button>`;
const ordered=(rows=[])=>[...rows].sort((a,b)=>(a.order||0)-(b.order||0));
const chapterOptions=(a,current='')=>entitySelect(ordered(a.chapters),current,'— Sem capítulo —');
const objectiveOptions=(a,current='')=>entitySelect(ordered(a.missions),current,'— Sem objetivo —');
const npcOptions=a=>entitySelect((campaign()?.npcs||[]).filter(n=>a.npcIds.includes(n.id)),'','— Sem NPC —');
const monsterOptions=a=>entitySelect(ordered(a.monsters||[]),'','— Sem monstro —');
const areaChoices=(a,current='')=>entitySelect((a.exploration?.areas||[]).map(area=>({...area,title:[area.code,area.name].filter(Boolean).join(' - ')})),current,'— Sem local —');
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
<div class="campaign-line-actions">${moveTools('missions',row.id,i,rows.length)}
<button type="button" class="danger campaign-list-remove" data-remove-entity="${esc(row.id)}" data-key="missions">Excluir</button></div></article>`}
function npcCard(row,a,c,i=0){const rows=a.npcIds;const sheetHref=row.sheetId?`ficha-personagem.html?npc=1&id=${encodeURIComponent(row.sheetId)}`:`criacao-personagem.html?${new URLSearchParams({npc:'1',campaign:campaignId,npcId:row.id,name:row.name||''})}`;return`<article class="story-card campaign-bullet-entry" data-reorder-adventure="npcs" draggable="true" tabindex="0" data-campaign-npc="${esc(row.id)}">
<div class="compact-grid"><label>Nome<input data-campaign-npc-field="name" value="${esc(row.name)}"></label><label>Papel<input data-campaign-npc-field="role" value="${esc(row.role)}"></label></div>
<div class="campaign-line-actions">${moveTools('npcs',row.id,i,rows.length)}
<a class="btn secondary" href="${esc(sheetHref)}" title="${row.sheetId?'Abrir ficha do NPC':'Criar ficha para este NPC'}">Abrir ficha</a><button type="button" class="danger campaign-list-remove" data-delete-campaign-npc="${esc(row.id)}">Excluir</button></div></article>`}
function locationCard(row,a,i=0){const rows=a.locationIds;return`<article class="story-card campaign-bullet-entry" data-reorder-adventure="locations" draggable="true" tabindex="0" data-campaign-location="${esc(row.id)}">
<div class="compact-grid"><label>Nome<input data-campaign-location-field="name" value="${esc(row.name)}"></label><label>Tipo<input data-campaign-location-field="type" value="${esc(row.type)}"></label></div>
<div class="campaign-line-actions">${moveTools('locations',row.id,i,rows.length)}
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
function sceneCast(rows,selected,visible,kind,visibility){
 const members=new Set(selected||[]),shown=new Set(visible||[]);
 return rows.length?rows.map(x=>`<div class="adventure-scene-cast-row"><label><input type="checkbox" data-scene-link="${kind}" value="${esc(x.id)}" ${members.has(x.id)?'checked':''}>${esc(x.title||x.name)}</label><label><input type="checkbox" data-scene-reveal="${visibility}" value="${esc(x.id)}" ${shown.has(x.id)&&members.has(x.id)?'checked':''}>Mostrar aos jogadores</label></div>`).join(''):'<span class="mini">Nenhum registro disponível na Aventura.</span>'
}
function sceneCard(scene,a,i=0){
 const linkedNpcs=(campaign()?.npcs||[]).filter(n=>a.npcIds.includes(n.id));
 const location=(a.exploration?.areas||[]).find(l=>l.id===scene.areaId);
 const locationLabel=location?[location.code,location.name].filter(Boolean).join(' - '):'Sem local';
 const total=ordered(a.scenes).length;
 return `<article class="story-card explore-level-card explore-record-card adventure-scene-record" data-reorder-adventure="scenes" draggable="true" tabindex="0" data-scene-row="${esc(scene.id)}">
 <button type="button" class="explore-area-drag-handle adventure-scene-drag-handle" data-adventure-grip aria-label="Arrastar cena ${esc(scene.title)} para reorganizar" title="Arraste para reorganizar">⠿</button>
 <details class="explore-record-editor hub-scene-editor" data-scene-editor ${expandedSceneIds.has(scene.id)?'open':''}>
  <summary class="explore-record-summary"><span class="explore-record-title"><strong>${esc(scene.title)}</strong><span class="mini">${esc(sceneStatus(scene.status))} · ${esc(locationLabel)}</span></span><span class="explore-record-toggle-label">Editar <span class="explore-record-chevron" aria-hidden="true"></span></span></summary>
  <div class="explore-record-body">
   <section class="explore-editor-group"><header><h4>Identificação e narrativa</h4><p>Dados da cena, narração e informações reservadas ao Mestre.</p></header>
    <div class="form-grid two">
     <label>Nome<input data-scene-field="title" value="${esc(scene.title)}"></label>
     <label>Local<select data-scene-field="areaId">${areaChoices(a,scene.areaId)}</select></label>
     <label>Cena da sessão<select data-scene-session-scene>${sessionSceneOptionsForAdventure(a,scene)}</select></label>
     <label>Encontro<select data-scene-encounter>${encounterOptions(scene)}</select></label>
     <label class="wide">Objetivo da cena (privado)<input data-scene-field="objective" value="${esc(scene.objective)}"></label>
     <label class="wide">Texto para narração<textarea data-scene-field="readAloud">${esc(scene.readAloud||'')}</textarea></label>
     <label class="wide">Descrição para o Mestre<textarea data-scene-field="description">${esc(scene.description)}</textarea></label>
     <label class="wide">Desfecho<textarea data-scene-field="outcome">${esc(scene.outcome)}</textarea></label>
     <label class="wide">Notas do Mestre<textarea data-scene-field="notes">${esc(scene.notes)}</textarea></label>
    </div></section>
   <section class="explore-editor-group"><header><h4>Participantes e objetivos</h4><p>Selecione os presentes na cena e defina quais são revelados aos jogadores.</p></header>
    <div class="form-grid two adventure-scene-presence">
     <fieldset><legend>NPCs presentes na cena</legend><div class="entity-checks adventure-cast-list">${sceneCast(linkedNpcs,scene.npcIds,scene.visibleNpcIds,'npcIds','visibleNpcIds')}</div></fieldset>
     <fieldset><legend>Monstros presentes na cena</legend><div class="entity-checks adventure-cast-list">${sceneCast(ordered(a.monsters||[]),scene.monsterIds,scene.visibleMonsterIds,'monsterIds','visibleMonsterIds')}</div></fieldset>
     <fieldset class="adventure-private-objectives"><legend>Objetivos (exclusivos do Mestre)</legend><p class="mini">Estes vínculos nunca aparecem aos jogadores.</p><div class="entity-checks">${checks(a.missions||[],scene.missionIds,'missionIds')}</div></fieldset>
    </div></section>
   <div class="explore-detail-actions adventure-scene-record-actions">
    ${moveTools('scenes',scene.id,i,total)}
    ${scene.status==='planned'?`<button type="button" data-start-scene="${esc(scene.id)}">Iniciar</button><button type="button" class="secondary" data-skip-scene="${esc(scene.id)}">Ignorar</button>`:''}
    ${scene.status==='active'?`<button type="button" data-complete-scene="${esc(scene.id)}">Concluir</button>`:''}
    <button type="button" class="danger campaign-list-remove" data-remove-entity="${esc(scene.id)}" data-key="scenes">Excluir cena</button>
    <button type="button" class="secondary" data-scene-close>Recolher</button>
   </div>
  </div>
 </details>
 <div class="explore-record-visibility-bar">${visibleToggle('scenes',scene.id,scene.visibleToPlayers)}</div>
 </article>`;
}
function adventureTimelineHtml(a){
 // A única fonte é a coleção de Cenas. Não criar eventos paralelos e
 // não duplicar alterações de status ou objetivos do Mestre na linha do tempo.
 const nodes=ordered(a.scenes).map(scene=>({id:scene.id,text:scene.title,kind:'scene',automatic:true,href:'#cenas',children:[],visibleToPlayers:scene.visibleToPlayers}));
 const flowchart=adventureTimelineView==='flowchart';
 const list=nodes.map((node,index)=>`<li class="timeline-item timeline-item-linked" data-timeline-id="${esc(node.id)}"><div class="campaign-flow-step campaign-linked-step"><span class="campaign-flow-node" aria-hidden="true">${index+1}</span><div class="campaign-flow-card campaign-linked-card"><span class="campaign-linked-title"><span class="campaign-linked-kind">Cena</span><a class="campaign-linked-name campaign-timeline-title-link" href="#cenas" aria-label="Ver cena: ${esc(node.text)}">${esc(node.text)}</a></span></div></div></li>`).join('');
 return`<section id="linha-tempo" class="card campaign-editor-card campaign-timeline-section adventure-timeline-section">
  <div class="campaign-editor-head hub-timeline-heading"><div class="hub-timeline-title-group"><h2>Linha do tempo</h2></div>${timelineViewToggle(adventureTimelineView)}</div>
  ${flowchart?renderCampaignTimelineDiagram(nodes,new Set(),{readOnly:true}):`<ol class="campaign-timeline-flow timeline-tree">${list||'<li class="campaign-blank-state">Nenhuma cena criada.</li>'}</ol>`}
 </section>`;
}
function linkedSessionsHtml(a){
 const ids=new Set(a.scenes.map(s=>s.sessionId).filter(Boolean));
 const rows=(campaign()?.sessions||[]).filter(s=>s.adventureId===a.id||ids.has(s.id)).sort((x,y)=>(x.order||x.number)-(y.order||y.number));
 return`<section id="sessoes" class="card campaign-editor-card"><h2>Sessões da Aventura</h2>
 <div class="list campaign-player-story-grid">${rows.length?rows.map(s=>`<div class="adventure-linked-session" data-adventure-session="${esc(s.id)}"><div class="adventure-session-card-wrap">${renderCampaignSessionCard(s,a.campaignId)}<div class="adventure-session-visibility">${visibleToggle('sessions',s.id,a.sessionVisibility?.[s.id]===true)}</div></div></div>`).join(''):'<div class="empty">Nenhuma sessão vinculada à Aventura.</div>'}</div></section>`;
}
function monstersHtml(a){
 const current=ordered(a.monsters||[]);
 return `<section id="monstros" class="card adventure-monster-library">
 <div class="explore-title"><div class="explore-title-copy"><h2>Adicionar Monstros</h2></div><span class="badge">${monsterCatalogReady?monsterCatalog.length:'…'} na Biblioteca</span></div>
 <div class="adventure-monster-picker">
 <label>Monstro da Biblioteca<select id="new-adventure-monster" aria-describedby="adventure-monster-status" disabled><option value="">Carregando Biblioteca...</option></select></label>
 <div class="row-actions adventure-monster-actions"><button type="button" class="secondary" id="adventure-monster-consult" disabled>Consultar ficha</button><button type="button" id="add-adventure-monster" disabled>Adicionar à Aventura</button></div>
 <p id="adventure-monster-status" class="mini" role="status" aria-live="polite">Carregando Biblioteca...</p>
 </div>
 <div id="adventure-monster-preview" class="adventure-monster-preview" role="status" aria-live="polite"></div>
 <details class="adventure-monsters-attached" ${attachedMonstersExpanded?'open':''}><summary>Monstros adicionados à Aventura (${current.length})</summary>
 <div class="story-list">${current.length?current.map((monster,i)=>`<article class="story-card campaign-bullet-entry" data-reorder-adventure="monsters" data-monster-row="${esc(monster.id)}" tabindex="0"><strong>${esc(monster.name)}</strong><p class="mini">${esc(monster.source||'Biblioteca')}</p><div class="campaign-line-actions">${moveTools('monsters',monster.id,i,current.length)}<button type="button" class="danger" data-remove-entity="${esc(monster.id)}" data-key="monsters">Remover da aventura</button></div></article>`).join(''):'<div class="story-empty">Nenhum monstro associado.</div>'}</div>
 </details>
 </section>`;
}
function bindAttachedSections(){
 document.querySelectorAll('[data-attached-section]').forEach(details=>details.addEventListener('toggle',()=>{
  const id=details.dataset.attachedSection;
  if(details.open)attachedSectionsExpanded.add(id);
  else attachedSectionsExpanded.delete(id);
 }));
}
function bindAdventureMonsterLibrary(){
 const panel=document.getElementById('monstros');if(!panel)return;
 const picker=panel.querySelector('#new-adventure-monster'),status=panel.querySelector('#adventure-monster-status');
 const consult=panel.querySelector('#adventure-monster-consult'),add=panel.querySelector('#add-adventure-monster');
 const preview=panel.querySelector('#adventure-monster-preview');
 panel.querySelector('.adventure-monsters-attached')?.addEventListener('toggle',event=>{attachedMonstersExpanded=event.currentTarget.open});
 let requestId=0;
 const selectedMonster=()=>monsterCatalog.find(monster=>monster.id===picker.value);
 const updateActions=()=>{const enabled=Boolean(selectedMonster());consult.disabled=!enabled;add.disabled=!enabled};
 const updateAvailability=()=>{
  const available=monsterCatalogReady&&monsterCatalog.length>0;
  picker.disabled=!available;
  if(!available)picker.innerHTML='<option value="">'+(monsterCatalogReady?'Nenhum monstro disponível':'Carregando Biblioteca...')+'</option>';
  else if(picker.options.length===1)picker.innerHTML='<option value="">— Selecione um monstro —</option>';
  status.textContent=monsterCatalogReady?(monsterCatalog.length?`${monsterCatalog.length} monstros disponíveis. Abra o menu para selecionar.`:'Biblioteca de monstros indisponível ou vazia.'):'Carregando Biblioteca...';
  updateActions();
 };
 const populate=()=>{
  if(!monsterCatalogReady||!monsterCatalog.length||picker.options.length>1)return;
  const selected=picker.value;
  picker.innerHTML='<option value="">— Selecione um monstro —</option>'+monsterCatalog.map(monster=>option(monster.id,monster.name,'')).join('');
  if(selected)picker.value=selected;
 };
 picker.addEventListener('pointerdown',populate);
 picker.addEventListener('focus',populate);
 picker.addEventListener('keydown',populate);
 picker.addEventListener('change',()=>{
  requestId++;
  preview.replaceChildren();
  const monster=selectedMonster();
  status.textContent='';
  updateActions();
 });
 consult.addEventListener('click',async()=>{
  const monster=selectedMonster();if(!monster)return;
  const requested=++requestId;
  consult.disabled=true;
  preview.textContent='Carregando ficha de '+monster.name+'...';
  try{
   const detail=await loadEncounterMonsterDetail(monster);
   if(!preview.isConnected||requested!==requestId||picker.value!==monster.id)return;
   preview.innerHTML=`<div class="adventure-monster-preview-head"><strong>${esc(detail.name)}</strong><span>${esc(detail.source||monster.sourceTitle||'Biblioteca')}</span></div>
   <dl><div><dt>CA</dt><dd>${Number(detail.ac)||0}</dd></div><div><dt>PV</dt><dd>${Number(detail.maxHp)||1}</dd></div><div><dt>ND</dt><dd>${esc(detail.cr||'—')}</dd></div><div><dt>XP</dt><dd>${Number(detail.xp)||0}</dd></div></dl>`;
  }catch(error){
   if(preview.isConnected&&requested===requestId)preview.textContent='Não foi possível carregar a ficha: '+(error?.message||'erro desconhecido');
  }finally{if(consult.isConnected)updateActions()}
 });
 panel.addEventListener('adventure-monster-catalog-ready',updateAvailability);
 updateAvailability();
}
function section(title,id,body,form=''){
 const attached=['npcs','missoes'].includes(id);
 const list=attached?`<details class="adventure-monsters-attached adventure-attached-list" data-attached-section="${esc(id)}" ${attachedSectionsExpanded.has(id)?'open':''}><summary>${esc(title)} adicionados à Aventura (${(body.match(/<article /g)||[]).length})</summary><div class="story-list">${body||'<div class="story-empty">Nenhum registro associado.</div>'}</div></details>`:`<div class="story-list">${body||''}</div>`;
 return`<section id="${id}" class="card adventure-entity-section"><h2>${esc(title)}</h2>${list}${form}<div class="row-actions adventure-section-actions"><button type="button" data-save-adventure-section>Salvar</button></div></section>`
}
function workspaceHtml(a){
 const c=campaign(),npcs=(c?.npcs||[]).filter(n=>a.npcIds.includes(n.id)).sort((x,y)=>a.npcIds.indexOf(x.id)-a.npcIds.indexOf(y.id)),locations=(c?.locations||[]).filter(l=>a.locationIds.includes(l.id)).sort((x,y)=>a.locationIds.indexOf(x.id)-a.locationIds.indexOf(y.id));
 const nav=[['visao-geral','Visão geral'],['participantes','Participantes'],['cenas','Cenas'],['exploracao','Locais'],['mapas','Mapas'],['criar-area','Adicionar área'],['criar-mapa','Adicionar mapa'],['criar-cena','Adicionar cena'],['npcs','NPCs'],['faccoes','Facções'],['missoes','Objetivos'],['monstros','Monstros'],['sessoes','Sessões'],['linha-tempo','Linha do tempo'],['notas-mestre','Notas do Mestre']];
 const objectives=section('Adicionar Objetivos','missoes',ordered(a.missions).map((m,i)=>missionCard(m,a,i)).join(''),`<div class="form-grid two"><label>Objetivo<input id="new-mission-title"></label><label>Descrição<input id="new-mission-description"></label><button type="button" id="add-mission">Adicionar objetivo</button></div>`);
 const npcPanel=section('Adicionar NPC','npcs',npcs.map((n,i)=>npcCard(n,a,c,i)).join(''),`<div class="form-grid two adventure-npc-create"><label>Nome<input id="new-npc-name"></label><label>Papel<input id="new-npc-role"></label><button type="button" id="add-campaign-npc">Adicionar NPC</button><a class="btn secondary" href="criacao-personagem.html?npc=1">Criar NPC</a>
 <label>NPC cadastrado<select id="attach-existing-npc"><option value="">— Selecione um NPC —</option>${readRegisteredNpcs().filter(n=>!(c?.npcs||[]).some(row=>row.sheetId===n.id)).map(n=>option(n.id,n.name||'NPC sem nome','')).join('')}</select></label><button type="button" id="add-registered-npc">Vincular NPC</button></div>`);
 const scenes=section('Cenas','cenas',ordered(a.scenes).map((scene,i)=>sceneCard(scene,a,i)).join(''));
 const addScene=`<section id="criar-cena" class="card adventure-exploration adventure-create-panel">
  <h2>Adicionar cena</h2>
  <div class="explore-create-form explore-create-scene">
   <label>Nome da cena<input id="new-scene-title" required></label>
   <label>Local<select id="new-scene-location">${areaChoices(a)}</select></label>
   <button type="button" id="add-scene">Criar cena</button>
  </div>
 </section>`;
 return`${operationalHtml(a)}
 ${renderNextCampaignSession(c,{canPlan:true,adventures:adventuresForCampaign(adventures,c.id)})}
 <nav class="section-nav adventure-nav hub-detail-nav">${nav.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}</nav>
 <div class="campaign-sections campaign-editor-grid hub-detail-grid">${basicsHtml(a)}${participantsHtml(a)}${scenes}
 ${renderAdventureExploration(a,c)}${addScene}${npcPanel}${renderAdventureFactions(a,c)}${objectives}${monstersHtml(a)}
 ${linkedSessionsHtml(a)}${adventureTimelineHtml(a)}${noteSection(a.dmNoteEntries)}</div>`;
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
function bindScenes(){document.querySelectorAll('[data-scene-row]').forEach(row=>{row.querySelector('[data-scene-close]')?.addEventListener('click',()=>{row.querySelector('[data-scene-editor]').open=false});const id=row.dataset.sceneRow;row.querySelector('[data-scene-editor]')?.addEventListener('toggle',event=>{if(event.target.open)expandedSceneIds.add(id);else expandedSceneIds.delete(id)});row.querySelectorAll('[data-scene-field]').forEach(input=>input.addEventListener('change',()=>{const field=input.dataset.sceneField,value=input.type==='number'?Number(input.value):input.value;commit(updateAdventureEntity(adventures,adventureId,'scenes',id,{[field]:value}),'Cena atualizada.')}));row.querySelector('[data-scene-session-scene]')?.addEventListener('change',e=>syncAdventureSceneToSessionScene(id,e.target.value));row.querySelector('[data-scene-encounter]')?.addEventListener('change',e=>{const scene=adventure()?.scenes.find(s=>s.id===id);commit(updateAdventureEntity(adventures,adventureId,'scenes',id,{encounterRef:{sessionId:scene?.sessionId||null,encounterId:e.target.value||null}}),'Encontro vinculado à cena.')});row.querySelectorAll('[data-scene-link],[data-scene-reveal]').forEach(input=>input.addEventListener('change',()=>{
 const patch={};
 for(const field of ['npcIds','monsterIds','missionIds'])patch[field]=[...row.querySelectorAll('[data-scene-link="'+field+'"]:checked')].map(el=>el.value);
 for(const [field,relation] of [['visibleNpcIds','npcIds'],['visibleMonsterIds','monsterIds']])patch[field]=[...row.querySelectorAll('[data-scene-reveal="'+field+'"]:checked')].map(el=>el.value).filter(id=>patch[relation].includes(id));
 commit(updateAdventureEntity(adventures,adventureId,'scenes',id,patch),'Participantes e visibilidade da cena atualizados.')
 }))})}
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
  for(const field of ['npcIds','monsterIds','missionIds'])patch[field]=[...row.querySelectorAll('[data-scene-link="'+field+'"]:checked')].map(el=>el.value);
   for(const [field,relation] of [['visibleNpcIds','npcIds'],['visibleMonsterIds','monsterIds']])patch[field]=[...row.querySelectorAll('[data-scene-reveal="'+field+'"]:checked')].map(el=>el.value).filter(id=>patch[relation].includes(id));
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
  const current=adventure();if(!current)return false;
  const rows=['npcs','locations'].includes(kind)?[...(kind==='npcs'?current.npcIds:current.locationIds)]:ordered(current[kind]||[]).map(x=>x.id);
  const from=rows.indexOf(id),neighbor=from+(direction==='up'?-1:1),to=targetId?rows.indexOf(targetId):neighbor;
  if(from<0||to<0||to>=rows.length||from===to)return false;
  const before=rows.join('\u0000'),target=rows[to],position=targetId?direction:(direction==='up'?'before':'after');
  rows.splice(from,1);
  rows.splice(rows.indexOf(target)+(position==='after'?1:0),0,id);
  if(before===rows.join('\u0000'))return false;
  const items=['npcs','locations'].includes(kind)?rows:rows.map(rowId=>current[kind].find(x=>x.id===rowId)).filter(Boolean);
  saveList(kind,items,'Ordem atualizada.');
  return true;
 };
 document.querySelectorAll('[data-adventure-visible]:not([data-adventure-visible="sessions"])').forEach(input=>input.addEventListener('change',()=>{
  const a=adventure(),id=input.dataset.visibleId,key=input.dataset.adventureVisible,on=input.checked;
  if(key==='npcs'||key==='locations'){
   const mapKey=key==='npcs'?'npcVisibility':'locationVisibility',patch={[mapKey]:{...(a[mapKey]||{}),[id]:on}};
   commit(updateAdventure(adventures,adventureId,patch),'Visibilidade atualizada.');
  }else commit(updateAdventureEntity(adventures,adventureId,key,id,{visibleToPlayers:on}),'Visibilidade atualizada.')
 }));
 document.querySelectorAll('[data-adventure-move]').forEach(button=>button.addEventListener('click',()=>move(button.dataset.kind,button.dataset.id,button.dataset.adventureMove)));
 // Todos os cards reorganizáveis compartilham a animação de Jogadores da Campanha.
 const root=$('adventure-root');
 for(const kind of ['chapters','missions','npcs','locations','scenes','monsters']){
  const itemSelector='[data-reorder-adventure="'+kind+'"]';
  const group=root?.querySelector(itemSelector)?.closest('.story-list');
  if(!group)continue;
  bindAdventureAnimatedReorder({
   container:group,itemSelector,handleSelector:'[data-adventure-grip]',
   idFor:node=>node.dataset.entityRow||node.dataset.campaignNpc||node.dataset.campaignLocation||node.dataset.sceneRow||node.dataset.monsterRow||'',
   onMove:(source,target,position)=>move(kind,source,position,target),
   confirmScope:'#'+({chapters:'capitulos',missions:'missoes',npcs:'npcs',locations:'locais',scenes:'cenas',monsters:'monstros'}[kind]),
   allowSurface:true
  });
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
 const list=section?.querySelector('.hub-note-list');if(!list)return;
 // A alça, antes decorativa, também aceita teclado para reorganizar as notas.
 list.querySelectorAll('[data-note-id]>.campaign-reorder-grip').forEach(span=>{
  const grip=document.createElement('button');
  grip.type='button';grip.className='campaign-reorder-grip hub-note-grip';
  grip.textContent=span.textContent;grip.title='Arraste para reorganizar ou use as setas do teclado';
  grip.setAttribute('aria-label','Reorganizar nota: arraste ou use as setas');
  span.replaceWith(grip);
 });
 bindAdventureAnimatedReorder({
  container:list,itemSelector:'[data-note-id]',handleSelector:'.hub-note-grip',allowSurface:true,
  idFor:row=>row.dataset.noteId,confirmScope:'#notas-mestre',
  onMove:(source,target,position)=>{
   const notes=[...(adventure()?.dmNoteEntries||[])],from=notes.findIndex(row=>row.id===source);
   if(from<0||source===target)return false;
   const [picked]=notes.splice(from,1),to=notes.findIndex(row=>row.id===target);
   if(to<0)return false;
   notes.splice(to+(position==='after'?1:0),0,picked);
   if(notes.every((row,index)=>row.id===adventure().dmNoteEntries[index]?.id))return false;
   commit(updateAdventure(adventures,adventureId,{dmNoteEntries:notes}),'Ordem das notas atualizada.');
   return true;
  }
 });
}
function bind(){
 bindAdventureMonsterLibrary();
 document.querySelectorAll('#sessoes [data-adventure-visible="sessions"]').forEach(input=>input.addEventListener('change',()=>{
  const a=adventure(),id=input.dataset.visibleId;
  const sessionVisibility={...(a.sessionVisibility||{}),[id]:input.checked};
  commit(updateAdventure(adventures,adventureId,{sessionVisibility}),'Visibilidade da sessão atualizada.');
 }));
 document.querySelectorAll('#linha-tempo [data-timeline-view]').forEach(button=>button.addEventListener('click',()=>{
  const next=button.dataset.timelineView==='flowchart'?'flowchart':'list';
  if(adventureTimelineView===next)return;
  adventureTimelineView=next;
  render();
  document.getElementById('linha-tempo')?.scrollIntoView({block:'nearest'});
 }));
 document.querySelectorAll('#linha-tempo [data-diagram-edit]').forEach(button=>button.addEventListener('click',()=>{
  const eventId=button.dataset.diagramEdit;
  adventureTimelineView='list';
  render();
  const target=[...document.querySelectorAll('#linha-tempo [data-entity-row]')].find(row=>row.dataset.entityRow===eventId);
  (target||document.getElementById('linha-tempo'))?.scrollIntoView({block:'nearest'});
 }));
 const c=campaign();
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

 
$('adventure-assignment')?.addEventListener('change',event=>{void reassignSelectedAdventure(event.target.value)});$('adventure-campaign')?.addEventListener('change',e=>{campaignId=e.target.value;adventureId='';syncUrl();render()});$('create-adventure')?.addEventListener('click',()=>commit(createAdventure(adventures,newAdventureData()),'Aventura criada.'));document.querySelectorAll('[data-open-adventure]').forEach(b=>b.addEventListener('click',()=>{adventureId=b.dataset.openAdventure;const selected=adventure();if(selected)campaignId=selected.campaignId;syncUrl();render()}));document.querySelectorAll('[data-delete-adventure]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Excluir esta Aventura?'))return;const target=adventures.find(row=>row.id===b.dataset.deleteAdventure),result=removeAdventure(adventures,b.dataset.deleteAdventure);if(result.ok){adventures=writeAdventures(result.list);if(adventureId===b.dataset.deleteAdventure)adventureId='';render();feedback('Aventura excluída.');if(target?.coverImage)deleteImage(target.coverImage).catch(()=>{})}}));if(!adventure())return;bindAdventureExploration({getAdventure:adventure,getCampaign:campaign,feedback,save:(exploration,message,rerenderOnly=false)=>{if(rerenderOnly){render();return}commit(updateAdventure(adventures,adventureId,{exploration}),message)}});bindAdventureFields();bindAdventureCover();bindParticipants();bindAttachedSections();bindEntityRows();bindScenes();bindCampaignEntities();bindAdventureSaveButtons();bindAdventureNotes();bindAdventureVisibilityAndOrder();document.querySelectorAll('[data-remove-entity]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Excluir este registro da Aventura?'))return;commit(removeAdventureEntity(adventures,adventureId,b.dataset.key,b.dataset.removeEntity),'Registro excluído.')}));document.querySelectorAll('[data-start-scene]').forEach(b=>b.addEventListener('click',()=>commit(startAdventureScene(adventures,adventureId,b.dataset.startScene),'Cena iniciada.')));document.querySelectorAll('[data-complete-scene]').forEach(b=>b.addEventListener('click',()=>commit(completeAdventureScene(adventures,adventureId,b.dataset.completeScene),'Cena concluída.')));document.querySelectorAll('[data-skip-scene]').forEach(b=>b.addEventListener('click',()=>commit(skipAdventureScene(adventures,adventureId,b.dataset.skipScene),'Cena ignorada.')));$('add-chapter')?.addEventListener('click',()=>commit(addAdventureChapter(adventures,adventureId,{title:$('new-chapter-title')?.value,arc:$('new-chapter-arc')?.value}),'Capítulo adicionado.'));$('add-mission')?.addEventListener('click',()=>commit(addAdventureMission(adventures,adventureId,{title:$('new-mission-title')?.value,kind:'side',description:$('new-mission-description')?.value}),'Missão adicionada.'));$('add-clue')?.addEventListener('click',()=>commit(addAdventureClue(adventures,adventureId,{title:$('new-clue-title')?.value,text:$('new-clue-text')?.value}),'Pista adicionada.'));$('add-material')?.addEventListener('click',()=>commit(addAdventureHandout(adventures,adventureId,{title:$('new-material-title')?.value,content:$('new-material-content')?.value}),'Material adicionado.'));$('add-treasure')?.addEventListener('click',()=>commit(addAdventureTreasure(adventures,adventureId,{name:$('new-treasure-name')?.value,description:$('new-treasure-description')?.value,type:'magic-item'}),'Tesouro adicionado.'));$('add-scene')?.addEventListener('click',()=>{const title=$('new-scene-title')?.value?.trim();if(!title)return feedback('Informe o nome da cena.',false);commit(addAdventureScene(adventures,adventureId,{title,areaId:$('new-scene-location')?.value||null}),'Cena adicionada.')});$('add-timeline')?.addEventListener('click',()=>commit(addAdventureTimelineEntry(adventures,adventureId,{title:$('new-timeline-title')?.value,text:$('new-timeline-text')?.value}),'Registro adicionado.'));$('add-registered-npc')?.addEventListener('click',()=>{
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
loadEncounterMonsterIndex().then(rows=>{monsterCatalog=rows;monsterCatalogReady=true;document.getElementById('monstros')?.dispatchEvent(new Event('adventure-monster-catalog-ready'))}).catch(error=>{monsterCatalogReady=true;document.getElementById('monstros')?.dispatchEvent(new Event('adventure-monster-catalog-ready'));console.warn('Catálogo de monstros indisponível:',error)})