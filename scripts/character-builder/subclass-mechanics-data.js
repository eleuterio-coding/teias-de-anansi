import{state,arr,fold,json}from'./state.js';

const FILES=[
 'dados/subclasses-mecanicas-phb-2024.json',
 'dados/subclasses-mecanicas-forge-2025.json',
 'dados/subclasses-mecanicas-quickstone-2024.json',
 'dados/subclasses-mecanicas-heroes-faerun-2025.json',
 'dados/subclasses-mecanicas-tasha-2020.json',
 'dados/subclasses-mecanicas-xanathar-2017.json',
 'dados/subclasses-mecanicas-larsene-ledger-2024.json'
];
const PRECEDENCE='dados/precedencia-subclasses.json';
const precedenceKey=(sourceId,name)=>`${sourceId}:${fold(name)}`;
let pending=null;
export function initSubclassMechanicsData(){
 if(pending)return pending;
 pending=(async()=>{
  const[packs,loc,precedence]=await Promise.all([
   Promise.all(FILES.map(file=>json(file))),
   json('dados/localizacao-ptbr-subclasses.json').catch(()=>({})),
   json(PRECEDENCE).catch(()=>({prioridade_fontes:{},substituicoes:[]}))
  ]);
  const names=loc.nomes||{},map=new Map(),total=packs.reduce((n,pkg)=>n+arr(pkg.subclasses).length,0);
  const priority=precedence.prioridade_fontes||{};
  const superseded=new Set(arr(precedence.substituicoes).map(x=>precedenceKey(x.fonte_anterior,x.nome_anterior)));
  const rank=sourceId=>Number(priority[sourceId])||0;
  const setPreferred=(key,value)=>{
   const current=map.get(key);
   if(!current||rank(value.fonte_id)>rank(current.fonte_id))map.set(key,value)
  };
  for(const pkg of packs)for(const row of arr(pkg.subclasses)){
   if(superseded.has(precedenceKey(pkg.fonte_id,row.nome)))continue;
   const value={...row,fonte_id:pkg.fonte_id,fonte:pkg.fonte,features:arr(row.progressao).map(x=>({level:Number(x.nivel)||0,name:x.nome||'Característica',text:x.descricao||''}))};
   setPreferred(fold(row.nome),value);if(names[row.nome])setPreferred(fold(names[row.nome]),value)
  }
  let applied=0;
  for(const sub of arr(state.catalogs.subclasses)){
   const row=map.get(fold(sub.name));if(!row)continue;
   sub.description=row.resumo||sub.description||'';sub.features=row.features;sub.progression=arr(row.progressao);sub.mechanics={name:row.nome,sourceId:row.fonte_id,source:row.fonte,summary:row.resumo,progression:arr(row.progressao)};applied++
  }
  state.subclassMechanics={total,applied};
  document.dispatchEvent(new CustomEvent('hub:subclass-mechanics-ready',{detail:{total,applied}}));
  return{total,applied,map}
 })().catch(error=>{console.error('[subclass-mechanics-data]',error);state.warnings?.push?.(`Mecânicas de subclasses: ${error.message||error}`);return{total:0,applied:0,map:new Map()}});
 return pending
}
