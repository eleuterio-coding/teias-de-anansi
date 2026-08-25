const rows=value=>Array.isArray(value)?value:[];
const levelOf=value=>Number(value)||0;
const ensureSet=(map,key)=>{if(!map.has(key))map.set(key,new Set());return map.get(key)};
const ensureMap=(map,key)=>{if(!map.has(key))map.set(key,new Map());return map.get(key)};

/**
 * Constrói o estado visual efetivo das listas de magias sem alterar o histórico
 * de aquisição usado pela progressão nível por nível.
 *
 * Uma magia aprendida em um nível continua registrada naquele nível, mas, se for
 * substituída depois, sua caixa passa a aparecer desmarcada. A magia recebida na
 * substituição aparece marcada no nível em que a troca ocorreu.
 */
export function buildSpellVisualMap(progress,kind='leveled'){
 const isCantrip=kind==='cantrip',gainKey=isCantrip?'cantrips':'leveled',changeKey=isCantrip?'cantripChange':'spellChange',beforeKey=isCantrip?'beforeCantrips':'beforeLeveled',afterKey=isCantrip?'afterCantrips':'afterLeveled';
 const active=new Map(),removedByLevel=new Map();
 for(const step of rows(progress?.steps)){
  if(step?.locked)break;
  const level=levelOf(step?.level),stored=step?.stored||{},after=new Set(rows(step?.[afterKey]));
  for(const id of rows(stored[gainKey]))if(id)active.set(id,{level,source:'gain'});
  const change=stored[changeKey],before=rows(step?.[beforeKey]);
  const applied=change?.decision==='replace'&&change.out&&change.in&&before.includes(change.out)&&after.has(change.in)&&!after.has(change.out);
  if(applied){
   const prior=active.get(change.out);
   if(prior?.level){ensureMap(removedByLevel,prior.level).set(change.out,level);active.delete(change.out)}
   active.set(change.in,{level,source:'swap'})
  }
  for(const id of [...active.keys()])if(!after.has(id))active.delete(id)
 }
 const activeByLevel=new Map(),swapInByLevel=new Map();
 for(const[id,meta]of active){
  if(!meta?.level)continue;
  ensureSet(activeByLevel,meta.level).add(id);
  if(meta.source==='swap')ensureSet(swapInByLevel,meta.level).add(id)
 }
 return{activeByLevel,removedByLevel,swapInByLevel}
}
