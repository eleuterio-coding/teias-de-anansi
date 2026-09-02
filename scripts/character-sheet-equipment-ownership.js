import{state,$,esc,signed,num}from'./character-builder/state.js';
import{derive}from'./character-builder/rules.js';
import{ownedEquipment,ownedItemCount,formatOwnedRows,weaponAttackProfile}from'./character-builder/equipment-ownership.js?v=20260902-magic-items2';
import{selectedBackgroundPackage,selectedClassPackage,creationBudgetBreakdown,itemsCurrencyCp,physicalItems,formatPhysicalItems}from'./character-builder/starting-equipment-rules.js?v=20260828-wealth-background1';
import{isStandardWealthBackground}from'./character-builder/background-wealth-tier-ui.js?v=20260901-background-wealth-tier1';
import{coinBalanceCp,creationBalanceCp,economyMode,ensureEconomyMetadata,formatBalanceGp,markCurrentEconomy}from'./character-builder/economy-state.js?v=20260901-campaign-inventory1';

let rendering=false;
const sourceBadge=v=>v?`<span class="source">${esc(v)}</span>`:'';
const fmtGp=cp=>`${(Math.max(0,cp)/100).toLocaleString('pt-BR',{minimumFractionDigits:cp%100?2:0,maximumFractionDigits:2})} PO`;
function weaponCard(d,row){
 const weapon=row.data||state.catalogs.weapons.find(w=>w.id===row.refId),profile=weaponAttackProfile(d,weapon);if(!weapon||!profile)return'';
 return`<div class="attack"><div><strong>${esc(weapon.nome)}${row.qty>1?` ×${row.qty}`:''}</strong>${sourceBadge(weapon.fonte||weapon.source)}</div><div class="attack-values"><span>Ataque <b>${signed(profile.attack)}</b>${profile.proficient?' ●':''}</span><span>Dano <b>${esc(weapon.dano)} ${profile.damageModifier}</b></span><span>Maestria <b>${esc(weapon.maestria||'—')}</b></span></div></div>`
}
export function sheetBackgroundForEconomy(bg,character=state.c){
 if(!bg||isStandardWealthBackground(bg))return bg;
 const ch=character?.choices?.background||{},saved=ch.wealthTier,owner=ch.wealthTierBackgroundId;
 if(saved&&(!owner||owner===bg.id))return{...bg,wealthTier:saved};
 return bg
}
function packageSummary(pkg){
 if(!pkg)return'—';const coins=itemsCurrencyCp(pkg.itens),physical=physicalItems(pkg.itens),parts=[];
 if(physical.length)parts.push(formatPhysicalItems(physical));if(coins)parts.push(fmtGp(coins));return parts.join(' + ')||'—'
}
export function sheetCreationEconomySnapshot(character=state.c,klass=null,bg=null){
 if(!character)return null;const level=Math.max(1,Math.min(20,num(character?.choices?.class?.level)||1)),classChoice=String(character?.choices?.class?.equipment||'A').toUpperCase(),backgroundChoice=String(character?.choices?.background?.equipment||'A').toUpperCase(),effectiveBg=sheetBackgroundForEconomy(bg,character),classPackage=selectedClassPackage(klass,classChoice),backgroundPackage=selectedBackgroundPackage(effectiveBg,backgroundChoice),breakdown=creationBudgetBreakdown(effectiveBg,backgroundChoice,level,klass,classChoice);
 return{level,classChoice,backgroundChoice,classPackage,backgroundPackage,breakdown}
}
function economyMarkup(d){
 ensureEconomyMetadata(state.c);const snap=sheetCreationEconomySnapshot(state.c,d.klass,d.bg);if(!snap)return'';const b=snap.breakdown,rows=[],mode=economyMode(state.c),initialAfterPurchases=creationBalanceCp(state.c),current=coinBalanceCp(state.c);
 rows.push(`<div class="row"><span>Pacote da Classe · Opção ${esc(snap.classChoice)}</span><strong>${esc(packageSummary(snap.classPackage))}</strong></div>`);
 rows.push(`<div class="row"><span>Pacote do Antecedente · Opção ${esc(snap.backgroundChoice)}</span><strong>${esc(packageSummary(snap.backgroundPackage))}</strong></div>`);
 rows.push(`<div class="row"><span>Faixa Econômica</span><strong>${esc(b.wealthTierLabel)} ×${b.wealthMultiplier.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></div>`);
 if(snap.level>=2)rows.push(`<div class="row"><span>Riqueza por Level · Level ${snap.level}</span><strong>${b.baseWealthGp.toLocaleString('pt-BR')} PO → ${b.adjustedWealthGp.toLocaleString('pt-BR')} PO</strong></div>`);else rows.push('<div class="row"><span>Riqueza por Level</span><strong>— no Level 1</strong></div>');
 rows.push(`<div class="row"><span>Total inicial antes das compras</span><strong>${esc(fmtGp(b.totalCp))}</strong></div>`);
 rows.push(`<div class="row"><span>Saldo inicial após compras</span><strong>${esc(formatBalanceGp(initialAfterPurchases))}</strong></div>`);
 rows.push(`<div class="row"><span>Saldo atual${mode==='current'?' · pós-criação':''}</span><strong>${esc(formatBalanceGp(current))}</strong></div>`);
 if(mode==='current')rows.push('<p class="mini">O saldo atual foi alterado na ficha e não será recalculado ao reabrir o construtor. As escolhas de criação continuam preservadas como histórico.</p>');
 return`<div class="section-source">Origem econômica da criação</div>${rows.join('')}`
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
 if(starting)starting.innerHTML=`${economyMarkup(d)}<h4 style="margin-top:14px">Inventário atual</h4><strong>Armas · ${ownedItemCount(owned.weapons)}</strong><br>${esc(formatOwnedRows(owned.weapons))}<br><br><strong>Armaduras · ${ownedItemCount(owned.armors)}</strong><br>${esc(formatOwnedRows(owned.armors))}<br><br><strong>Escudos · ${ownedItemCount(owned.shields)}</strong><br>${esc(formatOwnedRows(owned.shields))}<br><br><strong>Pertences · ${ownedItemCount(owned.belongings)}</strong><br>${esc(formatOwnedRows(owned.belongings))}`
}
function render(){if(rendering||!state.c)return;rendering=true;try{renderCombat();renderInventory()}finally{rendering=false}}
if(typeof document!=='undefined'){
 document.addEventListener('change',event=>{if(!/^coin-(cp|sp|ep|gp|pp)$/.test(event.target?.id||'')||!state.c)return;markCurrentEconomy(state.c);queueMicrotask(render)});
 for(const type of['hub-rpg:sheet-ready','hub-rpg:sheet-spells-ready','hub-rpg:inventory-transaction','hub-rpg:sheet-inventory-changed','hub-rpg:magic-items-changed','hub-rpg:magic-item-catalog-ready'])document.addEventListener(type,()=>queueMicrotask(render));
 queueMicrotask(()=>{if(state.c&&!$('sheet')?.hidden)render()});
 import('./character-sheet-combat-ui.js?v=20260901-combat1');
 import('./character-sheet-spellcasting-ui.js?v=20260901-rest1');
 import('./character-sheet-rest-ui.js?v=20260901-rest1');
 import('./character-sheet-magic-item-ui.js?v=20260902-magic-items2');
}
