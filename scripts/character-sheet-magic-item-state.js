import{applyCampaignInventoryRows,inventoryRowKey}from'./character-sheet-inventory-rules.js';

const bool=value=>value===true;
const cleanKey=value=>String(value||'').trim();

export function ensureMagicItemState(character){
 if(!character)return null;character.sheet=character.sheet||{};
 let state=character.sheet.magicItems;
 if(!state||typeof state!=='object'||Array.isArray(state))state={};
 state.usage=state.usage&&typeof state.usage==='object'&&!Array.isArray(state.usage)?state.usage:{};
 character.sheet.magicItems=state;return state
}

export function magicItemUsage(character,item){
 const state=ensureMagicItemState(character),key=inventoryRowKey(item),saved=state?.usage?.[key];
 return{key,equipped:bool(saved?.equipped),attuned:bool(saved?.attuned)}
}

export function activeMagicItemUsages(character,baseRows=[]){
 const state=ensureMagicItemState(character);if(!state)return[];
 const available=new Map(applyCampaignInventoryRows(baseRows,character).map(row=>[row.key,row]));
 const active=[];
 for(const[key,saved]of Object.entries(state.usage)){
  const row=available.get(key);if(!row)continue;
  const equipped=bool(saved?.equipped),attuned=bool(saved?.attuned);
  if(equipped||attuned)active.push({key,row,equipped,attuned})
 }
 return active
}

export function setMagicItemUsage(character,baseRows=[],item,input={}){
 if(!character)return{ok:false,reason:'Personagem indisponível.'};
 const key=inventoryRowKey(item),available=applyCampaignInventoryRows(baseRows,character).find(row=>row.key===key);
 if(!available)return{ok:false,reason:'O item não está disponível no inventário atual.',key};
 const state=ensureMagicItemState(character),equipped=bool(input.equipped),attuned=bool(input.attuned);
 if(!equipped&&!attuned){delete state.usage[key];return{ok:true,key,equipped:false,attuned:false,row:available}}
 state.usage[key]={equipped,attuned,updatedAt:new Date().toISOString()};
 return{ok:true,key,equipped,attuned,row:available}
}

export function clearUnavailableMagicItemUsages(character,baseRows=[]){
 const state=ensureMagicItemState(character);if(!state)return[];
 const available=new Set(applyCampaignInventoryRows(baseRows,character).map(row=>cleanKey(row.key)));
 const cleared=[];
 for(const key of Object.keys(state.usage))if(!available.has(cleanKey(key))){delete state.usage[key];cleared.push(key)}
 return cleared
}
