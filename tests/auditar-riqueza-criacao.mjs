import assert from 'node:assert/strict';
import {
 STANDARD_BACKGROUND_PACKAGE_B_GP,
 WEALTH_BY_LEVEL,
 backgroundPackageOptions,
 backgroundWealthProfile,
 classPackageOptions,
 creationBudgetBreakdown,
 creationPhysicalItems,
 itemsCurrencyCp,
 wealthBaseGp,
 wealthGp
} from '../scripts/character-builder/starting-equipment-rules.js';

const fighter={id:'classes:srd521:fighter',slug:'fighter',name:'Guerreiro'};
const noble={id:'bg:noble',name:'Nobre',equipmentText:'Fine Clothes, Perfume, 29 PO'};
const acolyte={id:'bg:acolyte',name:'Acólito',equipmentText:'Holy Symbol, Prayer Book, 5 Incense, Vestments, Common Clothes, 8 PO'};
const custom={id:'bg:custom',name:'Cronista Errante',equipmentText:'Journal, 10 PO'};

assert.equal(STANDARD_BACKGROUND_PACKAGE_B_GP,50,'Pacote B padrão do Antecedente deve conceder 50 PO.');
assert.equal(itemsCurrencyCp(backgroundPackageOptions(noble)[1].itens),5000,'Pacote B do Antecedente deve equivaler a 50 PO.');

const fighterOptions=classPackageOptions(fighter);
assert.equal(fighterOptions.length,3,'Guerreiro deve possuir opções A, B e C.');
assert.deepEqual(fighterOptions.map(x=>x.id),['A','B','C']);
assert.deepEqual(fighterOptions.map(x=>itemsCurrencyCp(x.itens)),[400,1100,15500],'PO das opções do Guerreiro devem ser 4, 11 e 155.');

assert.equal(backgroundWealthProfile(noble).id,'privilegiada');
assert.equal(backgroundWealthProfile(noble).multiplier,1.15);
assert.equal(backgroundWealthProfile(acolyte).id,'modesta');
assert.equal(backgroundWealthProfile(acolyte).multiplier,.95);
assert.equal(backgroundWealthProfile(custom).id,'regular','Antecedente sem classificação explícita deve usar Regular.');
assert.equal(backgroundWealthProfile({name:'Personalizado',wealthTier:'Próspera'}).multiplier,1.10,'Faixa econômica explícita deve prevalecer.');

assert.equal(wealthBaseGp(1),0);
assert.equal(wealthBaseGp(5),650);
assert.equal(wealthBaseGp(20),30000);
assert.equal(WEALTH_BY_LEVEL[10],5000);
assert.equal(wealthGp(5,noble),748,'650 × 1,15 deve arredondar para 748 PO.');
assert.equal(wealthGp(5,acolyte),618,'650 × 0,95 deve arredondar para 618 PO.');
assert.equal(wealthGp(20,noble),34500);
assert.equal(wealthGp(20,acolyte),28500);

const nobleL1=creationBudgetBreakdown(noble,'A',1,fighter,'A');
assert.equal(nobleL1.classCp,400);
assert.equal(nobleL1.backgroundCp,2900);
assert.equal(nobleL1.wealthCp,0);
assert.equal(nobleL1.totalCp,3300,'Guerreiro A + Nobre A no Level 1 deve iniciar com 33 PO.');

const nobleL5=creationBudgetBreakdown(noble,'A',5,fighter,'A');
assert.equal(nobleL5.adjustedWealthGp,748);
assert.equal(nobleL5.totalCp,78100,'Guerreiro A + Nobre A no Level 5 deve totalizar 781 PO antes das compras.');

const acolyteL5=creationBudgetBreakdown(acolyte,'A',5,fighter,'A');
assert.equal(acolyteL5.adjustedWealthGp,618);
assert.equal(acolyteL5.totalCp,63000,'Guerreiro A + Acólito A no Level 5 deve totalizar 630 PO antes das compras.');
assert.ok(nobleL5.totalCp>acolyteL5.totalCp,'Nobre deve iniciar com mais PO que Acólito no mesmo Level e Classe.');

const fighterCashNobleCash=creationBudgetBreakdown(noble,'B',1,fighter,'C');
assert.equal(fighterCashNobleCash.totalCp,20500,'Guerreiro C + Nobre B no Level 1 deve totalizar 205 PO.');

const physicalAtL5=creationPhysicalItems(noble,'A',5,fighter,'A');
assert.ok(physicalAtL5.some(x=>x.nome==='Greatsword'&&x._startingSource.includes('Classe')),'Pacote físico da Classe deve ser mantido acima do Level 1.');
assert.ok(physicalAtL5.some(x=>x.nome==='Fine Clothes'&&x._startingSource.includes('Antecedente')),'Pacote físico do Antecedente deve ser mantido acima do Level 1.');

console.log('OK — Riqueza por Level, faixas econômicas e pacotes iniciais auditados.');
