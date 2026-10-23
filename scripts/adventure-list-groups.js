import{sortCampaignAdventures}from'./campaign-recent-items.js?v=20261019-order-desc3';
import{adventureListCard,ADVENTURE_STATUSES}from'./adventure-list-card.js?v=20261023-session-count8';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const labels={active:'Em andamento',paused:'Pausada',completed:'Concluída',archived:'Arquivada',planned:'Planejada'};
const countLabel=count=>count===1?'1 aventura':`${count} aventuras`;

export function adventureFiltersHtml(campaigns,{campaign='all',status='all'}={}){
 const all=Array.isArray(campaigns)?campaigns:[];
 return `<div class="adventure-list-filterbar" role="group" aria-label="Filtros de aventuras">
  <label for="adventure-status-filter">Filtrar por status
   <select id="adventure-status-filter" aria-label="Filtrar aventuras por status">
    <option value="all" ${status==='all'?'selected':''}>Todos os status</option>
    ${ADVENTURE_STATUSES.map(value=>`<option value="${value}" ${status===value?'selected':''}>${labels[value]}</option>`).join('')}
   </select>
  </label>
  <label for="adventure-campaign-filter">Filtrar por campanha
   <select id="adventure-campaign-filter" aria-label="Filtrar aventuras por campanha">
    <option value="all" ${campaign==='all'?'selected':''}>Todas as campanhas</option>
    ${all.map(c=>`<option value="${esc(c.id)}" ${campaign===c.id?'selected':''}>${esc(c.name||'Campanha')}</option>`).join('')}
   </select>
  </label>
 </div>`;
}

export function adventureGroupsHtml(adventures,campaigns,{campaign='all',status='all',readOnly=false}={}){
 const known=new Map((Array.isArray(campaigns)?campaigns:[]).map(c=>[c.id,c]));
 const allowed=(Array.isArray(adventures)?adventures:[]).filter(a=>
  (campaign==='all'||a.campaignId===campaign)&&(status==='all'||(a.status||'planned')===status)
 );
 const grouped=new Map();
 for(const a of allowed){
  const id=a.campaignId||'__unassigned__';
  if(!grouped.has(id))grouped.set(id,[]);
  grouped.get(id).push(a);
 }
 const groups=[...grouped.entries()].sort(([a],[b])=>
  (known.get(a)?.name||'Campanha não encontrada').localeCompare(known.get(b)?.name||'Campanha não encontrada','pt-BR'));
 if(!groups.length)return '<div class="empty adventure-groups-empty">Nenhuma aventura encontrada para os filtros selecionados.</div>';
 return groups.map(([id,items])=>{
  const name=known.get(id)?.name||'Campanha não encontrada';
  const campaignLink=known.has(id)?`<a href="mesa.html?id=${encodeURIComponent(id)}" aria-label="Abrir campanha ${esc(name)}">${esc(name)}</a>`:`<span>${esc(name)}</span>`;
  const ordered=sortCampaignAdventures(items);
  const showArrows=ordered.length>1;
  const visible=Math.min(3,ordered.length);
  const cards=ordered.map(a=>adventureListCard(a,{parentName:known.get(id)?.name||'',readOnly,sessions:known.get(id)?.sessions||[]})).join('');
  return `<section class="adventure-campaign-group" data-adventure-campaign-group="${esc(id)}" aria-label="Aventuras da campanha ${esc(name)}">
   <div class="adventure-campaign-group-heading">
    <div class="adventure-campaign-group-identity">
     <span class="adventure-campaign-group-kicker">Campanha</span>
     <h3>${campaignLink}</h3>
     <span class="adventure-campaign-group-count">${countLabel(ordered.length)}</span>
    </div>
    ${showArrows?`<div class="adventure-campaign-scroll-actions" aria-label="Navegação de aventuras" hidden>
      <span>Arraste ou role para ver mais</span>
      <button class="secondary" type="button" data-adventure-scroll="-1" aria-label="Ver aventuras anteriores de ${esc(name)}">‹</button>
      <button class="secondary" type="button" data-adventure-scroll="1" aria-label="Ver próximas aventuras de ${esc(name)}">›</button>
     </div>`:''}
   </div>
   <div class="adventure-campaign-track" data-adventure-track data-visible="${visible}" role="region"
        aria-label="Aventuras da campanha ${esc(name)}">
    ${cards}
   </div>
  </section>`;
 }).join('');
}

export function bindAdventureGroupScroll(host){
 host?.querySelectorAll('.adventure-campaign-group').forEach(group=>{
  const track=group.querySelector('[data-adventure-track]');
  const buttons=[...group.querySelectorAll('[data-adventure-scroll]')];
  if(!track||!buttons.length)return;
  const update=()=>{
   const max=track.scrollWidth-track.clientWidth;
   const prev=buttons.find(b=>b.dataset.adventureScroll==='-1');
   const next=buttons.find(b=>b.dataset.adventureScroll==='1');
   const nav=group.querySelector('.adventure-campaign-scroll-actions');
   if(nav)nav.hidden=max<=1;
   if(prev)prev.disabled=track.scrollLeft<=1;
   if(next)next.disabled=track.scrollLeft>=max-1;
  };
  buttons.forEach(button=>button.addEventListener('click',()=>{
   const direction=Number(button.dataset.adventureScroll);
   const card=track.querySelector('.campaign-card');
   const gap=parseFloat(getComputedStyle(track).columnGap)||14;
   const step=(card?.getBoundingClientRect().width||track.clientWidth)+gap;
   const visible=Math.max(1,Math.round(track.clientWidth/step));
   track.scrollBy({left:direction*step*visible,behavior:'smooth'});
  }));
  track.addEventListener('scroll',update,{passive:true});
  update();
 });
}
