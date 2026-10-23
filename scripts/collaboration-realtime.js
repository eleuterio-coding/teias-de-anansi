import{createFirebaseCollaborationProvider}from'./firebase-collaboration-provider.js?v=20261023-adventure-library7';
import{pullCollaborations,syncOwnCharacters,publishMissingMasterCampaigns}from'./collaboration-sync.js?v=20261023-adventure-library7';
import{readCollaborationSession,writeCollaborationSession,clearCollaborationSession,readCollaborationCache,editableCharacterIds,playerCharacterIds,playerCharacterInfo}from'./collaboration-view.js?v=20261021-ficha-permissao3';
import{CAMPAIGN_KEY,readCampaigns}from'./campaign-state.js?v=20261022-chronicles-final3';
import{ADVENTURE_KEY,readAdventures}from'./adventure-state.js?v=20261022-chronicles-final3';
import{KEY as CHARACTER_KEY,read as readCharacters}from'./character-builder/state.js';
import{deleteRemoteCampaign,deleteRemoteOwnCharacter,deleteRemoteManagedCharacter,deleteRemoteCharacterAsMaster}from'./firebase-realtime-ops.js?v=20261022-revocation1';
import{changedEntityIds}from'./collaboration-quota-utils.js?v=20261022-quota1';

// A revisão 20260917-player-catalog1 foi substituída por 20260917-reload-loop-fix1 para impedir recarga circular ao abrir a ficha.
const CHANGE_EVENT='hub-rpg:data-changed';
const REMOTE_EVENT='hub-rpg:remote-updated';
const STORAGE_PATCH=Symbol.for('hub-rpg.realtime-storage-patch-v2');
const KIND_BY_KEY=new Map([[CAMPAIGN_KEY,'campaigns'],[ADVENTURE_KEY,'adventures'],[CHARACTER_KEY,'characters']]);
const text=v=>String(v??'').trim();
let provider=null,account=null,unsubscribeRemote=null,unsubscribeAuth=null,startPromise=null,pushTimer=0,pullTimer=0,pendingKinds=new Set(),initialPublicationUid='',retryAfter=0,lastPullAt=0,scheduledPullAt=0;
const pendingCharacterIds=new Set(),pendingCampaignIds=new Set(),pendingAdventureCampaignIds=new Set(),MIN_PULL_INTERVAL_MS=4000;
const pendingCampaignDeletes=new Set(),pendingCharacterDeletes=new Map();

function cacheComparable(){
 const rows=readCollaborationCache(),playerCharacters=Object.fromEntries(playerCharacterIds().map(id=>[id,playerCharacterInfo(id)]));
 return{campaigns:Object.fromEntries(Object.entries(rows).map(([id,row])=>[id,{membership:row?.membership||null,payload:row?.payload||null,characterIds:row?.characterIds||[],characters:row?.characters||[]}])),playerCharacters}
}
function sessionComparable(){
 const current=readCollaborationSession();
 if(!current)return null;
 return{uid:text(current.uid),username:text(current.username).toLowerCase(),isMaster:current.isMaster===true,memberships:Array.isArray(current.memberships)?current.memberships:[]}
}
function snapshotState(){
 let campaigns='',adventures='',characters='',session='',cache='';
 try{campaigns=localStorage.getItem(CAMPAIGN_KEY)||'';adventures=localStorage.getItem(ADVENTURE_KEY)||'';characters=localStorage.getItem(CHARACTER_KEY)||'';session=JSON.stringify(sessionComparable());cache=JSON.stringify(cacheComparable())}catch{}
 return{campaigns,adventures,characters,session,cache}
}
function changedKinds(before,after){const kinds=[];for(const key of['campaigns','adventures','characters'])if(before[key]!==after[key])kinds.push(key);if(before.session!==after.session||before.cache!==after.cache)kinds.push('permissions');return[...new Set(kinds)]}
function parseRows(raw){try{const rows=JSON.parse(raw||'[]');return Array.isArray(rows)?rows:[]}catch{return[]}}
function captureRemovals(kind,beforeRaw,afterRaw){
 if(globalThis.__HUB_REALTIME_APPLYING__)return;
 const before=parseRows(beforeRaw),after=parseRows(afterRaw),afterIds=new Set(after.map(row=>text(row?.id)).filter(Boolean));
 if(kind==='characters')for(const id of changedEntityIds(before,after))pendingCharacterIds.add(id);
 if(kind==='campaigns')for(const id of changedEntityIds(before,after))pendingCampaignIds.add(id);
 if(kind==='adventures'){
  const older=new Map(before.filter(row=>text(row?.id)).map(row=>[text(row.id),row]));
  const newer=new Map(after.filter(row=>text(row?.id)).map(row=>[text(row.id),row]));
  for(const id of changedEntityIds(before,after)){
   const oldCid=text(older.get(id)?.campaignId),newCid=text(newer.get(id)?.campaignId);
   if(oldCid)pendingAdventureCampaignIds.add(oldCid);
   if(newCid)pendingAdventureCampaignIds.add(newCid);
  }
 }
 if(kind==='campaigns')for(const row of before){const id=text(row?.id);if(id&&!afterIds.has(id))pendingCampaignDeletes.add(id)}
 if(kind==='characters')for(const row of before){const id=text(row?.id);if(id&&!afterIds.has(id)){const info=playerCharacterInfo(id);pendingCharacterDeletes.set(id,info?{...row,__managedOwner:info}:row)}}
}
/* Atualizações do servidor não devem desmontar selects nem menus que o jogador está usando.
 * Acumula os tipos de mudança e entrega-os assim que o controle é fechado/abandona o foco. */
const deferredKinds=new Set();
let dropdownReleaseBound=false;
function dropdownInUse(){
 const active=document.activeElement;
 if(active?.matches?.('select,[role="combobox"],input[list]'))return true;
 if(document.querySelector('details.campaign-status-disclosure[open], details[open]:focus-within, [role="listbox"]:not([hidden]), [aria-haspopup][aria-expanded="true"]'))return true;
 return false
}
function flushDeferredRemote(){
 if(!deferredKinds.size||dropdownInUse())return;
 const kinds=[...deferredKinds];deferredKinds.clear();emitRemote(kinds)
}
function bindDropdownRelease(){
 if(dropdownReleaseBound)return;dropdownReleaseBound=true;
 const afterInteraction=()=>queueMicrotask(flushDeferredRemote);
 document.addEventListener('focusout',afterInteraction,true);
 document.addEventListener('toggle',afterInteraction,true);
 document.addEventListener('pointerdown',afterInteraction,true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'||event.key==='Tab')afterInteraction()},true)
}
function emitRemote(kinds=[]){
 bindDropdownRelease();
 if(dropdownInUse()){kinds.forEach(kind=>deferredKinds.add(kind));return}
 let handled=false;
 const detail={kinds:[...new Set(kinds)],at:new Date().toISOString(),claim(){handled=true},get handled(){return handled}};
 window.dispatchEvent(new CustomEvent(REMOTE_EVENT,{detail}))
}
function emitRemoteStatus(status,error=null){if(typeof window==='undefined')return;window.dispatchEvent(new CustomEvent('hub-rpg:remote-status',{detail:{status,message:error?.message||String(error||'')}}))}
function emitLocalChange(kind){if(!kind||globalThis.__HUB_REALTIME_APPLYING__)return;window.dispatchEvent(new CustomEvent(CHANGE_EVENT,{detail:{kind}}))}
function installStorageBridge(){
 if(typeof Storage==='undefined'||Storage.prototype[STORAGE_PATCH])return;
 const originalSet=Storage.prototype.setItem,originalRemove=Storage.prototype.removeItem;
 Object.defineProperty(Storage.prototype,STORAGE_PATCH,{value:true,configurable:false});
 Storage.prototype.setItem=function(key,value){const watched=KIND_BY_KEY.get(String(key)),before=watched&&this===globalThis.localStorage?this.getItem(key):null,result=originalSet.call(this,key,value);if(watched&&this===globalThis.localStorage&&before!==String(value)){captureRemovals(watched,before,String(value));emitLocalChange(watched)}return result};
 Storage.prototype.removeItem=function(key){const watched=KIND_BY_KEY.get(String(key)),before=watched&&this===globalThis.localStorage?this.getItem(key):null,result=originalRemove.call(this,key);if(watched&&this===globalThis.localStorage&&before!=null){captureRemovals(watched,before,'[]');emitLocalChange(watched)}return result}
}
function persistAuthenticatedAccount(memberships=null){
 if(!account||!provider)return null;
 const owner=text(provider.config?.ownerUsername||'rafael').toLowerCase(),current=readCollaborationSession(),sameAccount=current&&text(current.uid)===text(account.uid)&&text(current.username).toLowerCase()===text(account.username).toLowerCase(),effectiveMemberships=memberships==null?(sameAccount?(current.memberships||[]):[]):memberships;
 return writeCollaborationSession({uid:account.uid,username:account.username,isMaster:text(account.username).toLowerCase()===owner,memberships:effectiveMemberships})
}
async function reconcilePersonalCharacters(memberships=null){
 if(!provider||!account)return;
 const owner=text(provider.config?.ownerUsername||'rafael').toLowerCase();
 if(text(account.username).toLowerCase()===owner)return;
 await syncOwnCharacters(provider,{memberships})
}
async function applyRemote(){
 if(!provider||!account||globalThis.__HUB_REALTIME_APPLYING__||Date.now()<retryAfter)return;
 if(pushInFlight||pendingKinds.size||pendingCampaignDeletes.size||pendingCharacterDeletes.size){const pushed=await pushChanges();if(pushed===false){schedulePull();return}}
 lastPullAt=Date.now();
 const before=snapshotState();
 globalThis.__HUB_REALTIME_APPLYING__=true;
 emitRemoteStatus('loading');
 try{
  const uid=text(account.uid),owner=text(provider.config?.ownerUsername||'rafael').toLowerCase();
  if(text(account.username).toLowerCase()===owner&&initialPublicationUid!==uid){
   await publishMissingMasterCampaigns(provider);
   initialPublicationUid=uid;
  }
  const result=await pullCollaborations(provider);
  await reconcilePersonalCharacters(result.memberships||[]);
  persistAuthenticatedAccount(result.memberships||[]);
  retryAfter=0;emitRemoteStatus('ready');
 }catch(error){
  // Em caso de cota/limite atingido, não disparar novas consultas incessantes.
  if(/resource-exhausted|quota|429|too.many.requests/i.test([error?.code,error?.message].join(' '))){retryAfter=Date.now()+60000;schedulePull()}
  console.warn('[Hub realtime] falha ao receber atualização:',error);emitRemoteStatus('error',error)
 }finally{globalThis.__HUB_REALTIME_APPLYING__=false}
 const after=snapshotState(),kinds=changedKinds(before,after);
 if(kinds.length)emitRemote(kinds)
}
function schedulePull(){
 // Coalesce notificações sem perder a próxima atualização; não reinicia o
 // timer indefinidamente quando muitos snapshots chegam em sequência.
 const time=Date.now(),at=Math.max(time+400,lastPullAt+MIN_PULL_INTERVAL_MS,retryAfter);
 if(pullTimer&&scheduledPullAt<=at)return;
 clearTimeout(pullTimer);scheduledPullAt=at;
 pullTimer=setTimeout(()=>{pullTimer=0;scheduledPullAt=0;applyRemote()},Math.max(0,at-Date.now()));
}
let pushInFlight=null;
async function pushChanges(){
 // Nunca publicar duas versões da mesma ficha em paralelo.
 if(pushInFlight)return pushInFlight.then(()=>pushChanges());
 if(Date.now()<retryAfter){schedulePull();return false}
 if(!pendingKinds.size&&!pendingCampaignDeletes.size&&!pendingCharacterDeletes.size)return true;
 pushInFlight=flushPushChanges();
 try{return await pushInFlight}finally{pushInFlight=null}
}
async function flushPushChanges(){
 clearTimeout(pushTimer);pushTimer=0;
 if(!provider||!account||globalThis.__HUB_REALTIME_APPLYING__)return false;
 const kinds=new Set(pendingKinds);pendingKinds.clear();
 const changedIds=new Set(pendingCharacterIds);pendingCharacterIds.clear();const selectiveCharacters=changedIds.size>0;
 const changedCampaignIds=new Set([...pendingCampaignIds,...pendingAdventureCampaignIds]);
 pendingCampaignIds.clear();pendingAdventureCampaignIds.clear();
 const selectiveCampaigns=changedCampaignIds.size>0;
 const removedCampaigns=[...pendingCampaignDeletes];pendingCampaignDeletes.clear();
 const removedCharacters=[...pendingCharacterDeletes.entries()];pendingCharacterDeletes.clear();
 const session=readCollaborationSession();if(!session)return false;
 try{
  if(session.isMaster){
   for(const id of removedCampaigns)await deleteRemoteCampaign(provider,id);
   if(kinds.has('campaigns')||kinds.has('adventures')||removedCampaigns.length){
    const adventures=readAdventures(),characters=readCharacters();for(const campaign of readCampaigns())if(!selectiveCampaigns||changedCampaignIds.has(text(campaign.id)))await provider.saveCampaignBundle(campaign,adventures.filter(a=>a.campaignId===campaign.id),characters)
   }
   if(kinds.has('characters')){
    const characters=readCharacters(),campaigns=readCampaigns();
    for(const character of characters){if(selectiveCharacters&&!changedIds.has(text(character?.id)))continue;const ownerUid=text(character?.ownerUid),ownerName=text(character?.ownerUsername).toLowerCase(),foreign=Boolean(ownerUid&&ownerUid!==text(session.uid))||Boolean(ownerName&&ownerName!==text(session.username).toLowerCase());if(foreign)await provider.saveManagedPlayerCharacter(character);else await provider.saveOwnCharacter(character)}
    for(const campaign of campaigns){const linked=new Set((campaign.members||[]).map(m=>text(m.characterId)).filter(Boolean));for(const character of characters)if(linked.has(text(character.id))&&(!selectiveCharacters||changedIds.has(text(character.id))))await provider.saveCampaignCharacter(campaign.id,character)}
   }
  }else if(kinds.has('characters')){
   const memberships=await provider.listMemberships(),characters=readCharacters(),editable=new Set(editableCharacterIds());
   for(const character of characters)if(editable.has(text(character?.id))&&(!selectiveCharacters||changedIds.has(text(character?.id))))await provider.saveOwnCharacter(character);
   for(const membership of memberships.filter(m=>m.role==='player'&&m.active!==false&&m.characterId)){
    const character=characters.find(c=>c.id===membership.characterId);if(!character||(selectiveCharacters&&!changedIds.has(text(character.id))))continue;await provider.saveCampaignCharacter(membership.campaignId,character)
   }
  }
  for(const[id,row]of removedCharacters){if(session.isMaster){await deleteRemoteCharacterAsMaster(provider,id);continue}const managed=row?.__managedOwner||null,ownerUid=text(managed?.ownerUid||row?.ownerUid),ownerName=text(managed?.ownerUsername||row?.ownerUsername).toLowerCase(),owns=text(row?.ownerUid)===text(session.uid)||text(row?.ownerUsername).toLowerCase()===text(session.username).toLowerCase();if(owns)await deleteRemoteOwnCharacter(provider,id)}
 }catch(error){
  for(const id of removedCampaigns)pendingCampaignDeletes.add(id);for(const[id,row]of removedCharacters)pendingCharacterDeletes.set(id,row);for(const kind of kinds)pendingKinds.add(kind);for(const id of changedIds)pendingCharacterIds.add(id);for(const id of changedCampaignIds)pendingCampaignIds.add(id);
  const exhausted=/resource-exhausted|quota|429|too.many.requests/i.test([error?.code,error?.message].join(' '));
  retryAfter=Date.now()+(exhausted?60000:10000);
  console.warn('[Hub realtime] falha ao enviar atualização:',error);
  schedulePull();
  return false
 }
 return true
}
function schedulePush(kind){if(!kind||globalThis.__HUB_REALTIME_APPLYING__)return;pendingKinds.add(kind);clearTimeout(pushTimer);pushTimer=setTimeout(pushChanges,650)}
/* Sessão Firebase expirada: retornar ao login preservando a ficha pretendida.
 * Antes havia uma chamada a loginUrl() sem definição, gerando ReferenceError. */
function loginUrl(){
 const current=location.pathname.split('/').pop()||'index.html';
 if(current==='usuarios.html')return null;
 const login=new URL('usuarios.html',location.href);
 login.searchParams.set('next',current+(location.search||'')+(location.hash||''));
 return login.href
}
async function bindAccount(next){
 if(!next){account=null;retryAfter=0;initialPublicationUid='';unsubscribeRemote?.();unsubscribeRemote=null;clearCollaborationSession();const target=loginUrl();if(target)location.replace(target);return}
 account=next;lastPullAt=0;scheduledPullAt=0;clearTimeout(pullTimer);pullTimer=0;persistAuthenticatedAccount();unsubscribeRemote?.();unsubscribeRemote=provider.subscribeRealtime(()=>schedulePull(),error=>{console.warn('[Hub realtime] listener:',error);emitRemoteStatus('error',error)});await applyRemote()
}
export async function startRealtime(){
 if(startPromise)return startPromise;
 startPromise=(async()=>{installStorageBridge();provider=await createFirebaseCollaborationProvider();if(!provider?.configured){emitRemoteStatus('error',new Error('Firebase não configurado ou indisponível.'));return null}unsubscribeAuth=provider.onAuthChanged(next=>{bindAccount(next).catch(error=>console.warn('[Hub realtime] conta:',error))});return provider})().catch(error=>{console.warn('[Hub realtime] inicialização:',error);emitRemoteStatus('error',error);startPromise=null;return null});
 return startPromise
}
export function stopRealtime(){deferredKinds.clear();clearTimeout(pushTimer);clearTimeout(pullTimer);pendingKinds.clear();pendingCharacterIds.clear();pendingCampaignIds.clear();pendingAdventureCampaignIds.clear();pendingCampaignDeletes.clear();pendingCharacterDeletes.clear();lastPullAt=0;scheduledPullAt=0;unsubscribeRemote?.();unsubscribeRemote=null;unsubscribeAuth?.();unsubscribeAuth=null;provider=null;account=null;retryAfter=0;initialPublicationUid='';startPromise=null}

if(typeof window!=='undefined')window.addEventListener(CHANGE_EVENT,event=>schedulePush(event.detail?.kind));
