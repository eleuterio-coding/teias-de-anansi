import{playerTerm,photoDataUrl,characterPicture}from'../profile-images.js?v=20261021-user1';
import{state,$,arr,num,esc}from'./state.js';
import{normalizeCharacterGender}from'../character-gender.js?v=20261019-gender1';
import{derive}from'./rules.js';
import{languageOutcome}from'./language-mechanics.js?v=20260923-race-language-builder1';
import{ownedEquipment,ownedItemCount,formatOwnedRows}from'./equipment-ownership.js?v=20260826-equipment-ownership1';

function ensureSheetState(){
 const c=state.c;
 c.sheet=c.sheet||{};
 c.sheet.profile={player:'',experience:'',age:'',gender:'',height:'',weight:'',hair:'',eyes:'',skin:'',alignment:'',faith:'',languages:'',...(c.sheet.profile||{})};
 c.sheet.roleplay={personality:'',ideal:'',bond:'',flaw:'',notes:'',...(c.sheet.roleplay||{})};
 c.sheet.runtime={currentHp:null,tempHp:0,inspiration:false,conditions:[],exhaustion:0,deathSuccess:0,deathFail:0,spellSlotsUsed:{},...(c.sheet.runtime||{})};
 c.sheet.runtime.conditions=arr(c.sheet.runtime.conditions);
 c.sheet.runtime.spellSlotsUsed={...(c.sheet.runtime.spellSlotsUsed||{})};
 c.sheet.inventory={cp:0,sp:0,ep:0,gp:0,pp:0,notes:'',magicItems:'',otherHoldings:'',...(c.sheet.inventory||{})};
 c.sheet.extraSpells=c.sheet.extraSpells||'';
}


let portraitBusy=false;
function renderOriginPortrait(){
  const preview=$('origin-portrait-preview'),input=$('origin-portrait-file'),remove=$('origin-portrait-remove');
  if(!preview||!state.c)return;
  const picture=characterPicture(state.c);
  preview.replaceChildren();
  if(picture){const image=document.createElement('img');image.src=picture;image.alt='Imagem do personagem';preview.appendChild(image)}
  else{const mark=document.createElement('span');mark.textContent='◇';mark.setAttribute('aria-hidden','true');preview.appendChild(mark)}
  if(input)input.disabled=portraitBusy;
  if(remove)remove.disabled=portraitBusy||!picture;
}
function initOriginPortrait(){
  const input=$('origin-portrait-file'),remove=$('origin-portrait-remove'),status=$('origin-portrait-status');
  if(!input||input.dataset.bound==='true')return;
  input.dataset.bound='true';renderOriginPortrait();
  input.addEventListener('change',async()=>{
    const file=input.files?.[0];input.value='';
    if(!file||portraitBusy)return;
    const currentCharacter=state.c;
    portraitBusy=true;renderOriginPortrait();
    try{
      const picture=await photoDataUrl(file,{dimension:360,maxLength:115000});
      if(state.c!==currentCharacter)return;
      state.c.portraitDataUrl=picture;
      if(status)status.textContent='Imagem selecionada. Salve o personagem para manter a alteração.';
    }catch(error){if(status)status.textContent=error?.message||'Imagem inválida.'}
    finally{portraitBusy=false;renderOriginPortrait()}
  });
  remove?.addEventListener('click',()=>{
    if(portraitBusy||!state.c)return;
    state.c.portraitDataUrl='';
    if(state.c.sheet)delete state.c.sheet.portraitDataUrl;
    renderOriginPortrait();
    if(status)status.textContent='Imagem removida. Salve o personagem para manter a alteração.';
  });
  document.addEventListener('hub:new-character',()=>{
    if(status)status.textContent='';
    renderOriginPortrait();
  });
}

function setValue(id,value){const el=$(id);if(el)el.value=value??''}
function row(label,value){return`<div class="value-row"><span>${esc(label)}</span><strong>${esc(value||'—')}</strong></div>`}
function textBlock(label,value){return`<div class="preview-block"><strong>${esc(label)}</strong><p>${esc(value||'—')}</p></div>`}
function coins(inv){return[['PC',inv.cp],['PP',inv.sp],['PE',inv.ep],['PO',inv.gp],['PL',inv.pp]].filter(([,v])=>num(v)>0).map(([k,v])=>`${num(v)} ${k}`).join(' · ')||'—'}
function languages(){return languageOutcome().all.join(', ')||'—'}
function ownedRow(label,rows){return row(`${label} · ${ownedItemCount(rows)}`,formatOwnedRows(rows))}

function hydrate(){
 ensureSheetState();
 const p=state.c.sheet.profile,rp=state.c.sheet.roleplay,inv=state.c.sheet.inventory;
 const profileFields={
  'profile-player':'player','profile-experience':'experience','profile-age':'age','profile-gender':'gender','profile-height':'height','profile-weight':'weight','profile-hair':'hair','profile-eyes':'eyes','profile-skin':'skin','profile-alignment':'alignment','profile-faith':'faith','profile-languages':'languages'
 };
 for(const[id,key]of Object.entries(profileFields))setValue(id,key==='gender'?normalizeCharacterGender(p[key]):p[key]);
 for(const[id,key]of Object.entries({'personality':'personality','ideal':'ideal','bond':'bond','flaw':'flaw','profile-notes':'notes'}))setValue(id,rp[key]);
 for(const coin of['cp','sp','ep','gp','pp'])setValue(`coin-${coin}`,num(inv[coin]));
 setValue('inventory-notes',inv.notes);setValue('magic-items',inv.magicItems);setValue('other-holdings',inv.otherHoldings);setValue('extra-spells',state.c.sheet.extraSpells);
}

function renderProfile(){
 ensureSheetState();
 const p=state.c.sheet.profile,box=$('creation-profile');if(!box)return;
 box.innerHTML=row(playerTerm(p.player),p.player)+row('Experiência',p.experience)+row('Idade',p.age)+row('Gênero',normalizeCharacterGender(p.gender))+row('Altura',p.height)+row('Peso',p.weight)+row('Cabelo',p.hair)+row('Olhos',p.eyes)+row('Pele',p.skin)+row('Alinhamento',p.alignment)+row('Fé',p.faith)+row('Idiomas',languages());
}

function renderRoleplay(){
 ensureSheetState();
 const rp=state.c.sheet.roleplay,box=$('creation-roleplay');if(!box)return;
 box.innerHTML=textBlock('Traços de personalidade',rp.personality)+textBlock('Ideal',rp.ideal)+textBlock('Vínculo',rp.bond)+textBlock('Defeito',rp.flaw)+textBlock('Notas',rp.notes);
}

function renderProficiencies(){
 ensureSheetState();
 const box=$('creation-proficiencies');if(!box)return;const d=derive();
 box.innerHTML=row('Armas, armaduras e outras',arr(d.klass?.proficiencies).join(', '))+row('Salvaguardas',arr(d.klass?.savingThrows).join(', '))+row('Perícias treinadas',arr(d.skills).join(', '))+row('Ferramentas',arr(d.tools).join(', '))+row('Idiomas',languages());
}

function renderInventory(){
 ensureSheetState();
 const box=$('creation-inventory');if(!box)return;const inv=state.c.sheet.inventory,owned=ownedEquipment();
 box.innerHTML=ownedRow('Armas',owned.weapons)+ownedRow('Armaduras',owned.armors)+ownedRow('Escudos',owned.shields)+ownedRow('Pertences',owned.belongings)+row('Moedas',coins(inv))+textBlock('Inventário adicional',inv.notes)+textBlock('Itens mágicos',inv.magicItems)+textBlock('Outras posses',inv.otherHoldings)+textBlock('Magias de outras fontes',state.c.sheet.extraSpells);
}

function renderAll(){ensureSheetState();renderProfile();renderRoleplay();renderProficiencies();renderInventory()}

function bind(){
 const profileFields={
  'profile-player':'player','profile-experience':'experience','profile-age':'age','profile-gender':'gender','profile-height':'height','profile-weight':'weight','profile-hair':'hair','profile-eyes':'eyes','profile-skin':'skin','profile-alignment':'alignment','profile-faith':'faith','profile-languages':'languages'
 };
 for(const[id,key]of Object.entries(profileFields))$(id)?.addEventListener('input',e=>{ensureSheetState();state.c.sheet.profile[key]=key==='gender'?normalizeCharacterGender(e.target.value):e.target.value;renderProfile();if(key==='languages')renderProficiencies();if(key==='gender')document.dispatchEvent(new CustomEvent('hub:character-gender-changed'))});
 for(const[id,key]of Object.entries({'personality':'personality','ideal':'ideal','bond':'bond','flaw':'flaw','profile-notes':'notes'}))$(id)?.addEventListener('input',e=>{ensureSheetState();state.c.sheet.roleplay[key]=e.target.value;renderRoleplay()});
 for(const coin of['cp','sp','ep','gp','pp'])$(`coin-${coin}`)?.addEventListener('change',e=>{ensureSheetState();state.c.sheet.inventory[coin]=Math.max(0,num(e.target.value));e.target.value=state.c.sheet.inventory[coin];renderInventory()});
 $('inventory-notes')?.addEventListener('input',e=>{ensureSheetState();state.c.sheet.inventory.notes=e.target.value;renderInventory()});
 $('magic-items')?.addEventListener('input',e=>{ensureSheetState();state.c.sheet.inventory.magicItems=e.target.value;renderInventory()});
 $('other-holdings')?.addEventListener('input',e=>{ensureSheetState();state.c.sheet.inventory.otherHoldings=e.target.value;renderInventory()});
 $('extra-spells')?.addEventListener('input',e=>{ensureSheetState();state.c.sheet.extraSpells=e.target.value;renderInventory()});
 $('builder')?.addEventListener('change',e=>{if(e.target.closest('#classe,#nivel,#especie,#antecedente,#subclasse,#sp-size,#sp-line,#bg-tool,#bg-tool-house,#armor,#shield,#weapon,[id^="base-"]'))queueMicrotask(renderProficiencies)});
 document.addEventListener('hub:languages-changed',()=>{renderProfile();renderProficiencies()});
 document.addEventListener('hub:equipment-inventory-changed',()=>queueMicrotask(renderInventory));
 document.addEventListener('hub:starting-equipment-changed',()=>queueMicrotask(renderInventory));
 $('new-character')?.addEventListener('click',()=>queueMicrotask(()=>{ensureSheetState();hydrate();renderAll()}));
}

export function initCharacterProfileUi(){ensureSheetState();hydrate();renderAll();bind();initOriginPortrait()}