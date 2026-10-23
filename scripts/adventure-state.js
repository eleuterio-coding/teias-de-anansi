import{sanitizeCampaign}from'./campaign-state.js?v=20261022-chronicles-final3';
import{normalizeExploration}from'./adventure-exploration-state.js?v=20261023-simplified3';
export const ADVENTURE_KEY='hub-rpg:adventures:v1';
export const ADVENTURE_SCHEMA='hub-rpg/adventure/v3';
export const ADVENTURE_STATUS=Object.freeze(['planned','active','paused','completed','archived']);
export const ADVENTURE_TYPES=Object.freeze(['main','side','oneshot','secondary']);
export const SCENE_STATUS=Object.freeze(['planned','active','completed','skipped']);
export const CLUE_STATUS=Object.freeze(['hidden','discovered','resolved']);
export const TREASURE_STATUS=Object.freeze(['planned','found','claimed']);
export const MISSION_STATUS=Object.freeze(['hidden','active','completed','failed','abandoned']);
const ADV_STATUS=new Set(ADVENTURE_STATUS),ADV_TYPES=new Set(ADVENTURE_TYPES),SCN_STATUS=new Set(SCENE_STATUS),CLUE_ST=new Set(CLUE_STATUS),TREASURE_ST=new Set(TREASURE_STATUS),MISSION_ST=new Set(MISSION_STATUS);
const text=v=>String(v??'').trim();
const arr=v=>Array.isArray(v)?v:[];
const now=()=>new Date().toISOString();
function sanitizeMediaRef(row){if(!row||typeof row!=='object'||!text(row.id))return null;return{id:text(row.id),campaignId:text(row.campaignId)||null,entityType:text(row.entityType),entityId:text(row.entityId),mime:text(row.mime)||'image/webp',width:Math.max(0,Math.floor(Number(row.width)||0)),height:Math.max(0,Math.floor(Number(row.height)||0)),size:Math.max(0,Math.floor(Number(row.size)||0))}}
const uniq=v=>[...new Set(arr(v).map(text).filter(Boolean))];
const uniqLower=v=>[...new Set(arr(v).map(x=>text(x).toLowerCase()).filter(Boolean))];
const uid=prefix=>globalThis.crypto?.randomUUID?.()||`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
const copy=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
function stamp(row={},prefix){return{id:text(row.id)||uid(prefix),createdAt:text(row.createdAt)||now(),updatedAt:text(row.updatedAt)||now()}}
function sanitizeParticipantAssignments(rows){
 if(!Array.isArray(rows))return null;
 const seen=new Set(),characters=new Set();
 return rows.map(row=>({username:text(row?.username).toLowerCase(),characterId:text(row?.characterId)||null}))
  .filter(row=>{if(!row.username||seen.has(row.username))return false;seen.add(row.username);
   if(row.characterId&&characters.has(row.characterId))row.characterId=null;
   if(row.characterId)characters.add(row.characterId);
   return true
  });
}
const reveal=row=>row?.visibleToPlayers===true;
function sanitizeAdventureMonster(row={},index=0){return{...stamp(row,'monster'),name:text(row.name)||'Monstro',monsterId:text(row.monsterId)||null,source:String(row.source??''),ac:Math.max(0,Number(row.ac)||0),maxHp:Math.max(1,Number(row.maxHp)||1),initiativeModifier:Number(row.initiativeModifier)||0,visibleToPlayers:reveal(row),order:Math.max(1,Number(row.order)||index+1)}}
function sanitizeAdventureTimelineNodes(rows=[],depth=0){if(depth>10)return[];return arr(rows).slice(0,300).filter(n=>n&&typeof n==='object').map((n,i)=>({id:text(n.id)||'adventure-event-'+depth+'-'+i,text:String(n.text??''),visibleToPlayers:reveal(n),children:sanitizeAdventureTimelineNodes(n.children,depth+1)})).filter(n=>n.text||n.children.length)}
function sanitizeChapter(row={},index=0){return{...stamp(row,'chapter'),title:text(row.title)||`Capítulo ${index+1}`,arc:String(row.arc??''),status:['planned','active','completed'].includes(row.status)?row.status:'planned',summary:String(row.summary??''),notes:String(row.notes??''),visibleToPlayers:reveal(row),order:Math.max(1,Math.floor(Number(row.order)||index+1))}}
function sanitizeLegacyLocation(row={}){return{...stamp(row,'location'),name:text(row.name)||'Local',type:String(row.type??''),description:String(row.description??''),notes:String(row.notes??'')}}
function sanitizeLegacyNpc(row={}){return{...stamp(row,'npc'),name:text(row.name)||'NPC',role:String(row.role??''),description:String(row.description??''),notes:String(row.notes??''),monsterId:text(row.monsterId)||null,source:String(row.source??'')}}
function sanitizeClue(row={}){return{...stamp(row,'clue'),title:text(row.title)||'Pista',text:String(row.text??''),status:CLUE_ST.has(row.status)?row.status:'hidden',locationId:text(row.locationId)||null,npcId:text(row.npcId)||null,sceneId:text(row.sceneId)||null,discoveredByCharacterId:text(row.discoveredByCharacterId)||null,discoveredSessionId:text(row.discoveredSessionId)||null,dependsOnIds:uniq(row.dependsOnIds),notes:String(row.notes??'')}}
function sanitizeHandout(row={}){return{...stamp(row,'material'),title:text(row.title)||'Material',type:['text','link','image','map','document'].includes(row.type)?row.type:'text',content:String(row.content??''),url:String(row.url??''),sceneId:text(row.sceneId)||null,revealed:row.revealed===true,revealedSessionId:text(row.revealedSessionId)||null,notes:String(row.notes??'')}}
function sanitizeTreasure(row={}){return{...stamp(row,'treasure'),name:text(row.name)||'Tesouro',description:String(row.description??''),quantity:Math.max(1,Math.floor(Number(row.quantity)||1)),type:String(row.type??''),libraryItemId:text(row.libraryItemId)||null,sceneId:text(row.sceneId)||null,locationId:text(row.locationId)||null,status:TREASURE_ST.has(row.status)?row.status:'planned',recipientCharacterId:text(row.recipientCharacterId)||null,notes:String(row.notes??'')}}
function sanitizeMission(row={},index=0){return{...stamp(row,'mission'),title:text(row.title)||`Missão ${index+1}`,kind:['main','side','optional'].includes(row.kind)?row.kind:'side',status:MISSION_ST.has(row.status)?row.status:'active',description:String(row.description??''),characterIds:uniq(row.characterIds),reward:String(row.reward??''),consequence:String(row.consequence??''),order:Math.max(1,Math.floor(Number(row.order)||index+1)),visibleToPlayers:reveal(row),notes:String(row.notes??'')}}
function sanitizeTimeline(row={}){return{...stamp(row,'event'),type:String(row.type??'note'),title:text(row.title)||'Registro',text:String(row.text??''),sessionId:text(row.sessionId)||null,sceneId:text(row.sceneId)||null,missionId:text(row.missionId)||null,at:text(row.at)||text(row.createdAt)||now(),automatic:row.automatic===true,visibleToPlayers:reveal(row)}}
function sanitizeScene(row={},index=0){const encounter=copy(row.encounterRef);return{...stamp(row,'scene'),chapterId:text(row.chapterId)||null,title:text(row.title)||`Cena ${index+1}`,status:SCN_STATUS.has(row.status)?row.status:'planned',locationId:text(row.locationId)||null,areaId:text(row.areaId)||null,npcIds:uniq(row.npcIds),clueIds:uniq(row.clueIds),handoutIds:uniq(row.handoutIds),treasureIds:uniq(row.treasureIds),missionIds:uniq(row.missionIds),monsterIds:uniq(row.monsterIds),visibleToPlayers:reveal(row),sessionId:text(row.sessionId)||null,sessionSceneId:text(row.sessionSceneId)||null,encounterRef:{sessionId:text(encounter.sessionId)||null,encounterId:text(encounter.encounterId)||null},objective:String(row.objective??''),description:String(row.description??''),outcome:String(row.outcome??''),notes:String(row.notes??''),order:Math.max(1,Math.floor(Number(row.order)||index+1))}}
export function sanitizeAdventure(row={}){
 const chapters=arr(row.chapters).map(sanitizeChapter).sort((a,b)=>a.order-b.order||a.title.localeCompare(b.title,'pt-BR'));
 const legacyLocations=arr(row.legacyLocations??row.locations).map(sanitizeLegacyLocation),legacyNpcs=arr(row.legacyNpcs??row.npcs).map(sanitizeLegacyNpc);
 const locationIds=uniq([...arr(row.locationIds),...legacyLocations.map(x=>x.id)]),npcIds=uniq([...arr(row.npcIds),...legacyNpcs.map(x=>x.id)]),participantAssignments=sanitizeParticipantAssignments(row.participantAssignments),characterIds=participantAssignments?uniq(participantAssignments.map(m=>m.characterId)):uniq(row.characterIds);
 const locationSet=new Set(locationIds),npcSet=new Set(npcIds),characterSet=new Set(characterIds);
 const monsters=arr(row.monsters).map(sanitizeAdventureMonster).sort((a,b)=>a.order-b.order),monsterIds=new Set(monsters.map(m=>m.id));
 const cluesRaw=arr(row.clues).map(sanitizeClue),handoutsRaw=arr(row.handouts??row.materials).map(sanitizeHandout),treasuresRaw=arr(row.treasures).map(sanitizeTreasure),missionsRaw=arr(row.missions).map(sanitizeMission).sort((a,b)=>a.order-b.order||a.title.localeCompare(b.title,'pt-BR')),timeline=arr(row.timelineEvents??(Array.isArray(row.timeline)?row.timeline:[])).map(sanitizeTimeline).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
 const chapterIds=new Set(chapters.map(x=>x.id)),clueIds=new Set(cluesRaw.map(x=>x.id)),handoutIds=new Set(handoutsRaw.map(x=>x.id)),treasureIds=new Set(treasuresRaw.map(x=>x.id)),missionIds=new Set(missionsRaw.map(x=>x.id));
 const exploration=normalizeExploration(row.exploration,{locationIds,chapterIds:[...chapterIds],npcIds,monsterIds:[...monsterIds],missionIds:[...missionIds],clueIds:[...clueIds],handoutIds:[...handoutIds],treasureIds:[...treasureIds]});
 const explorationAreaIds=new Set(exploration.areas.map(area=>area.id));
 const scenes=arr(row.scenes).map(sanitizeScene).map(scene=>({...scene,chapterId:chapterIds.has(scene.chapterId)?scene.chapterId:null,locationId:locationSet.has(scene.locationId)?scene.locationId:null,areaId:explorationAreaIds.has(scene.areaId)?scene.areaId:null,npcIds:scene.npcIds.filter(id=>npcSet.has(id)),clueIds:scene.clueIds.filter(id=>clueIds.has(id)),handoutIds:scene.handoutIds.filter(id=>handoutIds.has(id)),treasureIds:scene.treasureIds.filter(id=>treasureIds.has(id)),missionIds:scene.missionIds.filter(id=>missionIds.has(id)),monsterIds:scene.monsterIds.filter(id=>monsterIds.has(id))})).sort((a,b)=>a.order-b.order||a.title.localeCompare(b.title,'pt-BR')),sceneIds=new Set(scenes.map(x=>x.id));
 const clues=cluesRaw.map(clue=>({...clue,locationId:locationSet.has(clue.locationId)?clue.locationId:null,npcId:npcSet.has(clue.npcId)?clue.npcId:null,sceneId:sceneIds.has(clue.sceneId)?clue.sceneId:null,discoveredByCharacterId:characterSet.has(clue.discoveredByCharacterId)?clue.discoveredByCharacterId:null,dependsOnIds:clue.dependsOnIds.filter(id=>clueIds.has(id)&&id!==clue.id)}));
 const handouts=handoutsRaw.map(item=>({...item,sceneId:sceneIds.has(item.sceneId)?item.sceneId:null}));
 const treasures=treasuresRaw.map(item=>({...item,sceneId:sceneIds.has(item.sceneId)?item.sceneId:null,locationId:locationSet.has(item.locationId)?item.locationId:null,recipientCharacterId:characterSet.has(item.recipientCharacterId)?item.recipientCharacterId:null}));
 const missions=missionsRaw.map(item=>({...item,characterIds:item.characterIds.filter(id=>characterSet.has(id))}));
 let activeSceneId=text(row.activeSceneId)||null;const activeScenes=scenes.filter(x=>x.status==='active');if(activeSceneId&&!scenes.some(x=>x.id===activeSceneId&&x.status==='active'))activeSceneId=null;if(!activeSceneId&&activeScenes.length)activeSceneId=activeScenes[0].id;for(const scene of scenes)if(scene.status==='active'&&scene.id!==activeSceneId)scene.status='planned';
 let currentChapterId=text(row.currentChapterId)||null;if(currentChapterId&&!chapterIds.has(currentChapterId))currentChapterId=null;const activeScene=scenes.find(x=>x.id===activeSceneId);if(activeScene?.chapterId)currentChapterId=activeScene.chapterId;
 return{schema:ADVENTURE_SCHEMA,...stamp(row,'adventure'),campaignId:text(row.campaignId)||null,title:text(row.title)||'Nova Aventura',coverImage:sanitizeMediaRef(row.coverImage),coverImageUrl:String(row.coverImageUrl??''),description:String(row.description??''),status:row.status==='current'?'active':ADV_STATUS.has(row.status)?row.status:'planned',order:Math.max(1,Math.floor(Number(row.order)||1)),type:ADV_TYPES.has(row.type)?row.type:'main',arc:String(row.arc??''),pitch:String(row.pitch??''),objective:String(row.objective??''),summary:String(row.summary??''),currentSituation:String(row.currentSituation??''),nextStep:String(row.nextStep??''),dmNotes:String(row.dmNotes??''),dmNoteEntries:Array.isArray(row.dmNoteEntries)?row.dmNoteEntries.map((n,i)=>({id:text(n?.id)||'note-'+i,text:String(n?.text??''),visibleToPlayers:n?.visibleToPlayers===true})).filter(n=>n.text.trim()):String(row.dmNotes??'').trim()?[{id:'legacy-master-note',text:String(row.dmNotes),visibleToPlayers:false}]:[],participantUsernames:participantAssignments?uniqLower(participantAssignments.map(m=>m.username)):uniqLower(row.participantUsernames),participantAssignments,characterIds,participantAccessConfigured:row.participantAccessConfigured===true,chapters,scenes,exploration,locationIds,npcIds,legacyLocations,legacyNpcs,clues,handouts,treasures,missions,monsters,sessionVisibility:row.sessionVisibility&&typeof row.sessionVisibility==='object'?Object.fromEntries(Object.entries(row.sessionVisibility).map(([id,v])=>[id,v===true])):{},npcVisibility:row.npcVisibility&&typeof row.npcVisibility==='object'?Object.fromEntries(Object.entries(row.npcVisibility).map(([id,v])=>[id,v===true])):{},locationVisibility:row.locationVisibility&&typeof row.locationVisibility==='object'?Object.fromEntries(Object.entries(row.locationVisibility).map(([id,v])=>[id,v===true])):{},timelineNodes:sanitizeAdventureTimelineNodes(Array.isArray(row.timelineNodes)?row.timelineNodes:timeline.filter(n=>!n.automatic).map(n=>({id:n.id,text:n.title+(n.text?' — '+n.text:''),visibleToPlayers:false,children:[]}))),timelineEvents:timeline,currentChapterId,activeSceneId}
}
/** Recupera a ordem narrativa dos registros antigos sem alterar posições já escolhidas. */
export function normalizeAdventureOrders(list=[]){
 const rows=arr(list).map(row=>({...row})),groups=new Map();
 rows.forEach((row,index)=>{
  const id=text(row.campaignId)||'__standalone__';
  if(!groups.has(id))groups.set(id,[]);
  groups.get(id).push({row,index})
 });
 for(const group of groups.values()){
  const previous=new Set(group.filter(x=>Number.isInteger(Number(x.row.order))&&Number(x.row.order)>=1).map(x=>Number(x.row.order)));
  let candidate=1;
  const missing=group.filter(x=>!Number.isInteger(Number(x.row.order))||Number(x.row.order)<1)
   .sort((a,b)=>String(a.row.createdAt||a.row.updatedAt||'').localeCompare(String(b.row.createdAt||b.row.updatedAt||''))||a.index-b.index);
  for(const item of missing){while(previous.has(candidate))candidate++;item.row.order=candidate;previous.add(candidate);candidate++}
 }
 return rows.map(sanitizeAdventure)
}
export function readAdventures(storage=globalThis.localStorage){if(!storage)return[];try{return normalizeAdventureOrders(JSON.parse(storage.getItem(ADVENTURE_KEY)||'[]'))}catch{return[]}}
export function writeAdventures(list,storage=globalThis.localStorage){const clean=normalizeAdventureOrders(list);if(storage)storage.setItem(ADVENTURE_KEY,JSON.stringify(clean));return clean}
export function adventureById(list=[],adventureId){const id=text(adventureId);return arr(list).map(sanitizeAdventure).find(a=>a.id===id)||null}
export function adventuresForCampaign(list=[],campaignId){const id=text(campaignId);return arr(list).map(sanitizeAdventure).filter(a=>a.campaignId===id)}
export function createAdventure(list=[],data={}){const campaignId=text(data.campaignId);if(!campaignId)return{ok:false,reason:'Selecione uma Campanha.',list:arr(list).map(sanitizeAdventure)};const maxOrder=arr(list).filter(a=>a.campaignId===campaignId).reduce((max,a)=>Math.max(max,Number(a.order)||1),0);const adventure=sanitizeAdventure({...data,order:data.order||maxOrder+1,id:data.id||uid('adventure'),campaignId,createdAt:now(),updatedAt:now()});const base=arr(list).map(sanitizeAdventure);return{ok:true,list:[...base,adventure],adventure}}
export function updateAdventure(list=[],adventureId,patch={}){const id=text(adventureId);let adventure=null,found=false;const next=arr(list).map(row=>{const old=sanitizeAdventure(row);if(old.id!==id)return old;found=true;adventure=sanitizeAdventure({...old,...patch,id:old.id,campaignId:old.campaignId,createdAt:old.createdAt,updatedAt:now()});return adventure});return found?{ok:true,list:next,adventure}:{ok:false,reason:'Aventura não encontrada.',list:arr(list).map(sanitizeAdventure)}}
export function reassignAdventureCampaign(list=[],campaigns=[],adventureId,targetCampaignId){
 const source=adventureById(list,adventureId),targetId=text(targetCampaignId),all=arr(campaigns).map(sanitizeCampaign),destination=all.find(c=>c.id===targetId);
 if(!source)return{ok:false,reason:'Aventura não encontrada.'};
 if(!destination)return{ok:false,reason:'Campanha de destino não encontrada.'};
 if(source.campaignId===targetId)return{ok:true,list:arr(list).map(sanitizeAdventure),campaigns:all,adventure:source,previousCampaignId:source.campaignId,changed:false};
 const sourceCampaignId=source.campaignId,members=arr(destination.members).filter(m=>m.active!==false),allowedUsers=new Set(members.map(m=>text(m.username).toLowerCase())),allowedCharacters=new Set(members.map(m=>text(m.characterId)).filter(Boolean)),allowedNpcs=new Set(arr(destination.npcs).map(n=>text(n.id))),allowedLocations=new Set(arr(destination.locations).map(l=>text(l.id))),sceneIds=new Set(source.scenes.map(s=>s.id));
 // Campanhas possuem elencos e sessões próprios; o conteúdo narrativo continua sendo da Aventura.
 const newOrder=arr(list).filter(a=>a.campaignId===targetId).reduce((max,a)=>Math.max(max,Number(a.order)||1),0)+1;
 const moved=sanitizeAdventure({...source,campaignId:targetId,order:newOrder,updatedAt:now(),
  participantUsernames:source.participantUsernames.filter(u=>allowedUsers.has(u)),
  characterIds:source.characterIds.filter(id=>allowedCharacters.has(id)),
   participantAssignments:source.participantAssignments?.filter(row=>allowedUsers.has(row.username)).map(row=>({...row,characterId:allowedCharacters.has(row.characterId)?row.characterId:null}))??null,
  npcIds:source.npcIds.filter(id=>allowedNpcs.has(id)),
  locationIds:source.locationIds.filter(id=>allowedLocations.has(id)),
  legacyNpcs:[],legacyLocations:[],
  exploration:{...source.exploration,areas:source.exploration.areas.map(area=>({...area,locationId:allowedLocations.has(area.locationId)?area.locationId:null,npcIds:area.npcIds.filter(id=>allowedNpcs.has(id))})),history:source.exploration.history.map(event=>({...event,sessionId:null}))},
  scenes:source.scenes.map(scene=>({...scene,sessionId:null,sessionSceneId:null,encounterRef:{sessionId:null,encounterId:null},locationId:allowedLocations.has(scene.locationId)?scene.locationId:null,npcIds:scene.npcIds.filter(id=>allowedNpcs.has(id))})),
  clues:source.clues.map(clue=>({...clue,npcId:allowedNpcs.has(clue.npcId)?clue.npcId:null,locationId:allowedLocations.has(clue.locationId)?clue.locationId:null,discoveredByCharacterId:allowedCharacters.has(clue.discoveredByCharacterId)?clue.discoveredByCharacterId:null,discoveredSessionId:null})),
  handouts:source.handouts.map(handout=>({...handout,revealedSessionId:null})),
  treasures:source.treasures.map(treasure=>({...treasure,locationId:allowedLocations.has(treasure.locationId)?treasure.locationId:null,recipientCharacterId:allowedCharacters.has(treasure.recipientCharacterId)?treasure.recipientCharacterId:null})),
  missions:source.missions.map(mission=>({...mission,characterIds:mission.characterIds.filter(id=>allowedCharacters.has(id))})),
  timelineEvents:source.timelineEvents.map(event=>({...event,sessionId:null}))
 });
 const nextCampaigns=all.map(campaign=>{
  if(campaign.id!==sourceCampaignId)return campaign;
  let changed=false;
  const sessions=campaign.sessions.map(session=>{
   const linked=session.adventureId===source.id;
   const scenes=session.scenes.map(scene=>sceneIds.has(scene.adventureSceneId)?{...scene,adventureSceneId:null}:scene);
   if(!linked&&!scenes.some((scene,i)=>scene!==session.scenes[i]))return session;
   changed=true;return{...session,adventureId:linked?null:session.adventureId,scenes,updatedAt:now()}
  });
  return changed?sanitizeCampaign({...campaign,sessions,updatedAt:now()}):campaign
 });
 return{ok:true,list:arr(list).map(row=>text(row.id)===source.id?moved:sanitizeAdventure(row)),campaigns:nextCampaigns,adventure:moved,previousCampaignId:sourceCampaignId,changed:true}
}
export function removeAdventure(list=[],adventureId){const id=text(adventureId),base=arr(list).map(sanitizeAdventure),next=base.filter(x=>x.id!==id);return next.length===base.length?{ok:false,reason:'Aventura não encontrada.',list:base}:{ok:true,list:next}}
export function removeAdventuresForCampaign(list=[],campaignId){const id=text(campaignId);return arr(list).map(sanitizeAdventure).filter(x=>x.campaignId!==id)}
function timeline(adventure,title,type='note',refs={}){adventure.timelineEvents.unshift(sanitizeTimeline({title,type,text:refs.text||'',sessionId:refs.sessionId,sceneId:refs.sceneId,missionId:refs.missionId,automatic:refs.automatic===true,at:now()}))}
function mutate(list,adventureId,fn){const adventure=adventureById(list,adventureId);if(!adventure)return{ok:false,reason:'Aventura não encontrada.',list:arr(list).map(sanitizeAdventure)};const value=fn(adventure);if(value?.ok===false)return{...value,list:arr(list).map(sanitizeAdventure)};adventure.updatedAt=now();const clean=sanitizeAdventure(adventure);return{ok:true,list:arr(list).map(row=>row.id===clean.id?clean:sanitizeAdventure(row)),adventure:clean,...(value||{})}}
function addEntity(list,adventureId,key,data,sanitizer,prefix){return mutate(list,adventureId,adventure=>{const entity=sanitizer({...data,id:data?.id||uid(prefix),createdAt:now(),updatedAt:now()},adventure[key].length);adventure[key].push(entity);return{entity}})}
export const addAdventureChapter=(list,id,data={})=>addEntity(list,id,'chapters',data,sanitizeChapter,'chapter');
export const addAdventureClue=(list,id,data={})=>addEntity(list,id,'clues',data,sanitizeClue,'clue');
export const addAdventureHandout=(list,id,data={})=>addEntity(list,id,'handouts',data,sanitizeHandout,'material');
export const addAdventureTreasure=(list,id,data={})=>addEntity(list,id,'treasures',data,sanitizeTreasure,'treasure');
export const addAdventureMission=(list,id,data={})=>addEntity(list,id,'missions',data,sanitizeMission,'mission');
export const addAdventureMonster=(list,id,data={})=>addEntity(list,id,'monsters',data,sanitizeAdventureMonster,'monster');
export const addAdventureScene=(list,id,data={})=>addEntity(list,id,'scenes',data,sanitizeScene,'scene');
export function addAdventureTimelineEntry(list,id,data={}){return addEntity(list,id,'timelineEvents',{...data,automatic:false,at:data.at||now()},sanitizeTimeline,'event')}
export function addAdventureNpc(list,id,data={}){return mutate(list,id,adventure=>{const entity=sanitizeLegacyNpc({...data,id:data.id||uid('npc')});adventure.legacyNpcs.push(entity);adventure.npcIds=uniq([...adventure.npcIds,entity.id]);return{entity}})}
export function addAdventureLocation(list,id,data={}){return mutate(list,id,adventure=>{const entity=sanitizeLegacyLocation({...data,id:data.id||uid('location')});adventure.legacyLocations.push(entity);adventure.locationIds=uniq([...adventure.locationIds,entity.id]);return{entity}})}
export function updateAdventureEntity(list,adventureId,key,entityId,patch={}){
 const aliases={npcs:'legacyNpcs',locations:'legacyLocations'},actual=aliases[key]||key,sanitizers={chapters:sanitizeChapter,scenes:sanitizeScene,clues:sanitizeClue,handouts:sanitizeHandout,treasures:sanitizeTreasure,missions:sanitizeMission,monsters:sanitizeAdventureMonster,timelineEvents:sanitizeTimeline,legacyNpcs:sanitizeLegacyNpc,legacyLocations:sanitizeLegacyLocation},sanitize=sanitizers[actual];
 if(!sanitize)return{ok:false,reason:'Coleção de aventura inválida.',list:arr(list).map(sanitizeAdventure)};
 return mutate(list,adventureId,adventure=>{const index=adventure[actual].findIndex(x=>x.id===text(entityId));if(index<0)return{ok:false,reason:'Registro não encontrado.'};const old=adventure[actual][index];adventure[actual][index]=sanitize({...old,...patch,id:old.id,createdAt:old.createdAt,updatedAt:now()},index);return{entity:adventure[actual][index]}})
}
export function removeAdventureEntity(list,adventureId,key,entityId){
 const aliases={npcs:'legacyNpcs',locations:'legacyLocations'},actual=aliases[key]||key,id=text(entityId);
 return mutate(list,adventureId,adventure=>{if(!['chapters','scenes','clues','handouts','treasures','missions','monsters','timelineEvents','legacyNpcs','legacyLocations'].includes(actual))return{ok:false,reason:'Coleção de aventura inválida.'};const before=adventure[actual].length;adventure[actual]=adventure[actual].filter(x=>x.id!==id);if(before===adventure[actual].length)return{ok:false,reason:'Registro não encontrado.'};
  if(actual==='chapters')for(const scene of adventure.scenes)if(scene.chapterId===id)scene.chapterId=null;
  if(actual==='legacyLocations'){adventure.locationIds=adventure.locationIds.filter(x=>x!==id);for(const scene of adventure.scenes)if(scene.locationId===id)scene.locationId=null}
  if(actual==='legacyNpcs'){adventure.npcIds=adventure.npcIds.filter(x=>x!==id);for(const scene of adventure.scenes)scene.npcIds=scene.npcIds.filter(x=>x!==id)}
  if(actual==='clues')for(const scene of adventure.scenes)scene.clueIds=scene.clueIds.filter(x=>x!==id);
  if(actual==='handouts')for(const scene of adventure.scenes)scene.handoutIds=scene.handoutIds.filter(x=>x!==id);
  if(actual==='treasures')for(const scene of adventure.scenes)scene.treasureIds=scene.treasureIds.filter(x=>x!==id);
  if(actual==='missions')for(const scene of adventure.scenes)scene.missionIds=scene.missionIds.filter(x=>x!==id);
  if(actual==='monsters')for(const scene of adventure.scenes)scene.monsterIds=scene.monsterIds.filter(x=>x!==id);
  if(actual==='scenes'&&adventure.activeSceneId===id)adventure.activeSceneId=null;return{}})
}
export function unlinkAdventureCampaignEntity(list,adventureId,type,entityId){const id=text(entityId);return mutate(list,adventureId,adventure=>{if(type==='npc'){adventure.npcIds=adventure.npcIds.filter(x=>x!==id);for(const scene of adventure.scenes)scene.npcIds=scene.npcIds.filter(x=>x!==id)}else if(type==='location'){adventure.locationIds=adventure.locationIds.filter(x=>x!==id);for(const scene of adventure.scenes)if(scene.locationId===id)scene.locationId=null}else return{ok:false,reason:'Tipo de referência inválido.'};return{}})}
export function startAdventureScene(list,adventureId,sceneId){return mutate(list,adventureId,adventure=>{const scene=adventure.scenes.find(x=>x.id===text(sceneId));if(!scene)return{ok:false,reason:'Cena não encontrada.'};const other=adventure.scenes.find(x=>x.status==='active'&&x.id!==scene.id);if(other)return{ok:false,reason:`Conclua a cena ativa (${other.title}) antes de iniciar outra.`};scene.status='active';scene.updatedAt=now();adventure.status='active';adventure.activeSceneId=scene.id;adventure.currentChapterId=scene.chapterId||adventure.currentChapterId;if(scene.chapterId){const chapter=adventure.chapters.find(x=>x.id===scene.chapterId);if(chapter&&chapter.status==='planned')chapter.status='active'}timeline(adventure,`Cena iniciada: ${scene.title}`,'scene',{sceneId:scene.id,sessionId:scene.sessionId,automatic:true});return{scene}})}
export function completeAdventureScene(list,adventureId,sceneId,patch={}){return mutate(list,adventureId,adventure=>{const scene=adventure.scenes.find(x=>x.id===text(sceneId));if(!scene)return{ok:false,reason:'Cena não encontrada.'};Object.assign(scene,patch,{status:'completed',updatedAt:now()});if(adventure.activeSceneId===scene.id)adventure.activeSceneId=null;timeline(adventure,`Cena concluída: ${scene.title}`,'scene',{sceneId:scene.id,sessionId:scene.sessionId,text:scene.outcome,automatic:true});return{scene}})}
export function skipAdventureScene(list,adventureId,sceneId){return mutate(list,adventureId,adventure=>{const scene=adventure.scenes.find(x=>x.id===text(sceneId));if(!scene)return{ok:false,reason:'Cena não encontrada.'};scene.status='skipped';scene.updatedAt=now();if(adventure.activeSceneId===scene.id)adventure.activeSceneId=null;timeline(adventure,`Cena ignorada: ${scene.title}`,'scene',{sceneId:scene.id,sessionId:scene.sessionId,automatic:true});return{scene}})}
export function setAdventureClueStatus(list,adventureId,clueId,status){if(!CLUE_ST.has(status))return{ok:false,reason:'Status de pista inválido.',list:arr(list).map(sanitizeAdventure)};return mutate(list,adventureId,adventure=>{const clue=adventure.clues.find(x=>x.id===text(clueId));if(!clue)return{ok:false,reason:'Pista não encontrada.'};const before=clue.status;clue.status=status;clue.updatedAt=now();if(before!==status&&status!=='hidden')timeline(adventure,`Pista ${status==='discovered'?'descoberta':'resolvida'}: ${clue.title}`,'clue',{automatic:true});return{entity:clue}})}
export function setAdventureHandoutRevealed(list,adventureId,handoutId,revealed=true){return mutate(list,adventureId,adventure=>{const item=adventure.handouts.find(x=>x.id===text(handoutId));if(!item)return{ok:false,reason:'Material não encontrado.'};const before=item.revealed;item.revealed=!!revealed;item.updatedAt=now();if(!before&&item.revealed)timeline(adventure,`Material revelado: ${item.title}`,'material',{sessionId:item.revealedSessionId,sceneId:item.sceneId,automatic:true});return{entity:item}})}
export function setAdventureTreasureStatus(list,adventureId,treasureId,status){if(!TREASURE_ST.has(status))return{ok:false,reason:'Status de tesouro inválido.',list:arr(list).map(sanitizeAdventure)};return mutate(list,adventureId,adventure=>{const item=adventure.treasures.find(x=>x.id===text(treasureId));if(!item)return{ok:false,reason:'Tesouro não encontrado.'};const before=item.status;item.status=status;item.updatedAt=now();if(before!==status&&status!=='planned')timeline(adventure,`Tesouro ${status==='found'?'encontrado':'distribuído'}: ${item.name}`,'treasure',{sceneId:item.sceneId,automatic:true});return{entity:item}})}
export function setAdventureMissionStatus(list,adventureId,missionId,status){if(!MISSION_ST.has(status))return{ok:false,reason:'Status de missão inválido.',list:arr(list).map(sanitizeAdventure)};return mutate(list,adventureId,adventure=>{const mission=adventure.missions.find(x=>x.id===text(missionId));if(!mission)return{ok:false,reason:'Missão não encontrada.'};const before=mission.status;mission.status=status;mission.updatedAt=now();if(before!==status&&status!=='hidden')timeline(adventure,`Missão atualizada: ${mission.title} · ${status}`,'mission',{missionId:mission.id,automatic:true});return{entity:mission}})}
export function linkSceneToSession(list,adventureId,sceneId,sessionId){return updateAdventureEntity(list,adventureId,'scenes',sceneId,{sessionId:text(sessionId)||null})}
export function linkAdventureSceneToSessionScene(list,adventureId,sceneId,{sessionId=null,sessionSceneId=null}={}){return updateAdventureEntity(list,adventureId,'scenes',sceneId,{sessionId:text(sessionId)||null,sessionSceneId:text(sessionSceneId)||null})}
export function linkSceneToEncounter(list,adventureId,sceneId,{sessionId,encounterId}={}){const sid=text(sessionId),eid=text(encounterId);return updateAdventureEntity(list,adventureId,'scenes',sceneId,{sessionId:sid||null,encounterRef:{sessionId:sid||null,encounterId:eid||null}})}
export function adventureContextForSession(list=[],campaignId,sessionId){const cid=text(campaignId),sid=text(sessionId);return adventuresForCampaign(list,cid).flatMap(adventure=>adventure.scenes.filter(scene=>scene.sessionId===sid||scene.encounterRef?.sessionId===sid).map(scene=>({adventureId:adventure.id,adventureTitle:adventure.title,adventureStatus:adventure.status,scene})))}
