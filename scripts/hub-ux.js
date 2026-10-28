import{readSettings,applyUiPreferences}from'./settings-state.js?v=20261022-settings-unified1';
import{initAppShell,updateAppShellContext}from'./app-shell.js?v=20261022-chronicles-final3';

const STYLE_ID='hub-ux-styles';
const SKIP_ID='hub-skip-link';
const COLLAB_SESSION_KEY='hub-rpg:collaboration-session:v1';
let enhanceFrame=0,realtimeModule=null,realtimeLoad=null,characterAccessLoad=null;
const sectionNavStates=new Map();
const boundLinks=new WeakSet();

function ensureStyles(){
 if(!document.getElementById(STYLE_ID)&&!document.querySelector('link[href*="hub-ux.css"]')){
  const base=document.createElement('link');base.id=STYLE_ID;base.rel='stylesheet';
  base.href=new URL('../hub-ux.css?v=20261021-player-self1',import.meta.url).href;
  document.head.appendChild(base);
 }
 if(!document.getElementById('hub-layout-styles')){
  const layout=document.createElement('link');layout.id='hub-layout-styles';layout.rel='stylesheet';
  layout.href=new URL('../hub-layout.css?v=20261015-unified-layout1',import.meta.url).href;
  document.head.appendChild(layout);
 }
 // Camada final carregada em todas as rotas que utilizam o shell do Hub.
 // Arquivo próprio: tokens semânticos, famílias de componentes e motion.
 if(!document.getElementById('hub-design-system-styles')){
  const design=document.createElement('link');design.id='hub-design-system-styles';design.rel='stylesheet';
  design.href=new URL('../hub-design-system.css?v=20261028-design-system-global1',import.meta.url).href;
  document.head.appendChild(design);
 }
}
function preconnect(href){if(document.querySelector(`link[rel="preconnect"][href="${href}"]`))return;const link=document.createElement('link');link.rel='preconnect';link.href=href;link.crossOrigin='anonymous';document.head.appendChild(link)}
function warmExternalOrigins(){const page=location.pathname.split('/').pop()||'';if(page==='ficha-personagem.html'||page==='criacao-personagem.html')preconnect('https://raw.githubusercontent.com')}
function applyStoredPreferences(){applyUiPreferences(readSettings())}
function currentPage(){return location.pathname.split('/').pop()||'index.html'}
function hasLoginSession(){try{const raw=JSON.parse(localStorage.getItem(COLLAB_SESSION_KEY)||'null');return Boolean(raw?.uid&&raw?.username)}catch{return false}}
function enforceLogin(){const page=currentPage();if(page==='usuarios.html'||hasLoginSession())return true;const next=`${page}${location.search||''}${location.hash||''}`,login=new URL('usuarios.html',location.href);login.searchParams.set('next',next);location.replace(login.href);return false}
async function setRealtime(active){
 if(!active){realtimeModule?.stopRealtime?.();return}
 if(!realtimeLoad)realtimeLoad=import('./collaboration-realtime.js?v=20261027-scenes-cast-v1').then(module=>realtimeModule=module).catch(error=>{console.warn('[Hub realtime] bootstrap:',error);realtimeLoad=null;return null});
 const module=await realtimeLoad;module?.startRealtime?.()
}
function bootstrapRealtime(){let active=false;try{active=Boolean(localStorage.getItem(COLLAB_SESSION_KEY))}catch{}setRealtime(active)}
function bootstrapPageAccess(){const page=currentPage();if(page!=='ficha-personagem.html'||new URLSearchParams(location.search).get('npc')==='1'||characterAccessLoad)return;characterAccessLoad=import('./character-sheet-access-ui.js?v=20261021-ficha-permissao3').catch(error=>{console.warn('[Hub access] ficha:',error);characterAccessLoad=null;return null})}
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
function sectionLinks(nav){return[...nav.querySelectorAll('a[href^="#"]')].filter(a=>a.hash&&document.getElementById(a.hash.slice(1)))}
function positionSectionIndicator(nav,link){
 const indicator=nav.querySelector('.section-nav-indicator');
 if(!indicator||!link)return;
 const first=nav.dataset.indicatorReady!=='true';
 if(first)indicator.style.transition='none';
 indicator.style.width=`${link.offsetWidth}px`;
 indicator.style.transform=`translate3d(${link.offsetLeft}px,0,0)`;
 nav.dataset.indicatorReady='true';
 if(first)requestAnimationFrame(()=>{if(indicator.isConnected)indicator.style.removeProperty('transition')});
}
function markCurrent(link,links,{center=false}={}){
 for(const a of links)if(a!==link)a.removeAttribute('aria-current');
 if(!link)return;
 if(link.getAttribute('aria-current')!=='location')link.setAttribute('aria-current','location');
 const nav=link.closest('.section-nav');if(!nav)return;
 positionSectionIndicator(nav,link);
 if(center){
  const left=Math.max(0,Math.min(nav.scrollWidth-nav.clientWidth,link.offsetLeft+link.offsetWidth/2-nav.clientWidth/2));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.hubMotion==='reduce';
  nav.scrollTo({left,behavior:reduced?'auto':'smooth'});
 }
}
function enhanceSectionNav(){
 // Cada menu de seções possui observadores próprios; um menu não desativa
 // o indicador de outro quando a página contém mais de uma navegação.
 const navs=[...document.querySelectorAll('.section-nav')];
 for(const [nav,state] of sectionNavStates){
  if(!nav.isConnected||!navs.includes(nav)){
   state.observer?.disconnect();state.resizeObserver?.disconnect();
   sectionNavStates.delete(nav);
  }
 }
 for(const nav of navs){
  nav.setAttribute('aria-label',nav.getAttribute('aria-label')||'Navegação por seções');
  nav.dataset.horizontalScroll='true';
  const links=sectionLinks(nav);
  if(!links.length)continue;
  const signature=links.map(a=>a.hash).join('|');
  if(!nav.querySelector('.section-nav-indicator')){
   const indicator=document.createElement('span');
   indicator.className='section-nav-indicator';
   indicator.setAttribute('aria-hidden','true');
   nav.appendChild(indicator);
  }
  for(const link of links)if(!boundLinks.has(link)){
   boundLinks.add(link);
   link.addEventListener('click',()=>{
    nav.dataset.manualNavUntil=String(Date.now()+1000);
    markCurrent(link,sectionLinks(nav),{center:true});
   });
  }
  const previous=sectionNavStates.get(nav);
  if(previous?.signature===signature)continue;
  previous?.observer?.disconnect();previous?.resizeObserver?.disconnect();
  const state={signature,observer:null,resizeObserver:null};
  sectionNavStates.set(nav,state);
  if('ResizeObserver'in window){
   state.resizeObserver=new ResizeObserver(()=>{
    const active=nav.querySelector('a[aria-current="location"]');
    if(active)positionSectionIndicator(nav,active);
   });
   state.resizeObserver.observe(nav);
   for(const link of links)state.resizeObserver.observe(link);
  }
  if('IntersectionObserver'in window){
   const byId=new Map(links.map(a=>[a.hash.slice(1),a]));
   state.observer=new IntersectionObserver(entries=>{
    if(Date.now()<Number(nav.dataset.manualNavUntil||0))return;
    const visible=entries.filter(x=>x.isIntersecting)
      .sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
    if(visible)markCurrent(byId.get(visible.target.id),links);
   },{rootMargin:'-18% 0px -68% 0px',threshold:[0,.05,.25]});
   for(const id of byId.keys()){
    const section=document.getElementById(id);
    if(section)state.observer.observe(section);
   }
  }
  const hashLink=links.find(a=>a.hash===location.hash)||links[0];
  if(hashLink)markCurrent(hashLink,links,{center:true});
 }
}
function enhanceTouchGroups(){
 for(const group of document.querySelectorAll('.hero .actions,.top .actions,.hero-actions,.pc .actions'))if(group.dataset.mobileStack!=='true')group.dataset.mobileStack='true'
}
function enhanceStructureEditingCopy(){
 const edit=document.getElementById('edit-link');
 if(edit&&edit.textContent.trim()!=='Editar Ficha')edit.textContent='Editar Ficha';
 for(const link of document.querySelectorAll('a[data-structure-edit]')){
  if(link.textContent.trim()!=='Editar Ficha')link.textContent='Editar Ficha';
 }
}

/* Confirmação visual centralizada. A mensagem de sucesso só é exibida
   depois de o fluxo da página informar que concluiu o salvamento. */
const SAVE_STATUS_SELECTOR='#table-feedback,#adventure-feedback,#session-feedback,#save-status,#game-save-state,#storage-note,#resultado,.status,[role="status"],[role="alert"]';
let saveIntentAt=0,saveNoticeTimer=0,saveFeedbackReady=false;
function saveControl(node){
 const button=node?.closest?.('button,input[type="submit"],[role="button"]');
 if(!button||button.disabled)return false;
 const label=String(button.textContent||button.value||button.getAttribute('aria-label')||'').trim();
 return /^salvar(?:\b|$)|^gravar(?:\b|$)|^salve(?:\b|$)/i.test(label)
  ||['save-sheet','save-character','save-campaign'].includes(button.id);
}
function markSaveIntent(event){
 if(!saveControl(event.target))return;
 if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
 if(event.type==='click'&&Date.now()-saveIntentAt<300)return;
 saveIntentAt=Date.now()
}
function showSaveNotice(message,{ok=true}={}){
 let root=document.getElementById('hub-save-notice');
 if(!root){
  root=document.createElement('div');root.id='hub-save-notice';root.setAttribute('role','status');root.setAttribute('aria-live','polite');root.setAttribute('aria-atomic','true');
  root.innerHTML='<span class="hub-save-icon" aria-hidden="true"></span><div class="hub-save-copy"><strong class="hub-save-title"></strong><span class="hub-save-detail"></span></div><button type="button" class="hub-save-close" aria-label="Fechar confirmação">×</button>';
  root.querySelector('.hub-save-close').addEventListener('click',()=>{root.hidden=true;clearTimeout(saveNoticeTimer)});
  document.body.appendChild(root)
 }
 root.dataset.outcome=ok?'success':'error';
 root.querySelector('.hub-save-icon').textContent=ok?'✓':'!';
 root.querySelector('.hub-save-title').textContent=ok?'Alterações salvas':'Não foi possível salvar';
 root.querySelector('.hub-save-detail').textContent=String(message|| (ok?'Salvamento concluído.':'Verifique o aviso na página.'));
 root.setAttribute('role',ok?'status':'alert');
 root.setAttribute('aria-live',ok?'polite':'assertive');
 root.hidden=false;
 clearTimeout(saveNoticeTimer);saveNoticeTimer=setTimeout(()=>root.hidden=true,4200)
}
function statusSaveFeedback(region){
 if(!region?.isConnected||region.id==='hub-save-notice'||region.closest('#hub-save-notice')||region.hidden||region.closest('[hidden]'))return false;
 const message=String(region.textContent||'').trim().slice(0,220);
 if(!message)return false;
 const fail=region.classList.contains('warning')||/não foi possível|não pôde|falha(?: ao)?|erro (?:ao|para)|não salvo|não salvou/i.test(message);
 const success=/\bsalv(?:a|as|o|os|ou)\b|\bsincronizad[oa]s?\b|\batualizad[oa]s?\b|\bgravado\b|\bregistrado\b/i.test(message);
 if(!fail&&!success)return false;
 showSaveNotice(message,{ok:!fail});saveIntentAt=0;return true
}
function initSaveFeedback(){
 if(saveFeedbackReady)return;saveFeedbackReady=true;
 document.addEventListener('pointerdown',markSaveIntent,true);
 document.addEventListener('click',markSaveIntent,true);
 document.addEventListener('keydown',markSaveIntent,true);
 document.addEventListener('hub-rpg:save-feedback',event=>{
  const detail=event.detail||{};showSaveNotice(detail.message,{ok:detail.ok!==false});
  saveIntentAt=0
 });
 const pending=sessionStorage.getItem('hub-rpg:pending-save-notice');
 if(pending){sessionStorage.removeItem('hub-rpg:pending-save-notice');showSaveNotice(pending)}
 new MutationObserver(records=>{
  if(!saveIntentAt||Date.now()-saveIntentAt>15000)return;
  const regions=new Set();
  for(const record of records){
   const nodes=[record.target,...record.addedNodes];
   for(const node of nodes){
    const element=node.nodeType===1?node:node.parentElement;
    if(!element||element.id==='hub-save-notice'||element.closest?.('#hub-save-notice'))continue;
    if(element.matches?.(SAVE_STATUS_SELECTOR))regions.add(element);
    const ancestor=element.closest?.(SAVE_STATUS_SELECTOR);if(ancestor)regions.add(ancestor);
    if(node.nodeType===1)for(const child of node.querySelectorAll(SAVE_STATUS_SELECTOR))regions.add(child)
   }
  }
  for(const region of regions)if(statusSaveFeedback(region))break
 }).observe(document.body,{subtree:true,childList:true,characterData:true})
}
const CAMPAIGN_PAGES=new Set(['campanhas.html','nova-campanha.html','mesa.html','aventuras.html','sessoes.html']);
/* A campanha é um espaço de edição e narrativa: termos de regras, cenários,
   atos ou eventos não devem virar links automáticos para verbetes.
   Preserva links explícitos de ações (Abrir, Nova sessão, fichas, etc.). */
function removeCampaignGlossaryLinks(){
 if(!CAMPAIGN_PAGES.has(currentPage()))return;
 for(const anchor of document.querySelectorAll('a.hub-ref,a[data-ref-id],a[href^="referencia.html?id="]')){
  anchor.replaceWith(document.createTextNode(anchor.textContent||''))
 }
}
function enhanceDynamicUi(){removeCampaignGlossaryLinks();enhanceLiveRegions();enhanceTouchGroups();enhanceStructureEditingCopy();enhanceSectionNav()}
function scheduleEnhancements(){if(enhanceFrame)return;enhanceFrame=requestAnimationFrame(()=>{enhanceFrame=0;enhanceDynamicUi();updateAppShellContext()})}
function run(){ensureStyles();applyStoredPreferences();if(!enforceLogin())return;initSaveFeedback();initAppShell();ensureSkipLink();enhanceDynamicUi();updateAppShellContext();bootstrapPageAccess();bootstrapRealtime()}

if(typeof document!=='undefined'){
 warmExternalOrigins();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else queueMicrotask(run);
 document.addEventListener('hub-rpg:sheet-ready',scheduleEnhancements);
 document.addEventListener('hub-rpg:settings-changed',event=>applyUiPreferences(event.detail));
 window.addEventListener('hub-rpg:collaboration-session-changed',event=>setRealtime(Boolean(event.detail)));
 const mo=new MutationObserver(records=>{if(records.some(record=>record.addedNodes.length||record.removedNodes.length))scheduleEnhancements()});
 if(document.documentElement)mo.observe(document.documentElement,{childList:true,subtree:true})
}

export{run as initHubUx};