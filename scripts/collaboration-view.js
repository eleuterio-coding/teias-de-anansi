import{COLLAB_CACHE_KEY,COLLAB_SESSION_KEY}from'./storage-registry.js?v=20260905-access2';

const arr=v=>Array.isArray(v)?v:[];
const text=v=>String(v??'').trim();
const username=v=>text(v).toLowerCase();
const CHARACTER_KEY='hub-rpg:characters:v4';
const SESSION_EVENT='hub-rpg:collaboration-session-changed';
function signalSession(value){if(typeof window!=='undefined'&&typeof CustomEvent!=='undefined')window.dispatchEvent(new CustomEvent(SESSION_EVENT,{detail:value||null}))}
function localCharacters(storage=globalThis.localStorage){try{const rows=JSON.parse(storage?.getItem(CHARACTER_KEY)||'[]');return Array.isArray(rows)?rows:[]}catch{return[]}}

export function readCollaborationSession(storage=globalThis.localStorage){
 try{const raw=JSON.parse(storage?.getItem(COLLAB_SESSION_KEY)||'null');if(!raw?.uid||!raw?.username)return null;return{schema:'hub-rpg/collaboration-session/v1',uid:text(raw.uid),username:username(raw.username),isMaster:raw.isMaster===true,memberships:arr(raw.memberships),updatedAt:text(raw.updatedAt)}}catch{return null}
}
export function writeCollaborationSession(value,storage=globalThis.localStorage){
 if(!value){storage?.removeItem(COLLAB_SESSION_KEY);storage?.removeItem(COLLAB_CACHE_KEY);signalSession(null);return null}
 const clean={schema:'hub-rpg/collaboration-session/v1',uid:text(value.uid),username:username(value.username),isMaster:value.isMaster===true,memberships:arr(value.memberships),updatedAt:new Date().toISOString()};storage?.setItem(COLLAB_SESSION_KEY,JSON.stringify(clean));signalSession(clean);return clean
}
export function clearCollaborationSession(storage=globalThis.localStorage){storage?.removeItem(COLLAB_SESSION_KEY);storage?.removeItem(COLLAB_CACHE_KEY);signalSession(null)}
export function readCollaborationCache(storage=globalThis.localStorage){
 try{const raw=JSON.parse(storage?.getItem(COLLAB_CACHE_KEY)||'{}');return raw?.campaigns&&typeof raw.campaigns==='object'?raw.campaigns:{}}catch{return{}}
}
export function collaborationAccessMode(storage=globalThis.localStorage){const s=readCollaborationSession(storage);return!s?'guest':s.isMaster?'master':'player'}
export function authenticated(storage=globalThis.localStorage){return collaborationAccessMode(storage)!=='guest'}
export function playerMode(storage=globalThis.localStorage){return collaborationAccessMode(storage)==='player'}
export function masterMode(storage=globalThis.localStorage){return collaborationAccessMode(storage)==='master'}
export function sharedCampaignRows(storage=globalThis.localStorage){
 const session=readCollaborationSession(storage);if(!session||session.isMaster)return[];
 const allowed=new Map(arr(session.memberships).filter(m=>m?.active!==false&&username(m?.username||m?.displayName)===session.username&&m?.role==='player'&&text(m?.campaignId)).map(m=>[text(m.campaignId),m]));
 const cache=readCollaborationCache(storage);
 return Object.values(cache).filter(row=>{const membership=row?.membership,campaignId=text(membership?.campaignId||row?.payload?.campaign?.id),current=allowed.get(campaignId);return Boolean(current&&username(membership?.username||membership?.displayName)===session.username&&membership?.active!==false&&membership?.role==='player'&&row?.payload?.campaign)}).map(row=>{const campaign=row.payload.campaign,membership=allowed.get(text(row.membership.campaignId)),cachedCharacters=arr(row.characters).filter(c=>text(c?.id)),fallbackIds=arr(campaign.members).filter(m=>m?.active!==false).map(m=>text(m?.characterId)).filter(Boolean);return{campaign,membership,participants:arr(row.payload.participants),adventures:arr(row.payload.revealedAdventures),characters:cachedCharacters,characterIds:[...new Set([...arr(row.characterIds).map(text).filter(Boolean),...cachedCharacters.map(c=>text(c.id)),...fallbackIds,text(membership?.characterId)].filter(Boolean))],readOnly:true}})
}
export function sharedCampaignById(id,storage=globalThis.localStorage){return sharedCampaignRows(storage).find(row=>row.campaign.id===text(id))||null}
export function sharedAdventures(storage=globalThis.localStorage){return sharedCampaignRows(storage).flatMap(row=>row.adventures.map(a=>({...a,campaignId:a.campaignId||row.campaign.id,campaignName:row.campaign.name,readOnly:true})))}
export function sharedParticipants(campaignId,storage=globalThis.localStorage){return arr(sharedCampaignById(campaignId,storage)?.participants).filter(p=>p?.active!==false)}
export function participantsForSession(campaignId,sessionId,storage=globalThis.localStorage){const sid=text(sessionId);return sharedParticipants(campaignId,storage).filter(p=>p.role==='dm'||arr(p.sessionIds).map(text).includes(sid))}
export function participantsForAdventure(campaignId,adventureId,storage=globalThis.localStorage){const aid=text(adventureId);return sharedParticipants(campaignId,storage).filter(p=>p.role==='dm'||arr(p.adventureIds).map(text).includes(aid))}
export function sharedCharacters(storage=globalThis.localStorage){const map=new Map();for(const row of sharedCampaignRows(storage))for(const character of arr(row.characters))if(text(character?.id))map.set(text(character.id),character);return[...map.values()]}
export function sharedCharacterById(characterId,storage=globalThis.localStorage){const id=text(characterId);return sharedCharacters(storage).find(character=>text(character?.id)===id)||null}
export function assignedCharacterIds(storage=globalThis.localStorage){return[...new Set(sharedCampaignRows(storage).map(row=>text(row.membership.characterId)).filter(Boolean))]}
export function ownedCharacterIds(storage=globalThis.localStorage){const session=readCollaborationSession(storage);if(!session||session.isMaster)return[];return[...new Set(localCharacters(storage).filter(character=>text(character?.ownerUid)===session.uid||username(character?.ownerUsername)===session.username).map(character=>text(character?.id)).filter(Boolean))]}
export function editableCharacterIds(storage=globalThis.localStorage){return[...new Set([...assignedCharacterIds(storage),...ownedCharacterIds(storage)])]}
export function visibleCharacterIds(storage=globalThis.localStorage){return[...new Set([...sharedCampaignRows(storage).flatMap(row=>arr(row.characterIds)).map(text).filter(Boolean),...sharedCharacters(storage).map(c=>text(c?.id)).filter(Boolean),...ownedCharacterIds(storage)])]}
export function canOpenCharacter(characterId,storage=globalThis.localStorage){const mode=collaborationAccessMode(storage);if(mode==='guest')return false;if(mode==='master')return true;return visibleCharacterIds(storage).includes(text(characterId))}
export function canEditCharacter(characterId,storage=globalThis.localStorage){const mode=collaborationAccessMode(storage);if(mode==='guest')return false;if(mode==='master')return true;return editableCharacterIds(storage).includes(text(characterId))}
