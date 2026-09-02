import assert from'node:assert/strict';
import{activeMagicItemUsages,applyMagicItemPersistentEffects,clearUnavailableMagicItemUsages,magicItemPersistentOutcome,magicItemUsage,setMagicItemParameters,setMagicItemUsage,validateMagicItemParameters}from'../scripts/character-sheet-magic-item-state.js';

const character={sheet:{},choices:{}};
const amulet={kind:'magic-item',refId:'amulet-of-health',name:'Amulet of Health',qty:1,source:'Campanha'};
const armor={kind:'magic-item',refId:'armor-plus-1',name:'Armor +1',magicBonus:1,qty:1,source:'Campanha'};
const resistance={kind:'magic-item',refId:'armor-of-resistance',name:'Armor of Resistance',qty:1,source:'Campanha'};
const invulnerability={kind:'magic-item',refId:'armor-of-invulnerability',name:'Armor of Invulnerability',qty:1,source:'Campanha'};
const adamantine={kind:'magic-item',refId:'adamantine-armor',name:'Adamantine Armor',qty:1,source:'Campanha'};
const proof={kind:'magic-item',refId:'amulet-of-proof-against-detection-and-location',name:'Amulet of Proof against Detection and Location',qty:1,source:'Campanha'};
const vulnerability={kind:'magic-item',refId:'armor-of-vulnerability',name:'Armor of Vulnerability',qty:1,source:'Campanha'};
const ammunition={kind:'magic-item',refId:'ammunition-1-2-or-3',name:'Ammunition, +1, +2, or +3',qty:10,source:'Campanha'};
const weapon={kind:'magic-item',refId:'weapon-1-2-or-3',name:'Weapon, +1, +2, or +3',qty:1,source:'Campanha'};
const luckstone={kind:'magic-item',refId:'stone-of-good-luck-luckstone',name:'Stone of Good Luck',qty:1,source:'Campanha'};
const mithral={kind:'magic-item',refId:'mithral-armor',name:'Mithral Armor',qty:1,source:'Campanha'};
const giantPotion={kind:'magic-item',refId:'potion-of-giant-strength',name:'Potion of Giant Strength',qty:1,source:'Campanha'};
const carpet={kind:'magic-item',refId:'carpet-of-flying',name:'Carpet of Flying',qty:1,source:'Campanha'};
const defender={kind:'magic-item',refId:'defender',name:'Defender',qty:1,source:'Campanha'};
const base=[amulet,armor,resistance,invulnerability,adamantine,proof,vulnerability,ammunition,weapon,luckstone,mithral,giantPotion,carpet,defender];

{
 const result=setMagicItemUsage(character,base,amulet,{equipped:true,attuned:true});
 assert.equal(result.ok,true,'10F · deve aceitar estado de uso para item possuído');
 assert.deepEqual(magicItemUsage(character,amulet),{key:'magic-item|ref:amulet-of-health',equipped:true,attuned:true,active:false,parameters:{}},'10F · estado equipado/sintonizado deve persistir por chave estável');
}
{
 const active=activeMagicItemUsages(character,base);
 assert.equal(active.length,1,'10F · apenas itens ativos devem compor a lista mecânica');
 assert.equal(active[0].row.refId,'amulet-of-health');
 assert.equal(active[0].equipped,true);
 assert.equal(active[0].attuned,true);
 assert.equal(active[0].active,false);
 assert.deepEqual(active[0].parameters,{});
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
 const configured=setMagicItemParameters(character,base,resistance,{damageType:'fogo'});
 assert.equal(configured.ok,true,'10G · parâmetro legítimo deve ser persistido no estado do item');
 assert.deepEqual(configured.parameters,{damageType:'Fogo'});
 setMagicItemUsage(character,base,resistance,{equipped:true,attuned:true});
 setMagicItemUsage(character,base,invulnerability,{equipped:true,attuned:true});
 const outcome=magicItemPersistentOutcome(character,base);
 assert.deepEqual(new Set(outcome.resistances),new Set(['Fogo','Concussão','Perfurante','Cortante']),'10G · resistências persistentes de armaduras ativas devem ser estruturadas sem duplicatas');
}
{
 const unresolved={kind:'magic-item',refId:'armor-1-2-or-3',name:'Armor, +1, +2, or +3',qty:1,source:'Campanha'};
 const c={sheet:{},choices:{}};setMagicItemUsage(c,[unresolved],unresolved,{equipped:true});
 let outcome=magicItemPersistentOutcome(c,[unresolved]);
 assert.equal(outcome.acBonus,0,'10G · variante não informada não pode inventar bônus de CA');
 assert.equal(outcome.pending.length,1,'10G · variante normativa ausente deve permanecer fail-closed como pendência explícita');
 const configured=setMagicItemParameters(c,[unresolved],unresolved,{magicBonus:3});
 assert.equal(configured.ok,true);assert.deepEqual(configured.parameters,{magicBonus:3});
 outcome=magicItemPersistentOutcome(c,[unresolved]);
 assert.equal(outcome.acBonus,3,'10G · variante explicitamente escolhida deve produzir o bônus correspondente');
}
{
 const c={sheet:{},choices:{}};setMagicItemUsage(c,[ammunition],ammunition,{equipped:true});
 let outcome=magicItemPersistentOutcome(c,[ammunition]);
 assert.equal(outcome.conditionalAttackBonuses.length,0,'10G · munição genérica sem variante não pode inventar bônus de ataque');
 assert.equal(outcome.conditionalDamageBonuses.length,0,'10G · munição genérica sem variante não pode inventar bônus de dano');
 assert.equal(outcome.pending.length,1,'10G · variante ausente da munição deve permanecer pendente');
 assert.equal(setMagicItemParameters(c,[ammunition],ammunition,{magicBonus:2}).ok,true,'10G · variante explícita da munição deve ser aceita');
 outcome=magicItemPersistentOutcome(c,[ammunition]);
 assert.deepEqual(outcome.conditionalAttackBonuses.map(x=>({value:x.value,scope:x.scope})),[{value:2,scope:'attack-with-this-ammunition'}],'10G · bônus de ataque deve permanecer vinculado à munição usada');
 assert.deepEqual(outcome.conditionalDamageBonuses.map(x=>({value:x.value,scope:x.scope})),[{value:2,scope:'damage-with-this-ammunition'}],'10G · bônus de dano deve permanecer vinculado à munição usada');
 const derived={scores:{Constituição:10},level:1,hp:8,ac:10,attack:5};applyMagicItemPersistentEffects(derived,c,[ammunition]);
 assert.equal(derived.attack,5,'10G · bônus condicional de munição não pode contaminar o ataque global da ficha');
 assert.equal(derived.magicItemMechanics.conditionalAttackBonuses[0].value,2,'10G · derivação deve expor o modificador para a resolução contextual do Bloco 11');
}
{
 const unresolved={kind:'magic-item',refId:'armor-of-resistance',name:'Armor of Resistance',qty:1,source:'Campanha'};
 const c={sheet:{},choices:{}};setMagicItemUsage(c,[unresolved],unresolved,{equipped:true,attuned:true});
 const outcome=magicItemPersistentOutcome(c,[unresolved]);
 assert.equal(outcome.resistances.length,0,'10G · tipo de dano escolhido pelo Mestre não pode ser inferido');
 assert.equal(outcome.pending.length,1,'10G · escolha do Mestre ausente deve bloquear o efeito de forma explícita');
 assert.equal(validateMagicItemParameters(unresolved,{damageType:'Cortante'}).ok,false,'10G · Armadura de Resistência não aceita tipo físico fora da tabela normativa');
}
{
 const c={sheet:{},choices:{}};
 setMagicItemUsage(c,[adamantine,proof],adamantine,{equipped:true});
 setMagicItemUsage(c,[adamantine,proof],proof,{equipped:true,attuned:true});
 const derived={scores:{Constituição:10},level:1,hp:8,ac:16};
 applyMagicItemPersistentEffects(derived,c,[adamantine,proof]);
 assert.equal(derived.magicItemFlags.criticalHitsBecomeNormal,true,'10G · Armadura de Adamantina deve expor a normalização de críticos como estado mecânico');
 assert.equal(derived.magicItemFlags.divinationTargetingBlocked,true,'10G · amuleto de proteção deve expor bloqueio de alvo de Adivinhação');
 assert.equal(derived.magicItemFlags.scryingSensorsBlocked,true,'10G · amuleto de proteção deve expor bloqueio de sensores de vidência');
}
{
 const c={sheet:{},choices:{}};
 setMagicItemUsage(c,[vulnerability],vulnerability,{equipped:true,attuned:true});
 let outcome=magicItemPersistentOutcome(c,[vulnerability]);
 assert.equal(outcome.pending.length,1,'10G · Armadura da Vulnerabilidade sem escolha explícita deve permanecer pendente');
 assert.equal(setMagicItemParameters(c,[vulnerability],vulnerability,{damageType:'Fogo'}).ok,false,'10G · escolha inválida não deve ser persistida');
 assert.equal(setMagicItemParameters(c,[vulnerability],vulnerability,{damageType:'Perfurante'}).ok,true,'10G · tipo físico válido deve ser aceito');
 outcome=magicItemPersistentOutcome(c,[vulnerability]);
 assert.deepEqual(outcome.resistances,['Perfurante']);
 assert.deepEqual(new Set(outcome.vulnerabilities),new Set(['Concussão','Cortante']),'10G · os dois tipos físicos restantes devem virar vulnerabilidades estruturadas');
}
{
 const c={sheet:{},choices:{}};setMagicItemUsage(c,[weapon],weapon,{equipped:true,parameters:{magicBonus:2}});const outcome=magicItemPersistentOutcome(c,[weapon]);
 assert.equal(outcome.weaponAttackBonuses[0].value,2,'10G · Arma +1/+2/+3 deve expor bônus persistente de ataque');assert.equal(outcome.weaponDamageBonuses[0].value,2,'10G · Arma +1/+2/+3 deve expor bônus persistente de dano');
}
{
 const c={sheet:{},choices:{}};setMagicItemUsage(c,[luckstone,mithral],luckstone,{attuned:true});setMagicItemUsage(c,[luckstone,mithral],mithral,{equipped:true});const derived={scores:{Constituição:10},level:1,hp:8,ac:16};applyMagicItemPersistentEffects(derived,c,[luckstone,mithral]);
 assert.equal(derived.globalAbilityCheckBonus,1,'10G · Luckstone deve alimentar bônus global de testes de habilidade');assert.equal(derived.globalSavingThrowBonus,1,'10G · Luckstone deve alimentar bônus global de salvaguardas');assert.equal(derived.magicItemFlags.ignoreArmorStrengthRequirement,true,'10G · Mithral Armor deve remover requisito de Força da armadura');assert.equal(derived.magicItemFlags.ignoreArmorStealthDisadvantage,true,'10G · Mithral Armor deve remover desvantagem de Furtividade da armadura');
}
{
 const c={sheet:{},choices:{}};assert.equal(setMagicItemUsage(c,[giantPotion],giantPotion,{active:true,parameters:{strengthScore:25}}).ok,true);const derived={scores:{Força:10,Constituição:10},level:5,hp:30,ac:12};applyMagicItemPersistentEffects(derived,c,[giantPotion]);assert.equal(derived.scores.Força,25,'10G · efeito ativo da Poção de Força do Gigante deve alterar o atributo efetivo');assert.equal(magicItemUsage(c,giantPotion).active,true,'10F · efeito temporário precisa persistir como estado ativo na Ficha');
}
{
 const c={sheet:{},choices:{}};assert.equal(setMagicItemUsage(c,[carpet],carpet,{active:true,parameters:{flyingSpeed:60}}).ok,true);const derived={scores:{Constituição:10},level:1,hp:8,ac:10};applyMagicItemPersistentEffects(derived,c,[carpet]);assert.equal(derived.magicItemMovement.flySpeed,60,'10G · Tapete Voador ativo deve expor deslocamento de voo parametrizado');assert.equal(derived.magicItemFlags.ridingFlyingCarpet,true);
}
{
 const c={sheet:{},choices:{}};assert.equal(setMagicItemUsage(c,[defender],defender,{equipped:true,attuned:true,parameters:{acTransfer:2}}).ok,true);const outcome=magicItemPersistentOutcome(c,[defender]);assert.equal(outcome.acBonus,2,'10G · Defender deve estruturar a parcela transferida para CA');assert.equal(outcome.weaponAttackBonuses[0].value,1,'10G · Defender deve manter somente o bônus restante no ataque');assert.equal(outcome.weaponDamageBonuses[0].value,1,'10G · Defender deve manter somente o bônus restante no dano');
}
{
 setMagicItemUsage(character,base,amulet,{equipped:false,attuned:false});
 assert.equal(activeMagicItemUsages(character,base).some(x=>x.row.refId==='amulet-of-health'),false,'10F · desligar todos os estados deve remover a entrada persistida do amuleto');
}
{
 const c={sheet:{},choices:{}};setMagicItemUsage(c,[armor],armor,{equipped:true});
 assert.equal(activeMagicItemUsages(c,[armor]).length,1);
 const cleared=clearUnavailableMagicItemUsages(c,[amulet]);
 assert.deepEqual(cleared,['magic-item|ref:armor-plus-1'],'10F · estado órfão deve ser limpo quando o item deixa o inventário');
 assert.equal(activeMagicItemUsages(c,[amulet]).length,0);
}

console.log('10F–10G · Estado, parâmetros e efeitos persistentes de itens mágicos: OK');
