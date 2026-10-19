import{read,readNpcs}from'./character-builder/state.js';
import{findNextCampaignSession,renderNextCampaignSession}from'./campaign-next-session-ui.js?v=20261017-next1';
import{renderStructuredDetails,renderTimeline,bindStructuredDetails}from'./campaign-structured-ui.js?v=20261019-drag-feedback1';
import{readCampaigns,writeCampaigns,campaignById,updateCampaign,addCampaignMember,updateCampaignMember,removeCampaignMember,assignCharacterToMember,unassignCharacterFromMember,addCampaignSession,updateCampaignSession,startCampaignSession,finishCampaignSession,cancelCampaignSession,removeCampaignSession}from'./campaign-state.js?v=20261016-campaign-geography1';
import{readAdventures,adventuresForCampaign}from'./adventure-state.js?v=20261016-current-status2';
import{loadFirebaseConfig}from'./firebase-collaboration-provider.js?v=20260925-media1';
import{uploadImage,deleteImage,persistCampaignMediaState,imageElementHtml,imagePickerHtml,bindImagePicker,hydrateMediaImages}from'./image-media.js?v=20260925-media2';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search),campaignId=params.get('id');let campaigns=[],campaign=null,characters=[],hubParticipants=[],saveTimer=null;
const statusLabel=s=>({planned:'Planejada',current:'Atual',active:'Em andamento',paused:'Pausada',finished:'Concluída'}[s]||s),sessionStatus=s=>({planned:'Planejada',next:'Próxima',current:'Atual',active:'Em andamento',completed:'Concluída',cancelled:'Cancelada'}[s]||s),adventureStatus=s=>({planned:'Planejada',current:'Atual',active:'Em andamento',completed:'Concluída',archived:'Arquivada'}[s]||s);
function feedback(message,ok=true){const box=$('table-feedback');if(!box)return;box.hidden=false;box.className=`status ${ok?'ok':'warning'}`;box.textContent=message;clearTimeout(feedback.timer);feedback.timer=setTimeout(()=>box.hidden=true,3200)}
function commit(list,{rerender=true,message='Mesa salva.'}={}){campaigns=writeCampaigns(list);campaign=campaignById(campaigns,campaignId);if(rerender)render();feedback(message,true)}
function savePatch(patch,{rerender=false,message='Mesa salva.'}={}){const result=updateCampaign(campaigns,campaignId,patch);if(result.ok)commit(result.list,{rerender,message})}
const alphabetical=new Intl.Collator('pt-BR',{sensitivity:'base',numeric:true});
const playerOrder=(a,b)=>alphabetical.compare(a.displayName||a.username||'',b.displayName||b.username||'')||alphabetical.compare(a.username||'',b.username||'');
const characterOrder=(a,b)=>alphabetical.compare(a.name||'Personagem sem nome',b.name||'Personagem sem nome')||alphabetical.compare(a.id||'',b.id||'');
function charLabel(c){const s=c.refSnapshots||{},level=c.choices?.class?.level;return`${c.name||'Personagem sem nome'}${s.class?.name?` · ${s.class.name}${level?` ${level}`:''}`:''}`}
function characterOptions(selected='',memberId='',username=''){
 // Somente personagens sem vínculo com qualquer campanha podem ser escolhidos.
 // O vínculo com a própria linha continua aparecendo como seleção corrente.
 const unavailable=id=>campaigns.some(c=>(c.members||[]).some(m=>
  m.characterId===id&&(c.id!==campaignId||m.id!==memberId)
 ));
 return `<option value="">— Sem personagem —</option>${characters.filter(c=>!unavailable(c.id)).sort(characterOrder).map(c=>`<option value="${esc(c.id)}" ${c.id===selected?'selected':''}>${esc(charLabel(c))}</option>`).join('')}`
}
function participantOptions(){const used=new Set(campaign.members.map(m=>String(m.username||m.name||'').trim().toLowerCase()));const rows=hubParticipants.filter(p=>!used.has(String(p.username||p.displayName||'').trim().toLowerCase())).sort(playerOrder);return`<option value="">— Selecione —</option>${rows.map(p=>`<option value="${esc(p.username)}">${esc(p.displayName)}</option>`).join('')}`}function activeSession(){return campaign?.sessions.find(s=>s.id===campaign.activeSessionId)||null}
function metric(label,value,href=''){
 const content=`<span>${esc(label)}</span><strong>${esc(value)}</strong>`;
 return href?`<a class="metric campaign-summary-link" href="${esc(href)}" aria-label="${esc(label)}: ${esc(value)}">${content}</a>`
  :`<div class="metric">${content}</div>`
}
const countLabel=(n,singular,plural)=>`${n} ${n===1?singular:plural}`
function overviewHtml(){
 const linked=campaign.members.filter(m=>m.characterId).length,adventures=adventuresForCampaign(readAdventures(),campaignId);

 const cover=imageElementHtml(campaign.coverImage,campaign.coverImageUrl,{className:'campaign-product-hero-media',alt:''});
 const featured=findNextCampaignSession(campaign),nextLabel=featured?(featured.date||featured.title):'Não definida';
 const nextHref=featured?`sessoes.html?campaign=${encodeURIComponent(campaignId)}&id=${encodeURIComponent(featured.id)}`:'';
 return `<section class="campaign-product-hero">${cover}<div class="campaign-product-actions"><a class="btn secondary" href="campanhas.html">Todas as campanhas</a><a class="btn" href="sessoes.html?campaign=${encodeURIComponent(campaignId)}">Nova sessão</a></div><div class="campaign-product-hero-content"><div class="campaign-product-kicker">Contexto da Mesa · ${esc(campaign.system||'D&D 5.5e')}</div><div class="campaign-product-title-row"><h1>${esc(campaign.name)}</h1><span class="badge ${esc(campaign.status)}">${esc(statusLabel(campaign.status))}</span></div><p class="campaign-product-description">${esc(campaign.description||'Organize aventuras, sessões, personagens e o mundo desta campanha.')}</p><div class="campaign-product-meta"><span class="badge">${esc(campaign.setting||campaign.system||'D&D 5.5e')}</span><span class="badge">${countLabel(campaign.members.length,'jogador','jogadores')}</span><span class="badge">${countLabel(adventures.length,'aventura','aventuras')}</span></div></div></section><div class="campaign-product-summary">${metric('Status',statusLabel(campaign.status))}${metric('Sessões',campaign.sessions.length,'#sessoes')}${metric('Personagens',linked,'#jogadores')}${metric('Próxima sessão',nextLabel,nextHref)}</div>`
}
function settingsHtml(){return`<section id='campanha' class='card campaign-editor-card'><h2>Campanha</h2><div class='form-grid two'><label>Nome da campanha<input data-campaign-field='name' value='${esc(campaign.name)}'></label><div class='wide'><strong>Imagem/capa</strong>${imagePickerHtml({media:campaign.coverImage,legacyUrl:campaign.coverImageUrl,alt:`Capa de ${campaign.name}`,className:'campaign-cover-image'})}</div><label class='wide'>Descrição curta<textarea maxlength='500' data-campaign-field='description'>${esc(campaign.description)}</textarea></label><label class='wide'>Cenário de Campanha<input maxlength='160' data-campaign-field='setting' value='${esc(campaign.setting||'')}'></label><label>Mundo / Plano<input maxlength='160' data-campaign-field='worldPlane' value='${esc(campaign.worldPlane||'')}'></label><label>Principal Continente / Região<input maxlength='160' data-campaign-field='mainRegion' value='${esc(campaign.mainRegion||'')}'></label><label>Status<select data-campaign-field='status'><option value='planned' ${campaign.status==='planned'?'selected':''}>Planejada</option><option value='active' ${campaign.status==='active'?'selected':''}>Em andamento</option><option value='paused' ${campaign.status==='paused'?'selected':''}>Pausada</option><option value='finished' ${campaign.status==='finished'?'selected':''}>Concluída</option></select></label></div><div class='row-actions' style='margin-top:10px'><button type='button' data-save-campaign-section>Salvar</button></div></section>`}
function referenceSectionsHtml(){const adventures=adventuresForCampaign(readAdventures(),campaignId);const adv=`<section id='aventuras' class='card campaign-editor-card'><div class='top'><h2>Aventuras da campanha</h2><a class='btn secondary' href='aventuras.html?campaign=${encodeURIComponent(campaignId)}'>Abrir aventuras</a></div><div class='list'>${adventures.length?adventures.map(a=>`<article class='campaign-reference-row'><div><strong>${esc(a.title)}</strong><div><span class='badge'>${esc(adventureStatus(a.status))}</span></div>${a.summary?`<p class='mini'>${esc(a.summary)}</p>`:''}</div><a class='btn secondary' href='aventuras.html?campaign=${encodeURIComponent(campaignId)}&id=${encodeURIComponent(a.id)}'>Abrir</a></article>`).join(''):'<div class="empty">Nenhuma aventura vinculada.</div>'}</div></section>`;return adv}

function detailsSectionsHtml(){

 const text=(id,title,field)=>`<section id="${id}" class="card campaign-editor-card"><h2>${esc(title)}</h2><textarea class="campaign-large-text" data-campaign-field="${field}">${esc(campaign[field])}</textarea><div class="row-actions" style="margin-top:10px"><button type="button" data-save-campaign-section>Salvar</button></div></section>`;
 return text('historia','Resumo da história','historySummary')
  +renderStructuredDetails(campaign,readNpcs())
  +renderTimeline(campaign)
  +text('notas-mestre','Notas do Mestre','dmNotes')
}

function memberRow(m){
 const linked=characters.find(c=>c.id===m.characterId),name=m.name||m.username||'Jogador',initial=Array.from(name.trim())[0]?.toLocaleUpperCase('pt-BR')||'J';
 return `<article class="member-row roster-player" data-member-row="${esc(m.id)}">
  <div class="roster-player-identity"><span class="roster-avatar" aria-hidden="true">${esc(initial)}</span><div class="roster-player-display" aria-label="Jogador: ${esc(name)}"><span class="roster-player-label">Jogador</span><span class="roster-player-name">${esc(name)}</span></div></div>
  <div class="roster-player-character"><label>Personagem<select data-member-character aria-label="Personagem de ${esc(name)}">${characterOptions(m.characterId,m.id,m.username||m.name)}</select></label></div>
  <div class="row-actions roster-player-actions">${rosterOpenButton(linked)}<button type="button" class="danger" data-remove-member="${esc(m.id)}">Remover</button></div>
 </article>`
}
function rosterHtml(){return`<section id="jogadores" class="card roster-section">
 <div class="roster-heading"><h2>Jogadores da Mesa</h2><span class="roster-count">${campaign.members.length} ${campaign.members.length===1?'jogador':'jogadores'}</span></div>
 <div id="member-list" class="list roster-list">${campaign.members.length?campaign.members.map(memberRow).join(''):'<div class="empty">Nenhum jogador adicionado.</div>'}</div>
 <div class="roster-add-panel"><h3>Adicionar jogador</h3>
  <div class="roster-add-fields"><label>Jogador<select id="new-member-user">${participantOptions()}</select></label><label>Personagem<select id="new-member-character">${characterOptions('')}</select></label></div>
  <div class="row-actions roster-add-actions"><button id="add-member" type="button">Adicionar jogador</button><button type="button" class="secondary" data-save-campaign-section>Salvar</button></div>
 </div></section>`}

function rosterOpenButton(linked){
 return linked
  ?`<a class="btn secondary roster-open-button" href="ficha-personagem.html?id=${encodeURIComponent(linked.id)}" aria-label="Abrir ficha de ${esc(linked.name||'personagem')}">Abrir</a>`
  :'<button type="button" class="secondary roster-open-button" disabled aria-label="Abrir ficha - personagem não vinculado">Abrir</button>';
}
/* Atualiza apenas os controles afetados. A seção e seu foco nunca são
   desmontados ao salvar ou trocar a seleção de personagem. */
function syncRosterControls({rebuildRows=false}={}){
 const list=$('member-list');
 if(!list)return;
 if(rebuildRows){
  list.innerHTML=campaign.members.length?campaign.members.map(memberRow).join(''):'<div class="empty">Nenhum jogador adicionado.</div>';
  bindMembers();
 }
 for(const row of list.querySelectorAll('[data-member-row]')){
  const member=campaign.members.find(m=>m.id===row.dataset.memberRow);
  if(!member)continue;
  const name=member.name||member.username||'Jogador';
  const playerName=row.querySelector('.roster-player-name');
  if(playerName)playerName.textContent=name;
  const avatar=row.querySelector('.roster-avatar');
  if(avatar)avatar.textContent=Array.from(name.trim())[0]?.toLocaleUpperCase('pt-BR')||'J';
  const characterSelect=row.querySelector('[data-member-character]');
  if(characterSelect){
   characterSelect.innerHTML=characterOptions(member.characterId,member.id,member.username||member.name);
   characterSelect.setAttribute('aria-label',`Personagem de ${name}`);
  }
  const linked=characters.find(c=>c.id===member.characterId);
  const open=row.querySelector('.roster-open-button');
  if(open)open.outerHTML=rosterOpenButton(linked);
 }
 const count=document.querySelector('#jogadores .roster-count');
 if(count)count.textContent=`${campaign.members.length} ${campaign.members.length===1?'jogador':'jogadores'}`;
 const userPicker=$('new-member-user');
 if(userPicker){
  const current=userPicker.value;
  userPicker.innerHTML=participantOptions();
  if([...userPicker.options].some(o=>o.value===current))userPicker.value=current;
 }
 const characterPicker=$('new-member-character');
 if(characterPicker){
  const current=characterPicker.value;
  characterPicker.innerHTML=characterOptions('',null,userPicker?.value||'');
  if([...characterPicker.options].some(o=>o.value===current))characterPicker.value=current;
 }
 const heroPlayers=document.querySelector('.campaign-product-meta .badge:nth-child(2)');
 if(heroPlayers)heroPlayers.textContent=countLabel(campaign.members.length,'jogador','jogadores');
 const countLinked=document.querySelector('.campaign-product-summary .metric:nth-child(3) strong');
 if(countLinked)countLinked.textContent=String(campaign.members.filter(m=>m.characterId).length);
}
function commitRoster(list,message,{rebuildRows=false}={}){
 commit(list,{rerender:false,message});
 syncRosterControls({rebuildRows});
}
function participantChecks(session){const linked=campaign.members.filter(m=>m.characterId);if(!linked.length)return'<span class="mini">Nenhuma ficha vinculada à Mesa.</span>';const selected=new Set(session.participantCharacterIds);return linked.map(m=>{const character=characters.find(c=>c.id===m.characterId);return`<label class="badge"><input type="checkbox" style="width:auto;margin:0 5px 0 0" data-session-participant="${esc(m.characterId)}" ${selected.has(m.characterId)?'checked':''}>${esc(character?.name||m.name)}</label>`}).join('')}
function sessionCard(s){const participants=s.participantCharacterIds.map(id=>characters.find(c=>c.id===id)?.name||id).filter(Boolean);return`<article class="session-card ${s.status==='active'?'active':''}" data-session-row="${esc(s.id)}"><div class="session-head"><div><h3>Sessão ${s.number} · ${esc(s.title)}</h3><div><span class="badge ${esc(s.status)}">${esc(sessionStatus(s.status))}</span>${s.date?`<span class="badge">${esc(s.date)}</span>`:''}</div></div><div class="row-actions">${['planned','next'].includes(s.status)?`<button type="button" data-start-session="${esc(s.id)}">Iniciar sessão</button>`:''}${s.status==='active'?`<button type="button" data-finish-session="${esc(s.id)}">Concluir sessão</button>`:''}${!['completed','cancelled'].includes(s.status)?`<button type="button" class="secondary" data-cancel-session="${esc(s.id)}">Cancelar</button>`:''}<button type="button" class="danger" data-remove-session="${esc(s.id)}">Excluir</button></div></div><div class="form-grid two" style="margin-top:10px"><label>Título<input data-session-field="title" value="${esc(s.title)}"></label><label>Data<input data-session-field="date" type="date" value="${esc(s.date)}"></label><label>Status<select data-session-field="status">${['planned','next','current','completed','cancelled'].map(v=>`<option value="${v}" ${s.status===v?'selected':''}>${esc(sessionStatus(v))}</option>`).join('')}</select></label><label>Objetivo<input data-session-field="objective" value="${esc(s.objective)}"></label><label class="wide">Resumo / recap<textarea data-session-field="summary">${esc(s.summary)}</textarea></label><label class="wide">Notas compartilhadas<textarea data-session-field="sharedNotes">${esc(s.sharedNotes)}</textarea></label><label class="wide">Notas do Mestre<textarea data-session-field="dmNotes">${esc(s.dmNotes)}</textarea></label><div class="wide"><strong>Personagens participantes</strong><div data-session-participants style="margin-top:5px">${participantChecks(s)}</div></div></div>${participants.length?`<p class="mini">Registrados: ${esc(participants.join(', '))}</p>`:''}</article>`}
function sessionsHtml(){const sessions=[...campaign.sessions].sort((a,b)=>b.number-a.number);return`<section id="sessoes" class="card campaign-editor-card"><div class="top"><div><h2>Sessões da campanha</h2></div><a class="btn secondary" href="sessoes.html?campaign=${encodeURIComponent(campaignId)}">Planejar sessão</a></div><div class="list">${sessions.length?sessions.map(s=>`<article class="campaign-reference-row"><div><strong>Sessão ${s.number} · ${esc(s.title)}</strong><div><span class="badge ${esc(s.status)}">${esc(sessionStatus(s.status))}</span>${s.date?`<span class="badge">${esc(s.date)}</span>`:''}</div></div><a class="btn secondary" href="sessoes.html?campaign=${encodeURIComponent(campaignId)}&id=${encodeURIComponent(s.id)}">Abrir</a></article>`).join(''):'<div class="empty">Nenhuma sessão atrelada a esta campanha.</div>'}</div></section>`}
function render(){const root=$('table-root');if(!root)return;if(!campaign){root.innerHTML='<div class="status warning"><strong>Campanha não encontrada.</strong><br><a href="campanhas.html">Voltar para Campanhas</a></div>';return}document.title=`${campaign.name} - Campanha - Teias de Anansi`;root.innerHTML=`${overviewHtml()}${renderNextCampaignSession(campaign,{canPlan:true})}<nav class='section-nav'><a href='#proxima-sessao'>Próxima sessão</a><a href='#campanha'>Campanha</a><a href='#jogadores'>Jogadores</a><a href='#aventuras'>Aventuras</a><a href='#sessoes'>Sessões</a><a href='#historia'>História</a><a href='#npcs'>NPCs</a><a href='#locais'>Locais</a><a href='#missoes'>Atos</a><a href='#linha-tempo'>Linha do tempo</a><a href='#notas-mestre'>Notas do Mestre</a></nav><div id='table-feedback' class='status' hidden></div><div class='campaign-sections campaign-editor-grid'>${settingsHtml()}${rosterHtml()}${referenceSectionsHtml()}${sessionsHtml()}${detailsSectionsHtml()}</div>`;bind();hydrateMediaImages(root).catch(()=>{})}
function updateTextFields(){document.querySelectorAll('[data-campaign-field]').forEach(input=>{const eventName=input.tagName==='TEXTAREA'?'input':'change';input.addEventListener(eventName,()=>{const field=input.dataset.campaignField,value=input.value;clearTimeout(saveTimer);saveTimer=setTimeout(()=>savePatch({[field]:value},{rerender:false,message:'Mesa salva automaticamente.'}),eventName==='input'?350:0)})})}
function bindMembers(){
 const list=$('member-list');
 if(!list)return;
 list.querySelectorAll('[data-member-row]').forEach(row=>{
  const id=row.dataset.memberRow;
  row.querySelector('[data-member-character]')?.addEventListener('change',event=>{
   const value=event.target.value;
   const result=value?assignCharacterToMember(campaigns,campaignId,id,value):unassignCharacterFromMember(campaigns,campaignId,id);
   if(!result.ok){syncRosterControls();return feedback(result.reason,false)}
   commitRoster(result.list,'Vínculo de personagem atualizado.')
  })
 });
 list.querySelectorAll('[data-remove-member]').forEach(button=>button.addEventListener('click',()=>{
  if(!confirm('Remover este jogador da Mesa? A ficha vinculada não será excluída.'))return;
  const result=removeCampaignMember(campaigns,campaignId,button.dataset.removeMember);
  if(!result.ok)return feedback(result.reason,false);
  commitRoster(result.list,'Jogador removido.',{rebuildRows:true})
 }))
}
function bindSessions(){document.querySelectorAll('[data-session-row]').forEach(row=>{const id=row.dataset.sessionRow;row.querySelectorAll('[data-session-field]').forEach(input=>input.addEventListener('change',()=>{const result=updateCampaignSession(campaigns,campaignId,id,{[input.dataset.sessionField]:input.value});if(result.ok)commit(result.list,{rerender:false,message:'Sessão salva.'})}));row.querySelectorAll('[data-session-participant]').forEach(input=>input.addEventListener('change',()=>{const ids=[...row.querySelectorAll('[data-session-participant]:checked')].map(el=>el.dataset.sessionParticipant),result=updateCampaignSession(campaigns,campaignId,id,{participantCharacterIds:ids});if(result.ok)commit(result.list,{rerender:false,message:'Participantes da sessão atualizados.'})}))});document.querySelectorAll('[data-start-session]').forEach(button=>button.addEventListener('click',()=>{const result=startCampaignSession(campaigns,campaignId,button.dataset.startSession);if(!result.ok)return feedback(result.reason,false);commit(result.list,{message:'Sessão iniciada.'})}));document.querySelectorAll('[data-finish-session]').forEach(button=>button.addEventListener('click',()=>{const result=finishCampaignSession(campaigns,campaignId,button.dataset.finishSession);if(result.ok)commit(result.list,{message:'Sessão concluída.'})}));document.querySelectorAll('[data-cancel-session]').forEach(button=>button.addEventListener('click',()=>{const result=cancelCampaignSession(campaigns,campaignId,button.dataset.cancelSession);if(result.ok)commit(result.list,{message:'Sessão cancelada.'})}));document.querySelectorAll('[data-remove-session]').forEach(button=>button.addEventListener('click',()=>{if(!confirm('Excluir esta sessão da campanha?'))return;const result=removeCampaignSession(campaigns,campaignId,button.dataset.removeSession);if(result.ok)commit(result.list,{message:'Sessão excluída.'})}))}
function bindCampaignCover(){const picker=document.querySelector('#campanha [data-image-picker]');if(!picker)return;bindImagePicker(picker,{onSelect:async file=>{const before=campaigns,previous=campaign.coverImage,media=await uploadImage({campaignId,entityType:'campaign',entityId:campaignId,file}),result=updateCampaign(campaigns,campaignId,{coverImage:media,coverImageUrl:''});if(!result.ok){deleteImage(media).catch(()=>{});throw new Error(result.reason)}campaigns=writeCampaigns(result.list);campaign=campaignById(campaigns,campaignId);try{await persistCampaignMediaState(campaignId,{entityType:'campaign',entityId:campaignId})}catch(error){campaigns=writeCampaigns(before);campaign=campaignById(campaigns,campaignId);await deleteImage(media).catch(()=>{});render();throw new Error('A imagem não pôde ser sincronizada. A capa anterior foi preservada.')}render();feedback('Imagem salva e sincronizada.',true);if(previous?.id&&previous.id!==media.id)await deleteImage(previous).catch(()=>{})},onRemove:async()=>{const before=campaigns,previous=campaign.coverImage,result=updateCampaign(campaigns,campaignId,{coverImage:null,coverImageUrl:''});if(!result.ok)throw new Error(result.reason);campaigns=writeCampaigns(result.list);campaign=campaignById(campaigns,campaignId);try{await persistCampaignMediaState(campaignId,{entityType:'campaign',entityId:campaignId})}catch(error){campaigns=writeCampaigns(before);campaign=campaignById(campaigns,campaignId);render();throw new Error('A remoção não pôde ser sincronizada. A imagem foi preservada.')}render();feedback('Imagem removida e sincronizada.',true);if(previous?.id)await deleteImage(previous).catch(()=>{})},onError:error=>feedback(error?.message||'Não foi possível salvar a imagem.',false)})}
function bindCampaignSaveButtons(){
 document.querySelectorAll('[data-save-campaign-section]').forEach(button=>button.addEventListener('click',event=>{
  event.preventDefault();clearTimeout(saveTimer);
  const section=button.closest('section');
  if(!section)return;
  const patch={};
  for(const input of section.querySelectorAll('[data-campaign-field]'))patch[input.dataset.campaignField]=input.value;
  if(Object.keys(patch).length){
   const result=updateCampaign(campaigns,campaignId,patch);
   if(!result.ok)return feedback(result.reason,false);
   commit(result.list,{rerender:false,message:'Etapa salva.'});
  }else{
   commit(campaigns,{rerender:false,message:'Etapa salva.'})
  }
 }))
}

function bind(){updateTextFields();bindMembers();bindCampaignCover();bindCampaignSaveButtons();bindStructuredDetails({getCampaign:()=>campaign,getNpcs:readNpcs,save:savePatch,feedback});$('new-member-user')?.addEventListener('change',event=>{const select=$('new-member-character');if(select)select.innerHTML=characterOptions('',null,event.target.value)});$('add-member')?.addEventListener('click',()=>{const username=$('new-member-user')?.value,characterId=$('new-member-character')?.value||null,participant=hubParticipants.find(p=>p.username===username);if(!participant)return feedback('Selecione um jogador do Hub.',false);const added=addCampaignMember(campaigns,campaignId,{username:participant.username,name:participant.displayName,role:'player'});if(!added.ok)return feedback(added.reason,false);if(!characterId)return commitRoster(added.list,'Jogador adicionado.',{rebuildRows:true});const linked=assignCharacterToMember(added.list,campaignId,added.member.id,characterId);if(!linked.ok)return feedback(linked.reason,false);commitRoster(linked.list,'Jogador e personagem vinculados.',{rebuildRows:true})})}
async function init(){if(!campaignId){$('table-root').innerHTML='<div class="status warning">Abra uma campanha pela lista de Campanhas.</div>';return}campaigns=readCampaigns();campaign=campaignById(campaigns,campaignId);characters=read();try{const config=await loadFirebaseConfig();hubParticipants=(config.playerAccounts||[]).map(row=>({username:String(row.username||'').trim().toLowerCase(),displayName:String(row.displayName||row.username||'').trim()})).filter(row=>row.username)}catch{hubParticipants=[]}render()}
init();