import{json,arr}from'./state.js';

export async function loadMetamagic(){
 const data=await json('dados/metamagias-feiticeiro-2024.json');
 const items=arr(data?.itens).filter(x=>x?.id&&x?.nome);
 const progression=data?.progressao&&typeof data.progressao==='object'?{...data.progressao}:{};
 if(items.length!==10)throw new Error(`Catálogo de Metamagia incompleto: ${items.length}/10.`);
 for(let level=1;level<=20;level++)if(!Number.isFinite(Number(progression[String(level)])))throw new Error(`Progressão de Metamagia ausente no nível ${level}.`);
 return{items,progression,source:data?.fonte||{},precedence:data?.precedencia||{}}
}
