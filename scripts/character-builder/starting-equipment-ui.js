import{state,$,num,esc}from'./state.js';
import{selected}from'./rules.js?v=20260831-class-tools1';
import{backgroundPackageOptions,classPackageOptions,creationBudgetBreakdown,itemsCurrencyCp,physicalItems}from'./starting-equipment-rules.js?v=20260828-wealth-background1';
import{ownedEquipment,ownedItemCount,formatOwnedRows}from'./equipment-ownership.js?v=20260828-wealth-background1';

let rendering=false,scheduled=false,initialized=false;
const level=()=>Math.max(1,Math.min(20,num(state.c?.choices?.class?.level)||1));
const fmtGp=cp=>`${(Math.max(0,cp)/100).toLocaleString('pt-BR',{minimumFractionDigits:cp%100?2:0,maximumFractionDigits:2})} PO`;

function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render()})}
function inventorySummary(){
 const owned=ownedEquipment({includeLegacyActive:false}),section=(label,rows)=>`<div class="starting-equipment-summary"><strong>${esc(label)} · ${ownedItemCount(rows)} item(ns)</strong><p>${esc(formatOwnedRows(rows))}</p></div>`;
 return`<div class="choice-grid">${section('Armas',owned.weapons)}${section('Armaduras',owned.armors)}${section('Escudos',owned.shields)}${section('Pertences',owned.belongings)}</div>`
}
function packageLabel(pkg){
 const coins=itemsCurrencyCp(pkg?.itens),physical=physicalItems(pkg?.itens),id=String(pkg?.id||'A').toUpperCase();
 if(!physical.length)return`Opção ${id} · ${fmtGp(coins)}`;
 return`Opção ${id} · itens${coins?` + ${fmtGp(coins)}`:''}`
}
function optionMarkup(options,current){return options.map(pkg=>`<option value="${esc(pkg.id)}" ${String(pkg.id).toUpperCase()===current?'selected':''}>${esc(packageLabel(pkg))}</option>`).join('')}
function sanitizeChoice(options,value){const ids=options.map(pkg=>String(pkg.id).toUpperCase()),wanted=String(value||'A').toUpperCase();return ids.includes(wanted)?wanted:(ids[0]||'A')}
function budgetSummary(breakdown,bg){
 const packageCp=breakdown.classCp+breakdown.backgroundCp,lines=[`<p class="mini"><strong>PO dos pacotes:</strong> ${esc(fmtGp(packageCp))} (${esc(fmtGp(breakdown.classCp))} da Classe + ${esc(fmtGp(breakdown.backgroundCp))} do Antecedente).</p>`];
 if(breakdown.level>=2){lines.push(`<p class="mini"><strong>Riqueza por Level:</strong> ${breakdown.baseWealthGp.toLocaleString('pt-BR')} PO × ${breakdown.wealthMultiplier.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} (${esc(breakdown.wealthTierLabel)}${bg?` · ${esc(bg.name)}`:''}) = <strong>${breakdown.adjustedWealthGp.toLocaleString('pt-BR')} PO</strong>.</p>`)}
 lines.push(`<p class="mini"><strong>Total inicial para compras/saldo:</strong> ${esc(fmtGp(breakdown.totalCp))}.</p>`);
 return lines.join('')
}
function render(){
 const box=$('starting-equipment-choice'),{klass,bg}=selected();if(!box||!state.c)return;
 rendering=true;
 try{
  if(!klass&&!bg){box.innerHTML='<p data-standard-starting-equipment class="muted">Escolha Classe e Antecedente para definir os pacotes e o PO inicial.</p>';return}
  const l=level(),classState=state.c.choices.class||(state.c.choices.class={level:l,skills:[]}),bgState=state.c.choices.background||(state.c.choices.background={}),classOptions=classPackageOptions(klass),bgOptions=backgroundPackageOptions(bg);
  classState.equipment=sanitizeChoice(classOptions,classState.equipment);bgState.equipment=sanitizeChoice(bgOptions,bgState.equipment);
  const breakdown=creationBudgetBreakdown(bg,bgState.equipment,l,klass,classState.equipment),classControl=klass&&classOptions.length?`<label>Equipamento inicial da Classe<select id="class-eq-house">${optionMarkup(classOptions,classState.equipment)}</select></label>`:`<p class="muted">${klass?'Esta Classe ainda não possui opções de equipamento inicial cadastradas.':'Escolha a Classe para definir seu pacote inicial.'}</p>`,bgControl=bg&&bgOptions.length?`<label>Equipamento inicial do Antecedente<select id="bg-eq-house">${optionMarkup(bgOptions,bgState.equipment)}</select></label>`:`<p class="muted">${bg?'Este Antecedente ainda não possui opções de equipamento inicial cadastradas.':'Escolha o Antecedente para definir seu pacote inicial.'}</p>`;
  const rule=l>=2?`Os pacotes da Classe e do Antecedente continuam valendo. A Riqueza por Level é adicional e recebe o modificador econômico do Antecedente; a Classe não multiplica essa riqueza.`:`No Level 1, Classe e Antecedente concedem seus pacotes normalmente. Pacotes com itens também podem conceder PO residual.`;
  box.innerHTML=`<div data-standard-starting-equipment><div class="choice-grid">${classControl}${bgControl}</div><div class="starting-equipment-summary"><strong>Equipamento e PO inicial — Level ${l}</strong><p>${esc(rule)}</p>${budgetSummary(breakdown,bg)}</div><h4>Inventário inicial</h4>${inventorySummary()}</div>`
 }finally{rendering=false}
}
function changePackage(e){
 if(e.target?.id==='class-eq-house'){
  state.c.choices.class=state.c.choices.class||{};state.c.choices.class.equipment=String(e.target.value||'A').toUpperCase();render();document.dispatchEvent(new CustomEvent('hub:starting-equipment-changed'));return
 }
 if(e.target?.id==='bg-eq-house'){
  state.c.choices.background=state.c.choices.background||{};state.c.choices.background.equipment=String(e.target.value||'A').toUpperCase();render();document.dispatchEvent(new CustomEvent('hub:starting-equipment-changed'))
 }
}
function bind(){
 const box=$('starting-equipment-choice');box?.addEventListener('change',changePackage);
 if(box)new MutationObserver(()=>{if(!rendering&&!box.querySelector('[data-standard-starting-equipment]'))schedule()}).observe(box,{childList:true});
 document.addEventListener('hub:origin-house-changed',schedule);document.addEventListener('hub:origin-context-changed',schedule);document.addEventListener('hub:class-context-changed',schedule);document.addEventListener('hub:equipment-inventory-changed',schedule);document.addEventListener('hub:new-character',schedule);
 $('builder')?.addEventListener('change',e=>{if(e.target?.id==='nivel'||e.target?.id==='antecedente'||e.target?.id==='classe')schedule()})
}
export function initStartingEquipmentUi(){if(initialized)return;initialized=true;render();bind()}
