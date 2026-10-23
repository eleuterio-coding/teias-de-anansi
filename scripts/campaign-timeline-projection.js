/* Hierarquia derivada: Aventura -> Sessões vinculadas -> eventos manuais existentes.
 * Os vínculos nunca são gravados em timelineNodes; assim edições, exclusões e
 * reatribuições acompanham as entidades reais sem duplicação nem dados órfãos.
 * Para a visão Jogador, receber somente aventuras/sessões já autorizadas. */
import{numberedAdventureTitle,numberedSessionTitle}from'./narrative-labels.js';

const arr=value=>Array.isArray(value)?value:[];
const id=value=>String(value??'').trim();
const byOrder=(a,b)=>Number(a.order||0)-Number(b.order||0)
 ||String(a.createdAt||'').localeCompare(String(b.createdAt||''))
 ||String(a.id||'').localeCompare(String(b.id||''));
const sessionOrder=(a,b)=>(Number(a.order||a.number||0)-Number(b.order||b.number||0))
 ||String(a.date||'').localeCompare(String(b.date||''))
 ||String(a.id||'').localeCompare(String(b.id||''));

export function projectCampaignTimeline(campaign={},adventures=[]){
 const campaignId=id(campaign.id),sessions=arr(campaign.sessions);
 const linked=arr(adventures).filter(a=>a&&id(a.id)&&(!id(a.campaignId)||id(a.campaignId)===campaignId))
  .slice().sort(byOrder);
 const automatic=linked.map(adventure=>{
  const adventureId=id(adventure.id);
  const children=sessions.filter(session=>id(session.id)&&id(session.adventureId)===adventureId)
   .slice().sort(sessionOrder).map(session=>({
    id:'linked-session:'+id(session.id),text:numberedSessionTitle(session),
    kind:'session',automatic:true,entityId:id(session.id),
    href:'sessoes.html?campaign='+encodeURIComponent(campaignId)+'&id='+encodeURIComponent(session.id),
    children:[]
   }));
  return{
   id:'linked-adventure:'+adventureId,text:numberedAdventureTitle(adventure),
   kind:'adventure',automatic:true,entityId:adventureId,
   href:'aventuras.html?campaign='+encodeURIComponent(campaignId)+'&id='+encodeURIComponent(adventureId),
   children
  };
 });
 return[...automatic,...arr(campaign.timelineNodes)];
}
