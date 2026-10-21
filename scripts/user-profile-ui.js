import{rememberAvatars,photoDataUrl,validPortrait}from'./profile-images.js?v=20261021-user1';
import{createFirebaseCollaborationProvider}from'./firebase-collaboration-provider.js?v=20261021-user-profiles1';
import{effectiveCollaborationSession,masterPreviewMode}from'./collaboration-view.js?v=20261016-master-preview1';
const input=document.getElementById('user-avatar-input'),remove=document.getElementById('user-avatar-remove'),preview=document.getElementById('user-avatar-preview'),feedback=document.getElementById('user-avatar-feedback');
let provider=null,busy=false,current='';
const state=(message,error=false)=>{feedback.textContent=message;feedback.style.color=error?'var(--hub-danger,#f19ca7)':''};
function paint(value){
 current=validPortrait(value);
 preview.replaceChildren();
 if(current){const img=document.createElement('img');img.src=current;img.alt='Sua imagem de usuário';preview.append(img)}
 else{const icon=document.createElement('span');icon.textContent='◇';icon.setAttribute('aria-hidden','true');preview.append(icon)}
 remove.disabled=busy||!current;
  preview?.setAttribute("aria-disabled",String(busy||!provider));
}
function loading(value){busy=value;input.disabled=value;remove.disabled=value||!current;preview?.setAttribute("aria-disabled",String(value||!provider))}
async function init(){
 const session=effectiveCollaborationSession();
 if(!session){state('Entre com sua conta para alterar a imagem.',true);input.disabled=true;remove.disabled=true;return}
 if(masterPreviewMode()){state('Encerre a visualização de jogador para editar seu perfil.',true);input.disabled=true;remove.disabled=true;return}
 try{
  provider=await createFirebaseCollaborationProvider();
  if(!provider?.configured)throw new Error('Acesso online indisponível.');
  const profile=await provider.getMyProfile();
  paint(profile.avatarDataUrl);rememberAvatars([profile]);
  state('Imagem vinculada à sua conta.');
 }catch(error){state(error?.message||'Não foi possível carregar sua conta.',true);input.disabled=true;remove.disabled=true}
}
input?.addEventListener('change',async()=>{const file=input.files?.[0];if(!file||!provider||busy)return;loading(true);try{
 const url=await photoDataUrl(file,{dimension:256,maxLength:110000});
 const profile=await provider.saveMyAvatar(url);rememberAvatars([profile]);paint(url);state('Imagem atualizada.');window.dispatchEvent(new CustomEvent('hub-rpg:profile-photo-updated'))
 }catch(error){state(error?.message||'Não foi possível salvar sua imagem.',true)}finally{input.value='';loading(false)}
});
remove?.addEventListener('click',async()=>{if(!provider||busy||!current)return;loading(true);try{const profile=await provider.saveMyAvatar('');rememberAvatars([profile]);paint('');state('Imagem removida.');window.dispatchEvent(new CustomEvent('hub-rpg:profile-photo-updated'))}catch(error){state(error?.message||'Não foi possível remover a imagem.',true)}finally{loading(false)}});
function openAvatarPicker(){if(provider&&!busy&&!input.disabled)input.click()}
preview?.addEventListener('click',openAvatarPicker);
preview?.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openAvatarPicker()}});
void init();