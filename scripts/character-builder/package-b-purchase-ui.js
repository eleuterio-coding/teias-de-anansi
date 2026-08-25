import{initWealthPurchaseUi}from'./wealth-purchase-ui.js?v=20260824-wealth-by-level3';
import{initStartingEquipmentUi}from'./starting-equipment-ui.js?v=20260824-starting-equipment1';
import{initOriginFeatSync}from'./origin-feat-sync.js?v=20260824-origin-feat-sync1';
import{initSkilledFeatUi}from'./skilled-feat-ui.js?v=20260825-skilled-direct2';

// A Etapa 6 usa Pacote A/B no nível 1 e Riqueza por Level nos níveis seguintes.
// O mesmo inicializador sincroniza o Talento de Origem e mantém suas escolhas mecânicas interativas.
export function initPackageBPurchaseUi(){initOriginFeatSync();initSkilledFeatUi();initStartingEquipmentUi();return initWealthPurchaseUi()}
