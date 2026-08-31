import{state,$,esc,signed}from'./character-builder/state.js';
import{derive}from'./character-builder/rules.js?v=20260831-tasha-metamagic1';
import{ownedEquipment,ownedItemCount,formatOwnedRows,weaponAttackProfile}from'./character-builder/equipment-ownership.js?v=20260831-tasha-metamagic1';

let rendering=false;
const sourceBadge=v=>v?`<span class="source">${esc(v)}</span>`:'';
function weaponCard(d,row){
 const weapon=row.data||state.catalogs.weapons.find(w=>w.id===row.refId),profile=weaponAttackProfile(d,weapon);if(!weapon||!profile)return'';
 return`<div class="attack"><div><strong>${esc(weapon.nome)}${row.qty>1?` ×${row.qty}`:''}</strong>${sourceBadge(weapon.fonte||weapon.source)}</div><div class="attack-values"><span>Ataque <b>${signed(profile.attack)}</b>${profile.proficient?' ●':''}</span><span>Dano <b>${esc(weapon.dano)} ${profile.damageModifier}</b></span><span>Maestria <b>${esc(weapon.maestria||'—')}</b></span></div></div>`
}
function renderCombat(){
 const box=$('combat-summary');if(!box||!state.c)return;const d=derive(),owned=ownedEquipment(),parts=[];
 parts.push(`<div class="row"><span>Classe de Armadura</span><strong>${d.ac}</strong></div>`);
 if(d.armor)parts.push(`<div class="row"><span>Armadura ativa</span><strong>${esc(d.armor.nome)}</strong></div>`);
 if(state.c.choices.equipment.shield)parts.push('<div class="row"><span>Escudo</span><strong>Equipado</strong></div>');
 if(owned.weapons.length)parts.push(...owned.weapons.map(row=>weaponCard(d,row)).filter(Boolean));else parts.push('<p class="muted">Nenhuma arma no inventário.</p>');
 box.innerHTML=parts.join('')
}
function renderInventory(){
 if(!state.c)return;const d=derive(),owned=ownedEquipment(),active=$('active-equipment'),starting=$('starting-equipment');
 if(active)active.innerHTML=[d.armor?.nome,state.c.choices.equipment.shield?'Escudo':null,d.weapon?.nome].filter(Boolean).map(v=>`<span class="pill">${esc(v)}</span>`).join('')||'—';
 if(starting)starting.innerHTML=`<strong>Armas · ${ownedItemCount(owned.weapons)}</strong><br>${esc(formatOwnedRows(owned.weapons))}<br><br><strong>Armaduras · ${ownedItemCount(owned.armors)}</strong><br>${esc(formatOwnedRows(owned.armors))}<br><br><strong>Escudos · ${ownedItemCount(owned.shields)}</strong><br>${esc(formatOwnedRows(owned.shields))}<br><br><strong>Pertences · ${ownedItemCount(owned.belongings)}</strong><br>${esc(formatOwnedRows(owned.belongings))}`
}
function render(){if(rendering||!state.c)return;rendering=true;try{renderCombat();renderInventory()}finally{rendering=false}}
for(const type of['hub-rpg:sheet-ready','hub-rpg:sheet-spells-ready'])document.addEventListener(type,()=>queueMicrotask(render));
queueMicrotask(()=>{if(state.c&&!$('sheet')?.hidden)render()});
