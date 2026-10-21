import{rememberAvatars,photoDataUrl,validPortrait}from'./profile-images.js?v=20261021-user1';
import{createFirebaseCollaborationProvider}from'./firebase-collaboration-provider.js?v=20261021-users-edit1';
import{effectiveCollaborationSession,masterPreviewMode}from'./collaboration-view.js?v=20261016-master-preview1';

const $=id=>document.getElementById(id);
const list=$('user-directory-list'),directoryFeedback=$('user-directory-feedback'),editor=$('user-profile-card');
const input=$('user-avatar-input'),remove=$('user-avatar-remove'),preview=$('user-avatar-preview');
const nameInput=$('user-display-name'),nameSave=$('user-name-save'),feedback=$('user-avatar-feedback');
let provider=null,users=[],selectedUid='',ownUid='',isMaster=false,busy=false,previewing=false;

function notice(message,error=false){
 feedback.textContent=message;
 feedback.style.color=error?'var(--hub-danger,#f19ca7)':'';
}
function selected(){return users.find(user=>user.uid===selectedUid)||null}
function editablePhoto(user){return Boolean(user&&!previewing&&(isMaster||user.uid===ownUid))}
function paintAvatar(element,value,alt){
 element.replaceChildren();
 const image=validPortrait(value);
 if(image){const img=document.createElement('img');img.src=image;img.alt=alt;element.append(img)}
 else{const placeholder=document.createElement('span');placeholder.textContent='◇';placeholder.setAttribute('aria-hidden','true');element.append(placeholder)}
}
function drawList(){
 list.replaceChildren();
 for(const user of users){
  const button=document.createElement('button');button.type='button';
  button.className='hub-user-directory-item'+(selectedUid===user.uid?' is-selected':'');
  button.dataset.uid=user.uid;button.setAttribute('aria-pressed',String(selectedUid===user.uid));
  const avatar=document.createElement('span');avatar.className='hub-user-directory-avatar';
  paintAvatar(avatar,user.avatarDataUrl,'');
  const labels=document.createElement('span');labels.className='hub-user-directory-labels';
  const title=document.createElement('strong');title.textContent=user.displayName;
  const detail=document.createElement('small');detail.textContent=user.role==='dm'?'Mestre':user.username;
  labels.append(title,detail);button.append(avatar,labels);
  button.addEventListener('click',()=>{selectedUid=user.uid;notice('');drawList();drawEditor()});
  list.append(button);
 }
 directoryFeedback.textContent=users.length?`${users.length} usuário(s) cadastrado(s) no Hub.`:'Nenhum usuário cadastrado.';
}
function drawEditor(){
 const user=selected();editor.hidden=!user;if(!user)return;
 $('user-profile-heading').textContent=user.displayName;
 $('user-profile-role').textContent=user.role==='dm'?'Mestre':'Jogador';
 $('user-login-name').textContent=user.username;
 nameInput.value=user.displayName;
 nameInput.disabled=!isMaster||previewing||busy;
 nameSave.hidden=!isMaster||previewing;
 nameSave.disabled=busy;
 paintAvatar(preview,user.avatarDataUrl,'Foto de '+user.displayName);
 const canEdit=editablePhoto(user);
 preview.disabled=!canEdit||busy;
 input.disabled=!canEdit||busy;
 remove.disabled=!canEdit||busy||!validPortrait(user.avatarDataUrl);
 input.closest('.row-actions')?.classList.toggle('is-disabled',!canEdit);
 $('user-login-note').textContent='(identificador de login não editável)';
}
function loading(value){
 busy=value;drawEditor();
 for(const button of list.querySelectorAll('button'))button.disabled=value;
}
function updateLocal(saved,message){
 const i=users.findIndex(row=>row.uid===saved.uid);
 if(i<0)return;
 users[i]={...users[i],...saved};
 rememberAvatars([users[i]]);
 drawList();drawEditor();notice(message);
 window.dispatchEvent(new CustomEvent('hub-rpg:profile-photo-updated'));
}
async function init(){
 const session=effectiveCollaborationSession();
 if(!session){directoryFeedback.textContent='Entre no Hub para consultar os usuários.';return}
 previewing=masterPreviewMode();
 try{
  provider=await createFirebaseCollaborationProvider();
  if(!provider?.configured)throw new Error('Acesso online indisponível.');
  const mine=await provider.getMyProfile();
  ownUid=mine.uid;isMaster=mine.username===provider.config.ownerUsername;
  users=await provider.listUsers();
  rememberAvatars(users);
  selectedUid=users.find(user=>user.uid===ownUid)?.uid||users[0]?.uid||'';
  drawList();drawEditor();
  if(previewing)notice('Encerre a visualização como jogador para editar perfis.');
  else if(!isMaster)notice('Você pode alterar sua própria foto. Apenas o Mestre pode editar nomes e perfis de outros usuários.');
  else notice('Selecione um usuário para editar nome e foto.');
 }catch(error){directoryFeedback.textContent=error?.message||'Não foi possível carregar os usuários.';notice(directoryFeedback.textContent,true)}
}
preview?.addEventListener('click',()=>{if(editablePhoto(selected())&&!busy)input.click()});
input?.addEventListener('change',async()=>{
 const file=input.files?.[0],user=selected();input.value='';
 if(!file||!user||!provider||busy||!editablePhoto(user))return;
 loading(true);try{
  const url=await photoDataUrl(file,{dimension:256,maxLength:110000});
  const saved=await provider.saveUserProfile({uid:user.uid,avatarDataUrl:url});
  updateLocal(saved,'Foto atualizada.');
 }catch(error){notice(error?.message||'Não foi possível atualizar a foto.',true)}finally{loading(false)}
});
remove?.addEventListener('click',async()=>{
 const user=selected();if(!user||!provider||busy||!editablePhoto(user)||!validPortrait(user.avatarDataUrl))return;
 loading(true);try{
  const saved=await provider.saveUserProfile({uid:user.uid,avatarDataUrl:''});
  updateLocal(saved,'Foto removida.');
 }catch(error){notice(error?.message||'Não foi possível remover a foto.',true)}finally{loading(false)}
});
nameSave?.addEventListener('click',async()=>{
 const user=selected();if(!user||!provider||busy||!isMaster||previewing)return;
 const displayName=nameInput.value.trim();
 loading(true);try{
  const saved=await provider.saveUserProfile({uid:user.uid,displayName});
  updateLocal(saved,'Nome atualizado.');
 }catch(error){notice(error?.message||'Não foi possível atualizar o nome.',true)}finally{loading(false)}
});
void init();
