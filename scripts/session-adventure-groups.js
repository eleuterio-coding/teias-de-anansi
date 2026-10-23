import{numberedAdventureTitle}from'./narrative-labels.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const countLabel=n=>n===1?'1 sessão':`${n} sessões`;

/** Reutiliza os cards de Sessão; somente a organização visual muda. */
export function sessionAdventureGroupsHtml(sessions,adventures,renderCard,campaigns=[]){
 const known=new Map((Array.isArray(adventures)?adventures:[]).map(a=>[a.id,a]));
 const grouped=new Map();
 for(const session of Array.isArray(sessions)?sessions:[]){
  const campaignId=String(session.campaignId||'__standalone__');
  const adventureId=String(session.adventureId||'__none__');
  const key=campaignId+'::'+adventureId;
  if(!grouped.has(key))grouped.set(key,{key,campaignId,adventureId,items:[]});
  grouped.get(key).items.push(session);
 }
 if(!grouped.size)return '<div class="empty session-groups-empty">Nenhuma sessão encontrada.</div>';
 return [...grouped.values()].map(group=>{
  const adv=known.get(group.adventureId);
  const hasAdventure=group.adventureId!=='__none__';
  const name=adv?numberedAdventureTitle(adv):(hasAdventure?'Aventura não disponível':'Sem aventura');
  const campaignName=group.items[0]?.campaignName
   ||campaigns.find(c=>c.id===group.campaignId)?.name||'';
  const nameHtml=adv
   ?`<a href="aventuras.html?campaign=${encodeURIComponent(adv.campaignId)}&id=${encodeURIComponent(adv.id)}" aria-label="Abrir aventura ${esc(name)}">${esc(name)}</a>`
   :`<span>${esc(name)}</span>`;
  const visible=Math.min(3,group.items.length);
  const label=campaignName?`${name} — ${campaignName}`:name;
  const buttons=group.items.length>1?`
   <div class="session-adventure-scroll-actions" aria-label="Navegação de sessões" hidden>
    <span>Role para ver mais</span>
    <button type="button" class="secondary" data-session-scroll="-1" aria-label="Ver sessões anteriores de ${esc(label)}">‹</button>
    <button type="button" class="secondary" data-session-scroll="1" aria-label="Ver próximas sessões de ${esc(label)}">›</button>
   </div>`:'';
  return `<section class="session-adventure-group" data-session-adventure-group="${esc(group.key)}" aria-label="Sessões de ${esc(label)}">
   <div class="session-adventure-group-heading">
    <div class="session-adventure-group-identity">
     <span class="session-adventure-group-kicker">${hasAdventure?'Aventura':'Sessões sem aventura'}</span>
     <h3>${nameHtml}</h3>
     ${campaignName?`<span class="session-adventure-group-campaign">${esc(campaignName)}</span>`:''}
     <span class="session-adventure-group-count">${countLabel(group.items.length)}</span>
    </div>
    ${buttons}
   </div>
   <div class="session-adventure-track" data-session-track data-visible="${visible}"
        role="region" aria-label="Sessões de ${esc(label)}">
    ${group.items.map(renderCard).join('')}
   </div>
  </section>`;
 }).join('');
}

let activeObservers=[];
export function bindSessionAdventureScroll(host){
 for(const observer of activeObservers)observer.disconnect();
 activeObservers=[];
 host?.querySelectorAll('.session-adventure-group').forEach(group=>{
  const track=group.querySelector('[data-session-track]');
  const navigation=group.querySelector('.session-adventure-scroll-actions');
  const buttons=[...group.querySelectorAll('[data-session-scroll]')];
  if(!track||!navigation)return;
  const update=()=>{
   const max=Math.max(0,track.scrollWidth-track.clientWidth);
   navigation.hidden=max<=1;
   buttons.forEach(btn=>{
    const direction=Number(btn.dataset.sessionScroll);
    btn.disabled=direction<0?track.scrollLeft<=1:track.scrollLeft>=max-1;
   });
  };
  buttons.forEach(button=>button.addEventListener('click',()=>{
   const card=track.querySelector('.campaign-card');
   const step=(card?.getBoundingClientRect().width||track.clientWidth)
     +(parseFloat(getComputedStyle(track).columnGap)||14);
   const count=Math.max(1,Math.round(track.clientWidth/step));
   track.scrollBy({left:Number(button.dataset.sessionScroll)*step*count,behavior:'smooth'});
  }));
  track.addEventListener('scroll',update,{passive:true});
  if(typeof ResizeObserver==='function'){
   const observer=new ResizeObserver(update);
   observer.observe(track);
   activeObservers.push(observer);
  }
  update();
 });
}
