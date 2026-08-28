import{ownedEquipment}from'./equipment-ownership.js?v=20260828-wealth-background1';

/* Compatibilidade temporária.
   Este módulo antigo controlava #equipamento-escolhas ao mesmo tempo que
   equipment-ownership-ui.js. Os dois MutationObservers podiam substituir o
   DOM um do outro indefinidamente e congelar a criação de personagem.
   A interface ativa passou a ter um único controlador: equipment-ownership-ui. */
export function ownedActiveEquipment(){
 const owned=ownedEquipment();
 const adapt=(rows,type)=>rows.map(row=>({type,item:row.data||{id:row.refId,nome:row.name},qty:row.qty,sources:new Set([row.source||'inventário'])}));
 return{weapons:adapt(owned.weapons,'weapon'),armors:adapt(owned.armors,'armor'),shields:adapt(owned.shields,'shield')}
}

export function initActiveEquipmentUi(){
 /* no-op intencional: mantido apenas para módulos antigos em cache que ainda
    importem este inicializador. Não registrar listeners nem MutationObservers. */
}
