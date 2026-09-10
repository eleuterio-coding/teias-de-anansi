import{createFirebaseCollaborationProvider}from'./firebase-collaboration-provider.js?v=20260910-realtime1';
import{pullCollaborations}from'./collaboration-sync.js?v=20260910-realtime1';
import{readCollaborationSession,writeCollaborationSession,readCollaborationCache}from'./collaboration-view.js?v=20260910-realtime1';
import{CAMPAIGN_KEY,readCampaigns}from'./campaign-state.js?v=20260910-realtime1';
import{ADVENTURE_KEY,readAdventures}from'./adventure-state.js?v=20260910-realtime1';
import{KEY as CHARACTER_KEY,read as readCharacters}from'./character-builder/state.js';

const CHANGE_EVENT='hub-rpg:data-changed';
const REMOTE_EVENT='hub-rpg:remote-updated';
const STORAGE_PATCH=Symbol.for('hub-rpg.realtime-storage-patch');
const KIND_BY_KEY=new Map([[CAMPAIGN_KEY,'campaigns'],[ADVENTURE_KEY,'adventures'],[CHARACTER_KEY,'characters']]);
const text=v=>String(v??'').trim();
let provider=null,account=null,unsubscribeRemote=null,unsubscribeAuth=null,startPromise=null,pushTimer=0,pullTimer=0,pendingKinds=new Set(),refreshPending=false;

function cacheComparable(){
 const rows=readCollaborationCache();
 return Object.fromEntries(Object.entries(rows).map(([id,row])=>[id,{membership:row?.membership||null,payload:row?.payload||null}]))
}
function fingerprint(){return JSON.stringify({campaigns:readCampaigns(),adventures:readAdventures(),characters:readCharacters(),cache:cacheComparable(),memberships:readCollaborationSession()?.memberships||[]})}
function editing(){const el=document.activeElement;return Boolean(el&&el!==document.body&&(el.matches?.('input,textarea,select,[contenteditable="true"]')))}
function refreshPage(){
 if(refreshPending)return;
 refreshPending=true;
 const run=()=>{refreshPending=false;if(document.visibilityState==='hidden')return;location.reload()};
 if(editing()){
  const once=()=>{document.removeEventListener('focusout',once,true);setTimeout(run,250)};
  document.addEventListener('focusout',once,true);
  setTimeout(()=>{if(refreshPending&&!editing())run()},2500)
 }else setTimeout(run,250)
}
function emitLocalChange(kind){if(!kind||globalThis.__HUB_REALTIME_APPLYING__)return;window.dispatchEvent(new CustomEvent(CHANGE_EVENT,{detail:{kind}}))}
function installStorageBridge(){
 if(typeof Storage==='undefined'||Storage.prototype[STORAGE_PATCH])return;
 const original=Storage.prototype.setItem;
 Object.defineProperty(Storage.prototype,STORAGE_PATCH,{value:true,configurable:false});
 Storage.prototype.setItem=function(key,value){const watched=KIND_BY_KEY.get(String(key)),before=watched&&this===globalThis.localStorage?this.getItem(key):null,result=original.call(this,key,value);if(watched&&this===globalThis.localStorage&&before!==String(value))emitLocalChange(watched);return result}
}
async function applyRemote(){
 if(!provider||!account||globalThis.__HUB_REALTIME_APPLYING__)return;
 const before=fingerprint(),session=readCollaborationSession();
 globalThis.__HUB_REALTIME_APPLYING__=true;
 try{
  const result=await pullCollaborations(provider);
  if(session)writeCollaborationSession({...session,memberships:result.memberships||[]});
 }catch(error){console.warn('[Hub realtime] falha ao receber atualização:',error)}finally{globalThis.__HUB_REALTIME_APPLYING__=false}
 const after=fingerprint();
 if(before!==after){window.dispatchEvent(new CustomEvent(REMOTE_EVENT));refreshPage()}
}
function schedulePull(){clearTimeout(pullTimer);pullTimer=setTimeout(()=>applyRemote(),180)}
async function pushChanges(){
 pushTimer=0;
 if(!provider||!account||globalThis.__HUB_REALTIME_APPLYING__)return;
 const kinds=new Set(pendingKinds);pendingKinds.clear();
 const session=readCollaborationSession();if(!session)return;
 try{
  if(session.isMaster){
   if(kinds.has('campaigns')||kinds.has('adventures')){
    const adventures=readAdventures(),characters=readCharacters();for(const campaign of readCampaigns())await provider.saveCampaignBundle(campaign,adventures.filter(a=>a.campaignId===campaign.id),characters)
   }
   if(kinds.has('characters')){
    const characters=readCharacters(),campaigns=readCampaigns();
    for(const campaign of campaigns){const linked=new Set((campaign.members||[]).map(m=>text(m.characterId)).filter(Boolean));for(const character of characters)if(linked.has(text(character.id)))await provider.saveCampaignCharacter(campaign.id,character)}
   }
  }else if(kinds.has('characters')){
   const memberships=await provider.listMemberships(),characters=readCharacters();
   for(const membership of memberships.filter(m=>m.role==='player'&&m.active!==false&&m.characterId)){
    const character=characters.find(c=>c.id===membership.characterId);if(!character)continue;await provider.saveOwnCharacter(character);await provider.saveCampaignCharacter(membership.campaignId,character)
   }
  }
 }catch(error){console.warn('[Hub realtime] falha ao enviar atualização:',error)}
}
function schedulePush(kind){if(!kind||globalThis.__HUB_REALTIME_APPLYING__)return;pendingKinds.add(kind);clearTimeout(pushTimer);pushTimer=setTimeout(pushChanges,650)}
async function bindAccount(next){
 if(!next){account=null;unsubscribeRemote?.();unsubscribeRemote=null;return}
 account=next;unsubscribeRemote?.();unsubscribeRemote=provider.subscribeRealtime(()=>schedulePull(),error=>console.warn('[Hub realtime] listener:',error));await applyRemote()
}
export async function startRealtime(){
 if(startPromise)return startPromise;
 startPromise=(async()=>{const session=readCollaborationSession();if(!session)return null;installStorageBridge();provider=await createFirebaseCollaborationProvider();if(!provider?.configured)return null;unsubscribeAuth=provider.onAuthChanged(next=>{bindAccount(next).catch(error=>console.warn('[Hub realtime] conta:',error))});return provider})().catch(error=>{console.warn('[Hub realtime] inicialização:',error);startPromise=null;return null});
 return startPromise
}
export function stopRealtime(){clearTimeout(pushTimer);clearTimeout(pullTimer);pendingKinds.clear();unsubscribeRemote?.();unsubscribeRemote=null;unsubscribeAuth?.();unsubscribeAuth=null;provider=null;account=null;startPromise=null}

if(typeof window!=='undefined')window.addEventListener(CHANGE_EVENT,event=>schedulePush(event.detail?.kind));
