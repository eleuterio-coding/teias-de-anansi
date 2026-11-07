import{initWealthPurchaseUi}from'./wealth-purchase-ui.js?v=20261106-rules-singleton1';
export function initWealthPurchaseCreationUi(){if(new URLSearchParams(location.search).has('id'))return;return initWealthPurchaseUi()}
