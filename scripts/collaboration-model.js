export const COLLAB_ROLES=Object.freeze(['dm','player','observer']);
export const COLLAB_PERMISSIONS=Object.freeze({
 'campaign:read-shared':['dm','player','observer'],
 'campaign:write':['dm'],
 'session:write':['dm'],
 'encounter:write':['dm'],
 'adventure:write':['dm'],
 'member:manage':['dm'],
 'character:read-linked':['dm','player','observer'],
 'character:write-own':['player'],
 'handout:read':['dm','player','observer']
});
const arr=v=>Array.isArray(v)?v:[];
const text=v=>String(v??'').trim();
const role=v=>COLLAB_ROLES.includes(v)?v:'observer';
const unique=rows=>[...new Set(arr(rows).map(text).filter(Boolean))];
export function normalizeUsername(value=''){return text(value).toLowerCase()}
export function usernameFromTechnicalEmail(email='',domain='teias.invalid'){const raw=text(email).toLowerCase(),suffix=`@${String(domain||'teias.invalid').toLowerCase()}`;return raw.endsWith(suffix)?normalizeUsername(raw.slice(0,-suffix.length)):normalizeUsername(raw.split('@')[0])}
export function normalizeAccount(user={},options={}){const username=normalizeUsername(options.username)||usernameFromTechnicalEmail(user.email,options.domain||'teias.invalid');return{uid:text(user.uid),username,displayName:username||'Usuário'}}
export function normalizeMembership(row={}){return{id:text(row.id),campaignId:text(row.campaignId),uid:text(row.uid),role:role(row.role),characterId:text(row.characterId)||null,displayName:text(row.displayName),active:row.active!==false,updatedAt:text(row.updatedAt)}}
export function canCollaborate({ownerId='',uid='',membership=null},permission){if(text(ownerId)&&text(ownerId)===text(uid))return true;const m=membership?normalizeMembership(membership):null;if(!m?.active||m.uid!==text(uid))return false;return arr(COLLAB_PERMISSIONS[permission]).includes(m.role)}
export function sessionSharedProjection(session={}){return{id:text(session.id),number:Number(session.number)||1,title:String(session.title??''),date:String(session.date??''),status:String(session.status??'planned'),location:String(session.location??''),objective:String(session.objective??''),summary:String(session.summary??''),sharedNotes:String(session.sharedNotes??''),participantCharacterIds:unique(session.participantCharacterIds)}}
export function campaignSharedProjection(campaign={}){return{id:text(campaign.id),name:String(campaign.name??''),status:String(campaign.status??'active'),system:String(campaign.system??''),setting:String(campaign.setting??''),description:String(campaign.description??''),dmName:String(campaign.dmName??''),schedule:String(campaign.schedule??''),currentArc:String(campaign.currentArc??''),currentLocation:String(campaign.currentLocation??''),partyGoal:String(campaign.partyGoal??''),sharedNotes:String(campaign.sharedNotes??''),partyTreasure:String(campaign.partyTreasure??''),members:arr(campaign.members).map(m=>({id:text(m.id),name:String(m.name??''),role:String(m.role??'player'),characterId:text(m.characterId)||null,active:m.active!==false})),sessions:arr(campaign.sessions).map(sessionSharedProjection),activeSessionId:text(campaign.activeSessionId)||null,updatedAt:text(campaign.updatedAt)}}
export function campaignSharedCoreProjection(campaign={}){return{...campaignSharedProjection(campaign),sessions:[],activeSessionId:null}}
export function revealedAdventureProjection(adventure={}){const revealedHandoutIds=new Set(arr(adventure.handouts).filter(h=>h.revealed===true).map(h=>h.id)),visibleClueIds=new Set(arr(adventure.clues).filter(c=>['discovered','resolved'].includes(c.status)).map(c=>c.id));return{id:text(adventure.id),campaignId:text(adventure.campaignId),title:String(adventure.title??''),status:String(adventure.status??'planned'),arc:String(adventure.arc??''),summary:String(adventure.summary??''),handouts:arr(adventure.handouts).filter(h=>revealedHandoutIds.has(h.id)).map(h=>({id:h.id,title:String(h.title??''),type:String(h.type??'text'),content:String(h.content??''),url:String(h.url??'')})),clues:arr(adventure.clues).filter(c=>visibleClueIds.has(c.id)).map(c=>({id:c.id,title:String(c.title??''),text:String(c.text??''),status:c.status}))}}
export function adventureParticipantCharacterIds(adventure={},campaign={}){const sessions=new Map(arr(campaign.sessions).map(s=>[text(s.id),s])),ids=[];for(const scene of arr(adventure.scenes)){const session=sessions.get(text(scene.sessionId));if(session)ids.push(...arr(session.participantCharacterIds))}return unique(ids)}
export function adventureSharedRecord(adventure={},campaign={}){return{payload:revealedAdventureProjection(adventure),participantCharacterIds:adventureParticipantCharacterIds(adventure,campaign)}}
export function collaborationSharedBundle(campaign={},adventures=[]){return{campaign:campaignSharedProjection(campaign),revealedAdventures:arr(adventures).filter(a=>a.campaignId===campaign.id).map(revealedAdventureProjection)}}
export function collaborationMemberBundle(corePayload={},sessions=[],adventures=[]){const campaign={...(corePayload?.campaign||{}),sessions:arr(sessions).map(s=>s?.payload||s).filter(Boolean)};const activeSessionId=campaign.activeSessionId&&campaign.sessions.some(s=>s.id===campaign.activeSessionId)?campaign.activeSessionId:null;return{campaign:{...campaign,activeSessionId},revealedAdventures:arr(adventures).map(a=>a?.payload||a).filter(Boolean)}}
export function mergeNewest(localRows=[],remoteRows=[]){const map=new Map(arr(localRows).filter(x=>x?.id).map(row=>[row.id,row]));for(const row of arr(remoteRows).filter(x=>x?.id)){const old=map.get(row.id),oldAt=Date.parse(old?.updatedAt||old?.createdAt||'')||0,newAt=Date.parse(row?.updatedAt||row?.createdAt||'')||0;if(!old||newAt>=oldAt)map.set(row.id,row)}return[...map.values()]}
