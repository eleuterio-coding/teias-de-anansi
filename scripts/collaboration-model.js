export const COLLAB_ROLES=Object.freeze(['dm','player','observer']);
export const COLLAB_PERMISSIONS=Object.freeze({
 'campaign:read-shared':['dm','player','observer'],
 'campaign:write':['dm'],
 'session:write':['dm'],
 'encounter:write':['dm'],
 'adventure:write':['dm'],
 'invite:manage':['dm'],
 'member:manage':['dm'],
 'character:read-linked':['dm'],
 'character:write-own':['player'],
 'handout:read':['dm','player','observer']
});
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const text=v=>String(v??'').trim();
const cleanEmail=v=>text(v).toLocaleLowerCase('pt-BR');
const role=v=>COLLAB_ROLES.includes(v)?v:'observer';
export function normalizeAccount(user={}){return{uid:text(user.uid),displayName:text(user.displayName)||cleanEmail(user.email)||'Usuário',email:cleanEmail(user.email),photoURL:text(user.photoURL)||null}}
export function normalizeMembership(row={}){return{id:text(row.id),campaignId:text(row.campaignId),uid:text(row.uid),role:role(row.role),characterId:text(row.characterId)||null,inviteId:text(row.inviteId)||null,displayName:text(row.displayName),email:cleanEmail(row.email),active:row.active!==false,updatedAt:text(row.updatedAt)}}
export function normalizeInvite(row={}){return{id:text(row.id),campaignId:text(row.campaignId),invitedEmail:cleanEmail(row.invitedEmail),role:role(row.role),createdBy:text(row.createdBy),status:['open','accepted','revoked','expired'].includes(row.status)?row.status:'open',expiresAt:text(row.expiresAt),createdAt:text(row.createdAt),updatedAt:text(row.updatedAt)}}
export function canCollaborate({ownerId='',uid='',membership=null},permission){if(text(ownerId)&&text(ownerId)===text(uid))return true;const m=membership?normalizeMembership(membership):null;if(!m?.active||m.uid!==text(uid))return false;return arr(COLLAB_PERMISSIONS[permission]).includes(m.role)}
export function campaignSharedProjection(campaign={}){return{id:text(campaign.id),name:String(campaign.name??''),status:String(campaign.status??'active'),system:String(campaign.system??''),setting:String(campaign.setting??''),description:String(campaign.description??''),dmName:String(campaign.dmName??''),schedule:String(campaign.schedule??''),currentArc:String(campaign.currentArc??''),currentLocation:String(campaign.currentLocation??''),partyGoal:String(campaign.partyGoal??''),sharedNotes:String(campaign.sharedNotes??''),partyTreasure:String(campaign.partyTreasure??''),members:arr(campaign.members).map(m=>({id:text(m.id),name:String(m.name??''),role:String(m.role??'player'),characterId:text(m.characterId)||null,active:m.active!==false})),sessions:arr(campaign.sessions).map(s=>({id:text(s.id),number:Number(s.number)||1,title:String(s.title??''),date:String(s.date??''),status:String(s.status??'planned'),location:String(s.location??''),objective:String(s.objective??''),summary:String(s.summary??''),sharedNotes:String(s.sharedNotes??''),participantCharacterIds:arr(s.participantCharacterIds).map(text).filter(Boolean)})),activeSessionId:text(campaign.activeSessionId)||null,updatedAt:text(campaign.updatedAt)}}
export function revealedAdventureProjection(adventure={}){const revealedHandoutIds=new Set(arr(adventure.handouts).filter(h=>h.revealed===true).map(h=>h.id)),visibleClueIds=new Set(arr(adventure.clues).filter(c=>['discovered','resolved'].includes(c.status)).map(c=>c.id));return{id:text(adventure.id),campaignId:text(adventure.campaignId),title:String(adventure.title??''),status:String(adventure.status??'planned'),arc:String(adventure.arc??''),summary:String(adventure.summary??''),handouts:arr(adventure.handouts).filter(h=>revealedHandoutIds.has(h.id)).map(h=>({id:h.id,title:String(h.title??''),type:String(h.type??'text'),content:String(h.content??''),url:String(h.url??'')})),clues:arr(adventure.clues).filter(c=>visibleClueIds.has(c.id)).map(c=>({id:c.id,title:String(c.title??''),text:String(c.text??''),status:c.status}))}}
export function collaborationSharedBundle(campaign={},adventures=[]){return{campaign:campaignSharedProjection(campaign),revealedAdventures:arr(adventures).filter(a=>a.campaignId===campaign.id).map(revealedAdventureProjection)}}
export function mergeNewest(localRows=[],remoteRows=[]){const map=new Map(arr(localRows).filter(x=>x?.id).map(row=>[row.id,row]));for(const row of arr(remoteRows).filter(x=>x?.id)){const old=map.get(row.id),oldAt=Date.parse(old?.updatedAt||old?.createdAt||'')||0,newAt=Date.parse(row?.updatedAt||row?.createdAt||'')||0;if(!old||newAt>=oldAt)map.set(row.id,row)}return[...map.values()]}
export function inviteCanBeAccepted(invite,user,at=new Date()){const i=normalizeInvite(invite),u=normalizeAccount(user);if(!u.uid||!u.email||i.status!=='open'||i.invitedEmail!==u.email)return false;const expires=Date.parse(i.expiresAt||'');return!Number.isFinite(expires)||expires>at.getTime()}
