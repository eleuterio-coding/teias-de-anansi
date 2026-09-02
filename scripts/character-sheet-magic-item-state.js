import{applyCampaignInventoryRows,inventoryRowKey}from'./character-sheet-inventory-rules.js';

const bool=value=>value===true;
const cleanKey=value=>String(value||'').trim();
const uniq=values=>[...new Set(values.filter(Boolean))];
const abilityMod=value=>Math.floor((Number(value||0)-10)/2);
const magicSlug=row=>String(row?.refId||'').trim().toLowerCase().split(':').pop();
const magicBonus=row=>{
 const explicit=Number(row?.magicBonus??row?.variantBonus);
 if([1,2,3].includes(explicit))return explicit;
 if(magicSlug(row)==='armor-1-2-or-3')return 0;
 const text=`${row?.name||''} ${row?.refId||''}`;
 const match=text.match(/(?:\+|plus[- ]?)([123])\b/i);
 return match?Number(match[1]):0
};

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

export function magicItemPersistentOutcome(character,baseRows=[]){
 const outcome={abilityMinimums:{},acBonus:0,resistances:[],immunities:[],vulnerabilities:[],applied:[],pending:[]};
 for(const usage of activeMagicItemUsages(character,baseRows)){
  const row=usage.row,id=magicSlug(row);
  if(id==='amulet-of-health'){
   if(!(usage.equipped&&usage.attuned))continue;
   outcome.abilityMinimums.Constituição=Math.max(19,Number(outcome.abilityMinimums.Constituição||0));
   outcome.applied.push({id,effect:'constitution-minimum',value:19});continue
  }
  if(id==='armor-1-2-or-3'||/^armor-(?:plus-)?[123]$/.test(id)){
   if(!usage.equipped)continue;
   const bonus=magicBonus(row);
   if(!bonus){outcome.pending.push({id,reason:'A variante +1/+2/+3 da armadura não está registrada no estado do item.'});continue}
   outcome.acBonus+=bonus;outcome.applied.push({id,effect:'ac-bonus',value:bonus});continue
  }
  if(id==='armor-of-resistance'){
   if(!(usage.equipped&&usage.attuned))continue;
   const damageType=String(row?.damageType||row?.magicDamageType||'').trim();
   if(!damageType){outcome.pending.push({id,reason:'O tipo de dano escolhido pelo Mestre ainda não está registrado no estado do item.'});continue}
   outcome.resistances.push(damageType);outcome.applied.push({id,effect:'resistance',value:damageType});continue
  }
  if(id==='armor-of-invulnerability'){
   if(!(usage.equipped&&usage.attuned))continue;
   outcome.resistances.push('Concussão','Perfurante','Cortante');
   outcome.applied.push({id,effect:'resistance',value:['Concussão','Perfurante','Cortante']})
  }
 }
 outcome.resistances=uniq(outcome.resistances);outcome.immunities=uniq(outcome.immunities);outcome.vulnerabilities=uniq(outcome.vulnerabilities);
 return outcome
}

export function applyMagicItemPersistentEffects(derived,character,baseRows=[]){
 if(!derived)return derived;
 const outcome=magicItemPersistentOutcome(character,baseRows),oldCon=Number(derived.scores?.Constituição||0),minCon=Number(outcome.abilityMinimums.Constituição||0);
 if(minCon&&oldCon<minCon&&derived.scores){
  const delta=abilityMod(minCon)-abilityMod(oldCon);derived.scores.Constituição=minCon;
  if(Number.isFinite(Number(derived.hp)))derived.hp=Number(derived.hp)+Math.max(0,Number(derived.level||0))*delta;
  if(derived.barbarianMechanics?.unarmoredDefense&&Number.isFinite(Number(derived.ac)))derived.ac=Number(derived.ac)+delta
 }
 if(outcome.acBonus&&Number.isFinite(Number(derived.ac)))derived.ac=Number(derived.ac)+outcome.acBonus;
 derived.resistances=uniq([...(derived.resistances||[]),...outcome.resistances]);
 derived.immunities=uniq([...(derived.immunities||[]),...outcome.immunities]);
 derived.vulnerabilities=uniq([...(derived.vulnerabilities||[]),...outcome.vulnerabilities]);
 derived.magicItemMechanics=outcome;return derived
}
