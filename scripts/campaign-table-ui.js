import{read,readNpcs}from'./character-builder/state.js';
import{findPreviousCampaignSession,renderNextCampaignSession}from'./campaign-next-session-ui.js?v=20261019-open-only2';
import{renderStructuredDetails,renderTimeline,bindStructuredDetails}from'./campaign-structured-ui.js?v=20261019-ordered-roots1';
import{readCampaigns,writeCampaigns,campaignById,updateCampaign,addCampaignMember,updateCampaignMember,removeCampaignMember,reorderCampaignMember,assignCharacterToMember,unassignCharacterFromMember,addCampaignSession,updateCampaignSession,startCampaignSession,finishCampaignSession,cancelCampaignSession,removeCampaignSession}from'./campaign-state.js?v=20261019-roster-order1';
import{readAdventures,adventuresForCampaign}from'./adventure-state.js?v=20261016-current-status2';
import{loadFirebaseConfig}from'./firebase-collaboration-provider.js?v=20260925-media1';
import{uploadImage,deleteImage,persistCampaignMediaState,imageElementHtml,imagePickerHtml,bindImagePicker,hydrateMediaImages}from'./image-media.js?v=20260925-media2';
import{sortCampaignAdventures,recentCampaignSessions}from'./campaign-recent-items.js?v=20261019-order2';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search),campaignId=params.get('id');let campaigns=[],campaign=null,characters=[],hubParticipants=[],saveTimer=null;
const statusLabel=s=>({planned:'Planejada',active:'Em andamento',paused:'Pausada',finished:'Concluída',cancelled:'Cancelada'}[s]||s),sessionStatus=s=>({planned:'Planejada',next:'Próxima',current:'Atual',active:'Em andamento',completed:'Concluída',cancelled:'Cancelada'}[s]||s),adventureStatus=s=>({planned:'Planejada',current:'Atual',active:'Em andamento',completed:'Concluída',archived:'Arquivada'}[s]||s);
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
 const previous=findPreviousCampaignSession(campaign);
 const previousLabel=previous?`Sessão ${previous.number} · ${previous.title}`:'Nenhuma sessão anterior';
 const previousHref=previous?`sessoes.html?campaign=${encodeURIComponent(campaignId)}&id=${encodeURIComponent(previous.id)}`:'';
 return `<section class="campaign-product-hero">${cover}<div class="campaign-product-actions"><a class="btn campaign-product-create-action" href="aventuras.html?campaign=${encodeURIComponent(campaignId)}&new=1#adventure-create-card">Nova Aventura</a><a class="btn campaign-product-create-action" href="sessoes.html?campaign=${encodeURIComponent(campaignId)}&new=1#session-create-card">Nova Sessão</a></div><div class="campaign-product-hero-content"><div class="campaign-product-kicker">Contexto da Mesa · ${esc(campaign.system||'D&D 5.5e')}</div><div class="campaign-product-title-row"><h1>${esc(campaign.name)}</h1><span class="badge ${esc(campaign.status)}">${esc(statusLabel(campaign.status))}</span></div><p class="campaign-product-description">${esc(campaign.description||'Organize aventuras, sessões, personagens e o mundo desta campanha.')}</p><div class="campaign-product-meta"><span class="badge">${esc(campaign.setting||campaign.system||'D&D 5.5e')}</span><span class="badge">${countLabel(campaign.members.length,'jogador','jogadores')}</span><span class="badge">${countLabel(adventures.length,'aventura','aventuras')}</span></div></div></section><div class="campaign-product-summary">${metric('Status',statusLabel(campaign.status))}${metric('Sessões',campaign.sessions.length,'#sessoes')}${metric('Personagens',linked,'#jogadores')}${metric('Sessão anterior',previousLabel,previousHref)}</div>`
}
function settingsHtml(){
 return`<section id="campanha" class="card campaign-editor-card">
  <h2>Campanha</h2>
  <div class="campaign-settings-layout">
   <div class="campaign-settings-primary">
    <label>Nome da campanha<input data-campaign-field="name" value="${esc(campaign.name)}"></label>
    <div class="campaign-settings-cover"><strong>Imagem/capa</strong>${imagePickerHtml({media:campaign.coverImage,legacyUrl:campaign.coverImageUrl,alt:`Capa de ${campaign.name}`,className:'campaign-cover-image'})}</div>
   </div>
   <div class="campaign-settings-details form-grid two">
    <label class="wide">Descrição curta<textarea maxlength="500" data-campaign-field="description">${esc(campaign.description)}</textarea></label>
    <label class="wide">Cenário de Campanha<input maxlength="160" data-campaign-field="setting" value="${esc(campaign.setting||'')}"></label>
    <label>Mundo / Plano<input maxlength="160" data-campaign-field="worldPlane" value="${esc(campaign.worldPlane||'')}"></label>
    <label>Principal Continente / Região<input maxlength="160" data-campaign-field="mainRegion" value="${esc(campaign.mainRegion||'')}"></label>
    <div class="campaign-settings-status-row wide"><label>Status<select data-campaign-field="status"><option value="planned" ${campaign.status==='planned'?'selected':''}>Planejada</option><option value="active" ${campaign.status==='active'?'selected':''}>Em andamento</option><option value="paused" ${campaign.status==='paused'?'selected':''}>Pausada</option><option value="finished" ${campaign.status==='finished'?'selected':''}>Concluída</option><option value="cancelled" ${campaign.status==='cancelled'?'selected':''}>Cancelada</option></select></label>
    <div class="row-actions campaign-settings-save"><button type="button" data-save-campaign-section>Salvar</button></div></div>
   </div>
  </div>
 </section>`
}
function referenceSectionsHtml(){
 const adventures=sortCampaignAdventures(adventuresForCampaign(readAdventures(),campaignId),{includePlanned:false,limit:5});
 return`<section id="aventuras" class="card campaign-editor-card campaign-reference-section">
  <div class="top campaign-reference-head"><h2>Aventuras da Campanha</h2>
   <a class="btn secondary campaign-reference-header-action" href="aventuras.html?campaign=${encodeURIComponent(campaignId)}">Abrir Aventuras</a>
  </div>
  <div class="list">${adventures.length?adventures.map(a=>`<article class="campaign-reference-row">
   <div><strong>${esc(a.title)}</strong><div><span class="badge">${esc(adventureStatus(a.status))}</span></div>
   ${a.summary?`<p class="mini">${esc(a.summary)}</p>`:''}</div>
   <a class="btn secondary" href="aventuras.html?campaign=${encodeURIComponent(campaignId)}&id=${encodeURIComponent(a.id)}">Abrir</a>
  </article>`).join(''):'<div class="empty">Nenhuma aventura iniciada ou concluída nesta Campanha.</div>'}</div>
 </section>`
}

function detailsSectionsHtml(){

 const text=(id,title,field)=>`<section id="${id}" class="card campaign-editor-card"><h2>${esc(title)}</h2><textarea class="campaign-large-text" data-campaign-field="${field}">${esc(campaign[field])}</textarea><div class="row-actions" style="margin-top:10px"><button type="button" data-save-campaign-section>Salvar</button></div></section>`;
 return text('historia','Resumo da história','historySummary')
  +renderStructuredDetails(campaign,readNpcs())
  +renderTimeline(campaign)
  +text('notas-mestre','Notas do Mestre','dmNotes')
}

function memberRow(m){
 const linked=characters.find(c=>c.id===m.characterId),name=m.name||m.username||'Jogador',initial=Array.from(name.trim())[0]?.toLocaleUpperCase('pt-BR')||'J',index=campaign.members.findIndex(x=>x.id===m.id);
 return `<article class="member-row roster-player" data-member-row="${esc(m.id)}" draggable="true" tabindex="0" aria-label="${esc(name)}. Arraste para reorganizar ou use as setas.">
  <button type="button" class="roster-grip" aria-label="Reordenar ${esc(name)}: arraste ou use as setas para cima e para baixo" title="Reordenar jogador"><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="8" cy="5" r="1.7"/><circle cx="16" cy="5" r="1.7"/><circle cx="8" cy="12" r="1.7"/><circle cx="16" cy="12" r="1.7"/><circle cx="8" cy="19" r="1.7"/><circle cx="16" cy="19" r="1.7"/></svg></button>
  <div class="roster-player-identity"><span class="roster-avatar" aria-hidden="true">${esc(initial)}</span><div class="roster-player-display" aria-label="Jogador: ${esc(name)}"><span class="roster-player-label">Jogador</span><span class="roster-player-name">${esc(name)}</span></div></div>
  <div class="roster-player-character"><label>Personagem<select data-member-character aria-label="Personagem de ${esc(name)}">${characterOptions(m.characterId,m.id,m.username||m.name)}</select></label></div>
  <div class="row-actions roster-player-actions">
   <button type="button" class="secondary roster-move-button" data-roster-move="up" data-roster-id="${esc(m.id)}" aria-label="Mover ${esc(name)} para cima" ${index===0?'disabled':''}>↑</button>
   <button type="button" class="secondary roster-move-button" data-roster-move="down" data-roster-id="${esc(m.id)}" aria-label="Mover ${esc(name)} para baixo" ${index===campaign.members.length-1?'disabled':''}>↓</button>
   ${rosterOpenButton(linked)}<button type="button" class="danger roster-remove-button" data-remove-member="${esc(m.id)}" title="Remover jogador ${esc(name)}" aria-label="Remover jogador ${esc(name)}">
   <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 6h17M9 6V4h6v2m-9 0 .8 14h10.4L18 6M10 10v6m4-6v6"/></svg><span class="roster-action-label">Remover</span></button></div>
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
 const icon='<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5h6v6M19 5l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg><span class="roster-action-label">Abrir</span>';
 return linked
  ?`<a class="btn secondary roster-open-button" href="ficha-personagem.html?id=${encodeURIComponent(linked.id)}" title="Abrir ficha de ${esc(linked.name||'personagem')}" aria-label="Abrir ficha de ${esc(linked.name||'personagem')}">${icon}</a>`
  :`<button type="button" class="secondary roster-open-button" disabled title="Vincule um personagem para abrir a ficha" aria-label="Abrir ficha - personagem não vinculado">${icon}</button>`;
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
function sessionsHtml(){
 const sessions=recentCampaignSessions(campaign.sessions,{limit:5});
 return`<section id="sessoes" class="card campaign-editor-card campaign-reference-section">
  <div class="top campaign-reference-head"><h2>Sessões da Campanha</h2>
   <a class="btn secondary campaign-reference-header-action" href="sessoes.html?campaign=${encodeURIComponent(campaignId)}&new=1#session-create-card" target="_blank" rel="noopener noreferrer">Planejar Sessão</a>
  </div>
  <div class="list">${sessions.length?sessions.map(session=>`<article class="campaign-reference-row">
   <div><strong>Sessão ${session.number} · ${esc(session.title)}</strong>
    <div><span class="badge ${esc(session.status)}">${esc(sessionStatus(session.status))}</span>${session.date?`<span class="badge">${esc(session.date)}</span>`:''}</div></div>
   <a class="btn secondary" href="sessoes.html?campaign=${encodeURIComponent(campaignId)}&id=${encodeURIComponent(session.id)}">Abrir</a>
  </article>`).join(''):'<div class="empty">Nenhuma sessão iniciada ou concluída nesta Campanha.</div>'}</div>
 </section>`
}
function render(){const root=$('table-root');if(!root)return;if(!campaign){root.innerHTML='<div class="status warning"><strong>Campanha não encontrada.</strong><br><a href="campanhas.html">Voltar para Campanhas</a></div>';return}document.title=`${campaign.name} - Campanha - Teias de Anansi`;root.innerHTML=`${overviewHtml()}${renderNextCampaignSession(campaign,{canPlan:true})}<nav class='section-nav'><a href='#proxima-sessao'>Próxima sessão</a><a href='#campanha'>Campanha</a><a href='#jogadores'>Jogadores</a><a href='#aventuras'>Aventuras</a><a href='#sessoes'>Sessões</a><a href='#historia'>História</a><a href='#npcs'>NPCs</a><a href='#locais'>Locais</a><a href='#linha-tempo'>Linha do tempo</a><a href='#notas-mestre'>Notas do Mestre</a></nav><div id='table-feedback' class='status' hidden></div><div class='campaign-sections campaign-editor-grid'>${settingsHtml()}${rosterHtml()}${referenceSectionsHtml()}${sessionsHtml()}${detailsSectionsHtml()}</div>`;bind();hydrateMediaImages(root).catch(()=>{})}
function updateTextFields(){document.querySelectorAll('[data-campaign-field]').forEach(input=>{const eventName=input.tagName==='TEXTAREA'?'input':'change';input.addEventListener(eventName,()=>{const field=input.dataset.campaignField,value=input.value;clearTimeout(saveTimer);saveTimer=setTimeout(()=>savePatch({[field]:value},{rerender:false,message:'Mesa salva automaticamente.'}),eventName==='input'?350:0)})})}
function bindMembers(){
 const list=$('member-list');
 if(!list)return;
 bindRosterOrdering(list);
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
/** Ordenação acessível por arrastar (mouse/toque/caneta) ou setas do teclado.
 * Persistência por IDs no mesmo array de membros, sem recriar a seção inteira. */
/** Igual a Locais importantes: o card inteiro é a superfície de arraste,
 * com cópia elevada, marcador de soltura, setas e feedback de confirmação. */
function bindRosterOrdering(list){
 if(list.dataset.rosterOrderBound==='true')return;
 list.dataset.rosterOrderBound='true';
 let dragging=null,mouse=null,touch=null,floating=null;
 const rowFor=target=>target?.closest?.('#member-list [data-member-row]')||null;
 const interactive=target=>Boolean(target?.closest?.('input,textarea,select,a,button:not(.roster-grip),[contenteditable="true"]'));
 const lift=(row,x,y)=>{
  if(floating)return;
  const rect=row.getBoundingClientRect(),clone=row.cloneNode(true);
  clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  clone.querySelectorAll('input,select,button,a').forEach(el=>{el.tabIndex=-1;el.setAttribute('aria-hidden','true')});
  clone.removeAttribute('draggable');clone.removeAttribute('tabindex');
  clone.classList.add('campaign-floating-card','roster-floating-card');
  if(getComputedStyle(row).gridTemplateColumns.split(' ').length===3)clone.classList.add('roster-floating-compact');
  clone.setAttribute('aria-hidden','true');
  clone.style.display='grid';
  clone.style.gridTemplateColumns=getComputedStyle(row).gridTemplateColumns;
  clone.style.gridTemplateRows=getComputedStyle(row).gridTemplateRows;
  clone.style.left=rect.left+'px';clone.style.top=rect.top+'px';
  clone.style.width=rect.width+'px';clone.style.height=rect.height+'px';
  document.body.appendChild(clone);
  floating={element:clone,x,y};
 };
 const moveLift=(x,y)=>{
  if(floating)floating.element.style.transform='translate3d('+(x-floating.x)+'px,'+(y-floating.y)+'px,0) rotate(-1deg) scale(1.018)';
 };
 const clearHighlight=()=>{
  list.querySelectorAll('.roster-order-moving,.roster-order-before,.roster-order-after').forEach(row=>{
   row.classList.remove('roster-order-moving','roster-order-before','roster-order-after');
   delete row.dataset.dropPosition;
  });
 };
 const clearVisual=()=>{
  clearHighlight();floating?.element.remove();floating=null;
 };
 const dropAt=(source,target,y)=>{
  const row=rowFor(target);
  if(!row||row.dataset.memberRow===source)return null;
  const box=row.getBoundingClientRect();
  return {target:row.dataset.memberRow,row,position:y<box.top+box.height/2?'before':'after'};
 };
 const mark=(source,drop)=>{
  clearHighlight();
  const row=[...list.querySelectorAll('[data-member-row]')].find(item=>item.dataset.memberRow===source);
  if(row)row.classList.add('roster-order-moving');
  if(drop){
   drop.row.classList.add(drop.position==='before'?'roster-order-before':'roster-order-after');
   drop.row.dataset.dropPosition=drop.position;
  }
 };
 const confirm=(id)=>{
  const row=[...list.querySelectorAll('[data-member-row]')].find(item=>item.dataset.memberRow===id);
  row?.classList.add('campaign-reorder-confirmed');
  const heading=document.querySelector('#jogadores .roster-heading');
  if(!heading)return;
  heading.querySelector('[data-reorder-confirmation]')?.remove();
  const tag=document.createElement('span');
  tag.className='campaign-reorder-feedback';tag.dataset.reorderConfirmation='';
  tag.setAttribute('role','status');tag.textContent='✓ Ordem atualizada';
  heading.appendChild(tag);
  setTimeout(()=>{row?.classList.remove('campaign-reorder-confirmed');tag.remove()},2200);
 };
 const reorder=(source,target,position,focusName='')=>{
  if(!source||!target||source===target)return false;
  const before=campaign.members.map(m=>m.id).join('|');
  const result=reorderCampaignMember(campaigns,campaignId,source,target,position);
  if(!result.ok){feedback(result.reason,false);return false}
  if(!result.changed||before===result.campaign.members.map(m=>m.id).join('|'))return false;
  commitRoster(result.list,'Ordem dos jogadores salva.',{rebuildRows:true});
  confirm(source);
  if(focusName){
   const moved=[...list.querySelectorAll('[data-member-row]')].find(row=>row.dataset.memberRow===source);
   (moved?.querySelector('[data-roster-move="'+focusName+'"]')||moved?.querySelector('.roster-grip'))?.focus();
  }
  return true
 };
 const neighborMove=(row,dir,focusName)=>{
  const other=dir==='up'?row?.previousElementSibling:row?.nextElementSibling;
  if(row?.dataset.memberRow&&other?.dataset.memberRow)
   reorder(row.dataset.memberRow,other.dataset.memberRow,dir==='up'?'before':'after',focusName)
 };
 list.addEventListener('click',event=>{
  const btn=event.target.closest?.('[data-roster-move]');
  if(btn){event.preventDefault();neighborMove(rowFor(btn),btn.dataset.rosterMove,btn.dataset.rosterMove)}
 });
 list.addEventListener('keydown',event=>{
  if(!['ArrowUp','ArrowDown'].includes(event.key))return;
  const grip=event.target.closest?.('.roster-grip');
  if(!grip&&!event.target.matches?.('[data-member-row]'))return;
  event.preventDefault();
  neighborMove(rowFor(event.target),event.key==='ArrowUp'?'up':'down','grip')
 });
 const clearMouse=()=>{
  if(!mouse)return;
  const {row,pointerId,timer}=mouse;
  clearTimeout(timer);mouse=null;
  row.draggable=true;
  if(row.hasPointerCapture?.(pointerId))row.releasePointerCapture(pointerId);
  clearVisual()
 };
 list.addEventListener('pointerdown',event=>{
  if(event.pointerType!=='mouse'||event.button!==0||interactive(event.target))return;
  const row=rowFor(event.target);
  if(!row)return;
  const info={row,source:row.dataset.memberRow,pointerId:event.pointerId,x:event.clientX,y:event.clientY,active:false};
  info.timer=setTimeout(()=>{
   if(mouse===info&&!info.active){info.active=true;lift(row,info.x,info.y);mark(info.source,null)}
  },160);
  mouse=info;row.draggable=false;
  row.setPointerCapture?.(event.pointerId);
  event.preventDefault()
 });
 list.addEventListener('pointermove',event=>{
  if(!mouse||mouse.pointerId!==event.pointerId)return;
  if(!mouse.active&&Math.hypot(event.clientX-mouse.x,event.clientY-mouse.y)<6)return;
  mouse.active=true;event.preventDefault();
  lift(mouse.row,mouse.x,mouse.y);
  moveLift(event.clientX,event.clientY);
  const drop=dropAt(mouse.source,document.elementFromPoint(event.clientX,event.clientY),event.clientY);
  mark(mouse.source,drop)
 });
 list.addEventListener('pointerup',event=>{
  if(!mouse||mouse.pointerId!==event.pointerId)return;
  const {source,active}=mouse;
  const drop=dropAt(source,document.elementFromPoint(event.clientX,event.clientY),event.clientY);
  clearMouse();if(active&&drop)reorder(source,drop.target,drop.position)
 });
 list.addEventListener('pointercancel',clearMouse);
 list.addEventListener('dragstart',event=>{
  const row=rowFor(event.target);
  if(mouse){event.preventDefault();return}
  if(!row||interactive(event.target)){event.preventDefault();return}
  dragging={source:row.dataset.memberRow};
  if(event.dataTransfer){event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',dragging.source)}
  mark(dragging.source,null)
 });
 list.addEventListener('dragover',event=>{
  if(!dragging)return;
  const drop=dropAt(dragging.source,event.target,event.clientY);
  if(!drop)return;
  event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';
  mark(dragging.source,drop)
 });
 list.addEventListener('drop',event=>{
  if(!dragging)return;
  event.preventDefault();
  const source=dragging.source,drop=dropAt(source,event.target,event.clientY);
  dragging=null;clearVisual();if(drop)reorder(source,drop.target,drop.position)
 });
 list.addEventListener('dragend',()=>{dragging=null;clearVisual()});
 const clearTouch=()=>{
  if(touch?.timer)clearTimeout(touch.timer);
  touch=null;clearVisual()
 };
 list.addEventListener('touchstart',event=>{
  if(touch||interactive(event.target))return;
  const row=rowFor(event.target),point=event.changedTouches[0];
  if(!row||!point)return;
  const info={source:row.dataset.memberRow,row,identifier:point.identifier,x:point.clientX,y:point.clientY,active:false};
  info.timer=setTimeout(()=>{
   if(touch===info&&!info.active){info.active=true;lift(row,info.x,info.y);mark(info.source,null)}
  },280);
  touch=info
 },{passive:true});
 list.addEventListener('touchmove',event=>{
  if(!touch)return;
  const point=[...event.touches].find(t=>t.identifier===touch.identifier);
  if(!point)return;
  if(!touch.active){
   if(Math.hypot(point.clientX-touch.x,point.clientY-touch.y)>9)clearTouch();
   return
  }
  event.preventDefault();
  moveLift(point.clientX,point.clientY);
  mark(touch.source,dropAt(touch.source,document.elementFromPoint(point.clientX,point.clientY),point.clientY))
 },{passive:false});
 list.addEventListener('touchend',event=>{
  if(!touch)return;
  const point=[...event.changedTouches].find(t=>t.identifier===touch.identifier);
  if(!point)return;
  const {source,active}=touch,drop=dropAt(source,document.elementFromPoint(point.clientX,point.clientY),point.clientY);
  clearTouch();if(active){event.preventDefault();if(drop)reorder(source,drop.target,drop.position)}
 },{passive:false});
 list.addEventListener('touchcancel',clearTouch);
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