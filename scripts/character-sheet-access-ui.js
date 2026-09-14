import{collaborationAccessMode,canOpenCharacter,canEditCharacter}from'./collaboration-view.js?v=20260914-login-context1';

const id=new URLSearchParams(location.search).get('id')||'';
const accessMode=collaborationAccessMode(),restricted=accessMode==='player',guest=accessMode==='guest';
const canOpen=accessMode==='master'||(!guest&&canOpenCharacter(id));
const canEdit=accessMode==='master'||(!guest&&canEditCharacter(id));
let observer=null;

function deny(){
 const loading=document.getElementById('loading'),sheet=document.getElementById('sheet');
 if(sheet)sheet.hidden=true;
 if(loading){loading.hidden=false;loading.innerHTML=`<div class="status warning"><strong>Ficha indisponível.</strong><br>${guest?'Faça login para acessar esta ficha.':'Esta ficha não faz parte das suas Campanhas.'}</div>`}
}
function readOnlyBadge(){
 const hero=document.querySelector('#sheet .hero'),actions=hero?.querySelector('.actions');
 if(!hero||document.getElementById('sheet-access-state'))return;
 const badge=document.createElement('span');badge.id='sheet-access-state';badge.className='muted';badge.textContent='Somente leitura';badge.setAttribute('aria-label','Ficha de outro jogador, somente leitura');
 if(actions)actions.prepend(badge);else hero.appendChild(badge)
}
function lock(){
 if(guest){deny();return}
 if(!restricted)return;
 if(!canOpen){deny();return}
 if(canEdit)return;
 const sheet=document.getElementById('sheet');if(!sheet)return;
 sheet.setAttribute('data-read-only','true');sheet.setAttribute('aria-label','Ficha de personagem, somente leitura');
 document.getElementById('edit-link')?.setAttribute('hidden','');
 document.getElementById('save-sheet')?.setAttribute('hidden','');
 document.getElementById('save-status')?.replaceChildren(document.createTextNode('Somente leitura'));
 readOnlyBadge();
 for(const control of sheet.querySelectorAll('input,textarea,select,button')){control.disabled=true;control.setAttribute('aria-disabled','true')}
 for(const editable of sheet.querySelectorAll('[contenteditable]'))editable.setAttribute('contenteditable','false')
}
function watch(){if(observer||guest||!restricted||!canOpen||canEdit)return;observer=new MutationObserver(()=>lock());const sheet=document.getElementById('sheet');if(sheet)observer.observe(sheet,{childList:true,subtree:true})}
function apply(){lock();watch()}

if((guest||restricted)&&!canOpen){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',deny,{once:true});else deny()}
document.addEventListener('hub-rpg:sheet-ready',apply);
document.addEventListener('hub-rpg:sheet-spells-ready',apply);
document.addEventListener('hub-rpg:remote-updated',apply);
queueMicrotask(apply);
