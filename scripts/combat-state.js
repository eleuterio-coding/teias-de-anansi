import{applyDamageDefenses}from'./character-sheet-resolution-rules.js?v=20260902-resolution1';

export const COMBAT_SCHEMA='hub-rpg/combat/v1';
export const COMBAT_STATUS=Object.freeze(['draft','active','completed','cancelled']);
export const COMBATANT_KINDS=Object.freeze(['character','monster','npc']);
export const CONDITION_DURATIONS=Object.freeze(['manual','rounds','start-turn','end-turn']);
const STATUS=new Set(COMBAT_STATUS),KINDS=new Set(COMBATANT_KINDS),DURATIONS=new Set(CONDITION_DURATIONS);
const arr=v=>Array.isArray(v)?v:[];
const text=v=>String(v??'').trim();
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const now=()=>new Date().toISOString();
const uid=prefix=>globalThis.crypto?.randomUUID?.()||`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
const uniq=v=>[...new Set(arr(v).map(text).filter(Boolean))];
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const saves=value=>{const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};return Object.fromEntries(Object.entries(source).filter(([,v])=>Number.isFinite(Number(v))).map(([k,v])=>[text(k),Number(v)]))};
const actions=value=>arr(value).map(row=>({id:text(row?.id)||uid('action'),name:text(row?.name)||'Ação',attackBonus:Number.isFinite(Number(row?.attackBonus))?Number(row.attackBonus):null,damage:text(row?.damage),damageType:text(row?.damageType),saveAbility:text(row?.saveAbility),saveDc:Number.isFinite(Number(row?.saveDc))?Number(row.saveDc):null,notes:String(row?.notes??'')}));

export function sanitizeCombatCondition(row={}){
 if(typeof row==='string')return{id:uid('condition'),name:text(row),duration:'manual',remainingRounds:null,ownerTurnId:null,notes:''};
 const duration=DURATIONS.has(row.duration)?row.duration:'manual';
 return{id:text(row.id)||uid('condition'),name:text(row.name)||'Condição',duration,remainingRounds:duration==='rounds'?Math.max(1,Math.floor(num(row.remainingRounds)||1)):null,ownerTurnId:text(row.ownerTurnId)||null,notes:String(row.notes??'')}
}
function sanitizeConditions(value=[]){return arr(value).map(sanitizeCombatCondition).filter(row=>row.name)}
export function sanitizeCombatant(row={}){
 const kind=KINDS.has(row.kind)?row.kind:'npc',maxHp=Math.max(0,Math.floor(num(row.maxHp))),currentDefault=maxHp||Math.max(0,Math.floor(num(row.currentHp))),currentHp=clamp(Math.floor(num(row.currentHp==null?currentDefault:row.currentHp)),0,Math.max(maxHp,currentDefault));
 return{id:text(row.id)||uid('combatant'),kind,name:text(row.name)||(kind==='character'?'Personagem':kind==='monster'?'Monstro':'NPC'),characterId:kind==='character'?text(row.characterId)||null:null,monsterId:kind==='monster'?text(row.monsterId)||null:null,source:text(row.source),ruleset:text(row.ruleset),initiative:Number.isFinite(Number(row.initiative))?Number(row.initiative):null,initiativeModifier:Number.isFinite(Number(row.initiativeModifier))?Number(row.initiativeModifier):0,groupInitiativeKey:text(row.groupInitiativeKey)||null,ac:Number.isFinite(Number(row.ac))?Math.max(0,Math.floor(Number(row.ac))):null,maxHp,currentHp,tempHp:Math.max(0,Math.floor(num(row.tempHp))),conditions:sanitizeConditions(row.conditions),concentration:row.concentration===true,reactionAvailable:row.reactionAvailable!==false,deathState:kind==='character'&&row.deathState&&typeof row.deathState==='object'?{successes:clamp(Math.floor(num(row.deathState.successes)),0,3),failures:clamp(Math.floor(num(row.deathState.failures)),0,3),stable:!!row.deathState.stable,dead:!!row.deathState.dead}:null,resistances:uniq(row.resistances),immunities:uniq(row.immunities),vulnerabilities:uniq(row.vulnerabilities),conditionImmunities:uniq(row.conditionImmunities),saveModifiers:saves(row.saveModifiers),actions:actions(row.actions),cr:text(row.cr),xp:Math.max(0,Math.floor(num(row.xp))),notes:String(row.notes??''),defeated:row.defeated===true||(maxHp>0&&currentHp===0)}
}
export function sanitizeCombat(row={},index=0){
 const combatants=arr(row.combatants).map(sanitizeCombatant),ids=new Set(combatants.map(c=>c.id)),status=STATUS.has(row.status)?row.status:'draft';let activeCombatantId=text(row.activeCombatantId)||null;if(!ids.has(activeCombatantId))activeCombatantId=null;
 const initiativeOrderIds=uniq(row.initiativeOrderIds).filter(id=>ids.has(id));
 return{schema:COMBAT_SCHEMA,id:text(row.id)||uid('combat'),title:text(row.title)||`Combate ${index+1}`,status,encounterId:text(row.encounterId)||null,sessionSceneId:text(row.sessionSceneId)||null,round:Math.max(1,Math.floor(num(row.round)||1)),activeCombatantId,combatants,initiativeOrderIds,manualInitiativeOrder:row.manualInitiativeOrder===true,notes:String(row.notes??''),outcome:String(row.outcome??''),startedAt:text(row.startedAt)||null,endedAt:text(row.endedAt)||null,createdAt:text(row.createdAt)||now(),updatedAt:text(row.updatedAt)||now()}
}
export function sanitizeCombatList(rows=[]){return arr(rows).map(sanitizeCombat)}
export function sanitizeCombatSessionFields(row={}){
 const combats=sanitizeCombatList(row.combats);let activeCombatId=text(row.activeCombatId)||null;const active=combats.filter(c=>c.status==='active');
 if(activeCombatId&&!combats.some(c=>c.id===activeCombatId&&c.status==='active'))activeCombatId=null;
 if(!activeCombatId&&active.length)activeCombatId=active[0].id;
 for(const combat of combats)if(combat.status==='active'&&combat.id!==activeCombatId)combat.status='draft';
 return{combats,activeCombatId}
}
export function combatById(session,combatId){return sanitizeCombatList(session?.combats).find(c=>c.id===text(combatId))||null}
function result(session,combat){return{ok:true,session,combat}}
export function createCombat(session,data={}){
 if(!session)return{ok:false,reason:'Sessão indisponível.'};const fields=sanitizeCombatSessionFields(session),combat=sanitizeCombat({...data,id:data.id||uid('combat'),createdAt:now(),updatedAt:now()},fields.combats.length);session.combats=[...fields.combats,combat];session.activeCombatId=fields.activeCombatId;return result(session,combat)
}
export function createCombatFromEncounter(session,encounterId,{title}={}){
 const encounter=arr(session?.encounters).find(row=>row.id===text(encounterId));if(!encounter)return{ok:false,reason:'Encontro não encontrado.'};
 const combatants=arr(encounter.combatants).map(row=>sanitizeCombatant({...row,id:uid(row.kind||'combatant'),conditions:arr(row.conditions),reactionAvailable:true,concentration:false}));
 return createCombat(session,{title:text(title)||encounter.title,encounterId:encounter.id,sessionSceneId:encounter.sessionSceneId,combatants})
}
export function updateCombat(session,combatId,patch={}){
 if(!session)return{ok:false,reason:'Sessão indisponível.'};const fields=sanitizeCombatSessionFields(session),index=fields.combats.findIndex(c=>c.id===text(combatId));if(index<0)return{ok:false,reason:'Combate não encontrado.'};const old=fields.combats[index],combat=sanitizeCombat({...old,...patch,id:old.id,createdAt:old.createdAt,updatedAt:now()},index);fields.combats[index]=combat;if(fields.activeCombatId===combat.id&&combat.status!=='active')fields.activeCombatId=null;session.combats=fields.combats;session.activeCombatId=fields.activeCombatId;return result(session,combat)
}
export function removeCombat(session,combatId){
 if(!session)return{ok:false,reason:'Sessão indisponível.'};const fields=sanitizeCombatSessionFields(session),id=text(combatId),before=fields.combats.length;fields.combats=fields.combats.filter(c=>c.id!==id);if(fields.combats.length===before)return{ok:false,reason:'Combate não encontrado.'};if(fields.activeCombatId===id)fields.activeCombatId=null;session.combats=fields.combats;session.activeCombatId=fields.activeCombatId;return{ok:true,session}
}
function numericInitiativeOrder(combat){return arr(combat?.combatants).map(sanitizeCombatant).sort((a,b)=>{const ai=a.initiative==null?-Infinity:a.initiative,bi=b.initiative==null?-Infinity:b.initiative;return bi-ai||b.initiativeModifier-a.initiativeModifier||a.name.localeCompare(b.name,'pt-BR')||a.id.localeCompare(b.id)})}
export function initiativeOrder(combat){
 const rows=arr(combat?.combatants).map(sanitizeCombatant),byId=new Map(rows.map(row=>[row.id,row])),ids=uniq(combat?.initiativeOrderIds).filter(id=>byId.has(id));
 if(!ids.length)return numericInitiativeOrder(combat);
 const ordered=ids.map(id=>byId.get(id)),seen=new Set(ids),missing=rows.filter(row=>!seen.has(row.id));
 return[...ordered,...missing]
}
export function sortCombatInitiative(combat){if(!combat)return[];combat.combatants=numericInitiativeOrder(combat);combat.initiativeOrderIds=combat.combatants.map(c=>c.id);combat.manualInitiativeOrder=false;combat.updatedAt=now();return combat.combatants}
export function setCombatantInitiative(combat,combatantId,value){return updateCombatant(combat,combatantId,{initiative:Number.isFinite(Number(value))?Number(value):null},{sort:!combat?.manualInitiativeOrder})}
export function startCombat(session,combatId){
 if(!session)return{ok:false,reason:'Sessão indisponível.'};const fields=sanitizeCombatSessionFields(session),combat=fields.combats.find(c=>c.id===text(combatId));if(!combat)return{ok:false,reason:'Combate não encontrado.'};const other=fields.combats.find(c=>c.status==='active'&&c.id!==combat.id);if(other)return{ok:false,reason:`Finalize o combate ativo (${other.title}) antes de iniciar outro.`};if(!combat.combatants.length)return{ok:false,reason:'Adicione ao menos um combatente antes de iniciar.'};combat.status='active';combat.round=1;combat.startedAt=combat.startedAt||now();combat.endedAt=null;if(combat.manualInitiativeOrder&&combat.initiativeOrderIds?.length){combat.combatants=initiativeOrder(combat);combat.initiativeOrderIds=combat.combatants.map(c=>c.id)}else sortCombatInitiative(combat);combat.activeCombatantId=combat.combatants[0]?.id||null;if(combat.combatants[0])combat.combatants[0].reactionAvailable=true;combat.updatedAt=now();session.combats=fields.combats;session.activeCombatId=combat.id;return result(session,combat)
}
export function finishCombat(session,combatId,patch={}){
 const current=combatById(session,combatId);if(!current)return{ok:false,reason:'Combate não encontrado.'};const r=updateCombat(session,combatId,{...patch,status:'completed',activeCombatantId:null,endedAt:now()});if(r.ok)session.activeCombatId=null;return r
}
export function cancelCombat(session,combatId){const r=updateCombat(session,combatId,{status:'cancelled',activeCombatantId:null,endedAt:now()});if(r.ok&&session.activeCombatId===combatId)session.activeCombatId=null;return r}
export function addCombatant(combat,data={}){
 if(!combat)return{ok:false,reason:'Combate indisponível.'};if(data.kind==='character'&&data.characterId&&combat.combatants.some(c=>c.kind==='character'&&c.characterId===data.characterId))return{ok:false,reason:'Personagem já está no combate.'};const combatant=sanitizeCombatant({...data,id:data.id||uid(data.kind||'combatant')});combat.combatants.push(combatant);if(combat.initiativeOrderIds?.length)combat.initiativeOrderIds.push(combatant.id);combat.updatedAt=now();return{ok:true,combat,combatant}
}
export function addCombatants(combat,data={},quantity=1,{groupInitiative=false}={}){
 const count=clamp(Math.floor(num(quantity)||1),1,50),groupKey=groupInitiative&&count>1?uid('initiative-group'):null,created=[];for(let i=0;i<count;i++){const name=count>1?`${text(data.name)||'Combatente'} ${i+1}`:data.name,r=addCombatant(combat,{...data,name,groupInitiativeKey:groupKey});if(r.ok)created.push(r.combatant)}return{ok:created.length>0,combat,combatants:created}
}
export function updateCombatant(combat,combatantId,patch={},{sort=false}={}){
 if(!combat)return{ok:false,reason:'Combate indisponível.'};const index=combat.combatants.findIndex(c=>c.id===text(combatantId));if(index<0)return{ok:false,reason:'Combatente não encontrado.'};const old=combat.combatants[index],combatant=sanitizeCombatant({...old,...patch,id:old.id,kind:old.kind,characterId:old.characterId,monsterId:old.monsterId});combat.combatants[index]=combatant;if(sort)sortCombatInitiative(combat);combat.updatedAt=now();return{ok:true,combat,combatant}
}
export function removeCombatant(combat,combatantId){if(!combat)return{ok:false,reason:'Combate indisponível.'};const id=text(combatantId),before=combat.combatants.length;combat.combatants=combat.combatants.filter(c=>c.id!==id);if(combat.combatants.length===before)return{ok:false,reason:'Combatente não encontrado.'};combat.initiativeOrderIds=uniq(combat.initiativeOrderIds).filter(rowId=>rowId!==id);if(combat.activeCombatantId===id)combat.activeCombatantId=initiativeOrder(combat)[0]?.id||null;combat.updatedAt=now();return{ok:true,combat}}
function applyManualOrder(combat,ordered){combat.combatants=ordered;combat.initiativeOrderIds=ordered.map(c=>c.id);combat.manualInitiativeOrder=true;combat.updatedAt=now();return combat}
export function reorderCombatantTo(combat,combatantId,targetId,placement='before'){
 if(!combat)return{ok:false,reason:'Combate indisponível.'};const ordered=initiativeOrder(combat),from=ordered.findIndex(c=>c.id===text(combatantId)),targetOriginal=ordered.findIndex(c=>c.id===text(targetId));if(from<0||targetOriginal<0)return{ok:false,reason:'Combatente não encontrado.'};if(from===targetOriginal)return{ok:true,combat};
 const[row]=ordered.splice(from,1);let target=ordered.findIndex(c=>c.id===text(targetId));if(placement==='after')target+=1;ordered.splice(Math.max(0,target),0,row);applyManualOrder(combat,ordered);return{ok:true,combat}
}
export function reorderCombatant(combat,combatantId,direction=0){if(!combat)return{ok:false,reason:'Combate indisponível.'};const ordered=initiativeOrder(combat),index=ordered.findIndex(c=>c.id===text(combatantId)),target=index+(direction<0?-1:1);if(index<0||target<0||target>=ordered.length)return{ok:false,reason:'Não é possível mover o combatente nessa direção.'};const[row]=ordered.splice(index,1);ordered.splice(target,0,row);applyManualOrder(combat,ordered);return{ok:true,combat}}
export function setGroupInitiative(combat,combatantId,value){const source=combat?.combatants?.find(c=>c.id===text(combatantId));if(!source)return{ok:false,reason:'Combatente não encontrado.'};const ids=source.groupInitiativeKey?combat.combatants.filter(c=>c.groupInitiativeKey===source.groupInitiativeKey).map(c=>c.id):[source.id];for(const id of ids){const row=combat.combatants.find(c=>c.id===id);if(row)row.initiative=Number.isFinite(Number(value))?Number(value):null}if(!combat.manualInitiativeOrder)sortCombatInitiative(combat);combat.updatedAt=now();return{ok:true,combat,count:ids.length}}
function expireTurnConditions(combatant,phase){const before=combatant.conditions.length;combatant.conditions=combatant.conditions.filter(condition=>!(condition.duration===phase&&(!condition.ownerTurnId||condition.ownerTurnId===combatant.id)));return before-combatant.conditions.length}
function tickRoundConditions(combat){for(const c of combat.combatants)c.conditions=c.conditions.filter(condition=>{if(condition.duration!=='rounds')return true;condition.remainingRounds=Math.max(0,Math.floor(num(condition.remainingRounds))-1);return condition.remainingRounds>0})}
function applyStoredOrder(combat){combat.combatants=initiativeOrder(combat);combat.initiativeOrderIds=combat.combatants.map(c=>c.id);return combat.combatants}
export function nextCombatTurn(combat){
 if(!combat?.combatants?.length)return{ok:false,reason:'Combate sem combatentes.'};applyStoredOrder(combat);let index=combat.combatants.findIndex(c=>c.id===combat.activeCombatantId);const previous=index>=0?combat.combatants[index]:null;if(previous)expireTurnConditions(previous,'end-turn');let roundAdvanced=false;if(index<0)index=0;else{index+=1;if(index>=combat.combatants.length){index=0;combat.round=Math.max(1,Math.floor(num(combat.round)||1)+1);roundAdvanced=true;tickRoundConditions(combat)}}const current=combat.combatants[index];current.reactionAvailable=true;expireTurnConditions(current,'start-turn');combat.activeCombatantId=current.id;combat.updatedAt=now();return{ok:true,combat,combatant:current,previous,round:combat.round,roundAdvanced}
}
export function previousCombatTurn(combat){if(!combat?.combatants?.length)return{ok:false,reason:'Combate sem combatentes.'};applyStoredOrder(combat);let index=combat.combatants.findIndex(c=>c.id===combat.activeCombatantId);if(index<0)index=0;else{index-=1;if(index<0){index=combat.combatants.length-1;combat.round=Math.max(1,Math.floor(num(combat.round)||1)-1)}}combat.activeCombatantId=combat.combatants[index].id;combat.updatedAt=now();return{ok:true,combat,combatant:combat.combatants[index],round:combat.round}}
export function addCondition(combat,combatantId,data={}){const row=combat?.combatants?.find(c=>c.id===text(combatantId));if(!row)return{ok:false,reason:'Combatente não encontrado.'};const condition=sanitizeCombatCondition({...data,id:data.id||uid('condition'),ownerTurnId:data.ownerTurnId||row.id});row.conditions.push(condition);combat.updatedAt=now();return{ok:true,combat,combatant:row,condition}}
export function removeCondition(combat,combatantId,conditionId){const row=combat?.combatants?.find(c=>c.id===text(combatantId));if(!row)return{ok:false,reason:'Combatente não encontrado.'};const before=row.conditions.length;row.conditions=row.conditions.filter(c=>c.id!==text(conditionId));if(before===row.conditions.length)return{ok:false,reason:'Condição não encontrada.'};combat.updatedAt=now();return{ok:true,combat,combatant:row}}
export function setConcentration(combat,combatantId,on=true){return updateCombatant(combat,combatantId,{concentration:!!on})}
export function setReactionAvailable(combat,combatantId,on=true){return updateCombatant(combat,combatantId,{reactionAvailable:!!on})}
export function applyCombatDamage(combat,combatantId,amount,{type='',automaticDefenses=true}={}){
 const c=combat?.combatants?.find(row=>row.id===text(combatantId));if(!c)return{ok:false,reason:'Combatente não encontrado.'};const defense=automaticDefenses?applyDamageDefenses(amount,type,c):{rolled:Math.max(0,Math.floor(num(amount))),effective:Math.max(0,Math.floor(num(amount))),multiplier:1,type:text(type)},before={currentHp:c.currentHp,tempHp:c.tempHp},absorbed=Math.min(c.tempHp,defense.effective),remaining=defense.effective-absorbed;c.tempHp-=absorbed;c.currentHp=Math.max(0,c.currentHp-remaining);c.defeated=c.maxHp>0&&c.currentHp===0;combat.updatedAt=now();return{ok:true,...defense,absorbedByTempHp:absorbed,before,after:{currentHp:c.currentHp,tempHp:c.tempHp},combatant:c}
}
export function applyCombatHealing(combat,combatantId,amount){const c=combat?.combatants?.find(row=>row.id===text(combatantId));if(!c)return{ok:false,reason:'Combatente não encontrado.'};const healing=Math.max(0,Math.floor(num(amount))),before=c.currentHp,max=Math.max(c.maxHp,c.currentHp);c.currentHp=Math.min(max,c.currentHp+healing);if(c.currentHp>0)c.defeated=false;combat.updatedAt=now();return{ok:true,rolled:healing,applied:c.currentHp-before,before,after:c.currentHp,combatant:c}}
export function setTemporaryHp(combat,combatantId,value){return updateCombatant(combat,combatantId,{tempHp:Math.max(0,Math.floor(num(value)))})}
export function combatSummary(combat){const c=sanitizeCombat(combat),defeated=c.combatants.filter(x=>x.kind!=='character'&&x.defeated),participants=c.combatants.filter(x=>x.kind==='character');return{title:c.title,status:c.status,rounds:c.round,encounterId:c.encounterId,participants:participants.map(x=>({characterId:x.characterId,name:x.name,currentHp:x.currentHp,maxHp:x.maxHp})),defeated:defeated.map(x=>({monsterId:x.monsterId,name:x.name})),outcome:c.outcome,notes:c.notes,startedAt:c.startedAt,endedAt:c.endedAt}}
