import{readCampaigns,writeCampaigns,createCampaign,campaignUid}from'./campaign-state.js?v=20261016-current-status2';
import{uploadImage,deleteImage,persistCampaignMediaState,imagePickerHtml,bindImagePicker}from'./image-media.js?v=20260925-media2';
import{playerMode}from'./collaboration-view.js?v=20261016-master-preview1';
const $=id=>document.getElementById(id);
const DM_NAME='Rafael',SYSTEM_NAME='D&D 5.5e';
let pendingCoverFile=null,creating=false;
function note(message){const target=$('storage-note');if(target)target.textContent=message}
async function create(event){
 event?.preventDefault();
 if(creating||playerMode())return;
 const name=$('campaign-name')?.value.trim();
 if(!name){note('Informe o nome da campanha.');$('campaign-name')?.focus();return}
 const button=$('create-campaign'),id=campaignUid(),before=readCampaigns();
 let media=null;
 creating=true;if(button)button.disabled=true;
 try{
  if(pendingCoverFile){
   note('Salvando imagem...');
   media=await uploadImage({campaignId:id,entityType:'campaign',entityId:id,file:pendingCoverFile})
  }
  const result=createCampaign(before,{
   id,name,system:SYSTEM_NAME,dmName:DM_NAME,
   status:$('campaign-status')?.value||'planned',
   setting:$('campaign-setting')?.value.trim()||'',
   worldPlane:$('campaign-world-plane')?.value.trim()||'',
   mainRegion:$('campaign-main-region')?.value.trim()||'',
   coverImage:media,coverImageUrl:'',
   description:$('campaign-description')?.value||''
  });
  if(!result.ok)throw new Error(result.reason||'Não foi possível criar a campanha.');
  writeCampaigns(result.list);
  note('Salvando campanha...');
  try{await persistCampaignMediaState(id,{entityType:'campaign',entityId:id})}
  catch(error){writeCampaigns(before);if(media)await deleteImage(media).catch(()=>{});throw error}
  location.assign('mesa.html?id='+encodeURIComponent(id))
 }catch(error){note(error?.message||'Não foi possível salvar a campanha.')}
 finally{creating=false;if(button)button.disabled=false}
}
function init(){
 if(playerMode()){location.replace('campanhas.html');return}
 const holder=$('campaign-cover-picker');
 if(holder){
  holder.innerHTML=imagePickerHtml({});
  bindImagePicker(holder.querySelector('[data-image-picker]'),{
   onSelect:async file=>{pendingCoverFile=file},
   onRemove:async()=>{pendingCoverFile=null},
   onError:error=>note(error?.message||'Não foi possível usar esta imagem.')
  })
 }
 $('campaign-create-form')?.addEventListener('submit',create)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
