import{initWealthPurchaseUi}from'./wealth-purchase-ui.js?v=20260824-wealth-by-level2';

// A compra do Pacote B (PO) faz parte da Etapa 6 tanto em personagem novo
// quanto ao reabrir uma ficha existente. O módulo-base já detecta pacotes
// compostos apenas por moedas e abre o catálogo de compras correspondente.
export function initPackageBPurchaseUi(){return initWealthPurchaseUi()}
