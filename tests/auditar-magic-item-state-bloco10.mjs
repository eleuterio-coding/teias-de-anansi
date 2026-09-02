import assert from'node:assert/strict';
import{activeMagicItemUsages,clearUnavailableMagicItemUsages,magicItemUsage,setMagicItemUsage}from'../scripts/character-sheet-magic-item-state.js';

const character={sheet:{},choices:{}};
const amulet={kind:'magic-item',refId:'amulet-of-health',name:'Amulet of Health',qty:1,source:'Campanha'};
const armor={kind:'magic-item',refId:'armor-plus-1',name:'Armor, +1',qty:1,source:'Campanha'};
const base=[amulet,armor];

{
 const result=setMagicItemUsage(character,base,amulet,{equipped:true,attuned:true});
 assert.equal(result.ok,true,'10F · deve aceitar estado de uso para item possuído');
 assert.deepEqual(magicItemUsage(character,amulet),{key:'magic-item|ref:amulet-of-health',equipped:true,attuned:true},'10F · estado equipado/sintonizado deve persistir por chave estável');
}
{
 const active=activeMagicItemUsages(character,base);
 assert.equal(active.length,1,'10F · apenas itens ativos devem compor a lista mecânica');
 assert.equal(active[0].row.refId,'amulet-of-health');
 assert.equal(active[0].equipped,true);
 assert.equal(active[0].attuned,true);
}
{
 const missing=setMagicItemUsage(character,base,{kind:'magic-item',refId:'ghost',name:'Ghost Item'},{equipped:true});
 assert.equal(missing.ok,false,'10F · não pode equipar/sintonizar item ausente do inventário');
}
{
 const result=setMagicItemUsage(character,base,amulet,{equipped:false,attuned:false});
 assert.equal(result.ok,true);
 assert.equal(activeMagicItemUsages(character,base).length,0,'10F · desligar ambos os estados deve remover a entrada persistida');
}
{
 setMagicItemUsage(character,base,armor,{equipped:true});
 assert.equal(activeMagicItemUsages(character,base).length,1);
 const cleared=clearUnavailableMagicItemUsages(character,[amulet]);
 assert.deepEqual(cleared,['magic-item|ref:armor-plus-1'],'10F · estado órfão deve ser limpo quando o item deixa o inventário');
 assert.equal(activeMagicItemUsages(character,[amulet]).length,0);
}

console.log('10F · Estado persistente de itens mágicos: OK');
