import{sanitizeAdventure}from'./adventure-state.js?v=20260922-adventure-workspace2';
import{sanitizeCampaign}from'./campaign-state.js?v=20260922-adventure-workspace2';
const arr=v=>Array.isArray(v)?v:[];
const text=v=>String(v??'').trim();
export function migrateLegacyAdventureEntities(list=[],campaign=null){
 const cleanCampaign=campaign?sanitizeCampaign(campaign):null;if(!cleanCampaign)return{list:arr(list).map(sanitizeAdventure),campaign:null,changed:false};
 const npcIds=new Set(arr(cleanCampaign.npcs).map(x=>text(x.id))),locationIds=new Set(arr(cleanCampaign.locations).map(x=>text(x.id)));let changed=false;
 const next=arr(list).map(raw=>{const adventure=sanitizeAdventure(raw);if(adventure.campaignId!==cleanCampaign.id)return adventure;
  for(const npc of adventure.legacyNpcs){if(!npcIds.has(npc.id)){cleanCampaign.npcs.push({...npc});npcIds.add(npc.id);changed=true}}
  for(const location of adventure.legacyLocations){if(!locationIds.has(location.id)){cleanCampaign.locations.push({...location});locationIds.add(location.id);changed=true}}
  if(adventure.legacyNpcs.length||adventure.legacyLocations.length){adventure.legacyNpcs=[];adventure.legacyLocations=[];changed=true}
  return sanitizeAdventure(adventure)
 });
 return{list:next,campaign:cleanCampaign,changed}
}
export function reconcileAdventureCampaignRefs(list=[],campaign=null){
 const migrated=migrateLegacyAdventureEntities(list,campaign),cleanCampaign=migrated.campaign,campaignId=text(cleanCampaign?.id);if(!campaignId)return{list:migrated.list,campaign:cleanCampaign,changed:migrated.changed};
 const sessions=new Map(arr(cleanCampaign.sessions).map(session=>[text(session.id),new Set(arr(session.encounters).map(encounter=>text(encounter.id)).filter(Boolean))])),campaignNpcIds=new Set(arr(cleanCampaign.npcs).map(x=>text(x.id))),campaignLocationIds=new Set(arr(cleanCampaign.locations).map(x=>text(x.id)));let changed=migrated.changed;
 const next=migrated.list.map(raw=>{let adventure=sanitizeAdventure(raw);if(adventure.campaignId!==campaignId)return adventure;
  const npcIds=adventure.npcIds.filter(id=>campaignNpcIds.has(id)),locationIds=adventure.locationIds.filter(id=>campaignLocationIds.has(id));if(npcIds.length!==adventure.npcIds.length||locationIds.length!==adventure.locationIds.length){adventure.npcIds=npcIds;adventure.locationIds=locationIds;changed=true}
  const npcSet=new Set(npcIds),locationSet=new Set(locationIds);
  for(const scene of adventure.scenes){
   if(scene.locationId&&!locationSet.has(scene.locationId)){scene.locationId=null;changed=true}
   const validNpcIds=scene.npcIds.filter(id=>npcSet.has(id));if(validNpcIds.length!==scene.npcIds.length){scene.npcIds=validNpcIds;changed=true}
   const sessionId=text(scene.sessionId),refSessionId=text(scene.encounterRef?.sessionId),encounterId=text(scene.encounterRef?.encounterId);
   if(sessionId&&!sessions.has(sessionId)){scene.sessionId=null;if(refSessionId===sessionId||!refSessionId)scene.encounterRef={sessionId:null,encounterId:null};changed=true;continue}
   if(refSessionId&&!sessions.has(refSessionId)){scene.encounterRef={sessionId:null,encounterId:null};changed=true;continue}
   if(encounterId){const ownerSessionId=refSessionId||sessionId,encounters=sessions.get(ownerSessionId);if(!ownerSessionId||!encounters?.has(encounterId)){scene.encounterRef={sessionId:ownerSessionId||null,encounterId:null};changed=true}}
   if(scene.encounterRef?.sessionId&&scene.sessionId!==scene.encounterRef.sessionId){scene.sessionId=scene.encounterRef.sessionId;changed=true}
  }
  adventure=sanitizeAdventure(adventure);return adventure
 });
 return{list:next,campaign:cleanCampaign,changed}
}