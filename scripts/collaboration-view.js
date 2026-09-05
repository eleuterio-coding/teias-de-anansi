import{COLLAB_CACHE_KEY,COLLAB_SESSION_KEY}from'./storage-registry.js?v=20260905-access2';

const arr=v=>Array.isArray(v)?v:[];
const text=v=>String(v??'').trim();

export function readCollaborationSession(storage=globalThis.localStorage){
 try{const raw=JSON.parse(storage?.getItem(COLLAB_SESSION_KEY)||'null');if(!raw?.uid||!raw?.username)return null;return{schema:'hub-rpg/collaboration-session/v1',uid:text(raw.uid),username:text(raw.username),isMaster:raw.isMaster===true,memberships:arr(raw.memberships),updatedAt:text(raw.updatedAt)}}catch{return null}
}
export function writeCollaborationSession(value,storage=globalThis.localStorage){
 if(!value){storage?.removeItem(COLLAB_SESSION_KEY);return null}
 const clean={schema:'hub-rpg/collaboration-session/v1',uid:text(value.uid),username:text(value.username),isMaster:value.isMaster===true,memberships:arr(value.memberships),updatedAt:new Date().toISOString()};storage?.setItem(COLLAB_SESSION_KEY,JSON.stringify(clean));return clean
}
export function clearCollaborationSession(storage=globalThis.localStorage){storage?.removeItem(COLLAB_SESSION_KEY)}
export function readCollaborationCache(storage=globalThis.localStorage){
 try{const raw=JSON.parse(storage?.getItem(COLLAB_CACHE_KEY)||'{}');return raw?.campaigns&&typeof raw.campaigns==='object'?raw.campaigns:{}}catch{return{}}
}
export function playerMode(storage=globalThis.localStorage){const s=readCollaborationSession(storage);return Boolean(s&&!s.isMaster)}
export function sharedCampaignRows(storage=globalThis.localStorage){
 const session=readCollaborationSession(storage);if(!session||session.isMaster)return[];const cache=readCollaborationCache(storage);return Object.values(cache).filter(row=>row?.membership?.active!==false&&['player','observer'].includes(row?.membership?.role)&&row?.payload?.campaign).map(row=>({campaign:row.payload.campaign,membership:row.membership,adventures:arr(row.payload.revealedAdventures),readOnly:true}))
}
export function sharedCampaignById(id,storage=globalThis.localStorage){return sharedCampaignRows(storage).find(row=>row.campaign.id===text(id))||null}
export function sharedAdventures(storage=globalThis.localStorage){return sharedCampaignRows(storage).flatMap(row=>row.adventures.map(a=>({...a,campaignId:a.campaignId||row.campaign.id,campaignName:row.campaign.name,readOnly:true})))}
export function assignedCharacterIds(storage=globalThis.localStorage){return[...new Set(sharedCampaignRows(storage).map(row=>text(row.membership.characterId)).filter(Boolean))]}
export function canOpenCharacter(characterId,storage=globalThis.localStorage){const session=readCollaborationSession(storage);if(!session||session.isMaster)return true;return assignedCharacterIds(storage).includes(text(characterId))}
