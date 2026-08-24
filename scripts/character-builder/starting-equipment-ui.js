import{state,$,num,esc}from'./state.js';
import{selected}from'./rules.js?v=20260824-stage-isolation1';
import{backgroundPackageOptions,selectedBackgroundPackage,packageCurrencyCp,formatPhysicalItems,wealthGp}from'./starting-equipment-rules.js?v=20260824-starting-equipment1';

let rendering=false,scheduled=false,initialized=false;
const level=()=>Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1));
const fmtGp=cp=>`${(Math.max(0,cp)/100).toLocaleString('pt-BR',{maximumFractionDigits:2})} PO`;

function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render()})}
function render(){
 const box=$('starting-equipment-choice'),{bg}=selected();if(!box||!state.c)return;
 rendering=true;
 try{
  if(!bg){box.innerHTML='<p data-standard-starting-equipment class="muted">Escolha um antecedente na etapa Origem para definir o equipamento inicial.</p>';return}
  const l=level(),ch=state.c.choices.background||(state.c.choices.background={});
  if(l>1){
   box.innerHTML=`<div data-standard-starting-equipment class="starting-equipment-summary"><strong>Equipamento do antecedente — ${esc(bg.name)}</strong><p>Acima do nível 1, os Pacotes A/B são substituídos pela Riqueza por Level. No nível ${l}, o personagem inicia com <strong>${wealthGp(l).toLocaleString('pt-BR')} PO</strong> para compras.</p></div>`;
   return
  }
  if(!['A','B'].includes(String(ch.equipment||'').toUpperCase()))ch.equipment='A';else ch.equipment=String(ch.equipment).toUpperCase();
  const options=backgroundPackageOptions(bg),current=selectedBackgroundPackage(bg,ch.equipment),physical=formatPhysicalItems(current?.itens),coins=packageCurrencyCp(bg,ch.equipment);
  box.innerHTML=`<div data-standard-starting-equipment><label>Pacote de equipamento<select id="bg-eq-house"><option value="A" ${ch.equipment==='A'?'selected':''}>Pacote A · equipamento do antecedente</option><option value="B" ${ch.equipment==='B'?'selected':''}>Pacote B · 75 PO</option></select></label><div class="starting-equipment-summary"><strong>Equipamento do antecedente — ${esc(bg.name)}</strong><p>${ch.equipment==='A'?esc(physical):'Nenhum item físico concedido pelo pacote.'}</p><p class="mini"><strong>PO disponíveis pelo pacote:</strong> ${esc(fmtGp(coins))}. Esse valor aparece em PO e pode ser gasto nas compras abaixo.</p></div></div>`
 }finally{rendering=false}
}
function bind(){
 const box=$('starting-equipment-choice');
 box?.addEventListener('change',e=>{if(e.target?.id!=='bg-eq-house')return;state.c.choices.background=state.c.choices.background||{};state.c.choices.background.equipment=e.target.value==='B'?'B':'A';render();document.dispatchEvent(new CustomEvent('hub:starting-equipment-changed'))});
 if(box)new MutationObserver(()=>{if(!rendering&&!box.querySelector('[data-standard-starting-equipment]'))schedule()}).observe(box,{childList:true});
 document.addEventListener('hub:origin-house-changed',schedule);document.addEventListener('hub:origin-context-changed',schedule);document.addEventListener('hub:class-context-changed',schedule);document.addEventListener('hub:new-character',schedule);
 $('builder')?.addEventListener('change',e=>{if(e.target?.id==='nivel'||e.target?.id==='antecedente')schedule()})
}
export function initStartingEquipmentUi(){if(initialized)return;initialized=true;render();bind()}
