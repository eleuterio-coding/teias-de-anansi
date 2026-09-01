import assert from 'node:assert/strict';
import {physicalItems,itemsCurrencyCp} from '../scripts/character-builder/starting-equipment-rules.js';
import {sheetBackgroundForEconomy,sheetCreationEconomySnapshot} from '../scripts/character-sheet-equipment-ownership.js';

const fighter={id:'classes:srd521:fighter',slug:'fighter',name:'Guerreiro'};
const noble={id:'bg:noble',name:'Nobre',equipmentText:'Fine Clothes, Perfume, 29 PO'};
const custom={id:'bg:custom',name:'Cronista Errante',equipmentText:'Journal, 10 PO'};

const customCharacter={
 id:'pc-custom-economy',
 choices:{
  class:{level:5,equipment:'A'},
  background:{equipment:'A',wealthTier:'prospera',wealthTierBackgroundId:custom.id}
 }
};
const effectiveCustom=sheetBackgroundForEconomy(custom,customCharacter);
assert.notEqual(effectiveCustom,custom,'A ficha deve aplicar a Faixa Econômica salva sem mutar o catálogo original.');
assert.equal(effectiveCustom.wealthTier,'prospera');
assert.equal(custom.wealthTier,undefined,'O catálogo bruto do Antecedente deve permanecer imutável.');

const customSnapshot=sheetCreationEconomySnapshot(customCharacter,fighter,custom);
assert.equal(customSnapshot.breakdown.wealthTier,'prospera','A ficha deve restaurar a Faixa Econômica personalizada salva.');
assert.equal(customSnapshot.breakdown.adjustedWealthGp,715,'Level 5 Próspera deve aplicar 650 × 1,10 = 715 PO.');
assert.equal(customSnapshot.breakdown.totalCp,72900,'Guerreiro A (4 PO) + Cronista A (10 PO) + 715 PO devem totalizar 729 PO.');

const roundTripCharacter=JSON.parse(JSON.stringify(customCharacter));
const roundTripSnapshot=sheetCreationEconomySnapshot(roundTripCharacter,fighter,custom);
assert.equal(roundTripSnapshot.breakdown.wealthTier,'prospera','A Faixa Econômica deve sobreviver ao round-trip de persistência do personagem.');
assert.equal(roundTripSnapshot.breakdown.totalCp,customSnapshot.breakdown.totalCp,'O orçamento histórico deve permanecer idêntico após salvar e reabrir.');

const staleStandardCharacter={
 id:'pc-noble-stale-tier',
 choices:{
  class:{level:5,equipment:'A'},
  background:{equipment:'A',wealthTier:'prospera',wealthTierBackgroundId:noble.id}
 }
};
const nobleSnapshot=sheetCreationEconomySnapshot(staleStandardCharacter,fighter,noble);
assert.equal(nobleSnapshot.breakdown.wealthTier,'privilegiada','Antecedente-padrão deve ignorar override salvo indevido e manter a faixa normativa.');
assert.equal(nobleSnapshot.breakdown.adjustedWealthGp,748);
assert.equal(nobleSnapshot.breakdown.totalCp,78100);

const cashCharacter={
 id:'pc-cash-packages',
 choices:{class:{level:1,equipment:'C'},background:{equipment:'B'}}
};
const cashSnapshot=sheetCreationEconomySnapshot(cashCharacter,fighter,noble);
assert.equal(itemsCurrencyCp(cashSnapshot.classPackage.itens),15500,'A ficha deve reconstruir o Pacote C do Guerreiro como 155 PO.');
assert.equal(itemsCurrencyCp(cashSnapshot.backgroundPackage.itens),5000,'A ficha deve reconstruir o Pacote B padrão do Antecedente como 50 PO.');
assert.equal(physicalItems(cashSnapshot.backgroundPackage.itens).length,0,'Pacote B do Nobre não pode reaparecer com itens físicos do Pacote A na ficha.');
assert.equal(cashSnapshot.breakdown.totalCp,20500,'Guerreiro C + Nobre B no Level 1 deve permanecer em 205 PO após reabrir a ficha.');

console.log('OK — ficha restaura pacotes, Faixa Econômica e orçamento histórico após persistência.');
