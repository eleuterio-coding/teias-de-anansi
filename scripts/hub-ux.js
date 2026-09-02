const STYLE_ID='hub-ux-styles';
const SKIP_ID='hub-skip-link';
let observer=null,observedNav=null,observedSignature='';
const boundLinks=new WeakSet();

function ensureStyles(){
 if(document.getElementById(STYLE_ID)||document.querySelector('link[href*="hub-ux.css"]'))return;
 const link=document.createElement('link');
 link.id=STYLE_ID;link.rel='stylesheet';link.href=new URL('../hub-ux.css?v=20260901-ux-final1',import.meta.url).href;
 document.head.appendChild(link)
}
function mainTarget(){
 const target=document.querySelector('main:not([hidden]),#sheet:not([hidden]),#builder:not([hidden]),#table-root')||document.querySelector('main,#sheet,#builder,#table-root,h1');
 if(!target)return null;if(!target.id)target.id='hub-main-content';
 if(target.matches('h1')&&!target.hasAttribute('tabindex'))target.tabIndex=-1;
 return target
}
function ensureSkipLink(){
 if(document.getElementById(SKIP_ID))return;const target=mainTarget();if(!target)return;
 const link=document.createElement('a');link.id=SKIP_ID;link.className='skip-link';link.href=`#${target.id}`;link.textContent='Pular para o conteúdo principal';document.body.prepend(link)
}
function enhanceLiveRegions(){
 const selectors=['#save-status','#game-save-state','#loading','#load-warnings','#storage-note','#resultado','.status'];
 for(const el of document.querySelectorAll(selectors.join(','))){
  if(el.closest('[aria-live]')&&el.closest('[aria-live]')!==el)continue;
  const warning=el.classList.contains('warning')||el.id==='load-warnings';
  if(!el.hasAttribute('role'))el.setAttribute('role',warning?'alert':'status');
  if(!el.hasAttribute('aria-live'))el.setAttribute('aria-live',warning?'assertive':'polite');
  if(!el.hasAttribute('aria-atomic'))el.setAttribute('aria-atomic','true')
 }
}
function sectionLinks(nav){return[...nav.querySelectorAll('a[href^="#"]')].filter(a=>a.hash&&document.querySelector(a.hash))}
function markCurrent(link,links,{center=false}={}){for(const a of links)a.removeAttribute('aria-current');if(link){link.setAttribute('aria-current','location');if(center)link.scrollIntoView({block:'nearest',inline:'center'})}}
function enhanceSectionNav(){
 const nav=document.querySelector('.section-nav');if(!nav){observer?.disconnect();observer=null;observedNav=null;observedSignature='';return}
 nav.setAttribute('aria-label',nav.getAttribute('aria-label')||'Navegação por seções');nav.dataset.horizontalScroll='true';
 const links=sectionLinks(nav);if(!links.length)return;const signature=links.map(a=>a.hash).join('|');
 for(const link of links)if(!boundLinks.has(link)){boundLinks.add(link);link.addEventListener('click',()=>markCurrent(link,sectionLinks(nav),{center:true}))}
 if(nav===observedNav&&signature===observedSignature)return;
 observer?.disconnect();observer=null;observedNav=nav;observedSignature=signature;
 if('IntersectionObserver'in window){
  const byId=new Map(links.map(a=>[a.hash.slice(1),a]));observer=new IntersectionObserver(entries=>{
   const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
   if(visible)markCurrent(byId.get(visible.target.id),links,{center:true})
  },{rootMargin:'-18% 0px -68% 0px',threshold:[0,.05,.25]});
  for(const id of byId.keys()){const section=document.getElementById(id);if(section)observer.observe(section)}
 }
 const hashLink=links.find(a=>a.hash===location.hash)||links[0];if(hashLink)markCurrent(hashLink,links,{center:true})
}
function enhanceTouchGroups(){
 for(const group of document.querySelectorAll('.hero .actions,.top .actions,.hero-actions,.pc .actions'))group.dataset.mobileStack='true'
}
function enhanceStructureEditingCopy(){
 const edit=document.getElementById('edit-link');if(edit){edit.textContent='Editar estrutura';edit.title='Corrige escolhas estruturais da criação. PV, recursos, equipamento, magias, descansos e estado atual são administrados nesta ficha.'}
 for(const link of document.querySelectorAll('a[data-structure-edit]')){link.textContent='Editar estrutura';link.title='Use o construtor apenas para corrigir escolhas estruturais da criação.'}
}
function run(){ensureStyles();ensureSkipLink();enhanceLiveRegions();enhanceTouchGroups();enhanceStructureEditingCopy();enhanceSectionNav()}

if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else queueMicrotask(run);
 document.addEventListener('hub-rpg:sheet-ready',()=>queueMicrotask(run));
 const mo=new MutationObserver(()=>queueMicrotask(()=>{enhanceLiveRegions();enhanceTouchGroups();enhanceStructureEditingCopy();enhanceSectionNav()}));
 if(document.documentElement)mo.observe(document.documentElement,{childList:true,subtree:true})
}

export{run as initHubUx};