import{createFirebaseCollaborationProvider,loadFirebaseConfig}from'./firebase-collaboration-provider.js?v=20260925-media2';
import{read as readCharacters}from'./character-builder/state.js';
import{readCampaigns}from'./campaign-state.js?v=20260925-media1';
import{readAdventures}from'./adventure-state.js?v=20260925-media1';

const MAX_INPUT_BYTES=20*1024*1024;
const MAX_OUTPUT_BYTES=1800000;
const MAX_WIDTH=1600;
const MAX_HEIGHT=900;
const ACCEPTED=new Set(['image/jpeg','image/png','image/webp']);
const objectUrls=new Map();
let providerPromise=null;

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const text=value=>String(value??'').trim();

async function provider(){
 if(!providerPromise)providerPromise=(async()=>{
  const config=await loadFirebaseConfig();
  if(!config.configured)throw new Error('O acesso online do Hub não está disponível.');
  return createFirebaseCollaborationProvider({config})
 })();
 return providerPromise
}
function fit(width,height,maxWidth=MAX_WIDTH,maxHeight=MAX_HEIGHT){
 const scale=Math.min(1,maxWidth/width,maxHeight/height);
 return{width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))}
}
async function decode(file){
 if(typeof createImageBitmap==='function'){
  try{
   const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
   return{source:bitmap,width:bitmap.width,height:bitmap.height,close:()=>bitmap.close?.()}
  }catch{}
 }
 const url=URL.createObjectURL(file);
 try{
  const image=await new Promise((resolve,reject)=>{
   const node=new Image();
   node.onload=()=>resolve(node);
   node.onerror=()=>reject(new Error('Não foi possível ler esta imagem.'));
   node.src=url
  });
  return{source:image,width:image.naturalWidth,height:image.naturalHeight,close:()=>{}}
 }finally{URL.revokeObjectURL(url)}
}
function canvasBlob(canvas,quality){
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Não foi possível preparar esta imagem.')),'image/webp',quality))
}
async function renderWebp(decoded,width,height,quality){
 const canvas=document.createElement('canvas');
 canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx)throw new Error('Seu navegador não conseguiu preparar a imagem.');
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality='high';
 ctx.drawImage(decoded.source,0,0,width,height);
 return canvasBlob(canvas,quality)
}
export async function optimizeImage(file){
 if(!(file instanceof Blob))throw new Error('Selecione uma imagem.');
 if(file.size>MAX_INPUT_BYTES)throw new Error('A imagem original deve ter no máximo 20 MB.');
 const mime=text(file.type).toLowerCase();
 if(!ACCEPTED.has(mime))throw new Error('Use uma imagem JPG, PNG ou WebP.');
 const decoded=await decode(file);
 try{
  if(!decoded.width||!decoded.height)throw new Error('A imagem selecionada é inválida.');
  let size=fit(decoded.width,decoded.height),quality=.86,blob=await renderWebp(decoded,size.width,size.height,quality);
  for(let attempt=0;blob.size>MAX_OUTPUT_BYTES&&attempt<7;attempt++){
   if(quality>.62)quality-=.08;
   else{size=fit(size.width,size.height,Math.round(size.width*.86),Math.round(size.height*.86));quality=.72}
   blob=await renderWebp(decoded,size.width,size.height,quality)
  }
  if(blob.size>MAX_OUTPUT_BYTES)throw new Error('Não foi possível reduzir a imagem o suficiente. Escolha outra imagem.');
  return{blob,width:size.width,height:size.height,mime:'image/webp'}
 }finally{decoded.close?.()}
}
export async function uploadImage({campaignId=null,entityType,entityId,file}={}){
 const optimized=await optimizeImage(file),bytes=new Uint8Array(await optimized.blob.arrayBuffer()),p=await provider();
 return p.saveMedia({campaignId,entityType,entityId,mime:optimized.mime,width:optimized.width,height:optimized.height,size:bytes.byteLength,bytes})
}
export async function persistCampaignMediaState(campaignId){
 const id=text(campaignId);if(!id)throw new Error('Campanha inválida para sincronização da imagem.');
 const campaign=readCampaigns().find(row=>text(row?.id)===id);
 if(!campaign)throw new Error('A Campanha vinculada à imagem não foi encontrada.');
 const adventures=readAdventures().filter(row=>text(row?.campaignId)===id),characters=readCharacters(),p=await provider();
 await p.saveCampaignBundle(campaign,adventures,characters);
 return true
}
export async function deleteImage(media){
 const id=text(media?.id);if(!id)return;
 const p=await provider();await p.deleteMedia(id);
 const url=objectUrls.get(id);if(url){URL.revokeObjectURL(url);objectUrls.delete(id)}
}
export async function mediaUrl(media){
 const id=text(media?.id);if(!id)return'';
 if(objectUrls.has(id))return objectUrls.get(id);
 const p=await provider(),record=await p.readMedia(id);
 if(!record?.bytes?.byteLength)return'';
 const url=URL.createObjectURL(new Blob([record.bytes],{type:record.mime||'image/webp'}));
 objectUrls.set(id,url);
 return url
}
export function imageElementHtml(media,legacyUrl='',options={}){
 const id=text(media?.id),fallback=text(legacyUrl),className=text(options.className),alt=String(options.alt??'');
 if(id)return `<img${className?` class="${esc(className)}"`:''} data-hub-media-id="${esc(id)}"${fallback?` data-fallback-src="${esc(fallback)}"`:''} alt="${esc(alt)}">`;
 if(fallback)return `<img${className?` class="${esc(className)}"`:''} src="${esc(fallback)}" alt="${esc(alt)}">`;
 return''
}
export function imagePickerHtml({media=null,legacyUrl='',alt='',className=''}={}){
 const has=Boolean(text(media?.id)||text(legacyUrl)),image=imageElementHtml(media,legacyUrl,{alt,className});
 return `<div class="image-picker" data-image-picker><div class="image-picker-preview" data-image-dropzone>${image||'<span class="image-picker-empty" data-image-empty>Sem imagem</span>'}</div><div class="row-actions image-picker-actions"><label class="btn secondary image-picker-button">${has?'Alterar imagem':'Selecionar imagem'}<input type="file" accept="image/jpeg,image/png,image/webp" data-image-input hidden></label><button type="button" class="secondary" data-image-remove ${has?'':'hidden'}>Remover</button></div><div class="mini image-picker-status" data-image-status role="status" aria-live="polite"></div></div>`
}
function localPreview(root,file){
 const preview=root.querySelector('[data-image-dropzone]');if(!preview)return;
 const old=root.__hubPreviewUrl;if(old)URL.revokeObjectURL(old);
 const url=URL.createObjectURL(file);root.__hubPreviewUrl=url;
 const img=document.createElement('img');img.src=url;img.alt='';
 preview.replaceChildren(img);root.querySelector('[data-image-remove]')?.removeAttribute('hidden')
}
function clearLocalPreview(root){
 const old=root.__hubPreviewUrl;if(old){URL.revokeObjectURL(old);root.__hubPreviewUrl=''}
 const preview=root.querySelector('[data-image-dropzone]');if(preview){const empty=document.createElement('span');empty.className='image-picker-empty';empty.dataset.imageEmpty='';empty.textContent='Sem imagem';preview.replaceChildren(empty)}
 root.querySelector('[data-image-remove]')?.setAttribute('hidden','')
}
export function bindImagePicker(root,{onSelect=async()=>{},onRemove=async()=>{},onError=()=>{}}={}){
 if(!root||root.dataset.imagePickerBound==='1')return()=>{};
 root.dataset.imagePickerBound='1';
 const input=root.querySelector('[data-image-input]'),drop=root.querySelector('[data-image-dropzone]'),remove=root.querySelector('[data-image-remove]'),status=root.querySelector('[data-image-status]');
 const setBusy=value=>{root.classList.toggle('busy',value);if(input)input.disabled=value;if(remove)remove.disabled=value};
 const setStatus=value=>{if(status)status.textContent=value||''};
 const choose=async file=>{
  if(!file)return;
  const previous=drop?.innerHTML||'';localPreview(root,file);setBusy(true);setStatus('Preparando imagem...');
  try{await onSelect(file);setStatus('Imagem pronta.')}catch(error){if(drop)drop.innerHTML=previous;setStatus(error?.message||'Não foi possível usar esta imagem.');onError(error)}finally{setBusy(false)}
 };
 input?.addEventListener('change',()=>{const file=input.files?.[0];if(file)choose(file)});
 drop?.addEventListener('click',event=>{if(event.target.closest('button,label,input,a'))return;input?.click()});
 for(const name of['dragenter','dragover'])drop?.addEventListener(name,event=>{event.preventDefault();root.classList.add('dragging')});
 for(const name of['dragleave','drop'])drop?.addEventListener(name,event=>{event.preventDefault();root.classList.remove('dragging')});
 drop?.addEventListener('drop',event=>{const file=[...(event.dataTransfer?.files||[])].find(item=>item.type.startsWith('image/'));if(file)choose(file)});
 remove?.addEventListener('click',async()=>{setBusy(true);setStatus('Removendo imagem...');try{await onRemove();clearLocalPreview(root);setStatus('Imagem removida.')}catch(error){setStatus(error?.message||'Não foi possível remover a imagem.');onError(error)}finally{setBusy(false)}});
 return()=>{if(root.__hubPreviewUrl)URL.revokeObjectURL(root.__hubPreviewUrl)}
}
export async function hydrateMediaImages(root=document){
 const images=[...(root?.querySelectorAll?.('img[data-hub-media-id]')||[])];
 await Promise.all(images.map(async img=>{
  const id=text(img.dataset.hubMediaId);if(!id)return;
  try{const url=await mediaUrl({id});if(url)img.src=url;else if(img.dataset.fallbackSrc)img.src=img.dataset.fallbackSrc}
  catch{if(img.dataset.fallbackSrc)img.src=img.dataset.fallbackSrc;else img.hidden=true}
 }))
}
