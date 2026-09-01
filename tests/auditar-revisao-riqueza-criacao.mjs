import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {startingEquipmentReviewModel} from '../scripts/character-builder/starting-equipment-review-ui.js';
import {itemsCurrencyCp} from '../scripts/character-builder/starting-equipment-rules.js';

const fighter={id:'classes:srd521:fighter',slug:'fighter',name:'Guerreiro'};
const noble={id:'bg:noble',name:'Nobre',equipmentText:'Fine Clothes, Perfume, 29 PO'};

const cashReview=startingEquipmentReviewModel(noble,'B',1,fighter,'C');
assert.equal(cashReview.classChoice,'C');
assert.equal(cashReview.backgroundChoice,'B');
assert.equal(itemsCurrencyCp(cashReview.classPackage.itens),15500,'Revisão deve usar o Pacote C real do Guerreiro.');
assert.equal(itemsCurrencyCp(cashReview.backgroundPackage.itens),5000,'Revisão deve usar o Pacote B padrão de 50 PO do Antecedente.');
assert.equal(cashReview.classSummary,'155 PO');
assert.equal(cashReview.backgroundSummary,'50 PO');
assert.doesNotMatch(cashReview.backgroundSummary,/Fine Clothes|Perfume/,'Pacote B não pode exibir itens físicos do Pacote A na Revisão.');
assert.equal(cashReview.breakdown.totalCp,20500,'Revisão deve refletir o mesmo total de 205 PO do motor no Level 1.');

const level5Review=startingEquipmentReviewModel(noble,'A',5,fighter,'A');
assert.equal(level5Review.breakdown.wealthTier,'privilegiada');
assert.equal(level5Review.breakdown.adjustedWealthGp,748);
assert.equal(level5Review.breakdown.totalCp,78100,'Revisão deve refletir 781 PO no cenário Guerreiro A + Nobre A no Level 5.');
assert.match(level5Review.classSummary,/Greatsword/);
assert.match(level5Review.backgroundSummary,/Fine Clothes/);

const packageUiSource=readFileSync(new URL('../scripts/character-builder/package-b-purchase-ui.js',import.meta.url),'utf8');
assert.match(packageUiSource,/initStartingEquipmentReviewUi/,'Fluxo principal deve inicializar o resumo econômico da Revisão.');
const reviewUiSource=readFileSync(new URL('../scripts/character-builder/starting-equipment-review-ui.js',import.meta.url),'utf8');
for(const label of['Pacote da Classe','Pacote do Antecedente','Faixa Econômica','Riqueza por Level','Total inicial para compras/saldo'])assert.match(reviewUiSource,new RegExp(label),`Revisão deve exibir: ${label}.`);
assert.match(reviewUiSource,/legacy\.hidden=true/,'Resumo legado inconsistente deve ficar oculto quando a revisão mecânica estiver ativa.');

console.log('OK — Revisão usa os pacotes mecânicos reais e exibe Faixa Econômica, Riqueza por Level e total inicial.');
