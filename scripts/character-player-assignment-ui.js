import{state}from'./character-builder/state.js';
import{readCollaborationSession,collaborationAccessMode}from'./collaboration-view.js?v=20260917-master-full-control1';
import{createFirebaseCollaborationProvider}from'./firebase-collaboration-provider.js?v=20260922-character-player1';

const text=value=>String(value??'').trim();
const username=value=>text(value).toLowerCase();
let initialized=false,providerPromise=null,renderToken=0;

function ensureProfile(){
 if(!state.c)return null;
 state.c.sheet=state.c.sheet||{};
 state.c.sheet.profile={player:'',...(state.c.sheet.profile||{})};
 return state.c.sheet.profile
}
function provider(){
 if(!providerPromise)providerPromise=createFirebaseCollaborationProvider().catch(error=>{providerPromise=null;throw error});
 return providerPromise
}
function setOptions(select,rows,selectedUid=''){
 select.innerHTML='<option value="">Selecione o jogador</option>'+rows.map(row=>`<option value="${String(row.uid).replace(/"/g,'&quot;')}" data-username="${String(row.username).replace(/"/g,'&quot;')}">${String(row.displayName||row.username).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</option>`).join('');
 select.value=selectedUid||''
}
function emitProfile(select){
 select.dispatchEvent(new Event('input',{bubbles:true}));
 document.dispatchEvent(new CustomEvent('hub:player-assignment-changed',{detail:{characterId:state.c?.id||null,ownerUid:state.c?.ownerUid||null,ownerUsername:state.c?.ownerUsername||null}}))
}
function showStatus(message){
 const status=document.getElementById('save-status');
 if(status)status.textContent=message
}
async function renderAssignment(){
 const token=++renderToken,select=document.getElementById('profile-player'),profile=ensureProfile(),session=readCollaborationSession();
 if(!select||!profile||!session)return;
 const mode=collaborationAccessMode();
 select.disabled=true;
 try{
  const remote=await provider();if(token!==renderToken)return;
  if(mode==='player'){
   const current=await remote.currentUser().catch(()=>null),existing=username(state.c.ownerUsername),mine=username(session.username),account=current&&username(current.username)===mine?current:null,displayName=text(account?.displayName)||text((remote.playerAccounts?.()||[]).find(row=>username(row.username)===mine)?.displayName)||mine;
   if(!existing||existing===mine){state.c.ownerUid=session.uid;state.c.ownerUsername=mine;profile.player=displayName}
   const shownOwner=username(state.c.ownerUsername)||mine,shown=(remote.loginAccounts?.()||[]).find(row=>username(row.username)===shownOwner),label=text(shown?.displayName)||profile.player||shownOwner;
   select.innerHTML=`<option value="${String(label).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}">${String(label).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</option>`;
   select.value=label;select.disabled=true;profile.player=label;emitProfile(select);return
  }
  if(mode==='master'){
   const owner=username(remote.config?.ownerUsername||'rafael'),users=(await remote.listUsers()).filter(row=>username(row.username)!==owner),selected=users.find(row=>text(row.uid)===text(state.c.ownerUid)||username(row.username)===username(state.c.ownerUsername));
   setOptions(select,users,selected?.uid||'');select.disabled=false;
   if(selected){state.c.ownerUid=selected.uid;state.c.ownerUsername=username(selected.username);profile.player=selected.displayName||selected.username}else if(username(state.c.ownerUsername)===owner){state.c.ownerUid='';state.c.ownerUsername='';profile.player=''}
   select.addEventListener('change',()=>{
    const row=users.find(user=>text(user.uid)===text(select.value));
    if(!row){state.c.ownerUid='';state.c.ownerUsername='';profile.player='';emitProfile(select);return}
    state.c.ownerUid=row.uid;state.c.ownerUsername=username(row.username);profile.player=row.displayName||row.username;emitProfile(select)
   },{once:false});
   emitProfile(select)
  }
 }catch(error){
  if(token!==renderToken)return;
  console.warn('[character-player-assignment]',error);
  if(mode==='master'){select.innerHTML='<option value="">Jogadores indisponíveis</option>';select.disabled=true}
 }
}
function guardMasterSave(event){
 const session=readCollaborationSession();
 if(!session?.isMaster||!state.c)return;
 if(text(state.c.ownerUid)&&username(state.c.ownerUsername)&&username(state.c.ownerUsername)!==username(session.username))return;
 event.preventDefault();event.stopImmediatePropagation();showStatus('Selecione o jogador responsável por este personagem.');document.getElementById('profile-player')?.focus()
}
function bind(){
 document.getElementById('save')?.addEventListener('click',guardMasterSave,true);
 document.addEventListener('hub:new-character',()=>queueMicrotask(renderAssignment));
 document.addEventListener('hub-rpg:sheet-ready',()=>queueMicrotask(renderAssignment));
 window.addEventListener('hub-rpg:collaboration-session-changed',()=>queueMicrotask(renderAssignment))
}
export function initCharacterPlayerAssignmentUi(){
 if(initialized)return;initialized=true;bind();queueMicrotask(renderAssignment)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initCharacterPlayerAssignmentUi,{once:true});else initCharacterPlayerAssignmentUi();
