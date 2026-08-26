import{state,$,num,esc}from'./state.js';
import{selected}from'./rules.js?v=20260824-stage-isolation1';
import{backgroundPackageOptions,selectedBackgroundPackage,packageCurrencyCp,wealthGp}from'./starting-equipment-rules.js?v=20260824-starting-equipment1';
import{ownedEquipment,ownedItemCount,formatOwnedRows}from'./equipment-ownership.js?v=20260826-equipment-ownership1';

let rendering=false,scheduled=false,initialized=false;
const level=()=>Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1));
const fmtGp=cp=>`${(Math.max(0,cp)/100).toLocaleString('pt-BR',{maximumFractionDigits:2})} PO`;

function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render()})}
function inventorySummary(){
 const owned=ownedEquipment({includeLegacyActive:false}),section=(label,rows)=>`<div class="starting-equipment-summary"><strong>${esc(label)} · ${ownedItemCount(rows)} item(ns)</strong><p>${esc(formatOwnedRows(rows))}</p></div>`;
 return`<div class="choice-grid">${section('Armas',owned.weapons)}${section('Armaduras',owned.armors)}${section('Escudos',owned.shields)}${section('Pertences',owned.belongings)}</div>`
}
function render(){
 const box=$('starting-equipment-choice'),{bg}=selected();if(!box||!state.c)return;
 rendering=true;
 try{
  if(!bg){box.innerHTML='<p data-standard-starting-equipment class="muted">Escolha um antecedente na etapa Origem para definir o equipamento inicial.</p>';return}
  const l=level(),ch=state.c.choices.background||(state.c.choices.background={});
  if(l>1){
   box.innerHTML=`<div data-standard-starting-equipment><div class="starting-equipment-summary"><strong>Equipamento inicial — nível ${l}</strong><p>Acima do nível 1, os Pacotes A/B são substituídos pela Riqueza por Level. O personagem inicia com <strong>${wealthGp(l).toLocaleString('pt-BR')} PO</strong> para compras.</p></div><h4>Pertences e equipamentos adquiridos</h4>${inventorySummary()}</div>`;
   return
  }
  if(!['A','B'].includes(String(ch.equipment||'').toUpperCase()))ch.equipment='A';else ch.equipment=String(ch.equipment).toUpperCase();
  const options=backgroundPackageOptions(bg),current=selectedBackgroundPackage(bg,ch.equipment),coins=packageCurrencyCp(bg,ch.equipment);
  box.innerHTML=`<div data-standard-starting-equipment><label>Pacote de equipamento<select id="bg-eq-house"><option value="A" ${ch.equipment==='A'?'selected':''}>Pacote A · equipamento do antecedente</option><option value="B" ${ch.equipment==='B'?'selected':''}>Pacote B · 75 PO</option></select></label><div class="starting-equipment-summary"><strong>Equipamento do antecedente — ${esc(bg.name)}</strong><p>${ch.equipment==='A'?'Os itens físicos do pacote estão organizados abaixo por tipo.':'Nenhum item físico é concedido diretamente pelo Pacote B; as compras aparecem abaixo conforme forem realizadas.'}</p><p class="mini"><strong>PO disponíveis pelo pacote:</strong> ${esc(fmtGp(coins))}. Esse valor pode ser gasto nas compras abaixo.</p></div><h4>Inventário inicial</h4>${inventorySummary()}</div>`
 }finally{rendering=false}
}
function bind(){
 const box=$('starting-equipment-choice');
 box?.addEventListener('change',e=>{if(e.target?.id!=='bg-eq-house')return;state.c.choices.background=state.c.choices.background||{};state.c.choices.background.equipment=e.target.value==='B'?'B':'A';render();document.dispatchEvent(new CustomEvent('hub:starting-equipment-changed'))});
 if(box)new MutationObserver(()=>{if(!rendering&&!box.querySelector('[data-standard-starting-equipment]'))schedule()}).observe(box,{childList:true});
 document.addEventListener('hub:origin-house-changed',schedule);document.addEventListener('hub:origin-context-changed',schedule);document.addEventListener('hub:class-context-changed',schedule);document.addEventListener('hub:equipment-inventory-changed',schedule);document.addEventListener('hub:new-character',schedule);
 $('builder')?.addEventListener('change',e=>{if(e.target?.id==='nivel'||e.target?.id==='antecedente')schedule()})
}
export function initStartingEquipmentUi(){if(initialized)return;initialized=true;render();bind()}
