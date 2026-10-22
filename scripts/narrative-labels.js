/** Exibe a numeração registrada em Ordem, sem recalcular pela posição na lista. */
const numericOrder=(row,fallback=null)=>{const n=Number(row?.order??fallback);return Number.isInteger(n)&&n>0?n:null};
const label=(kind,row,fallback=null)=>{const title=String(row?.title||'Sem título').trim(),order=numericOrder(row,fallback);return order===null?title:`${kind} ${order} · ${title}`};
export const numberedAdventureTitle=row=>label('Aventura',row);
export const numberedSessionTitle=row=>label('Sessão',row,row?.number);
