/** Ordem narrativa da Campanha: aventura atual primeiro e retrospectiva depois.
 * Datas de criação preservam cronologia: editar uma aventura antiga não a torna mais recente. */
const adventureRank=Object.freeze({current:0,active:1,paused:2,completed:3,archived:4,planned:5});
export function sortCampaignAdventures(items=[],{includePlanned=true,limit=Infinity}={}){
 return (Array.isArray(items)?items:[])
  .filter(item=>item&&(includePlanned||item.status!=='planned'))
  .sort((a,b)=>{
   const ar=adventureRank[a.status]??4,br=adventureRank[b.status]??4;
   if(ar!==br)return ar-br;
   const aDate=String(a.createdAt||a.updatedAt||''),bDate=String(b.createdAt||b.updatedAt||'');
   return bDate.localeCompare(aDate)||String(b.id||'').localeCompare(String(a.id||''));
  }).slice(0,limit)
}
/** Próxima/planejada/cancelada não são sessões retrospectivas. */
export function recentCampaignSessions(items=[],{limit=5}={}){
 return (Array.isArray(items)?items:[])
  .filter(item=>item&&['current','active','completed'].includes(item.status))
  .sort((a,b)=>{
   const ar=['current','active'].includes(a.status)?0:1,br=['current','active'].includes(b.status)?0:1;
   return ar-br||Number(b.number||0)-Number(a.number||0)
    ||String(b.date||'').localeCompare(String(a.date||''))
  }).slice(0,limit)
}
