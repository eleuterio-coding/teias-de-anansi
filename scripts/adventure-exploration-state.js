/* Camada genérica de exploração de Aventuras.
   Áreas são unidades persistentes; cenas e sessões são acontecimentos distintos.
   Não contém dados de nenhuma aventura publicada. */
export const EXPLORATION_STATUS=Object.freeze(['unknown','discovered','visited','resolved','blocked']);
export const FACTION_STANCE=Object.freeze(['unknown','friendly','neutral','hostile','allied']);
const text=v=>String(v??'').trim();
const arr=v=>Array.isArray(v)?v:[];
const unique=v=>[...new Set(arr(v).map(text).filter(Boolean))];
const number=(v,fallback=null)=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v):fallback;
const point=v=>{const n=number(v);return n===null?null:Math.max(0,Math.min(100,n))};
const uid=k=>globalThis.crypto?.randomUUID?.()||k+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);
const stamp=(row,k)=>({id:text(row?.id)||uid(k),createdAt:text(row?.createdAt)||new Date().toISOString(),updatedAt:text(row?.updatedAt)||new Date().toISOString()});
const allowedUrl=value=>{const s=text(value);return /^(https?:\/\/[^\s<>"]+|(?:\.\/)?[a-zA-Z0-9_-][a-zA-Z0-9_./%-]*)$/.test(s)&&!s.includes('..')?s:''};
const visible=row=>row?.visibleToPlayers===true;
const status=(v,known,fallback)=>known.includes(v)?v:fallback;
function level(row={},i=0){return {...stamp(row,'level'),name:text(row.name)||'Nível '+(i+1),description:String(row.description??''),type:text(row.type),mapImage:row.mapImage&&typeof row.mapImage==='object'&&text(row.mapImage.id)?{...row.mapImage,id:text(row.mapImage.id)}:null,order:Math.max(1,Math.floor(number(row.order,i+1))),mapUrl:allowedUrl(row.mapUrl),notes:String(row.notes??''),visibleToPlayers:visible(row)}}
function area(row={},i=0){return{...stamp(row,'area'),code:text(row.code),name:text(row.name)||'Área '+(i+1),type:text(row.type),enemies:String(row.enemies??''),treasure:String(row.treasure??''),xp:Math.max(0,number(row.xp,0)),order:Math.max(1,Math.floor(number(row.order,i+1))),levelId:text(row.levelId)||null,parentId:text(row.parentId)||null,locationId:text(row.locationId)||null,chapterId:text(row.chapterId)||null,status:status(row.status,EXPLORATION_STATUS,'unknown'),visibleToPlayers:visible(row),publicDescription:String(row.publicDescription??''),description:String(row.description??''),readAloud:String(row.readAloud??''),features:String(row.features??''),checks:String(row.checks??''),hazards:String(row.hazards??''),outcomes:String(row.outcomes??''),dmNotes:String(row.dmNotes??''),mapX:point(row.mapX),mapY:point(row.mapY),connectionIds:unique(row.connectionIds),npcIds:unique(row.npcIds),monsterIds:unique(row.monsterIds),factionIds:unique(row.factionIds),missionIds:unique(row.missionIds),clueIds:unique(row.clueIds),handoutIds:unique(row.handoutIds),treasureIds:unique(row.treasureIds)}}
function faction(row={},i=0){return{...stamp(row,'faction'),name:text(row.name)||'Facção '+(i+1),stance:status(row.stance,FACTION_STANCE,'unknown'),objective:String(row.objective??''),relationship:String(row.relationship??''),npcIds:unique(row.npcIds),description:String(row.description??''),publicDescription:String(row.publicDescription??''),dmNotes:String(row.dmNotes??''),visibleToPlayers:visible(row),order:Math.max(1,Math.floor(number(row.order,i+1)))}}
function record(row={}){return{...stamp(row,'exploration-event'),areaId:text(row.areaId)||null,sessionId:text(row.sessionId)||null,previousStatus:text(row.previousStatus),status:text(row.status),text:String(row.text??''),at:text(row.at)||new Date().toISOString(),visibleToPlayers:visible(row)}}
const sorted=rows=>rows.sort((a,b)=>a.order-b.order||a.name.localeCompare(b.name,'pt-BR'));
/** Revalida todos os vínculos na leitura e na escrita, sem apagar registros antigos. */
export function normalizeExploration(raw={},references={}){
 const levels=sorted(arr(raw.levels).map(level)),levelIds=new Set(levels.map(x=>x.id));
 const factions=sorted(arr(raw.factions).map(faction)),factionIds=new Set(factions.map(x=>x.id));
 const locations=new Set(arr(references.locationIds)),chapters=new Set(arr(references.chapterIds)),npcs=new Set(arr(references.npcIds)),monsters=new Set(arr(references.monsterIds)),missions=new Set(arr(references.missionIds)),clues=new Set(arr(references.clueIds)),handouts=new Set(arr(references.handoutIds)),treasures=new Set(arr(references.treasureIds));
 for(const f of factions)f.npcIds=f.npcIds.filter(id=>npcs.has(id));
 const areas=sorted(arr(raw.areas).map(area)),areaIds=new Set(areas.map(x=>x.id));
 const byId=new Map(areas.map(x=>[x.id,x]));
 for(const a of areas){
  if(!levelIds.has(a.levelId))a.levelId=null;
  if(!areaIds.has(a.parentId)||a.parentId===a.id||byId.get(a.parentId)?.levelId!==a.levelId)a.parentId=null;
  // Um ciclo na hierarquia não pode travar a navegação.
  const seen=new Set([a.id]);let cursor=a.parentId;
  while(cursor){if(seen.has(cursor)){a.parentId=null;break}seen.add(cursor);cursor=byId.get(cursor)?.parentId||null}
  if(!locations.has(a.locationId))a.locationId=null;
  if(!chapters.has(a.chapterId))a.chapterId=null;
  for(const [key,set] of [['npcIds',npcs],['monsterIds',monsters],['missionIds',missions],['clueIds',clues],['handoutIds',handouts],['treasureIds',treasures],['factionIds',factionIds]])a[key]=a[key].filter(id=>set.has(id));
  a.connectionIds=a.connectionIds.filter(id=>areaIds.has(id)&&id!==a.id)
 }
 const history=arr(raw.history).map(record).map(x=>({...x,areaId:areaIds.has(x.areaId)?x.areaId:null})).sort((a,b)=>b.at.localeCompare(a.at));
 return{levels,areas,factions,history,activeAreaId:areaIds.has(text(raw.activeAreaId))?text(raw.activeAreaId):null}
}
const clone=e=>({levels:arr(e?.levels).map(x=>({...x})),areas:arr(e?.areas).map(x=>({...x})),factions:arr(e?.factions).map(x=>({...x})),history:arr(e?.history).map(x=>({...x})),activeAreaId:text(e?.activeAreaId)||null});
export function createExplorationEntity(exploration,kind,values={}){
 const e=clone(exploration),key=kind==='level'?'levels':kind==='area'?'areas':kind==='faction'?'factions':null;
 if(!key)return null;
 const value=(kind==='level'?level:kind==='area'?area:faction)({...values,id:uid(kind)},e[key].length);
 e[key].push(value);return{exploration:e,entity:value}
}
export function updateExplorationEntity(exploration,kind,id,changes={}){
 const e=clone(exploration),key=kind==='level'?'levels':kind==='area'?'areas':kind==='faction'?'factions':null;
 if(!key)return null;const index=e[key].findIndex(x=>x.id===id);if(index<0)return null;
 const previous=e[key][index],merged={...previous,...changes,id:previous.id,createdAt:previous.createdAt,updatedAt:new Date().toISOString()};
 e[key][index]=(kind==='level'?level:kind==='area'?area:faction)(merged,index);
 return{exploration:e,entity:e[key][index]}
}
export function removeExplorationEntity(exploration,kind,id){
 const e=clone(exploration);
 if(kind==='level'){
  if(e.areas.some(a=>a.levelId===id))return{error:'Mova ou exclua as áreas deste nível primeiro.'};
  e.levels=e.levels.filter(l=>l.id!==id)
 }else if(kind==='area'){
  e.areas=e.areas.filter(a=>a.id!==id).map(a=>({...a,parentId:a.parentId===id?null:a.parentId,connectionIds:arr(a.connectionIds).filter(x=>x!==id)}));
  if(e.activeAreaId===id)e.activeAreaId=null;
  // A crônica é preservada mesmo quando a área deixa de existir.
  e.history=e.history.map(h=>h.areaId===id?{...h,areaId:null}:h)
 }else if(kind==='faction'){
  e.factions=e.factions.filter(f=>f.id!==id);
  e.areas=e.areas.map(a=>({...a,factionIds:arr(a.factionIds).filter(x=>x!==id)}))
 }else return null;
 return{exploration:e}
}
/** Mudança de estado registra um evento auditável, sem concluir automaticamente cenas. */
export function changeAreaStatus(exploration,id,next,{sessionId=null,notes='',visibleToPlayers=false}={}){
 if(!EXPLORATION_STATUS.includes(next))return{error:'Estado de área inválido.'};
 const e=clone(exploration),a=e.areas.find(x=>x.id===id);if(!a)return{error:'Área não encontrada.'};
 const previous=a.status;
 a.status=next;a.updatedAt=new Date().toISOString();
 if(previous!==next||text(notes)){
  const event=record({areaId:id,sessionId,previousStatus:previous,status:next,text:notes,visibleToPlayers});
  e.history.unshift(event);
 }
 return{exploration:e,entity:a}
}
export function explorationProgress(exploration){
 const areas=arr(exploration?.areas),total=areas.length;
 return{total,discovered:areas.filter(a=>a.status!=='unknown').length,visited:areas.filter(a=>['visited','resolved'].includes(a.status)).length,resolved:areas.filter(a=>a.status==='resolved').length}
}

/** Foco de condução independente do status, do fluxo narrativo e dos marcadores. */
export function setCurrentExplorationArea(exploration,id=null){
 const e=clone(exploration),key=text(id);
 if(key&&!e.areas.some(a=>a.id===key))return{error:'Área atual não encontrada.'};
 e.activeAreaId=key||null;return{exploration:e}
}
