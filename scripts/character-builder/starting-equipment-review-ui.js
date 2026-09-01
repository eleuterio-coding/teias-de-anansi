import{state,num,esc}from'./state.js';
import{selected}from'./rules.js?v=20260824-stage-isolation1';
import{selectedBackgroundPackage,selectedClassPackage,creationBudgetBreakdown,formatPhysicalItems,itemsCurrencyCp}from'./starting-equipment-rules.js?v=20260828-wealth-background1';

let initialized=false,scheduled=false;
const clampLevel=value=>Math.max(1,Math.min(20,num(value)||1));
const fmtGp=cp=>`${(Math.max(0,cp)/100).toLocaleString('pt-BR',{minimumFractionDigits:cp%100?2:0,maximumFractionDigits:2})} PO`;

function packageSummary(pkg){
 if(!pkg)return'—';
 const physical=formatPhysicalItems(pkg.itens),coins=itemsCurrencyCp(pkg.itens),parts=[];
 if(physical!=='—')parts.push(physical);
 if(coins)parts.push(fmtGp(coins));
 return parts.join(' + ')||'—'
}

export function startingEquipmentReviewModel(bg,bgChoice='A',level=1,klass=null,classChoice='A'){
 const l=clampLevel(level),resolvedClassChoice=String(classChoice||'A').toUpperCase(),resolvedBgChoice=String(bgChoice||'A').toUpperCase();
 const classPackage=selectedClassPackage(klass,resolvedClassChoice),backgroundPackage=selectedBackgroundPackage(bg,resolvedBgChoice),breakdown=creationBudgetBreakdown(bg,resolvedBgChoice,l,klass,resolvedClassChoice);
 return{
  level:l,
  classChoice:resolvedClassChoice,
  backgroundChoice:resolvedBgChoice,
  classPackage,
  backgroundPackage,
  classSummary:packageSummary(classPackage),
  backgroundSummary:packageSummary(backgroundPackage),
  breakdown
 }
}

function ensureReviewBox(){
 const legacy=document.getElementById('sheet-equipment');if(!legacy)return null;
 legacy.hidden=true;
 let box=document.getElementById('sheet-starting-equipment-review');
 if(!box){box=document.createElement('div');box.id='sheet-starting-equipment-review';box.className='starting-equipment-summary';legacy.after(box)}
 return box
}
function render(){
 scheduled=false;if(!state.c)return;
 const box=ensureReviewBox();if(!box)return;
 const{klass,bg}=selected();
 if(!klass&&!bg){box.innerHTML='<span class="muted">—</span>';return}
 const classChoice=state.c.choices?.class?.equipment||'A',bgChoice=state.c.choices?.background?.equipment||'A',model=startingEquipmentReviewModel(bg,bgChoice,state.c.choices?.class?.level,klass,classChoice),b=model.breakdown;
 const wealthLine=model.level>=2?`${b.baseWealthGp.toLocaleString('pt-BR')} PO × ${b.wealthMultiplier.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} = <strong>${b.adjustedWealthGp.toLocaleString('pt-BR')} PO</strong>`:'Não se aplica no Level 1';
 box.innerHTML=`<div class="value-row"><span>Pacote da Classe · Opção ${esc(model.classChoice)}</span><strong>${esc(model.classSummary)}</strong></div><div class="value-row"><span>Pacote do Antecedente · Opção ${esc(model.backgroundChoice)}</span><strong>${esc(model.backgroundSummary)}</strong></div><div class="value-row"><span>Faixa Econômica</span><strong>${esc(b.wealthTierLabel)} ×${b.wealthMultiplier.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></div><div class="value-row"><span>Riqueza por Level</span><span>${wealthLine}</span></div><div class="value-row"><span>Total inicial para compras/saldo</span><strong>${esc(fmtGp(b.totalCp))}</strong></div>`
}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(render)}
function bind(){
 for(const type of['hub:starting-equipment-changed','hub:origin-context-changed','hub:wealth-context-changed','hub:equipment-inventory-changed','hub:class-context-changed','hub:new-character'])document.addEventListener(type,schedule);
 document.getElementById('builder')?.addEventListener('change',event=>{if(['nivel','antecedente','classe','class-eq-house','bg-eq-house','bg-wealth-tier'].includes(event.target?.id))schedule()});
 const legacy=document.getElementById('sheet-equipment');if(legacy)new MutationObserver(schedule).observe(legacy,{childList:true,characterData:true,subtree:true})
}
export function initStartingEquipmentReviewUi(){if(initialized)return;initialized=true;render();bind()}
