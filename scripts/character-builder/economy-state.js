export const COINS=['cp','sp','ep','gp','pp'];
export const COIN_FACTORS={cp:1,sp:10,ep:50,gp:100,pp:1000};
const INVENTORY_DEFAULTS={cp:0,sp:0,ep:0,gp:0,pp:0,notes:'',magicItems:'',otherHoldings:''};

export function ensureEconomyInventory(character){
 if(!character)return null;
 character.sheet=character.sheet||{};
 let inv=character.sheet.inventory;
 if(!inv||typeof inv!=='object'||Array.isArray(inv)){
  inv={...INVENTORY_DEFAULTS};character.sheet.inventory=inv;return inv
 }
 for(const[key,value]of Object.entries(INVENTORY_DEFAULTS))if(inv[key]===undefined)inv[key]=value;
 return inv
}

export function coinBalanceCp(character){
 const inv=ensureEconomyInventory(character);if(!inv)return 0;
 return COINS.reduce((total,coin)=>total+Math.max(0,Number(inv[coin])||0)*COIN_FACTORS[coin],0)
}

export function economyMode(character){
 const inv=ensureEconomyInventory(character);return inv?.economyMode==='current'?'current':'creation'
}

export function ensureEconomyMetadata(character){
 const inv=ensureEconomyInventory(character);if(!inv)return null;
 if(inv.economyMode!=='current')inv.economyMode='creation';
 if(!Number.isFinite(Number(inv.creationBalanceCp)))inv.creationBalanceCp=Math.round(coinBalanceCp(character));
 return inv
}

export function creationBalanceCp(character){
 const inv=ensureEconomyMetadata(character);return inv?Math.max(0,Math.round(Number(inv.creationBalanceCp)||0)):0
}

export function markCurrentEconomy(character){
 const inv=ensureEconomyMetadata(character);if(!inv)return null;
 inv.economyMode='current';return inv
}

export function currentCoinSnapshot(character){
 const inv=ensureEconomyInventory(character);if(!inv)return null;
 return Object.fromEntries(COINS.map(coin=>[coin,Math.max(0,Number(inv[coin])||0)]))
}

export function restoreCoinSnapshot(character,snapshot){
 const inv=ensureEconomyInventory(character);if(!inv||!snapshot)return inv;
 for(const coin of COINS)inv[coin]=Math.max(0,Number(snapshot[coin])||0);
 return inv
}

export function setCoinBalanceCp(character,totalCp){
 const inv=ensureEconomyInventory(character);if(!inv)return null;
 let rest=Math.max(0,Math.round(Number(totalCp)||0)),current=currentCoinSnapshot(character),next=Object.fromEntries(COINS.map(coin=>[coin,0]));
 for(const coin of['pp','gp','ep','sp','cp']){const factor=COIN_FACTORS[coin],keep=Math.min(current[coin],Math.floor(rest/factor));next[coin]=keep;rest-=keep*factor}
 for(const coin of['pp','gp','sp','cp']){const factor=COIN_FACTORS[coin],add=Math.floor(rest/factor);next[coin]+=add;rest-=add*factor}
 restoreCoinSnapshot(character,next);return next
}

export function adjustCoinBalanceCp(character,deltaCp){
 const before=coinBalanceCp(character),delta=Math.round(Number(deltaCp)||0),after=before+delta;
 if(after<0)return{ok:false,beforeCp:before,afterCp:before,deltaCp:delta,reason:'Saldo insuficiente.'};
 markCurrentEconomy(character);setCoinBalanceCp(character,after);return{ok:true,beforeCp:before,afterCp:after,deltaCp:delta}
}

export function recordCreationBalanceAndRestoreCurrent(character,currentSnapshot){
 const inv=ensureEconomyMetadata(character);if(!inv||economyMode(character)!=='current'||!currentSnapshot)return false;
 inv.creationBalanceCp=Math.max(0,Math.round(coinBalanceCp(character)));
 restoreCoinSnapshot(character,currentSnapshot);
 return true
}

export function formatBalanceGp(cp){
 const value=Math.max(0,Number(cp)||0)/100;
 return`${value.toLocaleString('pt-BR',{minimumFractionDigits:Number(cp)%100?2:0,maximumFractionDigits:2})} PO`
}
