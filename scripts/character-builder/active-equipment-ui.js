import{state,$,arr,num,esc,fold}from'./state.js';
import{selected}from'./rules.js?v=20260824-stage-isolation1';
import{creationPhysicalItems}from'./starting-equipment-rules.js?v=20260824-starting-equipment1';

let initialized=false,rendering=false,scheduled=false;

const level=()=>Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1));
const cleanName=value=>fold(String(value||'').replace(/\([^)]*\)/g,' ').replace(/^\s*\d+\s*[x×]?\s*/i,'').replace(/[^a-z0-9]+/g,' ').trim());
const unique=rows=>[...new Set(rows.filter(Boolean).map(cleanName).filter(Boolean))];
function weaponAliases(item){return unique([item?.id,item?.nome,item?.nome_original,item?.name,state.G?.armas?.[item?.nome_original],state.G?.armas?.[item?.nome]])}
function armorAliases(item){return unique([item?.id,item?.nome,item?.nome_original,item?.name,state.G?.armaduras?.[item?.nome_original],state.G?.armaduras?.[item?.nome]])}
function exactMatch(name,rows,aliasFn){const key=cleanName(name);if(!key)return null;return arr(rows).find(item=>aliasFn(item).includes(key))||null}
function sourceLabel(source){return source==='background'?'Antecedente':'Compra'}
function addOwned(map,type,item,qty,source){if(!item||qty<=0)return;const key=`${type}:${item.id}`,current=map.get(key)||{type,item,qty:0,sources:new Set()};current.qty+=Math.max(1,Math.floor(num(qty)||1));current.sources.add(source);map.set(key,current)}

export function ownedActiveEquipment(){
 const out=new Map(),weapons=arr(state.catalogs.weapons),armors=arr(state.catalogs.armors),{bg}=selected(),choice=state.c?.choices?.background?.equipment||'A';
 for(const row of creationPhysicalItems(bg,choice,level())){
  const name=row?.nome||row?.name||'',qty=Math.max(1,Math.floor(num(row?.quantidade??row?.quantity)||1)),weapon=exactMatch(name,weapons,weaponAliases),armor=exactMatch(name,armors,armorAliases);
  if(weapon)addOwned(out,'weapon',weapon,qty,'background');
  else if(armor)addOwned(out,fold(armor.categoria)==='escudo'?'shield':'armor',armor,qty,'background')
 }
 const quantities=state.c?.choices?.purchases?.quantities||{};
 for(const[id,value]of Object.entries(quantities)){
  const qty=Math.max(0,Math.floor(num(value)));if(!qty)continue;
  if(id.startsWith('weapon:')){const raw=id.slice('weapon:'.length),item=weapons.find(x=>x.id===raw);if(item)addOwned(out,'weapon',item,qty,'purchase')}
  else if(id.startsWith('armor:')){const raw=id.slice('armor:'.length),item=armors.find(x=>x.id===raw);if(item)addOwned(out,fold(item.categoria)==='escudo'?'shield':'armor',item,qty,'purchase')}
 }
 const rows=[...out.values()].sort((a,b)=>String(a.item?.nome||a.item?.name||'').localeCompare(String(b.item?.nome||b.item?.name||''),'pt-BR'));
 return{weapons:rows.filter(x=>x.type==='weapon'),armors:rows.filter(x=>x.type==='armor'),shields:rows.filter(x=>x.type==='shield')}
}
function equipmentState(){state.c.choices=state.c.choices||{};state.c.choices.equipment={armor:null,shield:false,shieldId:null,weapon:null,...(state.c.choices.equipment||{})};return state.c.choices.equipment}
function reconcileOwned(owned){
 const eq=equipmentState(),weaponIds=new Set(owned.weapons.map(x=>x.item.id)),armorIds=new Set(owned.armors.map(x=>x.item.id)),shieldIds=new Set(owned.shields.map(x=>x.item.id));let changed=false;
 if(eq.armor&&shieldIds.has(eq.armor)){eq.shield=true;eq.shieldId=eq.armor;eq.armor=null;changed=true}
 if(eq.weapon&&!weaponIds.has(eq.weapon)){eq.weapon=null;changed=true}
 if(eq.armor&&!armorIds.has(eq.armor)){eq.armor=null;changed=true}
 if(eq.shield){
  if(eq.shieldId&&shieldIds.has(eq.shieldId)){}
  else if(!eq.shieldId&&owned.shields.length){eq.shieldId=owned.shields[0].item.id;changed=true}
  else{eq.shield=false;eq.shieldId=null;changed=true}
 }else if(eq.shieldId){eq.shieldId=null;changed=true}
 return changed
}
function itemMeta(row){const sources=[...row.sources].map(sourceLabel).join(' + ');return`${row.qty}× · ${sources}`}
function weaponRows(rows,current){if(!rows.length)return'<p class="muted active-equipment-empty">Nenhuma arma disponível. Armas recebidas pelo Antecedente ou compradas aparecerão aqui automaticamente.</p>';return`<div class="active-equipment-options">${rows.map(row=>`<label class="active-equipment-option"><input type="radio" name="active-weapon" data-active-weapon value="${esc(row.item.id)}" ${current===row.item.id?'checked':''}><span><strong>${esc(row.item.nome||row.item.name)}</strong><small>${esc(itemMeta(row))}${row.item.dano?` · ${esc(row.item.dano)}`:''}${row.item.categoria?` · ${esc(row.item.categoria)}`:''}</small></span></label>`).join('')}<label class="active-equipment-option active-equipment-none"><input type="radio" name="active-weapon" data-active-weapon value="" ${!current?'checked':''}><span><strong>Nenhuma arma ativa</strong></span></label></div>`}
function armorRows(rows,current){if(!rows.length)return'<p class="muted active-equipment-empty">Nenhuma armadura disponível. Armaduras recebidas pelo Antecedente ou compradas aparecerão aqui automaticamente.</p>';return`<div class="active-equipment-options">${rows.map(row=>`<label class="active-equipment-option"><input type="radio" name="active-armor" data-active-armor value="${esc(row.item.id)}" ${current===row.item.id?'checked':''}><span><strong>${esc(row.item.nome||row.item.name)}</strong><small>${esc(itemMeta(row))}${row.item.ca?` · CA ${esc(row.item.ca)}`:''}${row.item.categoria?` · ${esc(row.item.categoria)}`:''}</small></span></label>`).join('')}<label class="active-equipment-option active-equipment-none"><input type="radio" name="active-armor" data-active-armor value="" ${!current?'checked':''}><span><strong>Sem armadura equipada</strong></span></label></div>`}
function shieldRows(rows,eq){if(!rows.length)return'<p class="muted active-equipment-empty">Nenhum escudo disponível. Escudos recebidos pelo Antecedente ou comprados aparecerão aqui automaticamente.</p>';return`<div class="active-equipment-options">${rows.map(row=>`<label class="active-equipment-option"><input type="radio" name="active-shield" data-active-shield value="${esc(row.item.id)}" ${eq.shield&&eq.shieldId===row.item.id?'checked':''}><span><strong>${esc(row.item.nome||row.item.name)}</strong><small>${esc(itemMeta(row))}${row.item.ca?` · CA ${esc(row.item.ca)}`:''}</small></span></label>`).join('')}<label class="active-equipment-option active-equipment-none"><input type="radio" name="active-shield" data-active-shield value="" ${!eq.shield?'checked':''}><span><strong>Sem escudo equipado</strong></span></label></div>`}
function ensureStyle(){if($('active-equipment-style'))return;const style=document.createElement('style');style.id='active-equipment-style';style.textContent=`.active-equipment-intro{margin:0 0 12px}.active-equipment-group{margin-top:14px}.active-equipment-group h5{margin:0 0 7px;font-size:.92rem}.active-equipment-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.active-equipment-option{display:flex;gap:9px;align-items:flex-start;border:1px solid #8884;border-radius:9px;padding:9px 10px;font-weight:500;cursor:pointer}.active-equipment-option:has(input:checked){border-color:#222;background:#f5f5f5}.active-equipment-option input{width:auto;margin:4px 0 0}.active-equipment-option span{min-width:0}.active-equipment-option strong,.active-equipment-option small{display:block}.active-equipment-option small{color:var(--muted);font-weight:400;margin-top:2px}.active-equipment-none{border-style:dashed}.active-equipment-empty{margin:5px 0 0}@media(max-width:760px){.active-equipment-options{grid-template-columns:1fr}}`;document.head.appendChild(style)}
function refreshSheet(){const name=$('nome');if(name)name.dispatchEvent(new Event('input',{bubbles:false}))}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render()})}
function render(){
 const box=$('equipamento-escolhas');if(!box||!state.c||rendering)return;rendering=true;
 try{
  ensureStyle();const owned=ownedActiveEquipment(),changed=reconcileOwned(owned),eq=equipmentState();
  box.innerHTML=`<div data-owned-equipment-ui><p class="section-note active-equipment-intro">Somente itens que o personagem possui são exibidos. Compras e equipamentos físicos do Antecedente entram automaticamente nesta lista.</p><section class="active-equipment-group"><h5>Armas disponíveis</h5>${weaponRows(owned.weapons,eq.weapon)}</section><section class="active-equipment-group"><h5>Armaduras disponíveis</h5>${armorRows(owned.armors,eq.armor)}</section><section class="active-equipment-group"><h5>Escudos disponíveis</h5>${shieldRows(owned.shields,eq)}</section></div>`;
  if(changed)refreshSheet()
 }finally{rendering=false}
}
function onChange(event){
 const target=event.target;if(!target.closest('[data-owned-equipment-ui]'))return;const eq=equipmentState();
 if(target.matches('[data-active-weapon]'))eq.weapon=target.value||null;
 else if(target.matches('[data-active-armor]'))eq.armor=target.value||null;
 else if(target.matches('[data-active-shield]')){eq.shield=!!target.value;eq.shieldId=target.value||null}
 else return;
 refreshSheet();document.dispatchEvent(new CustomEvent('hub:active-equipment-changed'))
}
function bind(){
 const box=$('equipamento-escolhas');if(!box)return;box.addEventListener('change',onChange);
 new MutationObserver(()=>{if(rendering)return;if(!box.querySelector('[data-owned-equipment-ui]'))schedule()}).observe(box,{childList:true,subtree:true});
 for(const type of['hub:origin-context-changed','hub:origin-house-changed','hub:starting-equipment-changed','hub:class-context-changed','hub:new-character'])document.addEventListener(type,schedule);
 $('builder')?.addEventListener('change',event=>{if(event.target?.matches('.wealth-buy,.wealth-qty')||['nivel','antecedente','bg-eq-house'].includes(event.target?.id))queueMicrotask(schedule)})
}
export function initActiveEquipmentUi(){if(initialized)return;initialized=true;ensureStyle();bind();render()}
