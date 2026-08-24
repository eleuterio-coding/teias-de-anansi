const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export const rulesetOf=x=>x?.ruleset||x?.compatibilidade?.ruleset||'';
export const revisionOf=x=>Number(x?.revision??x?.revisao_core??x?.compatibilidade?.revisao_core??0)||null;
export const is55=x=>rulesetOf(x)==='5.5e'||revisionOf(x)===2024;
export const is5e=x=>rulesetOf(x)==='5e'||revisionOf(x)===2014;
export function isCompatible55(x){
 if(!x)return false;
 if(is55(x)||!rulesetOf(x))return true;
 const compat=Array.isArray(x.compatibleWith)?x.compatibleWith:[];
 if(compat.includes('5.5e'))return true;
 const status=norm(x.status||x.classificacao?.status||'');
 return /legado.*(ativo|compativel|conteudo unico|sem equivalente)/.test(status)
}
export const sourceRank=x=>is55(x)?3:isCompatible55(x)?2:1;
export function preferCurrent(items,keyFn=x=>norm(x?.name||x?.nome||'')){
 const best=new Map;
 for(const item of items||[]){
  const key=keyFn(item);if(!key)continue;
  const prev=best.get(key);
  if(!prev||sourceRank(item)>sourceRank(prev)||(sourceRank(item)===sourceRank(prev)&&(revisionOf(item)||0)>(revisionOf(prev)||0))best.set(key,item)
 }
 return[...best.values()]
}
export function compatibilityLabel(x){
 if(is55(x))return'5.5e';
 if(isCompatible55(x))return'5e compatível';
 return rulesetOf(x)||'—'
}
