import{arr,num,fold}from'./character-builder/state.js';
import{adjustCoinBalanceCp,coinBalanceCp}from'./character-builder/economy-state.js?v=20260901-campaign-inventory1';

export const INVENTORY_MOVEMENTS={buy:'Comprar',sell:'Vender',gain:'Receber',lose:'Perder'};
const ACQUIRE=new Set(['buy','gain']);
const REMOVE=new Set(['sell','lose']);
const cleanQty=value=>Math.max(1,Math.floor(num(value)||1));
const cleanCost=value=>Math.max(0,Math.round(num(value)||0));
const cleanName=value=>String(value||'').trim();

export function inventoryRowKey(row){
 const kind=String(row?.kind||'belonging'),refId=String(row?.refId||'').trim();
 if(refId)return`${kind}|ref:${refId}`;
 return`${kind}|name:${fold(cleanName(row?.name)||'item')}`
}
export function inventoryRowSnapshot(row){return{kind:String(row?.kind||'belonging'),refId:row?.refId||null,name:cleanName(row?.name)||'Item',qty:cleanQty(row?.qty),source:cleanName(row?.source)||'Campanha',area:cleanName(row?.area),category:cleanName(row?.category)}}
function aggregate(rows){const map=new Map();for(const source of arr(rows)){const row=inventoryRowSnapshot(source),key=inventoryRowKey(row),old=map.get(key);if(old)old.qty+=row.qty;else map.set(key,{...row,key})}return[...map.values()]}

export function ensureCampaignInventory(character){
 if(!character)return null;character.sheet=character.sheet||{};
 let campaign=character.sheet.inventoryCampaign;
 if(!campaign||typeof campaign!=='object'||Array.isArray(campaign))campaign={};
 campaign.adjustments=campaign.adjustments&&typeof campaign.adjustments==='object'&&!Array.isArray(campaign.adjustments)?campaign.adjustments:{};
 campaign.items=campaign.items&&typeof campaign.items==='object'&&!Array.isArray(campaign.items)?campaign.items:{};
 campaign.transactions=arr(campaign.transactions).filter(Boolean);
 if(campaign.baseSnapshot&&!Array.isArray(campaign.baseSnapshot))campaign.baseSnapshot=null;
 character.sheet.inventoryCampaign=campaign;return campaign
}

export function campaignInventoryStarted(character){const c=ensureCampaignInventory(character);return!!(c?.frozenAt||c?.transactions?.length)}
export function freezeCampaignInventoryBase(character,baseRows=[]){
 const campaign=ensureCampaignInventory(character);if(!campaign)return null;
 if(!Array.isArray(campaign.baseSnapshot)){campaign.baseSnapshot=aggregate(baseRows).map(row=>inventoryRowSnapshot(row));campaign.frozenAt=new Date().toISOString()}
 return campaign.baseSnapshot
}
function effectiveBaseRows(character,baseRows){const campaign=ensureCampaignInventory(character);return Array.isArray(campaign?.baseSnapshot)?campaign.baseSnapshot:baseRows}

export function applyCampaignInventoryRows(baseRows=[],character){
 const campaign=ensureCampaignInventory(character);if(!campaign)return aggregate(baseRows);
 const map=new Map(aggregate(effectiveBaseRows(character,baseRows)).map(row=>[row.key,row]));
 for(const[key,deltaRaw]of Object.entries(campaign.adjustments)){const delta=Math.trunc(num(deltaRaw));if(!delta)continue;let row=map.get(key);if(!row){const saved=campaign.items[key];if(!saved)continue;row={...inventoryRowSnapshot(saved),qty:0,key};map.set(key,row)}row.qty=Math.max(0,row.qty+delta);if(delta>0&&row.source!=='Campanha')row.campaignDelta=(row.campaignDelta||0)+delta;else if(delta<0)row.campaignDelta=(row.campaignDelta||0)+delta}
 return[...map.values()].filter(row=>row.qty>0).sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'))
}

export function currentInventoryQuantity(baseRows,character,item){const key=inventoryRowKey(item);return applyCampaignInventoryRows(baseRows,character).find(row=>row.key===key)?.qty||0}

export function applyInventoryTransaction(character,baseRows=[],input={}){
 if(!character)return{ok:false,reason:'Personagem indisponível.'};
 const movement=String(input.movement||''),qty=cleanQty(input.qty),item=inventoryRowSnapshot({...input.item,qty:1,source:'Campanha'}),unitCostCp=cleanCost(input.unitCostCp);
 if(!INVENTORY_MOVEMENTS[movement])return{ok:false,reason:'Movimentação inválida.'};
 if(!cleanName(item.name))return{ok:false,reason:'Informe o item.'};
 const beforeRows=applyCampaignInventoryRows(baseRows,character),key=inventoryRowKey(item),beforeQty=beforeRows.find(row=>row.key===key)?.qty||0;
 if(REMOVE.has(movement)&&beforeQty<qty)return{ok:false,reason:`Quantidade insuficiente: há ${beforeQty} no inventário.`};
 const totalCp=unitCostCp*qty,balanceDeltaCp=movement==='buy'?-totalCp:movement==='sell'?totalCp:0,balanceBeforeCp=coinBalanceCp(character);
 if(balanceBeforeCp+balanceDeltaCp<0)return{ok:false,reason:'Saldo insuficiente para esta compra.',balanceBeforeCp};
 freezeCampaignInventoryBase(character,baseRows);const campaign=ensureCampaignInventory(character),delta=ACQUIRE.has(movement)?qty:-qty;
 campaign.items[key]={...item,qty:1};campaign.adjustments[key]=Math.trunc(num(campaign.adjustments[key]))+delta;if(!campaign.adjustments[key])delete campaign.adjustments[key];
 const balance=balanceDeltaCp?adjustCoinBalanceCp(character,balanceDeltaCp):{ok:true,beforeCp:balanceBeforeCp,afterCp:balanceBeforeCp,deltaCp:0};
 const tx={id:`inv-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,at:new Date().toISOString(),movement,item:{...item,qty:1},key,qty,deltaQty:delta,unitCostCp,totalCp,balanceDeltaCp,balanceBeforeCp,balanceAfterCp:balance.afterCp,note:cleanName(input.note)};
 campaign.transactions=[...campaign.transactions,tx];const rows=applyCampaignInventoryRows(baseRows,character);return{ok:true,transaction:tx,rows,balanceBeforeCp,balanceAfterCp:balance.afterCp}
}

export function clearUnavailableActiveEquipment(character,rows=[]){
 const eq=character?.choices?.equipment;if(!eq)return[];const changes=[],available=arr(rows);
 if(eq.weapon&&!available.some(row=>row.kind==='weapon'&&row.refId===eq.weapon)){changes.push('weapon');eq.weapon=null}
 if(eq.armor&&!available.some(row=>row.kind==='armor'&&row.refId===eq.armor)){changes.push('armor');eq.armor=null}
 if(eq.shield&&!available.some(row=>row.kind==='shield')){changes.push('shield');eq.shield=false}
 return changes
}

export function inventoryTransactionHistory(character){return arr(ensureCampaignInventory(character)?.transactions)}
