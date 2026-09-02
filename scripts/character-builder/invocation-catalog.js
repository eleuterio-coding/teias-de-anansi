import{json,arr}from'./state.js';

export async function loadInvocations(){
 const data=await json('dados/invocacoes-bruxo-2024.json');
 const items=arr(data?.itens).filter(x=>x?.id&&x?.nome);
 const progression=data?.progressao&&typeof data.progressao==='object'?{...data.progressao}:{};
 if(items.length!==28)throw new Error(`Catálogo de Invocações incompleto: ${items.length}/28.`);
 for(let level=1;level<=20;level++)if(!Number.isFinite(Number(progression[String(level)])))throw new Error(`Progressão de Invocações ausente no nível ${level}.`);
 return{items,progression,source:data?.fonte||{},precedence:data?.precedencia||{}}
}
