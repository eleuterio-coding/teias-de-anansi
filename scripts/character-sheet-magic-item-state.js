import{applyCampaignInventoryRows,inventoryRowKey}from'./character-sheet-inventory-rules.js';

const bool=value=>value===true;
const cleanKey=value=>String(value||'').trim();
const uniq=values=>[...new Set(values.filter(Boolean))];
const abilityMod=value=>Math.floor((Number(value||0)-10)/2);
const magicSlug=row=>String(row?.refId||'').trim().toLowerCase().split(':').pop();
const DAMAGE_TYPES=['Ácido','Frio','Fogo','Força','Elétrico','Necrótico','Veneno','Psíquico','Radiante','Trovejante','Concussão','Perfurante','Cortante'];
const PHYSICAL_DAMAGE_TYPES=['Concussão','Perfurante','Cortante'];
const cleanDamageType=value=>DAMAGE_TYPES.find(type=>type.toLocaleLowerCase('pt-BR')===String(value||'').trim().toLocaleLowerCase('pt-BR'))||null;
const magicBonus=(row,parameters={})=>{
 const explicit=Number(parameters.magicBonus??row?.magicBonus??row?.variantBonus);
 if([1,2,3].includes(explicit))return explicit;
 if(['armor-1-2-or-3','ammunition-1-2-or-3'].includes(magicSlug(row)))return 0;
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
 return{key,equipped:bool(saved?.equipped),attuned:bool(saved?.attuned),parameters:{...(saved?.parameters||{})}}
}

export function activeMagicItemUsages(character,baseRows=[]){
 const state=ensureMagicItemState(character);if(!state)return[];
 const available=new Map(applyCampaignInventoryRows(baseRows,character).map(row=>[row.key,row]));
 const active=[];
 for(const[key,saved]of Object.entries(state.usage)){
  const row=available.get(key);if(!row)continue;
  const equipped=bool(saved?.equipped),attuned=bool(saved?.attuned),parameters={...(saved?.parameters||{})};
  if(equipped||attuned)active.push({key,row,equipped,attuned,parameters})
 }
 return active
}

export function validateMagicItemParameters(item,input={}){
 const id=magicSlug(item),parameters={};
 if(id==='armor-1-2-or-3'||id==='ammunition-1-2-or-3'){
  const bonus=Number(input.magicBonus);
  if(![1,2,3].includes(bonus))return{ok:false,reason:id==='armor-1-2-or-3'?'Selecione explicitamente a variante +1, +2 ou +3 da armadura.':'Selecione explicitamente a variante +1, +2 ou +3 da munição.'};
  parameters.magicBonus=bonus
 }
 if(id==='armor-of-resistance'){
  const damageType=cleanDamageType(input.damageType);
  if(!damageType||PHYSICAL_DAMAGE_TYPES.includes(damageType))return{ok:false,reason:'Selecione um tipo de dano válido da tabela da Armadura de Resistência.'};
  parameters.damageType=damageType
 }
 if(id==='armor-of-vulnerability'){
  const damageType=cleanDamageType(input.damageType);
  if(!damageType||!PHYSICAL_DAMAGE_TYPES.includes(damageType))return{ok:false,reason:'Selecione Concussão, Perfurante ou Cortante para a Armadura da Vulnerabilidade.'};
  parameters.damageType=damageType
 }
 return{ok:true,parameters}
}

export function setMagicItemUsage(character,baseRows=[],item,input={}){
 if(!character)return{ok:false,reason:'Personagem indisponível.'};
 const key=inventoryRowKey(item),available=applyCampaignInventoryRows(baseRows,character).find(row=>row.key===key);
 if(!available)return{ok:false,reason:'O item não está disponível no inventário atual.',key};
 const state=ensureMagicItemState(character),equipped=bool(input.equipped),attuned=bool(input.attuned),previous=state.usage[key]||{};
 let parameters={...(previous.parameters||{})};
 if(input.parameters!=null){const validated=validateMagicItemParameters(available,input.parameters);if(!validated.ok)return{ok:false,reason:validated.reason,key};parameters=validated.parameters}
 if(!equipped&&!attuned){delete state.usage[key];return{ok:true,key,equipped:false,attuned:false,parameters:{},row:available}}
 state.usage[key]={equipped,attuned,parameters,updatedAt:new Date().toISOString()};
 return{ok:true,key,equipped,attuned,parameters,row:available}
}

export function setMagicItemParameters(character,baseRows=[],item,parameters={}){
 if(!character)return{ok:false,reason:'Personagem indisponível.'};
 const key=inventoryRowKey(item),available=applyCampaignInventoryRows(baseRows,character).find(row=>row.key===key);
 if(!available)return{ok:false,reason:'O item não está disponível no inventário atual.',key};
 const validated=validateMagicItemParameters(available,parameters);if(!validated.ok)return{ok:false,reason:validated.reason,key};
 const state=ensureMagicItemState(character),previous=state.usage[key]||{};
 state.usage[key]={equipped:bool(previous.equipped),attuned:bool(previous.attuned),parameters:validated.parameters,updatedAt:new Date().toISOString()};
 return{ok:true,key,parameters:validated.parameters}
}

export function clearUnavailableMagicItemUsages(character,baseRows=[]){
 const state=ensureMagicItemState(character);if(!state)return[];
 const available=new Set(applyCampaignInventoryRows(baseRows,character).map(row=>cleanKey(row.key)));
 const cleared=[];
 for(const key of Object.keys(state.usage))if(!available.has(cleanKey(key))){delete state.usage[key];cleared.push(key)}
 return cleared
}

export function magicItemPersistentOutcome(character,baseRows=[]){
 const outcome={abilityMinimums:{},acBonus:0,resistances:[],immunities:[],vulnerabilities:[],flags:{},conditionalAttackBonuses:[],conditionalDamageBonuses:[],applied:[],pending:[]};
 for(const usage of activeMagicItemUsages(character,baseRows)){
  const row=usage.row,id=magicSlug(row),parameters=usage.parameters||{};
  if(id==='amulet-of-health'){
   if(!(usage.equipped&&usage.attuned))continue;
   outcome.abilityMinimums.Constituição=Math.max(19,Number(outcome.abilityMinimums.Constituição||0));
   outcome.applied.push({id,effect:'constitution-minimum',value:19});continue
  }
  if(id==='adamantine-armor'){
   if(!usage.equipped)continue;
   outcome.flags.criticalHitsBecomeNormal=true;outcome.applied.push({id,effect:'critical-hits-become-normal',value:true});continue
  }
  if(id==='amulet-of-proof-against-detection-and-location'){
   if(!(usage.equipped&&usage.attuned))continue;
   outcome.flags.divinationTargetingBlocked=true;outcome.flags.scryingSensorsBlocked=true;
   outcome.applied.push({id,effect:'divination-protection',value:true});continue
  }
  if(id==='armor-1-2-or-3'||/^armor-(?:plus-)?[123]$/.test(id)){
   if(!usage.equipped)continue;
   const bonus=magicBonus(row,parameters);
   if(!bonus){outcome.pending.push({id,reason:'A variante +1/+2/+3 da armadura não está registrada no estado do item.'});continue}
   outcome.acBonus+=bonus;outcome.applied.push({id,effect:'ac-bonus',value:bonus});continue
  }
  if(id==='ammunition-1-2-or-3'||/^ammunition-(?:plus-)?[123]$/.test(id)){
   if(!usage.equipped)continue;
   const bonus=magicBonus(row,parameters);
   if(!bonus){outcome.pending.push({id,reason:'A variante +1/+2/+3 da munição não está registrada no estado do item.'});continue}
   const selector={kind:'magic-item',refId:row?.refId||id,key:usage.key};
   outcome.conditionalAttackBonuses.push({...selector,value:bonus,scope:'attack-with-this-ammunition'});
   outcome.conditionalDamageBonuses.push({...selector,value:bonus,scope:'damage-with-this-ammunition'});
   outcome.applied.push({id,effect:'attack-and-damage-bonus',value:bonus,scope:'this-ammunition'});continue
  }
  if(id==='armor-of-resistance'){
   if(!(usage.equipped&&usage.attuned))continue;
   const damageType=cleanDamageType(parameters.damageType||row?.damageType||row?.magicDamageType);
   if(!damageType||PHYSICAL_DAMAGE_TYPES.includes(damageType)){outcome.pending.push({id,reason:'O tipo de dano escolhido pelo Mestre ainda não está registrado no estado do item.'});continue}
   outcome.resistances.push(damageType);outcome.applied.push({id,effect:'resistance',value:damageType});continue
  }
  if(id==='armor-of-invulnerability'){
   if(!(usage.equipped&&usage.attuned))continue;
   outcome.resistances.push('Concussão','Perfurante','Cortante');
   outcome.applied.push({id,effect:'resistance',value:['Concussão','Perfurante','Cortante']});continue
  }
  if(id==='armor-of-vulnerability'){
   if(!(usage.equipped&&usage.attuned))continue;
   const damageType=cleanDamageType(parameters.damageType||row?.damageType||row?.magicDamageType);
   if(!damageType||!PHYSICAL_DAMAGE_TYPES.includes(damageType)){outcome.pending.push({id,reason:'O tipo de dano resistente da Armadura da Vulnerabilidade ainda não está registrado no estado do item.'});continue}
   outcome.resistances.push(damageType);outcome.vulnerabilities.push(...PHYSICAL_DAMAGE_TYPES.filter(type=>type!==damageType));
   outcome.applied.push({id,effect:'resistance-and-vulnerability',value:{resistance:damageType,vulnerabilities:PHYSICAL_DAMAGE_TYPES.filter(type=>type!==damageType)}});continue
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
 derived.magicItemFlags={...(derived.magicItemFlags||{}),...outcome.flags};
 derived.magicItemMechanics=outcome;return derived
}
