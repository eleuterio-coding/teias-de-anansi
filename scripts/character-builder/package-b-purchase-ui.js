import{initWealthPurchaseUi}from'./wealth-purchase-ui.js?v=20260831-magic-rarity2';
import{initStartingEquipmentUi}from'./starting-equipment-ui.js?v=20260828-wealth-background1';
import{initOriginFeatSync}from'./origin-feat-sync.js?v=20260824-origin-feat-sync1';
import{initSkilledFeatUi}from'./skilled-feat-ui.js?v=20260825-skilled-existing1';
import{initBackgroundWealthTierUi}from'./background-wealth-tier-ui.js?v=20260901-background-wealth-tier1';

let purchaseCollapseGuardBound=false;
let rememberedOpenAreas=null;
let purchaseListObserver=null;

function areaName(details){return String(details?.querySelector('summary')?.textContent||'').split(' · ')[0].trim()}
function purchaseList(){return document.getElementById('wealth-shop-list')}
function readOpenAreas(box=purchaseList()){
 if(!box)return null;
 const areas=[...box.querySelectorAll('details.wealth-area')];
 if(!areas.length)return null;
 return new Set(areas.filter(details=>details.open).map(areaName).filter(Boolean))
}
function rememberOpenAreas(box=purchaseList()){
 const current=readOpenAreas(box);if(current)rememberedOpenAreas=current
}
function restoreOpenAreas(box=purchaseList()){
 if(!box||rememberedOpenAreas===null)return;
 box.querySelectorAll('details.wealth-area').forEach(details=>{details.open=rememberedOpenAreas.has(areaName(details))})
}
function observePurchaseList(){
 const box=purchaseList();if(!box)return false;
 purchaseListObserver?.disconnect();
 purchaseListObserver=new MutationObserver(()=>restoreOpenAreas(box));
 purchaseListObserver.observe(box,{childList:true});
 if(rememberedOpenAreas===null)rememberOpenAreas(box);
 return true
}
function bindPurchaseCollapseGuard(){
 if(purchaseCollapseGuardBound)return;purchaseCollapseGuardBound=true;
 observePurchaseList();
 document.addEventListener('click',event=>{
  const summary=event.target?.closest?.('#wealth-shop-list details.wealth-area > summary');if(!summary)return;
  queueMicrotask(()=>rememberOpenAreas(summary.closest('#wealth-shop-list')))
 },true);
 document.addEventListener('change',event=>{
  if(!event.target?.closest?.('#wealth-purchase-card .wealth-buy, #wealth-purchase-card .wealth-qty'))return;
  rememberOpenAreas();
 },true)
}

// A Etapa 6 mantém os pacotes iniciais de Classe e Antecedente em qualquer Level de criação.
// Acima do Level 1, a Riqueza por Level é adicional e recebe somente o modificador econômico do Antecedente.
// O mesmo inicializador sincroniza o Talento de Origem, a Faixa Econômica e mantém suas escolhas mecânicas interativas.
// A proteção observa toda reconstrução do catálogo e reaplica continuamente o estado aberto/fechado escolhido pelo usuário.
export function initPackageBPurchaseUi(){
 initOriginFeatSync();initSkilledFeatUi();initBackgroundWealthTierUi();initStartingEquipmentUi();
 const result=initWealthPurchaseUi();
 Promise.resolve(result).then(()=>bindPurchaseCollapseGuard());
 return result
}
