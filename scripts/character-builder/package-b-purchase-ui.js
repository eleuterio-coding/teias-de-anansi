import{initWealthPurchaseUi}from'./wealth-purchase-ui.js?v=20260824-wealth-by-level3';
import{initStartingEquipmentUi}from'./starting-equipment-ui.js?v=20260824-starting-equipment1';
import{initOriginFeatSync}from'./origin-feat-sync.js?v=20260824-origin-feat-sync1';
import{initSkilledFeatUi}from'./skilled-feat-ui.js?v=20260825-skilled-existing1';

let purchaseCollapseGuardBound=false;
function areaName(details){return String(details?.querySelector('summary')?.textContent||'').split(' · ')[0].trim()}
function bindPurchaseCollapseGuard(){
 if(purchaseCollapseGuardBound)return;purchaseCollapseGuardBound=true;
 document.addEventListener('change',event=>{
  if(!event.target?.closest?.('#wealth-purchase-card .wealth-buy, #wealth-purchase-card .wealth-qty'))return;
  const box=document.getElementById('wealth-shop-list');if(!box)return;
  const areas=[...box.querySelectorAll('details.wealth-area')];if(!areas.length)return;
  const openAreas=new Set(areas.filter(details=>details.open).map(areaName).filter(Boolean));
  queueMicrotask(()=>{
   const current=document.querySelectorAll('#wealth-shop-list details.wealth-area');
   current.forEach(details=>{details.open=openAreas.has(areaName(details))});
  });
 },true)
}

// A Etapa 6 usa Pacote A/B no nível 1 e Riqueza por Level nos níveis seguintes.
// O mesmo inicializador sincroniza o Talento de Origem e mantém suas escolhas mecânicas interativas.
// O guard preserva o estado aberto/fechado do catálogo quando uma compra força sua renderização.
export function initPackageBPurchaseUi(){bindPurchaseCollapseGuard();initOriginFeatSync();initSkilledFeatUi();initStartingEquipmentUi();return initWealthPurchaseUi()}
