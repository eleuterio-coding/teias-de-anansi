import{read as readCharacters,write as writeCharacters}from'./character-builder/state.js';
import{readCampaigns,writeCampaigns}from'./campaign-state.js?v=20260910-realtime1';
import{readCollaborationCache,writeCollaborationCache}from'./collaboration-sync.js?v=20260918-master-delete1';
import{collaborationAccessMode}from'./collaboration-view.js?v=20260917-master-full-control1';
import{createFirebaseCollaborationProvider}from'./firebase-collaboration-provider.js?v=20260918-master-delete1';
import{deleteRemoteCharacterAsMaster}from'./firebase-realtime-ops.js?v=20260918-master-delete1';

const text=value=>String(value??'').trim();
const now=()=>new Date().toISOString();

function detachCampaign(campaign,characterId){
 const id=text(characterId),copy=structuredClone(campaign),stamp=now();let changed=false;
 copy.members=(Array.isArray(copy.members)?copy.members:[]).map(member=>{if(text(member?.characterId)!==id)return member;changed=true;return{...member,characterId:null}});
 copy.sessions=(Array.isArray(copy.sessions)?copy.sessions:[]).map(session=>{const ids=Array.isArray(session?.participantCharacterIds)?session.participantCharacterIds:[],next=ids.filter(value=>text(value)!==id);if(next.length===ids.length)return session;changed=true;return{...session,participantCharacterIds:next,updatedAt:stamp}});
 if(changed)copy.updatedAt=stamp;
 return{campaign:copy,changed}
}
function detachPayload(payload,characterId){
 if(!payload?.campaign)return payload;
 const result=detachCampaign(payload.campaign,characterId);
 return result.changed?{...payload,campaign:result.campaign}:payload
}
function cleanLocalState(characterId){
 const id=text(characterId),campaigns=readCampaigns(),nextCampaigns=[];let campaignChanged=false;
 for(const campaign of campaigns){const result=detachCampaign(campaign,id);nextCampaigns.push(result.campaign);campaignChanged=campaignChanged||result.changed}
 const cache=readCollaborationCache();
 if(cache.playerCharacters&&Object.prototype.hasOwnProperty.call(cache.playerCharacters,id))delete cache.playerCharacters[id];
 for(const [cid,row] of Object.entries(cache.campaigns||{})){
  const next={...row};
  if(text(next?.membership?.characterId)===id)next.membership={...next.membership,characterId:null};
  next.characterIds=(Array.isArray(next.characterIds)?next.characterIds:[]).filter(value=>text(value)!==id);
  next.characters=(Array.isArray(next.characters)?next.characters:[]).filter(character=>text(character?.id)!==id);
  if(next.payload)next.payload=detachPayload(next.payload,id);
  cache.campaigns[cid]=next
 }
 globalThis.__HUB_REALTIME_APPLYING__=true;
 try{
  writeCharacters(readCharacters().filter(character=>text(character?.id)!==id));
  if(campaignChanged)writeCampaigns(nextCampaigns);
  writeCollaborationCache(cache)
 }finally{globalThis.__HUB_REALTIME_APPLYING__=false}
 if(campaignChanged)window.dispatchEvent(new CustomEvent('hub-rpg:data-changed',{detail:{kind:'campaigns'}}));
 window.dispatchEvent(new CustomEvent('hub-rpg:remote-updated',{detail:{kinds:['characters',...(campaignChanged?['campaigns']:[])],at:now(),claim(){}}}))
}
export async function deleteCharacterAsMaster(characterId){
 const id=text(characterId);if(!id)throw new Error('Personagem inválido.');
 if(collaborationAccessMode()!=='master')throw new Error('Somente Rafael pode excluir qualquer personagem do Hub.');
 const provider=await createFirebaseCollaborationProvider();
 if(!provider?.configured)throw new Error(provider?.reason||'Acesso online indisponível.');
 const result=await deleteRemoteCharacterAsMaster(provider,id);
 cleanLocalState(id);
 return result
}
