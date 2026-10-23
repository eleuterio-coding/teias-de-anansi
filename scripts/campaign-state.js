import{sanitizeEncounterSessionFields}from'./encounter-state.js?v=20261022-chronicles-final3';
import{sanitizeCombatSessionFields}from'./combat-state.js?v=20261022-chronicles-final3';

export const CAMPAIGN_KEY='hub-rpg:campaigns:v1';
export const CAMPAIGN_SCHEMA='hub-rpg/campaign/v1';
export const STANDALONE_SESSION_KEY='hub-rpg:sessions:v1';
const CAMPAIGN_STATUS=new Set(['planned','active','paused','finished','cancelled']);
const SESSION_STATUS=new Set(['planned','next','current','active','completed','cancelled']);
const SESSION_SCENE_STATUS=new Set(['planned','active','completed','skipped']);
const MEMBER_ROLES=new Set(['dm','player']);
const text=v=>String(v??'').trim();
const arr=v=>Array.isArray(v)?v:[];
const now=()=>new Date().toISOString();
function sanitizeMediaRef(row){if(!row||typeof row!=='object'||!text(row.id))return null;return{id:text(row.id),campaignId:text(row.campaignId)||null,entityType:text(row.entityType),entityId:text(row.entityId),mime:text(row.mime)||'image/webp',width:Math.max(0,Math.floor(Number(row.width)||0)),height:Math.max(0,Math.floor(Number(row.height)||0)),size:Math.max(0,Math.floor(Number(row.size)||0))}}
export function campaignUid(prefix='cmp'){return globalThis.crypto?.randomUUID?.()||`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,9)}`}
function sanitizeMember(row={}){return{id:text(row.id)||campaignUid('member'),username:text(row.username).toLowerCase(),name:text(row.name)||'Participante',role:MEMBER_ROLES.has(row.role)?row.role:'player',characterId:text(row.characterId)||null,notes:String(row.notes??''),active:row.active!==false}}
function sanitizeSessionScene(row={},index=0){return{id:text(row.id)||campaignUid('session-scene'),title:text(row.title)||`Cena ${index+1}`,status:SESSION_SCENE_STATUS.has(row.status)?row.status:'planned',order:Math.max(1,Math.floor(Number(row.order)||index+1)),adventureSceneId:text(row.adventureSceneId)||null,locationId:text(row.locationId)||null,npcIds:[...new Set(arr(row.npcIds).map(text).filter(Boolean))],missionIds:[...new Set(arr(row.missionIds).map(text).filter(Boolean))],clueIds:[...new Set(arr(row.clueIds).map(text).filter(Boolean))],handoutIds:[...new Set(arr(row.handoutIds).map(text).filter(Boolean))],treasureIds:[...new Set(arr(row.treasureIds).map(text).filter(Boolean))],encounterId:text(row.encounterId)||null,description:String(row.description??''),notes:String(row.notes??''),createdAt:text(row.createdAt)||now(),updatedAt:text(row.updatedAt)||now()}}
export const sessionTimelineNodes=(nodes=[],depth=0)=>depth>9?[]:arr(nodes).filter(n=>n&&typeof n==='object').map((n,i)=>({id:text(n.id)||campaignUid('session-event'),text:String(n.text??''),visibleToPlayers:n.visibleToPlayers===true,children:sessionTimelineNodes(n.children,depth+1)})).filter(n=>n.text||n.children.length);
function sanitizeSession(row={},index=0){const status=SESSION_STATUS.has(row.status)?row.status:'planned',encounterFields=sanitizeEncounterSessionFields(row),combatFields=sanitizeCombatSessionFields(row),scenes=arr(row.scenes).map(sanitizeSessionScene).sort((a,b)=>a.order-b.order||a.title.localeCompare(b.title,'pt-BR')),sceneIds=new Set(scenes.map(s=>s.id));for(const encounter of encounterFields.encounters)if(encounter.sessionSceneId&&!sceneIds.has(encounter.sessionSceneId))encounter.sessionSceneId=null;for(const combat of combatFields.combats)if(combat.sessionSceneId&&!sceneIds.has(combat.sessionSceneId))combat.sessionSceneId=null;let activeSceneId=text(row.activeSceneId)||null;if(activeSceneId&&!scenes.some(s=>s.id===activeSceneId&&s.status==='active'))activeSceneId=null;if(!activeSceneId){const active=scenes.find(s=>s.status==='active');if(active)activeSceneId=active.id}return{id:text(row.id)||campaignUid('session'),number:Math.max(1,Math.floor(Number(row.number)||index+1)),order:Math.max(1,Math.floor(Number(row.order)||Number(row.number)||index+1)),title:text(row.title)||`Sessão ${Math.max(1,Math.floor(Number(row.number)||index+1))}`,date:text(row.date),status,adventureId:text(row.adventureId)||null,location:String(row.location??''),objective:String(row.objective??''),summary:String(row.summary??''),sharedNotes:String(row.sharedNotes??''),dmNotes:String(row.dmNotes??''),dmNoteEntries:Array.isArray(row.dmNoteEntries)?row.dmNoteEntries.map((n,i)=>({id:text(n?.id)||'note-'+i,text:String(n?.text??''),visibleToPlayers:n?.visibleToPlayers===true})).filter(n=>n.text.trim()):String(row.dmNotes??'').trim()?[{id:'legacy-master-note',text:String(row.dmNotes),visibleToPlayers:false}]:[],finalSummary:String(row.finalSummary??''),timelineNodes:sessionTimelineNodes(row.timelineNodes||[]),quickLog:String(row.quickLog??''),coverImage:sanitizeMediaRef(row.coverImage),coverImageUrl:String(row.coverImageUrl??''),participantUsernames:[...new Set(arr(row.participantUsernames).map(v=>text(v).toLowerCase()).filter(Boolean))],participantCharacterIds:[...new Set(arr(row.participantCharacterIds).map(text).filter(Boolean))],scenes,activeSceneId,...encounterFields,...combatFields,createdAt:text(row.createdAt)||now(),updatedAt:text(row.updatedAt)||now()}}
function sanitizeTimelineNodes(input=[],depth=0,seen=new Set()){
 if(depth>12)return[];
 return arr(input).slice(0,500).map((node,index)=>{
  const value=typeof node==='string'?{text:node}:node&&typeof node==='object'?node:{};
  let id=text(value.id)||campaignUid('event');
  if(seen.has(id))id=campaignUid('event');
  seen.add(id);
  return{id,text:String(value.text??'').trim().slice(0,2000),visibleToPlayers:value.visibleToPlayers===true,
   children:sanitizeTimelineNodes(value.children,depth+1,seen)}
 }).filter(n=>n.text||n.children.length);
}
function legacyTimelineNodes(value){
 return String(value||'').split(/\r?\n/).map(x=>x.trim().replace(/^[•*\-]\s*/, '')).filter(Boolean)
  .map((text,index)=>({id:'legacy-timeline-'+(index+1),text,children:[]}));
}
function sanitizeCharacterDirectoryEntry(row={}){return{id:text(row.id),status:['active','inactive','retired','dead','missing'].includes(row.status)?row.status:'active',notes:String(row.notes??'').slice(0,2000)}}
function sanitizeNpcDirectoryEntry(row={}){return{
 id:text(row.id),sheetId:text(row.sheetId)||null,name:text(row.name).slice(0,200),category:text(row.category).slice(0,80),
 role:text(row.role).slice(0,200),faction:text(row.faction).slice(0,200),relationship:text(row.relationship).slice(0,200),status:text(row.status).slice(0,80),
 location:text(row.location).slice(0,200),notes:String(row.notes??'').slice(0,6000),visibleToPlayers:row.visibleToPlayers===true,
 publicName:text(row.publicName).slice(0,200),publicCategory:text(row.publicCategory).slice(0,80),publicClass:text(row.publicClass).slice(0,200),publicSpecies:text(row.publicSpecies).slice(0,200),publicBackground:text(row.publicBackground).slice(0,200),publicLevel:Math.max(0,Math.min(20,Math.floor(Number(row.publicLevel)||0))),publicRole:text(row.publicRole).slice(0,200),publicFaction:text(row.publicFaction).slice(0,200),
 publicRelationship:text(row.publicRelationship).slice(0,200),publicStatus:text(row.publicStatus).slice(0,100),
 publicLocation:text(row.publicLocation).slice(0,200),publicDescription:String(row.publicDescription??'').slice(0,2000),
 publicPortraitUrl:String(row.publicPortraitUrl??'').slice(0,1000),updatedAt:text(row.updatedAt)||now()
}}
function sanitizeCampaignNpc(row={}){return{id:text(row.id)||campaignUid('npc'),sheetId:text(row.sheetId)||null,name:text(row.name)||'NPC',role:String(row.role??''),faction:String(row.faction??''),relationship:String(row.relationship??''),status:String(row.status??''),currentLocationId:text(row.currentLocationId)||null,portraitUrl:String(row.portraitUrl??''),monsterId:text(row.monsterId)||null,source:String(row.source??''),description:String(row.description??''),notes:String(row.notes??''),createdAt:text(row.createdAt)||now(),updatedAt:text(row.updatedAt)||now()}}
function sanitizeImportantLocationEntries(row={}){
 const names=String(row.importantLocations??'').split(/\r?\n/).map(name=>name.trim().replace(/^[•*\-]\s*/, '')).filter(Boolean);
 const existing=arr(row.importantLocationEntries).filter(item=>item&&typeof item==='object');
 const used=new Set();
 return names.map((name,index)=>{
  let matchIndex=index;
  if(!existing[index]||text(existing[index].name)!==name||used.has(index)){
   matchIndex=existing.findIndex((item,i)=>!used.has(i)&&text(item.name)===name);
  }
  if(matchIndex<0||used.has(matchIndex))matchIndex=-1;
  if(matchIndex>=0)used.add(matchIndex);
  const previous=matchIndex>=0?existing[matchIndex]:null;
  return{id:text(previous?.id)||campaignUid('important-location'),name,image:sanitizeMediaRef(previous?.image),visibleToPlayers:previous?.visibleToPlayers===true};
 });
}
function sanitizeCampaignLocation(row={}){return{id:text(row.id)||campaignUid('location'),name:text(row.name)||'Local',type:String(row.type??''),imageUrl:String(row.imageUrl??''),description:String(row.description??''),state:String(row.state??''),notes:String(row.notes??''),createdAt:text(row.createdAt)||now(),updatedAt:text(row.updatedAt)||now()}}
export function sanitizeCampaign(row={}){const sessions=arr(row.sessions).map(sanitizeSession);let activeSessionId=text(row.activeSessionId)||null;const active=sessions.filter(s=>s.status==='active');if(activeSessionId&&!sessions.some(s=>s.id===activeSessionId&&s.status==='active'))activeSessionId=null;if(!activeSessionId&&active.length)activeSessionId=active[0].id;for(const session of sessions)if(session.status==='active'&&session.id!==activeSessionId)session.status='planned';return{schema:CAMPAIGN_SCHEMA,id:text(row.id)||campaignUid(),name:text(row.name)||'Nova Campanha',status:row.status==='current'?'active':CAMPAIGN_STATUS.has(row.status)?row.status:'active',system:text(row.system)||'D&D 5.5e',setting:String(row.setting??''),worldPlane:String(row.worldPlane??''),mainRegion:String(row.mainRegion??''),description:String(row.description??''),coverImage:sanitizeMediaRef(row.coverImage),coverImageUrl:String(row.coverImageUrl??row.coverUrl??''),historySummary:String(row.historySummary??''),importantNpcs:String(row.importantNpcs??''),importantNpcIds:[...new Set(arr(row.importantNpcIds).map(text).filter(Boolean))],importantNpcPublicNames:Object.fromEntries(Object.entries(row.importantNpcPublicNames&&typeof row.importantNpcPublicNames==='object'?row.importantNpcPublicNames:{}).map(([id,name])=>[text(id),text(name).slice(0,200)]).filter(([id,name])=>id&&name)),importantNpcVisibility:Object.fromEntries(Object.entries(row.importantNpcVisibility&&typeof row.importantNpcVisibility==='object'?row.importantNpcVisibility:{}).map(([id,visible])=>[text(id),visible===true]).filter(([id])=>id)),importantLocations:String(row.importantLocations??''),importantLocationEntries:sanitizeImportantLocationEntries(row),activeMissions:String(row.activeMissions??''),campaignMaterials:String(row.campaignMaterials??''),timeline:String(row.timeline??''),timelineNodes:sanitizeTimelineNodes(Array.isArray(row.timelineNodes)?row.timelineNodes:legacyTimelineNodes(row.timeline)),dmName:String(row.dmName??''),schedule:String(row.schedule??''),currentArc:String(row.currentArc??''),currentLocation:String(row.currentLocation??''),partyGoal:String(row.partyGoal??''),sharedNotes:String(row.sharedNotes??''),dmNotes:String(row.dmNotes??''),dmNoteEntries:Array.isArray(row.dmNoteEntries)?row.dmNoteEntries.map((n,i)=>({id:text(n?.id)||'note-'+i,text:String(n?.text??''),visibleToPlayers:n?.visibleToPlayers===true})).filter(n=>n.text.trim()):String(row.dmNotes??'').trim()?[{id:'legacy-master-note',text:String(row.dmNotes),visibleToPlayers:false}]:[],partyTreasure:String(row.partyTreasure??''),characterDirectory:arr(row.characterDirectory).filter(r=>text(r?.id)).map(sanitizeCharacterDirectoryEntry),npcDirectory:arr(row.npcDirectory).filter(r=>text(r?.id)).map(sanitizeNpcDirectoryEntry),npcs:arr(row.npcs).map(sanitizeCampaignNpc),locations:arr(row.locations).map(sanitizeCampaignLocation),members:arr(row.members).map(sanitizeMember),sessions,activeSessionId,createdAt:text(row.createdAt)||now(),updatedAt:text(row.updatedAt)||now()}}
export function readCampaigns(storage=globalThis.localStorage){if(!storage)return[];try{const raw=JSON.parse(storage.getItem(CAMPAIGN_KEY)||'[]');return arr(raw).map(sanitizeCampaign)}catch{return[]}}
export function writeCampaigns(list,storage=globalThis.localStorage){const clean=arr(list).map(sanitizeCampaign);if(storage)storage.setItem(CAMPAIGN_KEY,JSON.stringify(clean));return clean}
export function readStandaloneSessions(storage=globalThis.localStorage){if(!storage)return[];try{const raw=JSON.parse(storage.getItem(STANDALONE_SESSION_KEY)||'[]');return arr(raw).map(sanitizeSession)}catch{return[]}}
export function writeStandaloneSessions(list,storage=globalThis.localStorage){const clean=arr(list).map(sanitizeSession);if(storage)storage.setItem(STANDALONE_SESSION_KEY,JSON.stringify(clean));return clean}
export function createStandaloneSession(list=[],data={}){let base=arr(list).map(sanitizeSession);const maxNumber=base.reduce((m,s)=>Math.max(m,s.number),0),session=sanitizeSession({...data,id:data.id||campaignUid('session'),number:data.number||maxNumber+1,order:data.order||maxNumber+1,createdAt:now(),updatedAt:now()},maxNumber);if(session.status==='current')base=base.map(s=>s.status==='current'?{...s,status:'planned'}:s);return{ok:true,list:[...base,session],session}}
export function updateStandaloneSession(list=[],sessionId,patch={}){const id=text(sessionId);let session=null,found=false;const next=arr(list).map((row,index)=>{const current=sanitizeSession(row,index);if(current.id!==id)return current;found=true;session=sanitizeSession({...current,...patch,id:current.id,createdAt:current.createdAt,updatedAt:now()},index);return session});return found?{ok:true,list:session.status==='current'?next.map(s=>s.id!==id&&s.status==='current'?{...s,status:'planned'}:s):next,session}:{ok:false,reason:'Sessão não encontrada.',list:arr(list).map(sanitizeSession)}}
export function removeStandaloneSession(list=[],sessionId){const id=text(sessionId),base=arr(list).map(sanitizeSession),next=base.filter(s=>s.id!==id);return next.length===base.length?{ok:false,reason:'Sessão não encontrada.',list:base}:{ok:true,list:next}}
export function addSessionScene(session,data={}){if(!session)return{ok:false,reason:'Sessão não encontrada.'};const scenes=arr(session.scenes).map(sanitizeSessionScene),maxOrder=scenes.reduce((m,s)=>Math.max(m,s.order),0),scene=sanitizeSessionScene({...data,id:data.id||campaignUid('session-scene'),order:data.order||maxOrder+1,createdAt:now(),updatedAt:now()},maxOrder);session.scenes=[...scenes,scene];session.updatedAt=now();return{ok:true,session,scene}}
export function updateSessionScene(session,sceneId,patch={}){if(!session)return{ok:false,reason:'Sessão não encontrada.'};const id=text(sceneId),index=arr(session.scenes).findIndex(s=>s.id===id);if(index<0)return{ok:false,reason:'Cena da sessão não encontrada.'};session.scenes[index]=sanitizeSessionScene({...session.scenes[index],...patch,id,createdAt:session.scenes[index].createdAt,updatedAt:now()},index);session.updatedAt=now();return{ok:true,session,scene:session.scenes[index]}}
export function removeSessionScene(session,sceneId){if(!session)return{ok:false,reason:'Sessão não encontrada.'};const id=text(sceneId),before=arr(session.scenes).length;session.scenes=arr(session.scenes).filter(s=>s.id!==id);if(session.scenes.length===before)return{ok:false,reason:'Cena da sessão não encontrada.'};if(session.activeSceneId===id)session.activeSceneId=null;for(const encounter of arr(session.encounters))if(encounter.sessionSceneId===id)encounter.sessionSceneId=null;for(const combat of arr(session.combats))if(combat.sessionSceneId===id)combat.sessionSceneId=null;session.updatedAt=now();return{ok:true,session}}
export function createCampaign(list=[],data={}){const campaign=sanitizeCampaign({...data,id:data.id||campaignUid(),createdAt:now(),updatedAt:now()}),base=arr(list).map(sanitizeCampaign),next=[...base,campaign];return{ok:true,list:next,campaign}}
export function updateCampaign(list=[],campaignId,patch={}){const id=text(campaignId);let campaign=null,found=false;const next=arr(list).map(row=>{const c=sanitizeCampaign(row);if(c.id!==id)return c;found=true;campaign=sanitizeCampaign({...c,...patch,id:c.id,createdAt:c.createdAt,updatedAt:now()});return campaign});return found?{ok:true,list:next,campaign}:{ok:false,reason:'Campanha não encontrada.',list:arr(list).map(sanitizeCampaign)}}
export function removeCampaign(list=[],campaignId){const id=text(campaignId),base=arr(list).map(sanitizeCampaign),next=base.filter(c=>c.id!==id);return next.length===base.length?{ok:false,reason:'Campanha não encontrada.',list:base}:{ok:true,list:next}}
export function campaignById(list=[],campaignId){const id=text(campaignId);return arr(list).map(sanitizeCampaign).find(c=>c.id===id)||null}
export function findCampaignForCharacter(list=[],characterId){const id=text(characterId);if(!id)return null;for(const campaign of arr(list).map(sanitizeCampaign)){const member=campaign.members.find(m=>m.characterId===id);if(member)return{campaign,member}}return null}
export function addCampaignMember(list=[],campaignId,data={}){
 const clean=arr(list).map(sanitizeCampaign),campaign=clean.find(c=>c.id===text(campaignId));
 if(!campaign)return{ok:false,reason:'Campanha não encontrada.',list:clean};
 const member=sanitizeMember({...data,id:data.id||campaignUid('member')});
 const characterId=member.characterId;member.characterId=null;
 campaign.members.push(member);campaign.updatedAt=now();
 if(characterId){
  const assigned=assignCharacterToMember(clean,campaignId,member.id,characterId);
  if(!assigned.ok)return{...assigned,list:arr(list).map(sanitizeCampaign)};
  return{...assigned,member:assigned.campaign.members.find(m=>m.id===member.id)}
 }
 return{ok:true,list:clean,campaign,member}
}
function characterAssignmentConflict(campaigns, campaignId, memberId, characterId){
 const targetId=text(campaignId),memberKey=text(memberId),characterKey=text(characterId);
 if(!characterKey)return null;
 for(const campaign of campaigns){
  for(const member of campaign.members){
   if(member.characterId!==characterKey)continue;
   if(campaign.id===targetId&&member.id===memberKey)continue;
   return {campaign,member,elsewhere:campaign.id!==targetId};
  }
 }
 return null;
}
function characterAssignmentReason(conflict){
 return conflict?.elsewhere
  ?'Este personagem já pertence a outra campanha. Desvincule-o da campanha original antes de atribuí-lo aqui.'
  :'Este personagem já está atribuído a outro jogador nesta campanha. Desvincule-o primeiro.';
}
export function updateCampaignMember(list=[],campaignId,memberId,patch={}){
 const clean=arr(list).map(sanitizeCampaign),campaign=clean.find(c=>c.id===text(campaignId));
 if(!campaign)return{ok:false,reason:'Campanha não encontrada.',list:clean};
 const index=campaign.members.findIndex(m=>m.id===text(memberId));
 if(index<0)return{ok:false,reason:'Participante não encontrado.',list:clean};
 const current=campaign.members[index],next=sanitizeMember({...current,...patch,id:current.id});
 const conflict=characterAssignmentConflict(clean,campaign.id,current.id,next.characterId);
 if(conflict)return{ok:false,reason:characterAssignmentReason(conflict),list:clean};
 const reassigned=Boolean(next.characterId&&next.characterId!==current.characterId);
 campaign.members[index]=reassigned?{...next,characterId:null}:next;campaign.updatedAt=now();
 if(reassigned){
  const result=assignCharacterToMember(clean,campaignId,memberId,next.characterId);
  if(!result.ok)return{...result,list:arr(list).map(sanitizeCampaign)};
  return{...result,member:result.campaign.members.find(m=>m.id===memberId)}
 }
 return{ok:true,list:clean,campaign,member:campaign.members[index]}
}
/** Reordena membros sem alterar IDs, vínculos ou dados das fichas. */
export function reorderCampaignMember(list=[],campaignId,sourceId,targetId,position='before'){
 const campaign=campaignById(list,campaignId);
 if(!campaign)return{ok:false,reason:'Campanha não encontrada.',list:arr(list).map(sanitizeCampaign)};
 const members=campaign.members;
 const source=members.findIndex(m=>m.id===text(sourceId));
 const target=members.findIndex(m=>m.id===text(targetId));
 if(source<0||target<0||!['before','after'].includes(position))
  return{ok:false,reason:'Jogador ou posição inválida.',list:arr(list).map(sanitizeCampaign)};
 if(source===target)return{ok:true,list:arr(list).map(sanitizeCampaign),campaign,changed:false};
 const [moved]=members.splice(source,1);
 const updatedTarget=members.findIndex(m=>m.id===text(targetId));
 members.splice(updatedTarget+(position==='after'?1:0),0,moved);
 campaign.updatedAt=now();
 return{ok:true,list:arr(list).map(row=>row.id===campaign.id?campaign:sanitizeCampaign(row)),campaign,changed:true};
}
export function removeCampaignMember(list=[],campaignId,memberId){const campaign=campaignById(list,campaignId);if(!campaign)return{ok:false,reason:'Campanha não encontrada.',list:arr(list).map(sanitizeCampaign)};const before=campaign.members.length;campaign.members=campaign.members.filter(m=>m.id!==text(memberId));if(campaign.members.length===before)return{ok:false,reason:'Participante não encontrado.',list:arr(list).map(sanitizeCampaign)};campaign.updatedAt=now();return{ok:true,list:arr(list).map(row=>row.id===campaign.id?campaign:sanitizeCampaign(row)),campaign}}
export function assignCharacterToMember(list=[],campaignId,memberId,characterId){
 const targetCampaignId=text(campaignId),targetMemberId=text(memberId),charId=text(characterId);
 const clean=arr(list).map(sanitizeCampaign);
 if(!charId)return{ok:false,reason:'Selecione um personagem.',list:clean};
 const target=clean.find(c=>c.id===targetCampaignId);
 const member=target?.members.find(m=>m.id===targetMemberId);
 if(!target||!member)return{ok:false,reason:'Campanha ou participante não encontrado.',list:clean};
 // Exclusividade por campanha, independente de quem controla a ficha.
 // Nunca transfira uma ficha silenciosamente entre campanhas.
 const conflict=characterAssignmentConflict(clean,targetCampaignId,targetMemberId,charId);
 if(conflict)return{ok:false,reason:characterAssignmentReason(conflict),list:clean};
 member.characterId=charId;target.updatedAt=now();
 return{ok:true,list:clean,campaign:target,member}
}
export function unassignCharacterFromMember(list=[],campaignId,memberId){return updateCampaignMember(list,campaignId,memberId,{characterId:null})}
export function addCampaignSession(list=[],campaignId,data={}){const campaign=campaignById(list,campaignId);if(!campaign)return{ok:false,reason:'Campanha não encontrada.',list:arr(list).map(sanitizeCampaign)};const maxNumber=campaign.sessions.reduce((m,s)=>Math.max(m,s.number),0),session=sanitizeSession({...data,id:data.id||campaignUid('session'),number:data.number||maxNumber+1,order:data.order||maxNumber+1,createdAt:now(),updatedAt:now()},maxNumber);if(session.status==='current')for(const old of campaign.sessions)if(old.status==='current')old.status='planned';campaign.sessions.push(session);campaign.updatedAt=now();return{ok:true,list:arr(list).map(row=>row.id===campaign.id?campaign:sanitizeCampaign(row)),campaign,session}}
export function updateCampaignSession(list=[],campaignId,sessionId,patch={}){const campaign=campaignById(list,campaignId);if(!campaign)return{ok:false,reason:'Campanha não encontrada.',list:arr(list).map(sanitizeCampaign)};const index=campaign.sessions.findIndex(s=>s.id===text(sessionId));if(index<0)return{ok:false,reason:'Sessão não encontrada.',list:arr(list).map(sanitizeCampaign)};campaign.sessions[index]=sanitizeSession({...campaign.sessions[index],...patch,id:campaign.sessions[index].id,createdAt:campaign.sessions[index].createdAt,updatedAt:now()},index);if(campaign.activeSessionId===campaign.sessions[index].id&&campaign.sessions[index].status!=='active')campaign.activeSessionId=null;if(campaign.sessions[index].status==='current')for(const other of campaign.sessions)if(other.id!==campaign.sessions[index].id&&other.status==='current')other.status='planned';campaign.updatedAt=now();return{ok:true,list:arr(list).map(row=>row.id===campaign.id?campaign:sanitizeCampaign(row)),campaign,session:campaign.sessions[index]}}
export function startCampaignSession(list=[],campaignId,sessionId){const campaign=campaignById(list,campaignId);if(!campaign)return{ok:false,reason:'Campanha não encontrada.',list:arr(list).map(sanitizeCampaign)};const session=campaign.sessions.find(s=>s.id===text(sessionId));if(!session)return{ok:false,reason:'Sessão não encontrada.',list:arr(list).map(sanitizeCampaign)};const other=campaign.sessions.find(s=>s.status==='active'&&s.id!==session.id);if(other)return{ok:false,reason:`Finalize a sessão ativa (${other.title}) antes de iniciar outra.`,list:arr(list).map(sanitizeCampaign)};session.status='active';session.updatedAt=now();campaign.activeSessionId=session.id;campaign.updatedAt=now();return{ok:true,list:arr(list).map(row=>row.id===campaign.id?campaign:sanitizeCampaign(row)),campaign,session}}
export function finishCampaignSession(list=[],campaignId,sessionId,patch={}){const campaign=campaignById(list,campaignId);if(!campaign)return{ok:false,reason:'Campanha não encontrada.',list:arr(list).map(sanitizeCampaign)};const session=campaign.sessions.find(s=>s.id===text(sessionId));if(!session)return{ok:false,reason:'Sessão não encontrada.',list:arr(list).map(sanitizeCampaign)};const activeCombat=session.combats?.find(e=>e.status==='active')||null;if(session.activeCombatId||activeCombat)return{ok:false,reason:`Finalize o combate ativo (${activeCombat?.title||'combate em andamento'}) antes de concluir a sessão.`,list:arr(list).map(sanitizeCampaign)};const activeEncounter=session.encounters?.find(e=>e.status==='active')||null;if(session.activeEncounterId||activeEncounter)return{ok:false,reason:`Finalize o encontro ativo legado (${activeEncounter?.title||'encontro em andamento'}) antes de concluir a sessão.`,list:arr(list).map(sanitizeCampaign)};const result=updateCampaignSession(list,campaignId,sessionId,{...patch,status:'completed'});if(!result.ok)return result;result.campaign.activeSessionId=null;result.campaign.updatedAt=now();result.list=result.list.map(row=>row.id===result.campaign.id?result.campaign:row);return result}
export function cancelCampaignSession(list=[],campaignId,sessionId){return updateCampaignSession(list,campaignId,sessionId,{status:'cancelled'})}
export function removeCampaignSession(list=[],campaignId,sessionId){const campaign=campaignById(list,campaignId);if(!campaign)return{ok:false,reason:'Campanha não encontrada.',list:arr(list).map(sanitizeCampaign)};const id=text(sessionId),before=campaign.sessions.length;campaign.sessions=campaign.sessions.filter(s=>s.id!==id);if(campaign.sessions.length===before)return{ok:false,reason:'Sessão não encontrada.',list:arr(list).map(sanitizeCampaign)};if(campaign.activeSessionId===id)campaign.activeSessionId=null;campaign.updatedAt=now();return{ok:true,list:arr(list).map(row=>row.id===campaign.id?campaign:sanitizeCampaign(row)),campaign}}
export function campaignContextForCharacter(list=[],characterId){const found=findCampaignForCharacter(list,characterId);if(!found)return null;const activeSession=found.campaign.sessions.find(s=>s.id===found.campaign.activeSessionId)||null;return{...found,activeSession}}
export function allCampaignSessions(list=[]){return arr(list).map(sanitizeCampaign).flatMap(campaign=>campaign.sessions.map(session=>({campaignId:campaign.id,campaignName:campaign.name,...session}))).sort((a,b)=>String(b.date||b.updatedAt).localeCompare(String(a.date||a.updatedAt))||b.number-a.number)}
function mutateCampaignEntity(list=[],campaignId,key,entityId,patch,remove=false){
 const campaign=campaignById(list,campaignId);if(!campaign)return{ok:false,reason:'Campanha não encontrada.',list:arr(list).map(sanitizeCampaign)};
 const sanitize=key==='npcs'?sanitizeCampaignNpc:key==='locations'?sanitizeCampaignLocation:null;if(!sanitize)return{ok:false,reason:'Coleção inválida.',list:arr(list).map(sanitizeCampaign)};
 if(remove){const before=campaign[key].length;campaign[key]=campaign[key].filter(row=>row.id!==text(entityId));if(before===campaign[key].length)return{ok:false,reason:'Registro não encontrado.',list:arr(list).map(sanitizeCampaign)};campaign.updatedAt=now();return{ok:true,list:arr(list).map(row=>row.id===campaign.id?campaign:sanitizeCampaign(row)),campaign}}
 const index=campaign[key].findIndex(row=>row.id===text(entityId));if(index<0)return{ok:false,reason:'Registro não encontrado.',list:arr(list).map(sanitizeCampaign)};
 const old=campaign[key][index];campaign[key][index]=sanitize({...old,...patch,id:old.id,createdAt:old.createdAt,updatedAt:now()});campaign.updatedAt=now();return{ok:true,list:arr(list).map(row=>row.id===campaign.id?campaign:sanitizeCampaign(row)),campaign,entity:campaign[key][index]}
}
function addCampaignEntity(list=[],campaignId,key,data={}){
 const campaign=campaignById(list,campaignId);if(!campaign)return{ok:false,reason:'Campanha não encontrada.',list:arr(list).map(sanitizeCampaign)};
 const sanitize=key==='npcs'?sanitizeCampaignNpc:key==='locations'?sanitizeCampaignLocation:null;if(!sanitize)return{ok:false,reason:'Coleção inválida.',list:arr(list).map(sanitizeCampaign)};
 const entity=sanitize({...data,id:data.id||campaignUid(key==='npcs'?'npc':'location'),createdAt:now(),updatedAt:now()});campaign[key].push(entity);campaign.updatedAt=now();return{ok:true,list:arr(list).map(row=>row.id===campaign.id?campaign:sanitizeCampaign(row)),campaign,entity}
}
export const addCampaignNpc=(list,id,data={})=>addCampaignEntity(list,id,'npcs',data);
export const updateCampaignNpc=(list,id,entityId,patch={})=>mutateCampaignEntity(list,id,'npcs',entityId,patch);
export const removeCampaignNpc=(list,id,entityId)=>mutateCampaignEntity(list,id,'npcs',entityId,{},true);
export const addCampaignLocation=(list,id,data={})=>addCampaignEntity(list,id,'locations',data);
export const updateCampaignLocation=(list,id,entityId,patch={})=>mutateCampaignEntity(list,id,'locations',entityId,patch);
export function removeCampaignLocation(list,id,entityId){const result=mutateCampaignEntity(list,id,'locations',entityId,{},true);if(!result.ok)return result;for(const npc of result.campaign.npcs)if(npc.currentLocationId===text(entityId))npc.currentLocationId=null;result.campaign.updatedAt=now();return result}
