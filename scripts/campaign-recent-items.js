/** As listas da Campanha seguem o campo Ordem, independentemente do status.
 * A data e o ID servem somente para desempatar ordens iguais. */
export function sortCampaignAdventures(items=[],{includePlanned=true,limit=Infinity}={}){
 return (Array.isArray(items)?items:[])
  .filter(item=>item&&(includePlanned||item.status!=='planned'))
  .sort((a,b)=>{
   const aOrder=Number(a.order)||0,bOrder=Number(b.order)||0;
   if(aOrder!==bOrder)return bOrder-aOrder;
   const aDate=String(a.createdAt||a.updatedAt||''),bDate=String(b.createdAt||b.updatedAt||'');
   return bDate.localeCompare(aDate)||String(b.id||'').localeCompare(String(a.id||''));
  }).slice(0,limit)
}
/** Destaca a sessão Atual, seguida das Próximas, preservando Ordem decrescente em cada grupo.
 * Se informado, activeAdventureIds restringe aos vínculos válidos da Campanha. */
export function recentCampaignSessions(items=[],{limit=5,activeAdventureIds=null}={}){
 const allowed=activeAdventureIds==null?null:new Set(activeAdventureIds);
 return (Array.isArray(items)?items:[])
  .filter(item=>item&&['current','completed','next'].includes(item.status)&&(item.status==='current'||!allowed||allowed.has(item.adventureId)))
  .sort((a,b)=>{
   const priority={current:0,next:1,completed:2};
   const pa=priority[a.status]??3,pb=priority[b.status]??3;
   if(pa!==pb)return pa-pb;
   const aOrder=Number(a.order??a.number)||0,bOrder=Number(b.order??b.number)||0;
   return bOrder-aOrder||Number(b.number||0)-Number(a.number||0)
    ||String(b.date||'').localeCompare(String(a.date||''))
    ||String(b.id||'').localeCompare(String(a.id||''))
  }).slice(0,limit)
}
