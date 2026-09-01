import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {state} from '../scripts/character-builder/state.js';
import {applyBackgroundWealthTier,isStandardWealthBackground} from '../scripts/character-builder/background-wealth-tier-ui.js';
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

assert.equal(isStandardWealthBackground(noble),true,'Nobre deve ser reconhecido como Antecedente-padrão.');
assert.equal(isStandardWealthBackground(custom),false,'Antecedente não padronizado deve permitir Faixa Econômica configurável.');
state.catalogs.backgrounds=[custom];state.c={id:'pc-wealth-tier-test',refs:{background:custom.id},choices:{background:{}}};
let customProfile=applyBackgroundWealthTier(custom);
assert.equal(customProfile.id,'regular','Antecedente personalizado deve iniciar na Faixa Regular.');
assert.equal(state.c.choices.background.wealthTier,'regular','Faixa Regular padrão deve ser persistida na escolha do personagem.');
state.c.choices.background.wealthTier='prospera';
customProfile=applyBackgroundWealthTier(custom);
assert.equal(customProfile.id,'prospera','Escolha explícita da Faixa Econômica deve chegar ao motor de Riqueza por Level.');
assert.equal(custom.wealthTier,'prospera','Catálogo em runtime deve refletir a escolha econômica do personagem.');
state.catalogs.backgrounds=[noble];state.c.refs.background=noble.id;
const standardProfile=applyBackgroundWealthTier(noble);
assert.equal(standardProfile.id,'privilegiada','Antecedente-padrão deve manter sua classificação normativa.');
assert.equal(state.c.choices.background.wealthTier,null,'Classificação padrão não deve ser sobrescrita por escolha personalizada anterior.');

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
assert.equal(fighterCashNobleCash.totalCp,20500,'Guerreiro C + Antecedente B no Level 1 deve totalizar 205 PO.');

const physicalAtL5=creationPhysicalItems(noble,'A',5,fighter,'A');
assert.ok(physicalAtL5.some(x=>x.nome==='Greatsword'&&x._startingSource.includes('Classe')),'Pacote físico da Classe deve ser mantido acima do Level 1.');
assert.ok(physicalAtL5.some(x=>x.nome==='Fine Clothes'&&x._startingSource.includes('Antecedente')),'Pacote físico do Antecedente deve ser mantido acima do Level 1.');

const rules=JSON.parse(readFileSync(new URL('../dados/regras-casa-adicionais.json',import.meta.url),'utf8'));
const wealthRule=rules.itens.find(x=>x.nome==='Riqueza por Level');
assert.ok(wealthRule,'Biblioteca de Regras da Casa deve conter Riqueza por Level.');

const values=wealthRule.secoes.find(x=>x.titulo==='Valores por Level')?.texto||'';
assert.match(values,/Level 5: 650 PO/);
assert.match(values,/Level 20: 30\.000 PO/);
assert.doesNotMatch(values,/90\.800 PO/,'A curva anterior não pode permanecer na regra normativa.');

const normativeLevelRows=[...values.matchAll(/Level\s+(\d+):\s*(—|[\d.]+)(?:\s+PO)?/g)].map(match=>[
 Number(match[1]),
 match[2]==='—'?0:Number(match[2].replace(/\./g,''))
]);
assert.equal(normativeLevelRows.length,20,'A regra normativa deve declarar todos os Levels de 1 a 20.');
const normativeWealthByLevel=Object.fromEntries(normativeLevelRows);
for(let level=1;level<=20;level+=1){
 assert.equal(normativeWealthByLevel[level],WEALTH_BY_LEVEL[level],`Regra normativa e motor divergem no Level ${level}.`);
 assert.equal(wealthBaseGp(level),WEALTH_BY_LEVEL[level],`wealthBaseGp diverge da curva do motor no Level ${level}.`);
}

const tiers=wealthRule.secoes.find(x=>x.titulo==='Faixas Econômicas')?.texto||'';
assert.match(tiers,/Privilegiada ×1,15/);
assert.match(tiers,/Precária ×0,90/);
const tierRows=[...tiers.matchAll(/(Precária|Modesta|Regular|Estável|Próspera|Privilegiada)\s+×\s*(\d+,\d+)/g)].map(match=>[
 match[1],
 Number(match[2].replace(',','.'))
]);
assert.equal(tierRows.length,6,'A regra normativa deve declarar exatamente 6 Faixas Econômicas.');
const tierMultiplierByLabel=Object.fromEntries(tierRows);

const classifications=wealthRule.secoes.find(x=>x.titulo==='Classificação Padrão dos Antecedentes')?.texto||'';
const normativeBackgroundTiers=classifications.replace(/\.$/,'').split(';').map(x=>x.trim()).filter(Boolean).map(row=>{
 const match=row.match(/^(.+?)\s+—\s+(.+)$/);
 assert.ok(match,`Classificação normativa de Antecedente inválida: ${row}`);
 return{name:match[1].trim(),tierLabel:match[2].trim()};
});
assert.equal(normativeBackgroundTiers.length,16,'A regra normativa deve declarar os 16 Antecedentes-padrão.');
for(const{name,tierLabel}of normativeBackgroundTiers){
 assert.ok(Object.hasOwn(tierMultiplierByLabel,tierLabel),`Antecedente ${name} usa Faixa Econômica não declarada: ${tierLabel}.`);
 const profile=backgroundWealthProfile({name});
 assert.equal(profile.label,tierLabel,`Regra normativa e motor divergem na Faixa Econômica de ${name}.`);
 assert.equal(profile.multiplier,tierMultiplierByLabel[tierLabel],`Multiplicador de ${name} diverge da Faixa Econômica normativa ${tierLabel}.`);
 assert.equal(isStandardWealthBackground({name}),true,`A interface deve reconhecer ${name} como Antecedente-padrão e bloquear override econômico.`);
}

const packageUiSource=readFileSync(new URL('../scripts/character-builder/package-b-purchase-ui.js',import.meta.url),'utf8');
assert.match(packageUiSource,/initBackgroundWealthTierUi/,'O fluxo de criação deve carregar a interface de Faixa Econômica.');
const wealthTierUiSource=readFileSync(new URL('../scripts/character-builder/background-wealth-tier-ui.js',import.meta.url),'utf8');
for(const id of['precaria','modesta','regular','estavel','prospera','privilegiada'])assert.match(wealthTierUiSource,new RegExp(id),`Interface deve contemplar a Faixa Econômica ${id}.`);

console.log('OK — Riqueza por Level, faixas econômicas, 16 antecedentes, personalizados, pacotes iniciais e regra normativa sincronizados.');
