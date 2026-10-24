import{updateAppShellContext}from'./app-shell.js?v=20261022-chronicles-final3';
import{renderNextCampaignSession}from'./campaign-next-session-ui.js?v=20261022-chronicles-final3';
import{renderTimeline,bindStructuredDetails}from'./campaign-structured-ui.js?v=20261022-chronicles-final3';
import{playerTerm,playerAvatarHtml,characterAvatarHtml,rememberAvatars}from'./profile-images.js?v=20261021-user1';
import{campaignAvatarHtml,bindCampaignAvatarPreviews}from'./campaign-avatar-preview.js?v=20261021-roster-zoom1';
import{numberedAdventureTitle,numberedSessionTitle}from'./narrative-labels.js';
import{read}from'./character-builder/state.js';
import{readCampaigns,writeCampaigns,allCampaignSessions,addCampaignSession,updateCampaignSession,startCampaignSession,finishCampaignSession,removeCampaignSession,assignCharacterToMember,unassignCharacterFromMember,readStandaloneSessions,writeStandaloneSessions,createStandaloneSession,updateStandaloneSession,removeStandaloneSession,addSessionScene,updateSessionScene,removeSessionScene,campaignUid}from'./campaign-state.js?v=20261022-chronicles-final3';
import{readAdventures,writeAdventures,updateAdventureEntity}from'./adventure-state.js?v=20261022-chronicles-final3';
import{uploadImage,deleteImage,persistCampaignMediaState,imageElementHtml,imagePickerHtml,bindImagePicker,hydrateMediaImages}from'./image-media.js?v=20260925-media2';
import{playerMode,sharedCampaignRows,sharedAdventures}from'./collaboration-view.js?v=20261016-master-preview1';
import{sessionAdventureGroupsHtml,bindSessionAdventureScroll}from'./session-adventure-groups.js?v=20261023-panoramic3';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search),campaignFilter=params.get('campaign')||'',sessionId=params.get('id')||'';let adventureFilter=params.get('adventure')||'';
let campaigns=[],standalone=[],adventures=[],characters=[],pendingSessionCoverFile=null,createSelectInitialized=false,showCreationPanel=params.get('new')==='1';

const statusLabel=s=>({planned:'Planejada',next:'Próxima',current:'Atual',active:'Em andamento',completed:'Concluída',cancelled:'Cancelada'}[s]||s);
const sceneStatus=s=>({planned:'Planejada',active:'Em andamento',completed:'Concluída',skipped:'Ignorada'}[s]||s);
const option=(value,label,current)=>`<option value="${esc(value)}" ${String(value)===String(current)?'selected':''}>${esc(label)}</option>`;
const listHref=()=>{const q=new URLSearchParams;if(campaignFilter)q.set('campaign',campaignFilter);if(adventureFilter)q.set('adventure',adventureFilter);return`sessoes.html${q.toString()?`?${q}`:''}`}
function detailHref(session){const q=new URLSearchParams;const targetCampaign=session.campaignId||campaignFilter,targetAdventure=Object.hasOwn(session,'adventureId')?session.adventureId:adventureFilter;if(targetCampaign)q.set('campaign',targetCampaign);if(targetAdventure)q.set('adventure',targetAdventure);q.set('id',session.id);return`sessoes.html?${q}`}


function feedback(message,ok=true){
 const box=$('session-feedback');if(!box)return;
 box.hidden=false;box.className=`status ${ok?'ok':'warning'}`;box.textContent=message;
 clearTimeout(feedback.timer);feedback.timer=setTimeout(()=>box.hidden=true,3000)
}
function reload(){
 campaigns=readCampaigns().filter(c=>c.id!=='e2e-explicit-player-access');standalone=readStandaloneSessions().filter(s=>s.campaignId!=='e2e-explicit-player-access');adventures=readAdventures().filter(a=>a.campaignId!=='e2e-explicit-player-access');characters=read()
}
function sharedSessions(){
 return sharedCampaignRows().flatMap(row=>(row.campaign.sessions||[]).map(s=>({...s,source:'campaign',campaignId:row.campaign.id,campaignName:row.campaign.name,assignedCharacterId:row.membership.characterId})))
}
function allSessions(){
 const nested=allCampaignSessions(campaigns).map(s=>({...s,source:'campaign'}));
 const loose=standalone.map(s=>({...s,source:'standalone',campaignId:null,campaignName:''}));
 return [...nested,...loose].sort((a,b)=>Number(b.order??b.number)-Number(a.order??a.number)||String(b.date||b.updatedAt).localeCompare(String(a.date||a.updatedAt))||b.number-a.number)
}
function filteredSessions(rows){
 return rows.filter(s=>(!campaignFilter||s.campaignId===campaignFilter)&&(!adventureFilter||s.adventureId===adventureFilter))
}
function adventureById(id){return adventures.find(a=>a.id===id)||null}
function campaignById(id){return campaigns.find(c=>c.id===id)||null}
function sessionRef(id,source=null){
 return allSessions().find(s=>s.id===id&&(!source||s.source===source))||null
}
function saveSession(ref,patch,message='Sessão salva.'){
 if(!ref)return false;
 if(ref.source==='campaign'){
  const result=updateCampaignSession(campaigns,ref.campaignId,ref.id,patch);
  if(!result.ok){feedback(result.reason,false);return false}
  campaigns=writeCampaigns(result.list)
 }else{
  const result=updateStandaloneSession(standalone,ref.id,patch);
  if(!result.ok){feedback(result.reason,false);return false}
  standalone=writeStandaloneSessions(result.list)
 }
 reload();render();feedback(message);return true
}
async function saveSessionCoverPersistent(ref,patch,{previous=null,newMedia=null,message='Imagem salva e sincronizada.'}={}){
 if(!ref)return false;
 if(ref.source!=='campaign'){
  if(!saveSession(ref,patch,message)){if(newMedia)await deleteImage(newMedia).catch(()=>{});return false}
  if(previous?.id&&previous.id!==newMedia?.id)await deleteImage(previous).catch(()=>{});
  return true
 }
 const before=campaigns,result=updateCampaignSession(campaigns,ref.campaignId,ref.id,patch);
 if(!result.ok){if(newMedia)await deleteImage(newMedia).catch(()=>{});throw new Error(result.reason)}
 campaigns=writeCampaigns(result.list);
 try{await persistCampaignMediaState(ref.campaignId,{entityType:'session',entityId:ref.id})}
 catch(error){
  campaigns=writeCampaigns(before);reload();render();if(newMedia)await deleteImage(newMedia).catch(()=>{});
  throw new Error('A imagem não pôde ser sincronizada. A versão anterior foi preservada.')
 }
 reload();render();feedback(message);
 if(previous?.id&&previous.id!==newMedia?.id)await deleteImage(previous).catch(()=>{});
 return true
}
function removeSession(ref){
 if(!ref)return;const media=findMutableSession(ref)?.coverImage;
 if(ref.source==='campaign'){
  const result=removeCampaignSession(campaigns,ref.campaignId,ref.id);
  if(!result.ok)return feedback(result.reason,false);
  campaigns=writeCampaigns(result.list)
 }else{
  const result=removeStandaloneSession(standalone,ref.id);
  if(!result.ok)return feedback(result.reason,false);
  standalone=writeStandaloneSessions(result.list)
 }
 if(media?.id)deleteImage(media).catch(()=>{});if(sessionId===ref.id){location.href=listHref();return}reload();render();feedback('Sessão excluída.')
}
function findMutableSession(ref){
 if(ref.source==='campaign')return campaigns.find(c=>c.id===ref.campaignId)?.sessions.find(s=>s.id===ref.id)||null;
 return standalone.find(s=>s.id===ref.id)||null
}
function storeMutableSession(ref,session){
 if(ref.source==='campaign'){
  const result=updateCampaignSession(campaigns,ref.campaignId,ref.id,session);
  if(!result.ok)return false;campaigns=writeCampaigns(result.list);return true
 }
 const result=updateStandaloneSession(standalone,ref.id,session);
 if(!result.ok)return false;standalone=writeStandaloneSessions(result.list);return true
}
function persistMutableSession(ref,session,message='Sessão salva.'){
 if(!storeMutableSession(ref,session))return feedback('Não foi possível salvar a Sessão.',false);
 reload();render();if(message)feedback(message);return true
}
/** Trocar a Aventura preserva cenas próprias e desfaz os vínculos de cenas da anterior. */
function changeSessionAdventure(ref,newAdventureId){
 if(!ref||ref.source!=='campaign')return feedback('Vincule a Sessão a uma Campanha antes de escolher uma Aventura.',false);
 const session=findMutableSession(ref);if(!session)return feedback('Sessão não encontrada.',false);
 const id=String(newAdventureId||''),target=adventureById(id);
 if(id&&(!target||target.campaignId!==ref.campaignId))return feedback('Escolha uma Aventura desta Campanha.',false);
 if((session.adventureId||'')===id)return;
 const previous=adventureById(session.adventureId);
 const scenes=(session.scenes||[]).map(scene=>scene.adventureSceneId
  ?{...scene,adventureSceneId:null,missionIds:[],clueIds:[],handoutIds:[],treasureIds:[]}
  :scene);
 const result=updateCampaignSession(campaigns,ref.campaignId,ref.id,{adventureId:id||null,scenes});
 if(!result.ok)return feedback(result.reason,false);
 campaigns=writeCampaigns(result.list);
 if(previous){
  adventures=writeAdventures(adventures.map(adv=>adv.id===previous.id
   ?{...adv,scenes:adv.scenes.map(scene=>scene.sessionId===session.id
     ?{...scene,sessionId:null,sessionSceneId:null,
       encounterRef:scene.encounterRef?.sessionId===session.id
        ?{...scene.encounterRef,sessionId:null,encounterId:null}:scene.encounterRef}
     :scene)}
   :adv))
 }
 adventureFilter=id;
 history.replaceState(null,'',detailHref({...result.session,campaignId:ref.campaignId}));
 reload();render();feedback('Aventura da sessão atualizada.')
}
function adventureLabel(a){
 const c=campaignById(a.campaignId);return c?`${numberedAdventureTitle(a)} · ${c.name}`:numberedAdventureTitle(a)
}
function campaignOptions(current=''){
 return `<option value="">— Sem campanha —</option>${campaigns.map(c=>option(c.id,c.name,current)).join('')}`
}
function adventureOptions(current='',campaignId=''){
 return `<option value="">— Sem aventura —</option>${adventures.filter(a=>!campaignId||a.campaignId===campaignId).map(a=>option(a.id,adventureLabel(a),current)).join('')}`
}
function syncNextSessionOrder(){
 const input=$('new-session-order');if(!input||input.dataset.orderEdited==='true')return;
 const id=$('new-session-campaign')?.value||'';
 const items=id?(campaignById(id)?.sessions||[]):standalone;
 input.value=String(items.reduce((max,item)=>Math.max(max,Number(item.order||item.number)||0),0)+1);
}
function syncCreationOptions({resetAdventure=false}={}){
 const campaignSelect=$('new-session-campaign'),adventureSelect=$('new-session-adventure');
 if(!campaignSelect||!adventureSelect)return;
 const requestedAdventure=createSelectInitialized&&!resetAdventure?adventureSelect.value:!createSelectInitialized?adventureFilter:'';
 const linked=adventureById(requestedAdventure);
 const requestedCampaign=createSelectInitialized?campaignSelect.value:(campaignFilter||linked?.campaignId||'');
 const validCampaign=campaigns.some(c=>c.id===requestedCampaign)?requestedCampaign:'';
 campaignSelect.innerHTML=campaignOptions(validCampaign);
 campaignSelect.value=validCampaign;
 const validAdventure=linked&&(!validCampaign||linked.campaignId===validCampaign)?requestedAdventure:'';
 adventureSelect.innerHTML=adventureOptions(validAdventure,validCampaign);
 adventureSelect.value=validAdventure;
 createSelectInitialized=true;
 syncNextSessionOrder()
}
function adventureSceneOptions(session,selected=''){
 const a=adventureById(session.adventureId);
 if(!a)return'<option value="">— Sem cena de aventura —</option>';
 return `<option value="">— Sem vínculo —</option>${a.scenes.map(scene=>option(scene.id,scene.title,selected)).join('')}`
}
function availableAdventureScenes(session){
 const a=adventureById(session.adventureId);if(!a)return[];
 const alreadyHere=new Set((session.scenes||[]).map(s=>s.adventureSceneId).filter(Boolean));
 return a.scenes.filter(scene=>!alreadyHere.has(scene.id)&&(!scene.sessionId||scene.sessionId===session.id&&!scene.sessionSceneId))
}
function adventureScenePickerOptions(session){
 const a=adventureById(session.adventureId);if(!a)return'<option value="">— Sessão sem Aventura —</option>';
 const alreadyHere=new Set((session.scenes||[]).map(s=>s.adventureSceneId).filter(Boolean));
 const rows=a.scenes.map(scene=>{
  const here=alreadyHere.has(scene.id),elsewhere=!!scene.sessionId&&scene.sessionId!==session.id,staleHere=scene.sessionId===session.id&&!!scene.sessionSceneId&&!here,disabled=here||elsewhere||staleHere;
  const suffix=here?' · já adicionada':elsewhere?' · vinculada a outra Sessão':staleHere?' · já vinculada':'';return`<option value="${esc(scene.id)}" ${disabled?'disabled':''}>${esc(scene.title+suffix)}</option>`
 });
 const available=availableAdventureScenes(session);
 return `<option value="">— Selecione uma Cena da Aventura —</option>${rows.join('')}${!available.length?'<option value="" disabled>— Nenhuma Cena disponível —</option>':''}`
}
function participantNames(session){
 const names=(session.participantCharacterIds||[]).map(id=>characters.find(c=>c.id===id)?.name).filter(Boolean);
 return names
}
function sceneReferenceHtml(session,scene){
 const a=adventureById(session.adventureId),linked=a?.scenes.find(s=>s.id===scene.adventureSceneId),c=campaignById(a?.campaignId);
 if(!linked)return'';
 const location=c?.locations?.find(l=>l.id===linked.locationId);
 const npcs=(linked.npcIds||[]).map(id=>c?.npcs?.find(n=>n.id===id)?.name).filter(Boolean);
 const clues=(linked.clueIds||[]).map(id=>a?.clues?.find(x=>x.id===id)?.title).filter(Boolean);
 const materials=(linked.handoutIds||[]).map(id=>a?.handouts?.find(x=>x.id===id)?.title).filter(Boolean);
 const treasures=(linked.treasureIds||[]).map(id=>a?.treasures?.find(x=>x.id===id)?.name).filter(Boolean);
 const bits=[];
 if(location)bits.push(`<span class="badge">Local: ${esc(location.name)}</span>`);
 if(npcs.length)bits.push(`<span class="badge">NPCs: ${esc(npcs.join(', '))}</span>`);
 if(clues.length)bits.push(`<span class="badge">Pistas: ${esc(clues.join(', '))}</span>`);
 if(materials.length)bits.push(`<span class="badge">Materiais: ${esc(materials.join(', '))}</span>`);
 if(treasures.length)bits.push(`<span class="badge">Tesouros: ${esc(treasures.join(', '))}</span>`);
 return bits.length?`<div class="story-status" style="margin-top:8px">${bits.join('')}</div>`:''
}
function sceneCard(ref,scene){
 const session=ref;
 return `<article class="story-card" data-session-scene="${esc(scene.id)}">
 <div class="compact-grid">
  <label>Título<input data-session-scene-field="title" value="${esc(scene.title)}"></label>
  <label>Status<select data-session-scene-field="status">${['planned','active','completed','skipped'].map(v=>option(v,sceneStatus(v),scene.status)).join('')}</select></label>
  <label>Ordem<input type="number" min="1" data-session-scene-field="order" value="${scene.order}"></label>
  <label>Cena da Aventura<select data-session-scene-adventure>${adventureSceneOptions(session,scene.adventureSceneId)}</select></label>
 </div>
 <label>Descrição / preparação<textarea data-session-scene-field="description">${esc(scene.description)}</textarea></label>
 <label>Notas do Mestre<textarea data-session-scene-field="notes">${esc(scene.notes)}</textarea></label>
 ${sceneReferenceHtml(session,scene)}
 <div class="row-actions"><button type="button" data-save-session-scene>Salvar cena</button><button type="button" class="danger" data-remove-session-scene="${esc(scene.id)}">Excluir cena</button></div>
 </article>`
}
function encounterSummary(session){
 const rows=session.encounters||[];
 return `<section class="session-subsection"><h4>Encontros</h4><div class="story-list">${rows.length?rows.map(e=>`<div class="campaign-reference-row"><div><strong>${esc(e.title)}</strong><div><span class="badge">${esc(e.status||'planned')}</span></div></div></div>`).join(''):'<div class="story-empty">Nenhum encontro registrado.</div>'}</div></section>`
}

const SESSION_CARD_STATUSES=['current','next','active','planned','completed','cancelled'];
function sessionListCard(s,restricted=false,availableAdventures=adventures){
 const adv=availableAdventures.find(a=>a.id===s.adventureId)||null,scenes=(s.scenes||[]).length,encounters=(s.encounters||[]).length;
 const cover=imageElementHtml(s.coverImage,s.coverImageUrl,{className:'campaign-card-cover',alt:''});
 const campaignName=s.campaignName||campaignById(s.campaignId)?.name||'Sem campanha';
 const description=s.summary||s.objective||'';
 const status=SESSION_CARD_STATUSES.includes(s.status)?s.status:'planned';
 const href=detailHref(s);
 const counts=`${scenes} ${scenes===1?'cena':'cenas'} · ${encounters} ${encounters===1?'encontro':'encontros'}`;
 const campaignLink=`<strong>${esc(campaignName)}</strong>`;
 const adventureLink=adv?`<strong>${esc(numberedAdventureTitle(adv))}</strong>`:`<strong>${s.adventureId?'Aventura não disponível':'Sem aventura'}</strong>`;
 const statusControl=restricted
  ?`<span class="campaign-status-value" aria-label="Status da sessão: ${esc(statusLabel(status))}">${esc(statusLabel(status))}</span>`
  :`<details class="campaign-status-disclosure" data-status-disclosure="${esc(s.id)}">
     <summary class="campaign-status-trigger" data-session-status-trigger="${esc(s.id)}" aria-label="Alterar status da sessão ${esc(s.title)}: ${esc(statusLabel(status))}">
      <span>${esc(statusLabel(status))}</span><span class="campaign-status-chevron" aria-hidden="true"></span>
     </summary>
     <div class="campaign-status-menu" role="group" aria-label="Escolher status da sessão ${esc(s.title)}">
      ${SESSION_CARD_STATUSES.map(value=>`<button type="button" class="campaign-status-option status-${value}" data-session-status-id="${esc(s.id)}" data-session-source="${esc(s.source)}" data-next-session-status="${value}" aria-pressed="${status===value}">${esc(statusLabel(value))}</button>`).join('')}
     </div>
    </details>`;
 const context=`<div class="mini session-card-context hub-ancestry" role="group" aria-label="Campanha e aventura vinculadas"><span class="hub-parent-link hub-ancestry-campaign"><span>Campanha</span>${campaignLink}</span><span class="hub-ancestry-chevron" aria-hidden="true">›</span><div class="campaign-card-ancestry-status session-adventure-context"><span class="hub-parent-link hub-ancestry-adventure"><span>Aventura</span>${adventureLink}</span><div class="campaign-card-status status-${esc(status)}">${statusControl}</div></div></div>`;
 return `<article class="campaign-card campaign-card-featured" data-session-list-id="${esc(s.id)}" data-session-list-source="${esc(s.source)}">
  <a class="campaign-card-stretched-link" href="${href}" aria-label="Abrir sessão ${esc(s.title)}"></a>
  <div class="campaign-card-main">
   <div class="campaign-card-art">${cover||'<div class="campaign-card-cover-placeholder" aria-hidden="true"><span class="campaign-cover-crest">✦</span><span class="campaign-cover-caption">Teias de Anansi</span></div>'}</div>
   <div class="campaign-card-details">
    <div class="campaign-card-intro">
     <h2>${esc(numberedSessionTitle(s))}</h2>
     ${description?`<p class="campaign-card-description">${esc(description)}</p>`:''}
     ${context}
    </div>
    <div class="campaign-card-metrics" role="group" aria-label="Cenas e encontros da sessão">
     <div class="campaign-card-stat"><span class="campaign-card-stat-copy"><strong>${scenes}</strong><span>${scenes===1?'Cena':'Cenas'}</span></span></div>
     <div class="campaign-card-stat"><span class="campaign-card-stat-copy"><strong>${encounters}</strong><span>${encounters===1?'Encontro':'Encontros'}</span></span></div>
    </div>
   </div>
  </div>
  <div class="row-actions campaign-card-actions">
   <a class="btn" href="${href}">Abrir</a>
   ${restricted?'':`<button type="button" class="danger" data-delete-session-list="${esc(s.id)}" data-session-source="${esc(s.source)}" aria-label="Excluir sessão ${esc(s.title)}">Excluir</button>`}
  </div>
 </article>`;
}
function sessionCreateTile(){
 return `<a href="${listHref()}${listHref().includes('?')?'&':'?'}new=1" id="open-session-create" class="campaign-card campaign-create-tile" aria-label="Nova sessão" aria-controls="session-create-card" aria-expanded="${showCreationPanel}"><span class="campaign-create-plus" aria-hidden="true">+</span><span class="campaign-create-tile-label">Nova sessão</span></a>`;
}
function updateSessionCardStatus(session,status){
 if(!session||!SESSION_CARD_STATUSES.includes(status))return false;
 if(session.status===status)return true;
 if(session.status==='active'&&status!=='completed'){
  feedback('Finalize a sessão em andamento antes de selecionar outro status.',false);return false
 }
 if(session.source==='standalone'&&status==='completed'&&
   (session.activeCombatId||session.activeEncounterId||(session.combats||[]).some(row=>row.status==='active')||(session.encounters||[]).some(row=>row.status==='active'))){
  feedback('Finalize o combate ou encontro ativo antes de concluir a sessão.',false);return false
 }
 if(session.source==='campaign'){
  let result;
  if(status==='active')result=startCampaignSession(campaigns,session.campaignId,session.id);
  else if(status==='completed'&&session.status==='active')result=finishCampaignSession(campaigns,session.campaignId,session.id);
  else result=updateCampaignSession(campaigns,session.campaignId,session.id,{status});
  if(!result.ok){feedback(result.reason||'Não foi possível alterar o status.',false);return false}
  campaigns=writeCampaigns(result.list);
 }else{
  const result=updateStandaloneSession(standalone,session.id,{status});
  if(!result.ok){feedback(result.reason||'Não foi possível alterar o status.',false);return false}
  standalone=writeStandaloneSessions(result.list);
 }
 reload();render();return true;
}

function sessionRosterHtml(session,{readOnly=false}={}){
 const cid=session.campaignId,campaign=readOnly?sharedCampaignRows().find(x=>x.campaign.id===cid)?.campaign:campaignById(cid);
 const profiles=readOnly?sharedCampaignRows().find(x=>x.campaign.id===cid)?.participants||[]:[];
 const members=(campaign?.members||[]).filter(m=>m.role!=='dm'&&m.active!==false);
 const sessionNames=new Set(session.participantUsernames||[]);
 const selected=members.filter(m=>sessionNames.has(m.username)||((session.participantCharacterIds||[]).includes(m.characterId)&&!sessionNames.size)).sort((a,b)=>(session.participantUsernames||[]).indexOf(a.username)-(session.participantUsernames||[]).indexOf(b.username));
 const available=members.filter(m=>!selected.some(s=>s.username===m.username));
 const characterRows=readOnly?sharedCampaignRows().find(x=>x.campaign.id===cid)?.characters||[]:characters;
 const freeCharacters=characters.filter(character=>!campaigns.some(c=>(c.members||[]).some(m=>m.characterId===character.id)));
 rememberAvatars(profiles);
 const externalIcon='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 5h6v6M19 5l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg>';
 const openIcon=externalIcon+'<span class="roster-action-label">Abrir</span>';
 const removeIcon='<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 6h17M9 6V4h6v2m-9 0 .8 14h10.4L18 6M10 10v6m4-6v6"/></svg><span class="roster-action-label">Remover</span>';
 const rows=selected.map((m,i)=>{
  const name=profiles.find(p=>p.username===m.username)?.displayName||m.name||m.username;
  const character=characterRows.find(c=>c.id===m.characterId);
  const profile='usuario.html?user='+encodeURIComponent(m.username)+'&campaign='+encodeURIComponent(cid||'');
  const ficha=character?'ficha-personagem.html?id='+encodeURIComponent(character.id):'';
  const characterOptions=characters.filter(c=>c.id===m.characterId||!campaigns.some(camp=>(camp.members||[]).some(member=>member.characterId===c.id)));
  const picker=readOnly
   ?(character?`<a class="roster-character-name roster-player-profile-link" href="${ficha}" aria-label="Abrir ficha de ${esc(character.name)}">${esc(character.name)} ${externalIcon}</a>`:'<span class="roster-character-name">Sem personagem</span>')
   :`<select class="session-character-assignment" data-session-character-link="${esc(m.id)}" aria-label="Personagem de ${esc(name)} na Campanha"><option value="">— Sem personagem —</option>${characterOptions.map(c=>`<option value="${esc(c.id)}" ${c.id===m.characterId?'selected':''}>${esc(c.name||'Personagem')}</option>`).join('')}</select>`;
  const actions=readOnly?'':`<div class="row-actions roster-player-actions">
   <button type="button" class="secondary roster-move-button" data-session-roster-action="up" data-username="${esc(m.username)}" aria-label="Mover ${esc(name)} para cima" ${i===0?'disabled':''}>↑</button>
   <button type="button" class="secondary roster-move-button" data-session-roster-action="down" data-username="${esc(m.username)}" aria-label="Mover ${esc(name)} para baixo" ${i===selected.length-1?'disabled':''}>↓</button>
   ${character?`<a class="btn secondary roster-open-button" href="${ficha}" aria-label="Abrir ficha de ${esc(character.name)}">${openIcon}</a>`:`<button type="button" class="secondary roster-open-button" disabled title="Associe um personagem para abrir a ficha" aria-label="Sem ficha vinculada">${openIcon}</button>`}
   <button type="button" class="danger roster-remove-button" data-session-roster-action="remove" data-username="${esc(m.username)}" aria-label="Remover jogador ${esc(name)} da sessão">${removeIcon}</button>
   </div>`;
  return `<article class="member-row roster-player session-roster-item" data-session-roster-row="${esc(m.username)}" draggable="${!readOnly}" tabindex="0" aria-label="${esc(name)}. ${readOnly?'Jogador da sessão.':'Arraste para reorganizar ou use as setas.'}">
   ${readOnly?'':`<button type="button" class="roster-grip" title="Reordenar jogador" aria-label="Reordenar ${esc(name)}: arraste ou use as setas"><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="8" cy="5" r="1.7"/><circle cx="16" cy="5" r="1.7"/><circle cx="8" cy="12" r="1.7"/><circle cx="16" cy="12" r="1.7"/><circle cx="8" cy="19" r="1.7"/><circle cx="16" cy="19" r="1.7"/></svg></button>`}
   <div class="roster-player-identity">${campaignAvatarHtml(playerAvatarHtml(m.username,profiles),name)}<div class="roster-player-display" aria-label="${esc(playerTerm(m.username||name))}: ${esc(name)}"><span class="roster-player-label">${esc(playerTerm(m.username||name))}</span><div class="roster-player-name-line"><span class="roster-player-name">${esc(name)}</span><a class="roster-player-profile-link" href="${profile}" title="Abrir perfil de ${esc(name)}" aria-label="Abrir perfil de ${esc(name)}">${externalIcon}</a></div></div></div>
   <div class="roster-player-character"><label>Personagem<div class="roster-character-picker">${campaignAvatarHtml(characterAvatarHtml(character),character?.name||'personagem')}${picker}</div></label></div>
   ${actions}</article>`;
 }).join('');
 return `<section id="participantes" class="card campaign-editor-card roster-section session-participant-roster${readOnly?' roster-readonly':''}"><div class="roster-heading"><h2>Jogadores da Sessão</h2></div>
 <div class="list roster-list session-roster-list">${rows||'<div class="empty">Nenhum jogador atribuído.</div>'}</div>
 ${readOnly?'':`<div class="roster-add-panel"><h3>Adicionar jogador</h3>
  <div class="roster-add-fields"><label>Jogador<select data-session-add-member><option value="">— Selecione —</option>${available.map(m=>`<option value="${esc(m.username)}">${esc(m.name||m.username)}</option>`).join('')}</select></label>
  <label>Personagem<select data-session-add-character><option value="">— Manter personagem da Campanha —</option>${freeCharacters.map(c=>`<option value="${esc(c.id)}">${esc(c.name||'Personagem')}</option>`).join('')}</select></label></div>
  <div class="row-actions roster-add-actions"><button type="button" data-session-add-button>Adicionar jogador</button><button type="button" class="secondary" data-save-session-participants>Salvar</button></div></div>`}
 </section>`;
}
function bindSessionRoster(card,ref){
 const update=(usernames)=>{
  const c=campaignById(ref.campaignId),members=c?.members||[],characters=members.filter(m=>usernames.includes(m.username)&&m.characterId).map(m=>m.characterId);
  saveSession(ref,{participantUsernames:usernames,participantCharacterIds:characters},'Jogadores da sessão atualizados.')
 };
 card.querySelectorAll('[data-session-character-link]').forEach(select=>select.addEventListener('change',()=>{
  const campaignId=ref.campaignId,memberId=select.dataset.sessionCharacterLink,charId=select.value,current=readCampaigns();
  const change=charId?assignCharacterToMember(current,campaignId,memberId,charId):unassignCharacterFromMember(current,campaignId,memberId);
  if(!change.ok){feedback(change.reason||'Não foi possível atribuir a ficha.',false);render();return}
  campaigns=writeCampaigns(change.list);
  const assignment=campaignById(campaignId)?.members||[];
  const usernames=[...card.querySelectorAll('[data-session-roster-row]')].map(node=>node.dataset.sessionRosterRow);
  const characterIds=assignment.filter(m=>usernames.includes(m.username)&&m.characterId).map(m=>m.characterId);
  saveSession(ref,{participantUsernames:usernames,participantCharacterIds:characterIds},'Personagem atualizado na Campanha e na Sessão.')
 }));
 card.querySelector('[data-session-add-button]')?.addEventListener('click',()=>{
  const name=card.querySelector('[data-session-add-member]')?.value;
  const chosenCharacter=card.querySelector('[data-session-add-character]')?.value||'';
  if(!name)return feedback('Selecione um jogador da Campanha.',false);
  if(chosenCharacter){
   const member=campaignById(ref.campaignId)?.members.find(m=>m.username===name);
   if(!member)return feedback('Jogador não encontrado na Campanha.',false);
   const assigned=assignCharacterToMember(readCampaigns(),ref.campaignId,member.id,chosenCharacter);
   if(!assigned.ok)return feedback(assigned.reason||'Não foi possível atribuir o personagem.',false);
   campaigns=writeCampaigns(assigned.list);
  }
  const names=[...card.querySelectorAll('[data-session-roster-row]')].map(row=>row.dataset.sessionRosterRow);
  update([...new Set([...names,name])]);
 });
 card.querySelector('[data-save-session-participants]')?.addEventListener('click',()=>{
  const usernames=[...card.querySelectorAll('[data-session-roster-row]')].map(row=>row.dataset.sessionRosterRow);
  update(usernames);
 });
 for(const b of card.querySelectorAll('[data-session-roster-action]'))b.addEventListener('click',()=>{
  let names=[...card.querySelectorAll('[data-session-roster-row]')].map(row=>row.dataset.sessionRosterRow),user=b.dataset.username,i=names.indexOf(user);
  if(b.dataset.sessionRosterAction==='remove')names=names.filter(n=>n!==user);
  else{const j=i+(b.dataset.sessionRosterAction==='up'?-1:1);if(i<0||j<0||j>=names.length)return;[names[i],names[j]]=[names[j],names[i]]}
  update(names)
 });
 let moving='';
 for(const row of card.querySelectorAll('[data-session-roster-row]')){
  row.addEventListener('dragstart',event=>{moving=row.dataset.sessionRosterRow;event.dataTransfer?.setData('text/plain',moving)});
  row.addEventListener('dragover',event=>{if(moving&&moving!==row.dataset.sessionRosterRow)event.preventDefault()});
  row.addEventListener('drop',event=>{event.preventDefault();const to=row.dataset.sessionRosterRow,names=[...card.querySelectorAll('[data-session-roster-row]')].map(row=>row.dataset.sessionRosterRow);const i=names.indexOf(moving),j=names.indexOf(to);if(i<0||j<0)return;names.splice(j,0,names.splice(i,1)[0]);update(names);moving=''});
 }
}
function sessionCard(s,restricted=false){
 const adv=(restricted?sharedAdventures():adventures).find(a=>a.id===s.adventureId)||null, published=restricted?sharedCampaignRows().flatMap(row=>row.characters||[]):characters,participants=(s.participantCharacterIds||[]).map(id=>published.find(c=>c.id===id)?.name).filter(Boolean),playerNames=(s.participantUsernames||[]),cover=imageElementHtml(s.coverImage,s.coverImageUrl,{className:'campaign-product-hero-media',alt:`Capa de ${s.title}`});
 const campaignName=s.campaignName||campaignById(s.campaignId)?.name||'Sem campanha';
 const currentCampaign=restricted?sharedCampaignRows().find(row=>row.campaign.id===s.campaignId)?.campaign:campaignById(s.campaignId);
 return `<article id="session-${esc(s.id)}" class="session-card hub-detail-page ${s.status==='active'?'active':''}" data-session-id="${esc(s.id)}" data-session-source="${esc(s.source)}">
 <section class="campaign-product-hero session-product-hero">
 ${cover}
 <div class="campaign-product-actions">${s.campaignId?`<a class="btn campaign-product-create-action" href="mesa.html?id=${encodeURIComponent(s.campaignId)}">Abrir Campanha</a>`:''}${adv?`<a class="btn campaign-product-create-action" href="aventuras.html?campaign=${encodeURIComponent(adv.campaignId)}&id=${encodeURIComponent(adv.id)}">Abrir Aventura</a>`:''}</div>
 <div class="campaign-product-hero-content">
 <div class="campaign-product-kicker">Campanha: ${esc(campaignName)}${adv?' · Aventura: '+esc(numberedAdventureTitle(adv)):''}</div>
 <div class="campaign-product-title-row"><h1>${esc(numberedSessionTitle(s))}</h1><span class="badge ${esc(s.status)}">${esc(statusLabel(s.status))}</span></div>
 <p class="campaign-product-description">${esc(s.summary||s.objective||'Resumo da Sessão')}</p>
 <div class="campaign-product-meta">${s.date?`<span class="badge">${esc(s.date)}</span>`:''}<span class="badge">${playerNames.length} ${playerNames.length===1?'jogador':'jogadores'}</span><span class="badge">${(s.scenes||[]).length} ${(s.scenes||[]).length===1?'cena':'cenas'}</span><span class="badge">${(s.encounterCount??(s.encounters||[]).length)} {(s.encounterCount??(s.encounters||[]).length)===1?'encontro':'encontros'}</span></div>
 </div></section>
 <div class="campaign-product-summary">
 <div class="metric"><span>Status</span><strong>${esc(statusLabel(s.status))}</strong></div>
 <div class="metric"><span>Campanha</span><strong>${esc(campaignName)}</strong></div>
 <div class="metric"><span>Aventura</span><strong>${adv?esc(numberedAdventureTitle(adv)):'Sem aventura'}</strong></div>
 <div class="metric"><span>Personagens</span><strong>${participants.length}</strong></div>
 <div class="metric"><span>Encontros</span><strong>${s.encounterCount??(s.encounters||[]).length}</strong></div>
 </div>
 ${currentCampaign?renderNextCampaignSession(currentCampaign,{canPlan:!restricted,adventures:restricted?sharedAdventures():adventures}):''}
 <nav class="section-nav hub-detail-nav" aria-label="Seções da Sessão">
 <a href="#visao-geral">Visão geral</a><a href="#participantes">Jogadores da Sessão</a>
 <a href="#cenas">Cenas</a>${restricted?'':`<a href="#encontros">Encontros</a><a href="#combates">Combates</a>`}
 <a href="#linha-tempo">Linha do tempo</a></nav>
 <div class="campaign-sections campaign-editor-grid hub-detail-grid">
 ${restricted?`
  <section id="visao-geral" class="card campaign-editor-card"><h2>Visão geral</h2>
  ${s.objective?`<p><strong>Objetivo:</strong> ${esc(s.objective)}</p>`:''}
  ${s.summary?`<p>${esc(s.summary)}</p>`:''}
  </section>${sessionRosterHtml(s,{readOnly:true})}
  <section id="cenas" class="card campaign-editor-card"><h2>Cenas</h2><div class="story-list">
  ${(adv?.scenes||[]).length?(adv.scenes||[]).map(scene=>`<article class="story-card"><strong>${esc(scene.title)}</strong></article>`).join(''):'<p class="mini">Nenhuma cena revelada nesta Aventura.</p>'}</div></section>
 `:`
 <section id="visao-geral" class="card campaign-editor-card"><h2>Visão geral</h2><div class="form-grid two" style="margin-top:10px">
   <div class="wide"><strong>Imagem/capa</strong>${imagePickerHtml({media:s.coverImage,legacyUrl:s.coverImageUrl,alt:`Capa de ${s.title}`,className:'session-cover'})}</div>
  <label>Título<input data-session-field="title" value="${esc(s.title)}"></label>
  <label>Data<input type="date" data-session-field="date" value="${esc(s.date)}"></label>
  <label>Ordem<input type="number" min="1" step="1" data-session-field="order" value="${s.order}"></label>
  ${s.status==='active'?'':`<label>Status<select data-session-field="status">${['planned','next','current','completed','cancelled'].map(v=>option(v,statusLabel(v),s.status)).join('')}</select></label>`}
  <label>Aventura<select data-session-adventure ${s.campaignId?'':'disabled'}>${adventureOptions(s.adventureId,s.campaignId||'__sem_campanha__')}</select></label>
  <label>Objetivo<input data-session-field="objective" value="${esc(s.objective)}"></label>
  <label class="wide">Resumo da Sessão<textarea data-session-field="summary">${esc(s.summary)}</textarea></label>
  <label class="wide">Notas do Mestre<textarea data-session-field="dmNotes">${esc(s.dmNotes)}</textarea></label>
  <label class="wide">Registro rápido de acontecimentos<textarea data-session-field="quickLog">${esc(s.quickLog)}</textarea></label>
  <label class="wide">Resumo final<textarea data-session-field="finalSummary">${esc(s.finalSummary)}</textarea></label>
 </div>
 <div class="row-actions" style="margin-top:10px"><button type="button" data-save-session-main>Salvar</button></div>
 </section>${sessionRosterHtml(s,{readOnly:false})}
<section id="cenas" class="card campaign-editor-card"><h2>Cenas</h2><section class="session-subsection">
 ${adv?`<div class="story-list adventure-scene-source-list">${adv.scenes.map(scene=>{
  const linked=s.scenes?.some(row=>row.adventureSceneId===scene.id),other=scene.sessionId&&scene.sessionId!==s.id;
  return`<div class="campaign-reference-row"><div><strong>${esc(scene.title)}</strong><p class="mini">Cena da Aventura${linked?' · Adicionada à Sessão':other?' · Vinculada a outra Sessão':''}</p></div>
  <button type="button" class="secondary" data-include-adventure-scene="${esc(scene.id)}" ${linked||other?'disabled':''}>${linked?'Adicionada':'Adicionar à Sessão'}</button></div>`}).join('')}</div>` : ''}
 ${adv?`<div class="form-grid two" style="margin:8px 0 10px"><label>Cena da Aventura<select data-adventure-scene-picker>${adventureScenePickerOptions(s)}</select></label><div style="align-self:end"><button type="button" data-add-adventure-scene ${availableAdventureScenes(s).length?'':'disabled'}>Adicionar cena da Aventura</button></div></div>`:'<p class="mini">Esta Sessão não está vinculada a uma Aventura. Você ainda pode criar Cenas próprias da Sessão.</p>'}
 <div class="row-actions" style="margin:8px 0 10px"><button type="button" class="secondary" data-add-session-scene>Criar cena na Sessão</button></div>
 <div class="story-list">${s.scenes?.length?s.scenes.map(scene=>sceneCard(s,scene)).join(''):'<div class="story-empty">Nenhuma cena nesta sessão.</div>'}</div>
 <div class="row-actions" style="margin-top:10px"><button type="button" data-save-session-scenes>Salvar</button></div></section></section>
 ${encounterSummary(s)}
 `}${renderTimeline(s,'list',null,{readOnly:restricted})}</div></article>`
}
function render(){
 const detailMode=Boolean(sessionId);
 const collectionTitle=document.querySelector('.hub-collection-top');
 if(collectionTitle)collectionTitle.hidden=detailMode;
 const homeLink=document.querySelector('.hub-collection-home');
 if(homeLink)homeLink.hidden=detailMode;
 const restricted=playerMode();
 if(!restricted)reload();
 const rows=restricted?sharedSessions():allSessions(),sessions=filteredSessions(rows);
 const availableAdventures=restricted?sharedAdventures():adventures;
 const box=$('sessions-list'),createCard=$('session-create-card'),listSection=$('session-list-section');
 bindSessionAdventureScroll(null);
 box?.classList.remove('hub-collection-grid');
 if(!restricted)syncCreationOptions();
 if(sessionId){
  if(createCard)createCard.hidden=true;
  if(listSection)listSection.querySelector('.campaign-list-heading').hidden=true;
  const selected=sessions.find(s=>s.id===sessionId)||rows.find(s=>s.id===sessionId)||null;
  if(!box)return;
  box.innerHTML=selected?sessionCard(selected,restricted):`<div class="status warning">Sessão não encontrada.</div><div class="hub-collection-detail-back"><a class="btn secondary" href="${listHref()}">← Lista de Sessões</a></div>`;
  if(!restricted&&selected)bindSessionCards();if(selected){updateAppShellContext();bindCampaignAvatarPreviews(box);if(!restricted)bindStructuredDetails({getCampaign:()=>sessionRef(selected.id,selected.source),getNpcs:()=>[],save:(patch,{message}={})=>saveSession(sessionRef(selected.id,selected.source),patch,message||'Linha do tempo salva.'),feedback});else box.querySelectorAll('[data-timeline-toggle]').forEach(button=>button.addEventListener('click',()=>{const children=button.closest('.timeline-item')?.querySelector(':scope > .timeline-children');if(children){children.hidden=!children.hidden;button.setAttribute('aria-expanded',String(!children.hidden))}}))}hydrateMediaImages(box).catch(()=>{});
  return
 }
 if(listSection)listSection.querySelector('.campaign-list-heading').hidden=false;
 if(createCard)createCard.hidden=restricted||!showCreationPanel;
 if(!box)return;
 box.innerHTML=`<div class="session-adventure-groups">
  ${sessionAdventureGroupsHtml(sessions,availableAdventures,row=>sessionListCard(row,restricted,availableAdventures),campaigns)}
 </div>${restricted?'':`<div class="session-create-tile-row">${sessionCreateTile()}</div>`}`;
 if(restricted&&!sessions.length)box.innerHTML='<div class="empty">Nenhuma sessão foi atribuída à sua ficha.</div>';
 bindSessionAdventureScroll(box);
 $('open-session-create')?.addEventListener('click',event=>{
  event.preventDefault();
  showCreationPanel=true;
  if(createCard)createCard.hidden=false;
  $('open-session-create')?.setAttribute('aria-expanded','true');
  $('new-session-title')?.focus()
 });
 box.querySelectorAll('[data-status-disclosure]').forEach(disclosure=>disclosure.addEventListener('toggle',()=>{
  if(!disclosure.open)return;
  box.querySelectorAll('[data-status-disclosure][open]').forEach(other=>{if(other!==disclosure)other.open=false})
 }));
 box.querySelectorAll('[data-next-session-status]').forEach(button=>button.addEventListener('click',()=>{
  const ref=sessionRef(button.dataset.sessionStatusId,button.dataset.sessionSource);
  if(ref?.status===button.dataset.nextSessionStatus){button.closest('details')?.removeAttribute('open');return}
  if(ref&&updateSessionCardStatus(ref,button.dataset.nextSessionStatus)){
   [...document.querySelectorAll('#sessions-list [data-session-status-trigger]')].find(el=>el.dataset.sessionStatusTrigger===ref.id)?.focus()
  }else button.closest('details')?.removeAttribute('open')
 }));
 box.querySelectorAll('[data-delete-session-list]').forEach(button=>button.addEventListener('click',()=>{
  const ref=sessionRef(button.dataset.deleteSessionList,button.dataset.sessionSource);
  if(ref&&confirm('Excluir esta sessão?'))removeSession(ref)
 }));
 hydrateMediaImages(box).catch(()=>{})
}
async function createSession(){
 if(playerMode())return;
 const selectedCampaign=$('new-session-campaign')?.value||'',adventureId=$('new-session-adventure')?.value||null,adv=adventureById(adventureId);
 if(adventureId&&!adv)return feedback('A Aventura selecionada não foi encontrada.',false);
 if(selectedCampaign&&adv&&adv.campaignId!==selectedCampaign)return feedback('A Aventura selecionada pertence a outra Campanha.',false);
 const targetCampaignId=selectedCampaign||adv?.campaignId||'',campaign=targetCampaignId?campaignById(targetCampaignId):null;
 if(targetCampaignId&&!campaign)return feedback('Selecione uma Campanha válida.',false);
 const newStatus=$('new-session-status')?.value||'planned',title=$('new-session-title')?.value.trim(),date=$('new-session-date')?.value,id=campaignUid('session');
 const orderInput=$('new-session-order'),order=Number(orderInput?.value);
 if(!Number.isInteger(order)||order<1)return feedback('Informe uma ordem válida para a Sessão.',false);
 if(campaign){
  const before=campaigns;let coverImage=null;
  try{if(pendingSessionCoverFile)coverImage=await uploadImage({campaignId:campaign.id,entityType:'session',entityId:id,file:pendingSessionCoverFile})}catch(error){return feedback(error?.message||'Não foi possível salvar a imagem.',false)}
  const result=addCampaignSession(campaigns,campaign.id,{id,adventureId:adv?.id||null,title:title||undefined,date,status:newStatus,order,coverImage,participantUsernames:adv?.participantUsernames||[],participantCharacterIds:adv?.characterIds||[]});
  if(!result.ok){if(coverImage)deleteImage(coverImage).catch(()=>{});return feedback(result.reason,false)}
  campaigns=writeCampaigns(result.list);
  try{if(coverImage)await persistCampaignMediaState(campaign.id,{entityType:'session',entityId:id})}catch(error){campaigns=writeCampaigns(before);if(coverImage)await deleteImage(coverImage).catch(()=>{});return feedback('A Sessão não pôde ser sincronizada. Nenhuma imagem foi perdida.',false)}
  location.href=detailHref({...result.session,campaignId:campaign.id})
 }else{
  let coverImage=null;try{if(pendingSessionCoverFile)coverImage=await uploadImage({campaignId:null,entityType:'session',entityId:id,file:pendingSessionCoverFile})}catch(error){return feedback(error?.message||'Não foi possível salvar a imagem.',false)}
  const result=createStandaloneSession(standalone,{id,title:title||undefined,date,status:newStatus,order,coverImage});
  standalone=writeStandaloneSessions(result.list);location.href=detailHref(result.session)
 }
}
function addAdventureSceneToSession(ref,adventureSceneId){
 const session=findMutableSession(ref),adv=adventureById(session?.adventureId);
 if(!session||!adv)return feedback('Esta Sessão não possui Aventura vinculada.',false);
 const target=adv.scenes.find(scene=>scene.id===adventureSceneId);
 if(!target)return feedback('Selecione uma Cena da Aventura.',false);
 if(session.scenes.some(scene=>scene.adventureSceneId===target.id))return feedback('Esta Cena da Aventura já está nesta Sessão.',false);
 if(target.sessionId&&target.sessionId!==session.id)return feedback('Esta Cena da Aventura já está vinculada a outra Sessão.',false);
 if(target.sessionSceneId&&target.sessionId===session.id)return feedback('Esta Cena da Aventura já possui vínculo com uma Cena desta Sessão.',false);
 const result=addSessionScene(session,{title:target.title,status:target.status,adventureSceneId:target.id,locationId:target.locationId,npcIds:target.npcIds,missionIds:target.missionIds,clueIds:target.clueIds,handoutIds:target.handoutIds,treasureIds:target.treasureIds,description:target.description});
 if(!result.ok)return feedback(result.reason,false);
 const linked=updateAdventureEntity(adventures,adv.id,'scenes',target.id,{sessionId:session.id,sessionSceneId:result.scene.id});
 if(!linked.ok){session.scenes=session.scenes.filter(scene=>scene.id!==result.scene.id);return feedback(linked.reason,false)}
 adventures=writeAdventures(linked.list);
 persistMutableSession(ref,session,'Cena da Aventura adicionada à Sessão.')
}
function updateSceneLink(ref,sceneId,newAdventureSceneId){
 const session=findMutableSession(ref);if(!session)return;
 const scene=session.scenes.find(s=>s.id===sceneId);if(!scene)return;
 const adv=adventureById(session.adventureId);
 if(!adv&&newAdventureSceneId)return feedback('Esta sessão não possui Aventura vinculada.',false);
 const oldId=scene.adventureSceneId;
 if(adv&&oldId&&oldId!==newAdventureSceneId){
  const oldScene=adv.scenes.find(x=>x.id===oldId);
  if(oldScene&&oldScene.sessionId===session.id&&oldScene.sessionSceneId===scene.id){
   const result=updateAdventureEntity(adventures,adv.id,'scenes',oldScene.id,{sessionId:null,sessionSceneId:null});
   if(result.ok)adventures=writeAdventures(result.list)
  }
 }
 if(adv&&newAdventureSceneId){
  const target=adv.scenes.find(x=>x.id===newAdventureSceneId);
  if(!target)return;
  if(target.sessionId&&target.sessionSceneId&&(target.sessionId!==session.id||target.sessionSceneId!==scene.id)){
   const other=sessionRef(target.sessionId);
   if(other){
    if(other.id===ref.id){
     const otherScene=session.scenes.find(x=>x.id===target.sessionSceneId);if(otherScene)otherScene.adventureSceneId=null
    }else{
     const otherSession=findMutableSession(other),otherScene=otherSession?.scenes.find(x=>x.id===target.sessionSceneId);
     if(otherScene){otherScene.adventureSceneId=null;storeMutableSession(other,otherSession)}
    }
   }
  }
  const result=updateAdventureEntity(adventures,adv.id,'scenes',target.id,{sessionId:session.id,sessionSceneId:scene.id});
  if(result.ok)adventures=writeAdventures(result.list)
 }
 scene.adventureSceneId=newAdventureSceneId||null;
 persistMutableSession(ref,session,'Cena vinculada.')
}
function saveSessionMainFromCard(ref,card){
 const patch=Object.fromEntries([...card.querySelectorAll('[data-session-field]')].map(input=>[input.dataset.sessionField,input.type==='number'?Number(input.value):input.value]));
 saveSession(ref,patch,'Etapa salva.')
}
function saveSessionParticipantsFromCard(ref,card){
 saveSession(ref,{participantUsernames:[...card.querySelectorAll('[data-session-roster-row]')].map(row=>row.dataset.sessionRosterRow)},'Participantes salvos.')
}
function applySceneFields(session,node){
 const sceneId=node.dataset.sessionScene,patch={};
 for(const input of node.querySelectorAll('[data-session-scene-field]'))patch[input.dataset.sessionSceneField]=input.type==='number'?Number(input.value):input.value;
 return updateSessionScene(session,sceneId,patch)
}
function saveSessionSceneNode(ref,node){
 const session=findMutableSession(ref),result=applySceneFields(session,node);
 if(!result.ok)return feedback(result.reason,false);
 persistMutableSession(ref,session,'Cena salva.')
}
function saveSessionScenesFromCard(ref,card){
 const session=findMutableSession(ref);if(!session)return feedback('Sessão não encontrada.',false);
 for(const node of card.querySelectorAll('[data-session-scene]')){
  const result=applySceneFields(session,node);if(!result.ok)return feedback(result.reason,false)
 }
 persistMutableSession(ref,session,'Cenas salvas.')
}
function bindSessionCards(){
 document.querySelectorAll('[data-session-id]').forEach(card=>{
  const ref=sessionRef(card.dataset.sessionId,card.dataset.sessionSource);if(!ref)return;
  const picker=card.querySelector('[data-image-picker]');if(picker)bindImagePicker(picker,{onSelect:async file=>{const current=findMutableSession(ref),previous=current?.coverImage,media=await uploadImage({campaignId:ref.campaignId||null,entityType:'session',entityId:ref.id,file});await saveSessionCoverPersistent(ref,{coverImage:media,coverImageUrl:''},{previous,newMedia:media,message:'Imagem salva e sincronizada.'})},onRemove:async()=>{const current=findMutableSession(ref),previous=current?.coverImage;await saveSessionCoverPersistent(ref,{coverImage:null,coverImageUrl:''},{previous,message:'Imagem removida e sincronizada.'})},onError:error=>feedback(error?.message||'Não foi possível salvar a imagem.',false)});
  card.querySelectorAll('[data-session-field]').forEach(input=>input.addEventListener('change',()=>saveSession(ref,{[input.dataset.sessionField]:input.type==='number'?Number(input.value):input.value})));
  card.querySelector('[data-session-adventure]')?.addEventListener('change',event=>changeSessionAdventure(ref,event.target.value));
  bindSessionRoster(card,ref);
  card.querySelector('[data-save-session-main]')?.addEventListener('pointerdown',event=>{event.preventDefault();saveSessionMainFromCard(ref,card)});
  card.querySelector('[data-save-session-participants]')?.addEventListener('pointerdown',event=>{event.preventDefault();saveSessionParticipantsFromCard(ref,card)});
  card.querySelector('[data-save-session-scenes]')?.addEventListener('pointerdown',event=>{event.preventDefault();saveSessionScenesFromCard(ref,card)});
  card.querySelector('[data-remove-session]')?.addEventListener('click',()=>{if(confirm('Excluir esta sessão?'))removeSession(ref)});
  card.querySelectorAll('[data-include-adventure-scene]').forEach(button=>button.addEventListener('click',()=>addAdventureSceneToSession(ref,button.dataset.includeAdventureScene)));
  card.querySelector('[data-add-adventure-scene]')?.addEventListener('click',()=>{
   const sceneId=card.querySelector('[data-adventure-scene-picker]')?.value||'';addAdventureSceneToSession(ref,sceneId)
  });
  card.querySelector('[data-add-session-scene]')?.addEventListener('click',()=>{
   const session=findMutableSession(ref),result=addSessionScene(session,{title:`Cena ${(session?.scenes?.length||0)+1}`});if(!result.ok)return feedback(result.reason,false);persistMutableSession(ref,session,'Cena adicionada.')
  });
  card.querySelectorAll('[data-session-scene]').forEach(node=>{
   const sceneId=node.dataset.sessionScene;
   node.querySelectorAll('[data-session-scene-field]').forEach(input=>input.addEventListener('change',()=>{
    const session=findMutableSession(ref),value=input.type==='number'?Number(input.value):input.value,result=updateSessionScene(session,sceneId,{[input.dataset.sessionSceneField]:value});
    if(!result.ok)return feedback(result.reason,false);persistMutableSession(ref,session,'Cena atualizada.')
   }));
   node.querySelector('[data-save-session-scene]')?.addEventListener('pointerdown',event=>{event.preventDefault();saveSessionSceneNode(ref,node)});
   node.querySelector('[data-session-scene-adventure]')?.addEventListener('change',e=>updateSceneLink(ref,sceneId,e.target.value||null));
   node.querySelector('[data-remove-session-scene]')?.addEventListener('click',()=>{
    if(!confirm('Excluir esta cena da sessão?'))return;
    const session=findMutableSession(ref),scene=session?.scenes.find(s=>s.id===sceneId);
    if(scene?.adventureSceneId)updateSceneLink(ref,sceneId,null);
    const fresh=findMutableSession(ref),result=removeSessionScene(fresh,sceneId);if(!result.ok)return feedback(result.reason,false);persistMutableSession(ref,fresh,'Cena excluída.')
   })
  })
 })
}
function refreshFromRemote(event){event.detail?.claim?.();render()}
const newCoverHolder=$('new-session-cover-picker');if(newCoverHolder){newCoverHolder.innerHTML=imagePickerHtml({});bindImagePicker(newCoverHolder.querySelector('[data-image-picker]'),{onSelect:async file=>{pendingSessionCoverFile=file},onRemove:async()=>{pendingSessionCoverFile=null},onError:error=>feedback(error?.message||'Não foi possível usar a imagem.',false)})}
$('create-session')?.addEventListener('click',createSession);
$('cancel-session-create')?.addEventListener('click',()=>{showCreationPanel=false;$('session-create-card').hidden=true;$('open-session-create')?.setAttribute('aria-expanded','false')});
$('new-session-campaign')?.addEventListener('change',()=>syncCreationOptions({resetAdventure:true}));
$('new-session-order')?.addEventListener('input',()=>{$('new-session-order').dataset.orderEdited='true'});
$('new-session-adventure')?.addEventListener('change',event=>{
 const adventure=adventureById(event.target.value),campaignSelect=$('new-session-campaign');
 if(adventure&&campaignSelect&&!campaignSelect.value){campaignSelect.value=adventure.campaignId;syncCreationOptions()}
});
reload();render();
document.addEventListener('pointerdown',event=>{
 if(event.target.closest?.('#sessions-list [data-status-disclosure]'))return;
 document.querySelectorAll('#sessions-list [data-status-disclosure][open]').forEach(node=>node.open=false)
});
document.addEventListener('keydown',event=>{
 if(event.key!=='Escape')return;
 const open=document.querySelector('#sessions-list [data-status-disclosure][open]');
 if(!open)return;
 open.open=false;open.querySelector('summary')?.focus();event.stopPropagation()
});
if(params.get('new')==='1'&&!sessionId&&!playerMode())requestAnimationFrame(()=>{
 $('session-create-card')?.scrollIntoView({block:'start'});
 $('new-session-title')?.focus({preventScroll:true})
});
window.addEventListener('hub-rpg:remote-updated',refreshFromRemote);
window.addEventListener('hub-rpg:sessions-local-updated',()=>{reload();render()});
