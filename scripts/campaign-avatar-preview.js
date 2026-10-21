/* Visualização ampliada dos retratos usados nas campanhas.
   A URL vem exclusivamente de uma imagem já renderizada e validada pelo Hub. */
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const attached=new WeakSet();
export function campaignAvatarHtml(avatarHtml,label){
 if(!avatarHtml.includes('<img'))return avatarHtml;
 return `<button type="button" class="campaign-avatar-trigger" data-campaign-avatar-preview aria-label="Ampliar imagem de ${esc(label)}" title="Ampliar imagem de ${esc(label)}">${avatarHtml}</button>`;
}
export function bindCampaignAvatarPreviews(root){
 if(!root||attached.has(root))return;
 attached.add(root);
 root.addEventListener('click',event=>{
  const button=event.target.closest('[data-campaign-avatar-preview]');
  if(!button||!root.contains(button))return;
  event.preventDefault();
  event.stopPropagation();
  const original=button.querySelector('img');
  const src=original?.getAttribute('src');
  if(!src||!/^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(src))return;
  const caption=button.getAttribute('aria-label')?.replace(/^Ampliar imagem de /,'')||'Imagem';
  const dialog=document.createElement('dialog');
  dialog.className='campaign-avatar-lightbox';
  const head=document.createElement('div');head.className='campaign-location-lightbox-head';
  const title=document.createElement('strong');title.textContent=caption;
  const close=document.createElement('button');close.type='button';close.className='secondary';close.textContent='Fechar';close.setAttribute('aria-label','Fechar imagem ampliada');
  const image=document.createElement('img');image.src=src;image.alt=caption;
  head.append(title,close);dialog.append(head,image);
  document.body.append(dialog);
  const returnFocus=()=>{dialog.remove();if(button.isConnected)button.focus()};
  dialog.addEventListener('close',returnFocus,{once:true});
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  dialog.showModal();close.focus();
 });
}
