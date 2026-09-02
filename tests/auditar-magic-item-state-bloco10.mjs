import assert from'node:assert/strict';
import{activeMagicItemUsages,applyMagicItemPersistentEffects,clearUnavailableMagicItemUsages,magicItemPersistentOutcome,magicItemUsage,setMagicItemUsage}from'../scripts/character-sheet-magic-item-state.js';

const character={sheet:{},choices:{}};
const amulet={kind:'magic-item',refId:'amulet-of-health',name:'Amulet of Health',qty:1,source:'Campanha'};
const armor={kind:'magic-item',refId:'armor-plus-1',name:'Armor +1',magicBonus:1,qty:1,source:'Campanha'};
const resistance={kind:'magic-item',refId:'armor-of-resistance',name:'Armor of Resistance',damageType:'Fogo',qty:1,source:'Campanha'};
const invulnerability={kind:'magic-item',refId:'armor-of-invulnerability',name:'Armor of Invulnerability',qty:1,source:'Campanha'};
const base=[amulet,armor,resistance,invulnerability];

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
 const outcome=magicItemPersistentOutcome(character,base);
 assert.equal(outcome.abilityMinimums.Constituição,19,'10G · Amulet of Health deve estruturar Constituição mínima 19 quando vestido e sintonizado');
 const derived={scores:{Constituição:14},level:5,hp:35,ac:15,barbarianMechanics:{unarmoredDefense:true}};
 applyMagicItemPersistentEffects(derived,character,base);
 assert.equal(derived.scores.Constituição,19,'10G · Constituição efetiva deve subir para 19');
 assert.equal(derived.hp,45,'10G · mudança de modificador de Constituição deve repercutir no PV máximo por nível');
 assert.equal(derived.ac,17,'10G · Defesa sem Armadura do Bárbaro deve refletir o novo modificador de Constituição');
}
{
 setMagicItemUsage(character,base,armor,{equipped:true});
 const derived={scores:{Constituição:12},level:3,hp:24,ac:16};
 applyMagicItemPersistentEffects(derived,character,base);
 assert.equal(derived.ac,17,'10G · armadura mágica +1 explicitamente parametrizada deve aumentar a CA em 1');
}
{
 setMagicItemUsage(character,base,resistance,{equipped:true,attuned:true});
 setMagicItemUsage(character,base,invulnerability,{equipped:true,attuned:true});
 const outcome=magicItemPersistentOutcome(character,base);
 assert.deepEqual(new Set(outcome.resistances),new Set(['Fogo','Concussão','Perfurante','Cortante']),'10G · resistências persistentes de armaduras ativas devem ser estruturadas sem duplicatas');
}
{
 const unresolved={kind:'magic-item',refId:'armor-1-2-or-3',name:'Armor, +1, +2, or +3',qty:1,source:'Campanha'};
 const c={sheet:{},choices:{}};setMagicItemUsage(c,[unresolved],unresolved,{equipped:true});
 const outcome=magicItemPersistentOutcome(c,[unresolved]);
 assert.equal(outcome.acBonus,0,'10G · variante não informada não pode inventar bônus de CA');
 assert.equal(outcome.pending.length,1,'10G · variante normativa ausente deve permanecer fail-closed como pendência explícita');
}
{
 const unresolved={kind:'magic-item',refId:'armor-of-resistance',name:'Armor of Resistance',qty:1,source:'Campanha'};
 const c={sheet:{},choices:{}};setMagicItemUsage(c,[unresolved],unresolved,{equipped:true,attuned:true});
 const outcome=magicItemPersistentOutcome(c,[unresolved]);
 assert.equal(outcome.resistances.length,0,'10G · tipo de dano escolhido pelo Mestre não pode ser inferido');
 assert.equal(outcome.pending.length,1,'10G · escolha do Mestre ausente deve bloquear o efeito de forma explícita');
}
{
 setMagicItemUsage(character,base,amulet,{equipped:false,attuned:false});
 assert.equal(activeMagicItemUsages(character,base).some(x=>x.row.refId==='amulet-of-health'),false,'10F · desligar ambos os estados deve remover a entrada persistida do amuleto');
}
{
 const c={sheet:{},choices:{}};setMagicItemUsage(c,[armor],armor,{equipped:true});
 assert.equal(activeMagicItemUsages(c,[armor]).length,1);
 const cleared=clearUnavailableMagicItemUsages(c,[amulet]);
 assert.deepEqual(cleared,['magic-item|ref:armor-plus-1'],'10F · estado órfão deve ser limpo quando o item deixa o inventário');
 assert.equal(activeMagicItemUsages(c,[amulet]).length,0);
}

console.log('10F–10G · Estado e efeitos persistentes de itens mágicos: OK');
