export const DAILY_PREPARED_CLASSES=new Set(['wizard','cleric','druid','artificer']);
export const LONG_REST_ONE_CLASSES=new Set(['paladin','ranger']);
export const LEVEL_CHANGE_CLASSES=new Set(['bard','sorcerer','warlock']);

export function casterProfile(slug=''){
 if(slug==='warlock')return{kind:'pact',listLabel:'Magias de Pact Magic',resourceLabel:'Pact Magic',recovery:'Descanso Curto ou Longo'};
 if(slug==='wizard')return{kind:'daily',listLabel:'Magias preparadas para conjurar',resourceLabel:'Espaços de magia',recovery:'Descanso Longo',sourceLabel:'Grimório'};
 if(['cleric','druid','artificer'].includes(slug))return{kind:'daily',listLabel:'Magias preparadas para conjurar',resourceLabel:'Espaços de magia',recovery:'Descanso Longo',sourceLabel:'Lista da classe'};
 if(LONG_REST_ONE_CLASSES.has(slug))return{kind:'fixed-long-rest',listLabel:'Magias preparadas da classe',resourceLabel:'Espaços de magia',recovery:'Descanso Longo'};
 if(LEVEL_CHANGE_CLASSES.has(slug))return{kind:'fixed-level',listLabel:'Magias preparadas da classe',resourceLabel:'Espaços de magia',recovery:'Descanso Longo'};
 return{kind:'standard',listLabel:'Magias da classe',resourceLabel:'Espaços de magia',recovery:'Descanso Longo'}
}

export function normalizedSlotPools(slots=[],used={}){
 return(slots||[]).filter(s=>Number(s?.count)>0).map(s=>{
  const level=Number(s.level)||0,count=Math.max(0,Number(s.count)||0),spent=Math.max(0,Math.min(count,Number(used?.[level]??used?.[String(level)])||0));
  return{level,count,used:spent,remaining:count-spent}
 }).sort((a,b)=>a.level-b.level)
}

export function pactPool(slots=[],used={}){
 const pools=normalizedSlotPools(slots,used);if(!pools.length)return null;
 const current=pools.reduce((best,row)=>!best||row.level>best.level?row:best,null);
 return{...current,kind:'pact'}
}

export function eligibleSlotPools(spellLevel,slots=[],used={},slug=''){
 const base=Math.max(1,Number(spellLevel)||1),pools=normalizedSlotPools(slots,used);
 if(slug==='warlock'){
  const pact=pactPool(slots,used);return pact&&pact.level>=base?[pact]:[]
 }
 return pools.filter(row=>row.level>=base)
}

export function firstAvailableSlotLevel(spellLevel,slots=[],used={},slug=''){
 return eligibleSlotPools(spellLevel,slots,used,slug).find(row=>row.remaining>0)?.level||null
}

export function adjustSlotUse(used={},slots=[],level,delta){
 const pools=normalizedSlotPools(slots,used),pool=pools.find(row=>row.level===Number(level));if(!pool)return{...used};
 const next={...used},current=Number(next[level]??next[String(level)])||0;next[level]=Math.max(0,Math.min(pool.count,current+Number(delta||0)));return next
}

export function remainingLabel(remaining,total){return`${Math.max(0,Number(remaining)||0)}/${Math.max(0,Number(total)||0)} restante${Number(remaining)===1?'':'s'}`}

export function activeClassSpellIds({slug='',selectedIds=[],preparedIds=[],preparationClassMatches=false}={}){
 if(DAILY_PREPARED_CLASSES.has(slug)&&preparationClassMatches)return[...new Set((preparedIds||[]).filter(Boolean))];
 return[...new Set((selectedIds||[]).filter(Boolean))]
}

export function freeLongRestFeat(featName=''){
 return['Magic Initiate','Fey-Touched','Shadow-Touched','Telepathic'].includes(String(featName))
}
