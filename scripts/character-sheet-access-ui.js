import{collaborationAccessMode,canOpenCharacter,canEditCharacter}from'./collaboration-view.js?v=20260917-master-full-control1';

const id=new URLSearchParams(location.search).get('id')||'';
const accessMode=collaborationAccessMode(),guest=accessMode==='guest';
const canOpen=!guest&&canOpenCharacter(id);
const canEdit=!guest&&canEditCharacter(id);
let observer=null;

function deny(){
 const loading=document.getElementById('loading'),sheet=document.getElementById('sheet');
 if(sheet)sheet.hidden=true;
 if(loading){loading.hidden=false;loading.innerHTML=`<div class="status warning"><strong>Ficha indisponível.</strong><br>${guest?'Faça login para acessar esta ficha.':'Esta ficha não faz parte dos seus acessos.'}</div>`}
}
async function deleteAsMaster(){
 if(accessMode!=='master'||!id)return;
 if(!confirm('Excluir este personagem permanentemente?'))return;
 const button=document.getElementById('master-delete-character');if(button){button.disabled=true;button.textContent='Excluindo...'}
 try{
  const module=await import('./character-admin-actions.js?v=20260918-master-delete1');
  await module.deleteCharacterAsMaster(id);
  location.href='lista-personagens.html?v=20260918-master-delete1'
 }catch(error){
  alert(error?.message||'Não foi possível excluir o personagem.');
  if(button){button.disabled=false;button.textContent='Excluir personagem'}
 }
}
function ensureMasterDelete(){
 if(accessMode!=='master'||!canOpen||document.getElementById('master-delete-character'))return;
 const actions=document.querySelector('#sheet .hero .actions');if(!actions)return;
 const button=document.createElement('button');button.id='master-delete-character';button.type='button';button.className='btn danger';button.textContent='Excluir personagem';button.addEventListener('click',deleteAsMaster);actions.appendChild(button)
}
function readOnlyBadge(){
 const hero=document.querySelector('#sheet .hero'),actions=hero?.querySelector('.actions');
 if(!hero||document.getElementById('sheet-access-state'))return;
 const badge=document.createElement('span');badge.id='sheet-access-state';badge.className='muted';badge.textContent='Somente leitura';badge.setAttribute('aria-label','Ficha somente leitura');
 if(actions)actions.prepend(badge);else hero.appendChild(badge)
}
function lock(){
 if(guest){deny();return}
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
function watch(){if(observer||guest||!canOpen||canEdit)return;observer=new MutationObserver(()=>lock());const sheet=document.getElementById('sheet');if(sheet)observer.observe(sheet,{childList:true,subtree:true})}
function apply(){lock();ensureMasterDelete();watch()}

if(guest||!canOpen){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',deny,{once:true});else deny()}
document.addEventListener('hub-rpg:sheet-ready',apply);
document.addEventListener('hub-rpg:sheet-spells-ready',apply);
document.addEventListener('hub-rpg:remote-updated',apply);
queueMicrotask(apply);
