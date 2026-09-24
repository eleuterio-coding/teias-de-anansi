import{read}from'./character-builder/state.js';
import{readCampaigns,writeCampaigns,allCampaignSessions,addCampaignSession,updateCampaignSession,removeCampaignSession,readStandaloneSessions,writeStandaloneSessions,createStandaloneSession,updateStandaloneSession,removeStandaloneSession,addSessionScene,updateSessionScene,removeSessionScene}from'./campaign-state.js?v=20260924-session-scenes2';
import{readAdventures,writeAdventures,updateAdventureEntity}from'./adventure-state.js?v=20260924-session-scenes2';
import{playerMode,sharedCampaignRows}from'./collaboration-view.js?v=20260917-player-catalog1';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search),campaignFilter=params.get('campaign')||'',adventureFilter=params.get('adventure')||'';
let campaigns=[],standalone=[],adventures=[],characters=[];

const statusLabel=s=>({planned:'Planejada',active:'Em andamento',completed:'Concluída',cancelled:'Cancelada'}[s]||s);
const sceneStatus=s=>({planned:'Planejada',active:'Em andamento',completed:'Concluída',skipped:'Ignorada'}[s]||s);
const option=(value,label,current)=>`<option value="${esc(value)}" ${String(value)===String(current)?'selected':''}>${esc(label)}</option>`;

function feedback(message,ok=true){
 const box=$('session-feedback');if(!box)return;
 box.hidden=false;box.className=`status ${ok?'ok':'warning'}`;box.textContent=message;
 clearTimeout(feedback.timer);feedback.timer=setTimeout(()=>box.hidden=true,3000)
}
function reload(){
 campaigns=readCampaigns();standalone=readStandaloneSessions();adventures=readAdventures();characters=read()
}
function sharedSessions(){
 return sharedCampaignRows().flatMap(row=>(row.campaign.sessions||[]).map(s=>({...s,source:'campaign',campaignId:row.campaign.id,campaignName:row.campaign.name,assignedCharacterId:row.membership.characterId})))
}
function allSessions(){
 const nested=allCampaignSessions(campaigns).map(s=>({...s,source:'campaign'}));
 const loose=standalone.map(s=>({...s,source:'standalone',campaignId:null,campaignName:''}));
 return [...nested,...loose].sort((a,b)=>String(b.date||b.updatedAt).localeCompare(String(a.date||a.updatedAt))||b.number-a.number)
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
function removeSession(ref){
 if(!ref)return;
 if(ref.source==='campaign'){
  const result=removeCampaignSession(campaigns,ref.campaignId,ref.id);
  if(!result.ok)return feedback(result.reason,false);
  campaigns=writeCampaigns(result.list)
 }else{
  const result=removeStandaloneSession(standalone,ref.id);
  if(!result.ok)return feedback(result.reason,false);
  standalone=writeStandaloneSessions(result.list)
 }
 reload();render();feedback('Sessão excluída.')
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
function adventureLabel(a){
 const c=campaignById(a.campaignId);return c?`${a.title} · ${c.name}`:a.title
}
function adventureOptions(current=''){
 return `<option value="">— Sem aventura —</option>${adventures.map(a=>option(a.id,adventureLabel(a),current)).join('')}`
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
function sessionCard(s,restricted=false){
 const adv=adventureById(s.adventureId),participants=participantNames(s),playerNames=(s.participantUsernames||[]);
 return `<article id="session-${esc(s.id)}" class="session-card ${s.status==='active'?'active':''}" data-session-id="${esc(s.id)}" data-session-source="${esc(s.source)}">
 <div class="session-head"><div>
  <h3>${esc(s.title)}</h3>
  <div><span class="badge ${s.status==='active'?'active':''}">${esc(statusLabel(s.status))}</span>${s.date?`<span class="badge">${esc(s.date)}</span>`:''}<span class="badge">${adv?esc(adv.title):'Sem aventura'}</span></div>
 </div><div class="row-actions">${adv?`<a class="btn secondary" href="aventuras.html?campaign=${encodeURIComponent(adv.campaignId)}&id=${encodeURIComponent(adv.id)}">Abrir aventura</a>`:''}${restricted?'':`<button type="button" class="danger" data-remove-session>Excluir</button>`}</div></div>
 ${restricted?`
  ${s.objective?`<p><strong>Objetivo:</strong> ${esc(s.objective)}</p>`:''}
  ${s.summary?`<p>${esc(s.summary)}</p>`:''}
  ${participants.length?`<p class="mini">Personagens: ${esc(participants.join(', '))}</p>`:''}
 `:`
 <div class="form-grid two" style="margin-top:10px">
  <label>Título<input data-session-field="title" value="${esc(s.title)}"></label>
  <label>Data<input type="date" data-session-field="date" value="${esc(s.date)}"></label>
  <label>Status<select data-session-field="status">${['planned','active','completed','cancelled'].map(v=>option(v,statusLabel(v),s.status)).join('')}</select></label>
  <label>Aventura<input value="${esc(adv?.title||'Sem aventura')}" readonly></label>
  <label>Objetivo<input data-session-field="objective" value="${esc(s.objective)}"></label>
  <label class="wide">Resumo / preparação<textarea data-session-field="summary">${esc(s.summary)}</textarea></label>
  <label class="wide">Notas do Mestre<textarea data-session-field="dmNotes">${esc(s.dmNotes)}</textarea></label>
  <label class="wide">Registro rápido de acontecimentos<textarea data-session-field="quickLog">${esc(s.quickLog)}</textarea></label>
  <label class="wide">Resumo final<textarea data-session-field="finalSummary">${esc(s.finalSummary)}</textarea></label>
 </div>
 <div class="row-actions" style="margin-top:10px"><button type="button" data-save-session-main>Salvar</button></div>
 <div class="session-subsection"><h4>Jogadores participantes</h4><p class="mini">${playerNames.length?esc(playerNames.join(', ')):'Nenhum jogador registrado.'}</p></div>
 <div class="session-subsection"><h4>Personagens participantes</h4><div class="entity-checks">${characters.length?characters.map(c=>`<label><input type="checkbox" data-session-character="${esc(c.id)}" ${(s.participantCharacterIds||[]).includes(c.id)?'checked':''}>${esc(c.name||'Personagem')}</label>`).join(''):'<span class="mini">Nenhum personagem no Hub.</span>'}</div><div class="row-actions" style="margin-top:10px"><button type="button" data-save-session-participants>Salvar</button></div></div>
 <section class="session-subsection"><div class="top"><h4>Cenas</h4></div>
 ${adv?`<div class="form-grid two" style="margin:8px 0 10px"><label>Cena da Aventura<select data-adventure-scene-picker>${adventureScenePickerOptions(s)}</select></label><div style="align-self:end"><button type="button" data-add-adventure-scene ${availableAdventureScenes(s).length?'':'disabled'}>Adicionar cena da Aventura</button></div></div>`:'<p class="mini">Esta Sessão não está vinculada a uma Aventura. Você ainda pode criar Cenas próprias da Sessão.</p>'}
 <div class="row-actions" style="margin:8px 0 10px"><button type="button" class="secondary" data-add-session-scene>Criar cena na Sessão</button></div>
 <div class="story-list">${s.scenes?.length?s.scenes.map(scene=>sceneCard(s,scene)).join(''):'<div class="story-empty">Nenhuma cena nesta sessão.</div>'}</div>
 <div class="row-actions" style="margin-top:10px"><button type="button" data-save-session-scenes>Salvar</button></div></section>
 ${encounterSummary(s)}
 `}</article>`
}
function render(){
 const restricted=playerMode();
 if(!restricted)reload();
 const rows=restricted?sharedSessions():allSessions(),sessions=filteredSessions(rows),box=$('sessions-list'),createCard=$('session-create-card');
 if(createCard)createCard.hidden=restricted;
 const select=$('new-session-adventure');
 if(select&&!restricted)select.innerHTML=adventureOptions(adventureFilter);
 const stats={planned:sessions.filter(s=>s.status==='planned').length,active:sessions.filter(s=>s.status==='active').length,completed:sessions.filter(s=>s.status==='completed').length};
 $('session-metrics').innerHTML=`<div class="metric"><span>Sessões</span><strong>${sessions.length}</strong></div><div class="metric"><span>Em andamento</span><strong>${stats.active}</strong></div><div class="metric"><span>Planejadas</span><strong>${stats.planned}</strong></div><div class="metric"><span>Concluídas</span><strong>${stats.completed}</strong></div>`;
 if(!box)return;
 box.innerHTML=sessions.length?sessions.map(s=>sessionCard(s,restricted)).join(''):`<div class="empty">${restricted?'Nenhuma sessão foi atribuída à sua ficha.':'Nenhuma sessão registrada.'}</div>`;
 if(!restricted)bindSessionCards()
}
function createSession(){
 if(playerMode())return;
 const adventureId=$('new-session-adventure')?.value||null,adv=adventureById(adventureId),title=$('new-session-title')?.value.trim(),date=$('new-session-date')?.value,objective=$('new-session-objective')?.value;
 if(adv){
  const campaign=campaignById(adv.campaignId);
  if(!campaign)return feedback('A Campanha da Aventura não foi encontrada.',false);
  const result=addCampaignSession(campaigns,campaign.id,{adventureId:adv.id,title:title||undefined,date,objective,participantUsernames:adv.participantUsernames,participantCharacterIds:adv.characterIds});
  if(!result.ok)return feedback(result.reason,false);
  campaigns=writeCampaigns(result.list);reload();render();location.hash=`session-${result.session.id}`;feedback('Sessão criada e vinculada à Aventura.')
 }else{
  const result=createStandaloneSession(standalone,{title:title||undefined,date,objective});
  standalone=writeStandaloneSessions(result.list);reload();render();location.hash=`session-${result.session.id}`;feedback('Sessão avulsa criada.')
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
 const patch=Object.fromEntries([...card.querySelectorAll('[data-session-field]')].map(input=>[input.dataset.sessionField,input.value]));
 saveSession(ref,patch,'Etapa salva.')
}
function saveSessionParticipantsFromCard(ref,card){
 const participantCharacterIds=[...card.querySelectorAll('[data-session-character]:checked')].map(el=>el.dataset.sessionCharacter);
 saveSession(ref,{participantCharacterIds},'Participantes salvos.')
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
  card.querySelectorAll('[data-session-field]').forEach(input=>input.addEventListener('change',()=>saveSession(ref,{[input.dataset.sessionField]:input.value})));
  card.querySelectorAll('[data-session-character]').forEach(input=>input.addEventListener('change',()=>{
   const ids=[...card.querySelectorAll('[data-session-character]:checked')].map(el=>el.dataset.sessionCharacter);saveSession(ref,{participantCharacterIds:ids},'Participantes atualizados.')
  }));
  card.querySelector('[data-save-session-main]')?.addEventListener('pointerdown',event=>{event.preventDefault();saveSessionMainFromCard(ref,card)});
  card.querySelector('[data-save-session-participants]')?.addEventListener('pointerdown',event=>{event.preventDefault();saveSessionParticipantsFromCard(ref,card)});
  card.querySelector('[data-save-session-scenes]')?.addEventListener('pointerdown',event=>{event.preventDefault();saveSessionScenesFromCard(ref,card)});
  card.querySelector('[data-remove-session]')?.addEventListener('click',()=>{if(confirm('Excluir esta sessão?'))removeSession(ref)});
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
$('create-session')?.addEventListener('click',createSession);
reload();render();
window.addEventListener('hub-rpg:remote-updated',refreshFromRemote);
