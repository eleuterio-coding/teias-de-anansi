const COINS=['cp','sp','ep','gp','pp'];
const FACTORS={cp:1,sp:10,ep:50,gp:100,pp:1000};

export function ensureEconomyInventory(character){
 if(!character)return null;
 character.sheet=character.sheet||{};
 character.sheet.inventory={cp:0,sp:0,ep:0,gp:0,pp:0,notes:'',magicItems:'',otherHoldings:'',...(character.sheet.inventory||{})};
 return character.sheet.inventory
}

export function coinBalanceCp(character){
 const inv=ensureEconomyInventory(character);if(!inv)return 0;
 return COINS.reduce((total,coin)=>total+Math.max(0,Number(inv[coin])||0)*FACTORS[coin],0)
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
