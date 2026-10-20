import{uploadImage,deleteImage,persistCampaignMediaState,imageElementHtml,hydrateMediaImages}from'./image-media.js?v=20261019-disclosure1';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const locationPatch=rows=>({importantLocationEntries:rows,importantLocations:rows.map(row=>row.name).join('\n')});
export function reorderLocationRows(rows,sourceIndex,targetIndex,position='before'){
 const from=Number(sourceIndex),to=Number(targetIndex);
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=rows.length||to>=rows.length||from===to)return null;
 const next=[...rows],item=next.splice(from,1)[0];
 next.splice(to+(position==='after'?1:0)-(from<to?1:0),0,item);
 return next;
}
export function locationThumbnail(item){
 const label=esc(item.name),exists=Boolean(item.image?.id);
 return `<span class="campaign-location-image-slot">
 <button type="button" class="campaign-location-thumb" data-location-preview="${esc(item.id)}" title="${exists?'Ampliar imagem':'Adicionar imagem'}" aria-label="${exists?'Ampliar imagem de':'Adicionar imagem a'} ${label}">${exists?imageElementHtml(item.image,'',{alt:`Imagem de ${item.name}`}):'<span aria-hidden="true">▧</span>'}</button>
 <label class="campaign-location-upload" title="${exists?'Trocar imagem':'Enviar imagem'}"><span aria-hidden="true">▣</span><input type="file" data-location-image-file="${esc(item.id)}" accept="image/jpeg,image/png,image/webp" aria-label="Selecionar imagem de ${label}"></label>
 ${exists?`<button type="button" class="campaign-location-clear" data-location-image-clear="${esc(item.id)}" aria-label="Remover imagem de ${label}" title="Remover imagem">×</button>`:''}
 </span>`;
}
function enlarge(item){
 const dialog=document.createElement('dialog');dialog.className='campaign-location-lightbox';
 dialog.innerHTML=`<div class="campaign-location-lightbox-head"><strong>${esc(item.name)}</strong><button type="button" class="secondary" data-close-location-image>Fechar</button></div>${imageElementHtml(item.image,'',{alt:`Imagem de ${item.name}`})}`;
 document.body.appendChild(dialog);
 dialog.querySelector('[data-close-location-image]')?.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 dialog.showModal();void hydrateMediaImages(dialog).catch(()=>{});
}
export function bindLocationImages({root,getCampaign,save,refresh,feedback}){
 const read=()=>getCampaign()?.importantLocationEntries||[];
 const apply=(rows,message)=>{
  save(locationPatch(rows),{message});refresh('locais');
 };
 root.addEventListener('click',event=>{
  const target=event.target.closest?.('[data-location-preview],[data-location-image-clear]');
  if(!target)return;
  const campaign=getCampaign(),item=read().find(row=>row.id===(target.dataset.locationPreview||target.dataset.locationImageClear));
  if(!item)return;
  if(target.matches('[data-location-preview]')){
   if(item.image?.id)enlarge(item);
   else target.parentElement?.querySelector('[data-location-image-file]')?.click();
   return;
  }
  if(!item.image?.id)return;
  apply(read().map(row=>row.id===item.id?{...row,image:null}:row),'Imagem removida.');
  void persistCampaignMediaState(campaign.id,{entityType:'campaign',entityId:campaign.id})
    .then(()=>deleteImage(item.image)).catch(error=>feedback(error?.message||'Não foi possível sincronizar a remoção.',false));
 });
 root.addEventListener('change',async event=>{
  const input=event.target;
  if(!input.matches?.('[data-location-image-file]'))return;
  const file=input.files?.[0],campaign=getCampaign(),rows=read(),item=rows.find(row=>row.id===input.dataset.locationImageFile);
  if(!file||!item||!campaign)return;
  input.disabled=true;let uploaded=null;
  try{
   uploaded=await uploadImage({campaignId:campaign.id,entityType:'campaign',entityId:campaign.id,file});
   // Evita sobrescrever mudanças da lista feitas enquanto a imagem era preparada.
   const current=read(),existing=current.find(row=>row.id===item.id);
   if(!existing){await deleteImage(uploaded);return}
   const before=locationPatch(current),previous=existing.image;
   apply(current.map(row=>row.id===item.id?{...row,image:uploaded}:row),'Imagem adicionada.');
   try{await persistCampaignMediaState(campaign.id,{entityType:'campaign',entityId:campaign.id})}
   catch(error){save(before,{message:'Imagem anterior restaurada.'});refresh('locais');await deleteImage(uploaded).catch(()=>{});throw error}
   if(previous?.id)await deleteImage(previous).catch(()=>{});
  }catch(error){feedback(error?.message||'Não foi possível salvar a imagem.',false)}
  finally{input.disabled=false}
 });
}
