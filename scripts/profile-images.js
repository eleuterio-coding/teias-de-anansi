const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const userKey=value=>String(value??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const playerTerm=value=>userKey(value)==='fernanda'?'Jogadora':'Jogador';
export const validPortrait=value=>typeof value==='string'&&/^data:image\/(?:webp|png|jpeg);base64,[a-zA-Z0-9+/=]+$/.test(value)&&value.length<300000?value:'';
export const userPicture=(name,profiles=[])=>{
 const wanted=userKey(name);
 return validPortrait((Array.isArray(profiles)?profiles:[]).find(p=>userKey(p.username||p.displayName)===wanted)?.avatarDataUrl);
};
export const playerAvatarHtml=(name,profiles=[],extraClass='')=>{
 const picture=userPicture(name,profiles),initial=Array.from(String(name||'J').trim())[0]?.toLocaleUpperCase('pt-BR')||'J';
 return picture?`<span class="roster-avatar hub-user-photo ${escapeHtml(extraClass)}"><img alt="" src="${picture}"></span>`:`<span class="roster-avatar ${escapeHtml(extraClass)}" aria-hidden="true">${escapeHtml(initial)}</span>`;
};
export const characterPicture=character=>validPortrait(character?.portraitDataUrl||character?.sheet?.portraitDataUrl);
export const characterAvatarHtml=(character,extraClass='')=>{
 const portrait=characterPicture(character);
 return portrait?`<span class="hub-character-photo ${escapeHtml(extraClass)}"><img alt="" src="${portrait}"></span>`:`<span class="hub-character-photo hub-character-photo-empty ${escapeHtml(extraClass)}" aria-hidden="true">◇</span>`;
};
export async function photoDataUrl(file,{dimension=320,maxLength=125000}={}){
 if(!file||!/^image\/(png|jpeg|webp)$/.test(file.type))throw new Error('Escolha uma imagem PNG, JPG ou WebP.');
 if(file.size>12*1024*1024)throw new Error('A imagem deve ter no máximo 12 MB.');
 const objectUrl=URL.createObjectURL(file);
 try{
  const image=new Image();
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Imagem inválida.'));image.src=objectUrl});
  const scale=Math.min(1,dimension/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  let output='';
  for(const quality of [.84,.70,.55,.40]){output=canvas.toDataURL('image/webp',quality);if(validPortrait(output)&&output.length<=maxLength)break}
  if(!validPortrait(output)||output.length>maxLength)throw new Error('Não foi possível reduzir a imagem para o tamanho permitido.');
  return output;
 }finally{URL.revokeObjectURL(objectUrl)}
}
