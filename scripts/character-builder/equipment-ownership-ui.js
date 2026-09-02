import{state,$,esc,signed}from'./state.js';
import{derive}from'./rules.js?v=20260831-tasha-metamagic1';
import{ownedEquipment,canUseArmor,canUseShield,canUseWeapon,weaponAttackProfile}from'./equipment-ownership.js?v=20260828-wealth-background1';

let rendering=false,combatRendering=false,initialized=false;
const ACTIVE_MARK='equipment-ownership-active-v3',COMBAT_MARK='equipment-ownership-combat-v3';

function ownedContext(){
 const owned=ownedEquipment(),armors=owned.armors.map(row=>({...row,data:row.data||state.catalogs.armors.find(a=>a.id===row.refId)})).filter(row=>row.data&&canUseArmor(null,row.data)),weapons=owned.weapons.map(row=>({...row,data:row.data||state.catalogs.weapons.find(w=>w.id===row.refId)})).filter(row=>row.data&&canUseWeapon(null,row.data)),shield=owned.shields.length>0&&canUseShield();
 return{owned,armors,weapons,shield}
}
function normalizeActive(){
 const eq=state.c?.choices?.equipment;if(!eq)return false;const ctx=ownedContext(),armorIds=new Set(ctx.armors.map(x=>x.refId)),weaponIds=new Set(ctx.weapons.map(x=>x.refId));let changed=false;
 if(eq.armor&&!armorIds.has(eq.armor)){eq.armor=null;changed=true}
 if(eq.weapon&&!weaponIds.has(eq.weapon)){eq.weapon=null;changed=true}
 if(eq.shield&&!ctx.shield){eq.shield=false;eq.shieldId=null;changed=true}
 return changed
}
function markup(){
 const ctx=ownedContext(),eq=state.c.choices.equipment;
 return`<div data-equipment-ownership="${ACTIVE_MARK}"><div class="choice-grid"><label>Armadura equipada<select id="armor"><option value="">Sem armadura</option>${ctx.armors.map(row=>`<option value="${esc(row.refId)}" ${eq.armor===row.refId?'selected':''}>${esc(row.data.nome)} · CA ${esc(row.data.ca)}${row.qty>1?` · ${row.qty} disponíveis`:''}</option>`).join('')}</select></label><label class="checkline"><input id="shield" type="checkbox" ${eq.shield?'checked':''} ${ctx.shield?'':'disabled'}> Escudo equipado${ctx.shield?'':' · nenhum escudo utilizável no inventário'}</label><label>Arma principal<select id="weapon"><option value="">Nenhuma</option>${ctx.weapons.map(row=>`<option value="${esc(row.refId)}" ${eq.weapon===row.refId?'selected':''}>${esc(row.data.nome)} · ${esc(row.data.dano)}${row.qty>1?` · ${row.qty} disponíveis`:''}</option>`).join('')}</select></label></div></div>`
}
function renderActive(){
 const box=$('equipamento-escolhas');if(!box||!state.c||rendering)return;
 /* O módulo legado active-equipment-ui pode estar em cache em uma sessão já aberta.
    Se ele estiver controlando o bloco, não disputamos o DOM: isso evita o ping-pong
    que congelava a criação. Em carregamentos novos, wizard-ui não inicializa mais o legado. */
 if(box.querySelector('[data-owned-equipment-ui]')){normalizeActive();return}
 rendering=true;try{normalizeActive();const html=markup();if(box.innerHTML!==html)box.innerHTML=html}finally{rendering=false}
}
function weaponCard(d,row){const weapon=row.data||state.catalogs.weapons.find(w=>w.id===row.refId),p=weaponAttackProfile(d,weapon);if(!weapon||!p)return'';return`<div class="preview-block"><strong>${esc(weapon.nome)}${row.qty>1?` ×${row.qty}`:''}</strong><div class="value-row"><span>Ataque</span><strong>${signed(p.attack)}${p.proficient?' ●':''}</strong></div><div class="value-row"><span>Dano</span><strong>${esc(weapon.dano)} ${p.damageModifier}</strong></div><div class="value-row"><span>Maestria</span><strong>${esc(weapon.maestria||'—')}</strong></div></div>`}
function renderCombat(){
 const box=$('combat');if(!box||!state.c||combatRendering)return;combatRendering=true;
 try{const d=derive(),owned=ownedEquipment(),cards=owned.weapons.map(row=>weaponCard(d,row)).join(''),html=`<div data-equipment-combat="${COMBAT_MARK}"><div class="value-row"><span>CA</span><strong>${d.ac}</strong></div>${d.armor?`<div class="value-row"><span>Armadura</span><strong>${esc(d.armor.nome)}</strong></div>`:''}${state.c.choices.equipment.shield?'<div class="value-row"><span>Escudo</span><strong>Equipado</strong></div>':''}${cards||'<p class="muted">Nenhuma arma no inventário.</p>'}</div>`;if(box.innerHTML!==html)box.innerHTML=html}finally{combatRendering=false}
}
function refresh(){normalizeActive();renderActive();renderCombat()}
function bind(){
 const equipment=$('equipamento-escolhas');equipment?.addEventListener('change',event=>{const id=event.target?.id;if(!['armor','shield','weapon'].includes(id))return;event.stopImmediatePropagation();if(id==='armor')state.c.choices.equipment.armor=event.target.value||null;else if(id==='shield')state.c.choices.equipment.shield=event.target.checked;else state.c.choices.equipment.weapon=event.target.value||null;renderActive();renderCombat();document.dispatchEvent(new CustomEvent('hub:active-equipment-changed'))},true);
 /* Não observar #equipamento-escolhas. O antigo active-equipment-ui também observava
    esse mesmo nó e os dois módulos reescreviam o DOM um do outro indefinidamente. */
 const combat=$('combat');if(combat)new MutationObserver(()=>{if(combatRendering)return;if(!combat.querySelector(`[data-equipment-combat="${COMBAT_MARK}"]`))queueMicrotask(renderCombat)}).observe(combat,{childList:true,subtree:false});
 for(const type of['hub:equipment-inventory-changed','hub:class-context-changed','hub:origin-context-changed','hub:origin-house-changed','hub:starting-equipment-changed','hub:progression-context-changed','hub:species-choices-changed','hub:new-character'])document.addEventListener(type,()=>queueMicrotask(refresh))
}
export function initEquipmentOwnershipUi(){if(initialized)return;initialized=true;refresh();bind()}
