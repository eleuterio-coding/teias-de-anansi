import{rememberAvatars,photoDataUrl,validPortrait}from'./profile-images.js?v=20261021-user1';
import{createFirebaseCollaborationProvider}from'./firebase-collaboration-provider.js?v=20261022-chronicles-final3';
import{effectiveCollaborationSession,masterPreviewMode}from'./collaboration-view.js?v=20261016-master-preview1';
import{updateAppShellContext}from'./app-shell.js?v=20261022-chronicles-final3';

const $=id=>document.getElementById(id);
const input=$('user-avatar-input'),remove=$('user-avatar-remove'),preview=$('user-avatar-preview'),feedback=$('user-avatar-feedback');
const directory=$('hub-users-list'),adminCard=$('user-admin-card'),adminForm=$('user-admin-form');
const adminImage=$('admin-avatar-preview'),adminInput=$('admin-avatar-file'),adminRemove=$('admin-avatar-remove');
const text=value=>String(value??'').trim();
let provider=null,busy=false,current='',myProfile=null,isMaster=false,profiles=[];
let selectedUid='',stagedAvatar='',avatarTouched=false,adminBusy=false;

function status(node,message,error=false){
 if(!node)return;
 node.textContent=message;
 node.style.color=error?'var(--hub-red,#ff9898)':'';
}
function pictureInto(node,source,alt=''){
 if(!node)return;
 node.replaceChildren();
 const safe=validPortrait(source);
 if(safe){const image=document.createElement('img');image.src=safe;image.alt=alt;node.appendChild(image)}
 else{const mark=document.createElement('span');mark.textContent='◇';mark.setAttribute('aria-hidden','true');node.appendChild(mark)}
}
function paint(value){
 current=validPortrait(value);
 pictureInto(preview,current,'Minha imagem de usuário');
 if(remove)remove.disabled=busy||!current;
 preview?.setAttribute('aria-disabled',String(busy||!provider));
}
function ownLoading(value){
 busy=value;
 if(input)input.disabled=value;
 if(remove)remove.disabled=value||!current;
 preview?.setAttribute('aria-disabled',String(value||!provider));
}
function openAvatarPicker(){if(provider&&!busy&&!input.disabled)input.click()}
preview?.addEventListener('click',openAvatarPicker);
preview?.addEventListener('keydown',event=>{
 if(event.key==='Enter'||event.key===' '){event.preventDefault();openAvatarPicker()}
});

function allowedProfiles(rows){
 const allowed=new Set([text(provider?.config?.ownerUsername),...(provider?.config?.playerAccounts||[]).map(spec=>text(spec.username))].map(n=>n.toLowerCase()).filter(Boolean));
 const byName=new Map();
 for(const row of rows||[]){
  const name=text(row.username).toLowerCase();
  if(!name||!allowed.has(name)||!text(row.uid))continue;
  byName.set(name,{uid:text(row.uid),username:name,displayName:text(row.displayName)||name,avatarDataUrl:validPortrait(row.avatarDataUrl)});
 }
 if(myProfile?.uid&&allowed.has(text(myProfile.username).toLowerCase())){
  const key=text(myProfile.username).toLowerCase();
  if(!byName.has(key))byName.set(key,{...myProfile,avatarDataUrl:validPortrait(myProfile.avatarDataUrl)});
 }
 return[...byName.values()].sort((a,b)=>a.displayName.localeCompare(b.displayName,'pt-BR'));
}
function profileForSelection(){return profiles.find(row=>row.uid===selectedUid)||null}
const linkedProfile=new URLSearchParams(location.search).get('user')?.trim().toLowerCase()||'';
const returnCampaign=new URLSearchParams(location.search).get('campaign')||'';
function renderFocusedProfile(){
 const card=$('hub-user-focused-profile');
 if(!card)return;
 if(!isMaster){card.hidden=true;return}
 const row=profiles.find(profile=>profile.username===linkedProfile);
 card.hidden=!row;if(!row)return;
 $('hub-focused-user-title').textContent=row.username===text(provider?.config?.ownerUsername)?'Perfil do Mestre':'Perfil do jogador';
 $('hub-focused-user-name').textContent=row.displayName;
 $('hub-focused-user-login').textContent='Usuário: @'+row.username;
 $('hub-focused-user-role').textContent=row.username===text(provider?.config?.ownerUsername)?'Mestre':'Jogador';
 pictureInto($('hub-focused-user-avatar'),row.avatarDataUrl,'Foto de '+row.displayName);
 const back=$('hub-user-profile-back');
 if(back){back.hidden=!returnCampaign;if(returnCampaign)back.href='mesa.html?id='+encodeURIComponent(returnCampaign)}
}

function renderDirectory(){
 const accessLink=$('hub-users-manage-access');
 if(accessLink)accessLink.hidden=!isMaster;
 directory?.replaceChildren();
 const count=$('hub-users-count');if(count)count.textContent=`${profiles.length} ${profiles.length===1?'usuário':'usuários'}`;
 if(!profiles.length){status($('hub-users-feedback'),'Nenhuma conta cadastrada.');return}
 status($('hub-users-feedback'),'');
 for(const row of profiles){
  const item=document.createElement(isMaster?'button':'div');
  item.className='hub-user-list-item';
  if(row.username===linkedProfile)item.classList.add('hub-user-list-item-focused');
  if(isMaster){
   item.type='button';
   item.dataset.userSelect=row.uid;
   item.setAttribute('aria-pressed',String(selectedUid===row.uid));
   item.setAttribute('aria-label',`Editar ${row.displayName}`);
   item.addEventListener('click',()=>selectUser(row.uid));
  }
  const photo=document.createElement('span');photo.className='hub-user-list-photo';
  pictureInto(photo,row.avatarDataUrl,'');
  const details=document.createElement('span');details.className='hub-user-list-details';
  const title=document.createElement('strong');title.textContent=row.displayName;
  const login=document.createElement('small');login.textContent=`@${row.username}`;
  const role=document.createElement('small');role.textContent=row.username===text(provider?.config?.ownerUsername)?'Mestre':'Jogador';
  details.append(title,login,role);item.append(photo,details);directory?.appendChild(item);
 }
}
function renderAdmin(){
 const row=profileForSelection();
 if(!isMaster||!row){if(adminCard)adminCard.hidden=true;return}
 adminCard.hidden=false;
 $('admin-display-name').value=row.displayName;
 $('admin-login-name').textContent=`Login: @${row.username}`;
 stagedAvatar=validPortrait(row.avatarDataUrl);
 avatarTouched=false;
 pictureInto(adminImage,stagedAvatar,`Imagem de ${row.displayName}`);
 adminRemove.disabled=!stagedAvatar;
 adminInput.disabled=false;
 status($('admin-feedback'),'');
}
function selectUser(uid){
 if(!isMaster||adminBusy)return;
 selectedUid=uid;
 renderDirectory();renderAdmin();
 adminCard?.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function setAdminBusy(value){
 adminBusy=value;
 for(const id of ['admin-display-name','admin-avatar-file','admin-save','admin-cancel']){
  const node=$(id);if(node)node.disabled=value;
 }
 if(adminImage)adminImage.disabled=value;
 if(adminRemove)adminRemove.disabled=value||!stagedAvatar;
}
async function refreshDirectory(){
 if(!isMaster){
  profiles=myProfile?[myProfile]:[];
  directory?.replaceChildren();
  if(adminCard)adminCard.hidden=true;
  renderFocusedProfile();
  return;
 }
 const rows=await provider.listUsers();
 profiles=allowedProfiles(rows);
 rememberAvatars(profiles);
 if(selectedUid&&!profiles.some(row=>row.uid===selectedUid))selectedUid='';
 if(isMaster&&!selectedUid)selectedUid=profiles.find(row=>row.uid===myProfile?.uid)?.uid||profiles[0]?.uid||'';
 const fromLink=profiles.find(row=>row.username===linkedProfile);
 if(fromLink&&isMaster)selectedUid=fromLink.uid;
 renderDirectory();
 if(isMaster)renderAdmin();
 renderFocusedProfile();
}
function announceUpdate(){
 window.dispatchEvent(new CustomEvent('hub-rpg:profile-photo-updated',{detail:{username:myProfile?.username,displayName:myProfile?.displayName,avatarDataUrl:myProfile?.avatarDataUrl}}));
}

input?.addEventListener('change',async()=>{
 const file=input.files?.[0];input.value='';
 if(!file||!provider||busy)return;
 ownLoading(true);
 try{
  const url=await photoDataUrl(file,{dimension:256,maxLength:110000});
  const result=await provider.saveMyAvatar(url);
  myProfile={...myProfile,...result};rememberAvatars([myProfile]);
  paint(url);status(feedback,'Imagem atualizada.');
  announceUpdate();
  await refreshDirectory();
  if(linkedProfile&&!$('hub-user-focused-profile')?.hidden){
   requestAnimationFrame(()=>$('hub-user-focused-profile')?.scrollIntoView({block:'start',behavior:'auto'}));
  }
 }catch(error){status(feedback,error?.message||'Não foi possível salvar a imagem.',true)}
 finally{ownLoading(false)}
});
remove?.addEventListener('click',async()=>{
 if(!provider||busy||!current)return;
 ownLoading(true);
 try{
  const result=await provider.saveMyAvatar('');
  myProfile={...myProfile,...result};rememberAvatars([myProfile]);
  paint('');status(feedback,'Imagem removida.');
  announceUpdate();
  await refreshDirectory();
 }catch(error){status(feedback,error?.message||'Não foi possível remover a imagem.',true)}
 finally{ownLoading(false)}
});

adminImage?.addEventListener('click',()=>{if(isMaster&&!adminBusy&&selectedUid)adminInput?.click()});
adminInput?.addEventListener('change',async()=>{
 const file=adminInput.files?.[0],target=selectedUid;adminInput.value='';
 if(!file||!isMaster||adminBusy||!target)return;
 setAdminBusy(true);
 try{
  const url=await photoDataUrl(file,{dimension:256,maxLength:110000});
  if(selectedUid!==target)return;
  stagedAvatar=url;avatarTouched=true;
  pictureInto(adminImage,url,'Imagem selecionada');
  status($('admin-feedback'),'Imagem selecionada.');
 }catch(error){status($('admin-feedback'),error?.message||'Imagem inválida.',true)}
 finally{setAdminBusy(false)}
});
adminRemove?.addEventListener('click',()=>{
 if(!isMaster||adminBusy||!selectedUid)return;
 stagedAvatar='';avatarTouched=true;
 pictureInto(adminImage,'');
 adminRemove.disabled=true;
 status($('admin-feedback'),'Imagem removida da prévia.');
});
adminForm?.addEventListener('submit',async event=>{
 event.preventDefault();
 const selected=profileForSelection(),name=text($('admin-display-name').value);
 if(!isMaster||!selected||adminBusy)return;
 if(!name||name.length>80){status($('admin-feedback'),'Informe um nome de até 80 caracteres.',true);return}
 const changes={uid:selected.uid};
 if(name!==selected.displayName)changes.displayName=name;
 if(avatarTouched)changes.avatarDataUrl=stagedAvatar;
 if(!('displayName'in changes)&&!('avatarDataUrl'in changes)){status($('admin-feedback'),'Nenhuma alteração para salvar.');return}
 setAdminBusy(true);
 try{
  const updated=await provider.saveManagedUserProfile(changes);
  if(myProfile?.uid===updated.uid){
   myProfile={...myProfile,...updated};
   $('own-display-name').textContent=myProfile.displayName;
   paint(myProfile.avatarDataUrl);
  }
  rememberAvatars([updated]);
  announceUpdate();
  await refreshDirectory();
  status($('admin-feedback'),'Alterações salvas.');
 }catch(error){status($('admin-feedback'),error?.message||'Não foi possível salvar este perfil.',true)}
 finally{setAdminBusy(false)}
});
$('admin-cancel')?.addEventListener('click',()=>{if(!adminBusy)renderAdmin()});

async function init(){
 const session=effectiveCollaborationSession();
 if(!session){status(feedback,'Entre com sua conta para acessar perfis.',true);ownLoading(true);return}
 if(masterPreviewMode()){status(feedback,'Encerre a visualização de jogador para acessar perfis.',true);ownLoading(true);return}
 try{
  provider=await createFirebaseCollaborationProvider();
  if(!provider?.configured)throw new Error('Acesso online indisponível.');
  // getMyProfile aguarda o Firebase restaurar a sessão antes de consultar o usuário.
  myProfile=await provider.getMyProfile();
  const account=await provider.currentUser();
  if(!account)throw new Error('Faça login para acessar perfis.');
  isMaster=Boolean(session.isMaster&&account.username===text(provider.config.ownerUsername));
  if(!myProfile||myProfile.uid!==account.uid)throw new Error('Não foi possível confirmar o perfil da conta.');
  document.body.classList.toggle('hub-self-profile-only',!isMaster);
  const directoryCard=document.querySelector('.hub-user-directory');if(directoryCard)directoryCard.hidden=!isMaster;
  const heading=document.querySelector('.hub-users-page>.top h1');
  if(heading)heading.textContent=isMaster?'Usuários':'Usuário';
  document.title=(isMaster?'Usuários':'Usuário')+' - Teias de Anansi';
  updateAppShellContext();
  $('own-display-name').textContent=myProfile.displayName||myProfile.username;
  $('own-username').textContent='@'+myProfile.username+' · '+(isMaster?'Mestre':'Jogador');
  paint(myProfile.avatarDataUrl);rememberAvatars([myProfile]);
  announceUpdate();
  status(feedback,'');
  await refreshDirectory();
 }catch(error){
  status(feedback,error?.message||'Não foi possível carregar perfis.',true);
  status($('hub-users-feedback'),'Não foi possível carregar os usuários.',true);
  ownLoading(true);
 }
}
void init();
