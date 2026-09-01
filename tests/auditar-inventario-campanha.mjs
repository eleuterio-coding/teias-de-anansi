import assert from'node:assert/strict';
import fs from'node:fs';
import{coinBalanceCp,creationBalanceCp,economyMode}from'../scripts/character-builder/economy-state.js';
import{applyCampaignInventoryRows,applyInventoryTransaction,applyCurrencyTransaction,campaignInventoryStarted,clearUnavailableActiveEquipment,inventoryRowKey,inventoryTransactionHistory}from'../scripts/character-sheet-inventory-rules.js';

const sword={kind:'weapon',refId:'weapon:longsword',name:'Espada Longa',qty:1,source:'Pacote da Classe'};
const rope={kind:'belonging',refId:null,name:'Corda de cânhamo',qty:1,source:'Pacote do Antecedente'};
const base=[sword,rope];
const character={id:'pc-campaign',choices:{class:{level:5,equipment:'A'},background:{equipment:'A'},equipment:{weapon:'weapon:longsword',armor:null,shield:false},purchases:{quantities:{'gear:old':1},items:{'gear:old':{name:'Compra de criação'}}}},sheet:{inventory:{cp:0,sp:0,ep:0,gp:20,pp:0,notes:'',magicItems:'',otherHoldings:''}}};
const creationPurchases=JSON.stringify(character.choices.purchases);

assert.equal(coinBalanceCp(character),2000);
assert.equal(campaignInventoryStarted(character),false);

const potion={kind:'magic',refId:null,name:'Poção de Cura'};
const buy=applyInventoryTransaction(character,base,{movement:'buy',item:potion,qty:2,unitCostCp:100,note:'Comprada na cidade'});
assert.equal(buy.ok,true);
assert.equal(coinBalanceCp(character),1800,'Comprar 2 itens de 1 PO deve retirar 2 PO do saldo atual.');
assert.equal(creationBalanceCp(character),2000,'O saldo histórico da criação deve permanecer congelado antes da primeira compra de campanha.');
assert.equal(economyMode(character),'current');
assert.equal(campaignInventoryStarted(character),true);
assert.equal(buy.rows.find(row=>inventoryRowKey(row)===inventoryRowKey(potion))?.qty,2);
assert.ok(Array.isArray(character.sheet.inventoryCampaign.baseSnapshot),'A primeira movimentação deve congelar o inventário que saiu da criação.');
assert.equal(JSON.stringify(character.choices.purchases),creationPurchases,'Movimentações de campanha não podem reescrever compras da criação.');

const changedBase=[...base,{kind:'weapon',refId:'weapon:greataxe',name:'Machado Grande',qty:1,source:'Construtor alterado depois'}];
const frozenRows=applyCampaignInventoryRows(changedBase,character);
assert.equal(frozenRows.some(row=>row.refId==='weapon:greataxe'),false,'Depois da primeira movimentação, alterações estruturais não podem recriar o inventário pós-criação.');

const sell=applyInventoryTransaction(character,changedBase,{movement:'sell',item:sword,qty:1,unitCostCp:750,note:'Vendida a um ferreiro'});
assert.equal(sell.ok,true);
assert.equal(coinBalanceCp(character),2550,'Venda deve somar o valor negociado ao saldo atual.');
assert.equal(sell.rows.some(row=>row.refId==='weapon:longsword'),false,'Item vendido integralmente deve sair do inventário atual.');
const cleared=clearUnavailableActiveEquipment(character,sell.rows);
assert.deepEqual(cleared,['weapon'],'Arma vendida não pode continuar equipada.');
assert.equal(character.choices.equipment.weapon,null);

const beforeHistory=inventoryTransactionHistory(character).length;
const invalidLoss=applyInventoryTransaction(character,changedBase,{movement:'lose',item:rope,qty:2,unitCostCp:0});
assert.equal(invalidLoss.ok,false,'Não pode perder mais unidades do que possui.');
assert.equal(inventoryTransactionHistory(character).length,beforeHistory,'Movimentação inválida não entra no histórico.');
assert.equal(coinBalanceCp(character),2550,'Movimentação inválida não altera moedas.');

const gain=applyInventoryTransaction(character,changedBase,{movement:'gain',item:{kind:'belonging',name:'Mapa antigo'},qty:1,unitCostCp:9999,note:'Recompensa de missão'});
assert.equal(gain.ok,true);
assert.equal(coinBalanceCp(character),2550,'Receber item não deve alterar moedas, mesmo que um preço acidental seja informado.');
assert.equal(gain.rows.some(row=>row.name==='Mapa antigo'&&row.qty===1),true);

const income=applyCurrencyTransaction(character,{movement:'income',amountCp:500,note:'Recompensa da missão'});
assert.equal(income.ok,true);
assert.equal(coinBalanceCp(character),3050,'Receita avulsa deve aumentar o caixa sem criar item.');
const expense=applyCurrencyTransaction(character,{movement:'expense',amountCp:250,note:'Hospedagem'});
assert.equal(expense.ok,true);
assert.equal(coinBalanceCp(character),2800,'Despesa avulsa deve reduzir o caixa.');
const deniedExpense=applyCurrencyTransaction(character,{movement:'expense',amountCp:999999,note:'Despesa impossível'});
assert.equal(deniedExpense.ok,false,'Despesa acima do saldo deve ser recusada.');
assert.equal(coinBalanceCp(character),2800);
assert.equal(JSON.stringify(character.choices.purchases),creationPurchases,'Caixa de campanha também não pode tocar compras de criação.');

const poor={id:'pc-poor',choices:{equipment:{}},sheet:{inventory:{cp:0,sp:0,ep:0,gp:1,pp:0}}};
const denied=applyInventoryTransaction(poor,[],{movement:'buy',item:{kind:'belonging',name:'Item caro'},qty:1,unitCostCp:200});
assert.equal(denied.ok,false,'Compra acima do saldo deve ser recusada.');
assert.equal(coinBalanceCp(poor),100);
assert.equal(campaignInventoryStarted(poor),false,'Compra recusada não deve congelar um inventário de campanha vazio.');

const roundTrip=JSON.parse(JSON.stringify(character));
assert.equal(coinBalanceCp(roundTrip),2800);
assert.equal(inventoryTransactionHistory(roundTrip).length,5);
assert.deepEqual(applyCampaignInventoryRows(changedBase,roundTrip).map(row=>[row.name,row.qty]),applyCampaignInventoryRows(changedBase,character).map(row=>[row.name,row.qty]),'Inventário atual deve sobreviver ao save/reopen em JSON.');

const ui=fs.readFileSync(new URL('../scripts/character-sheet-inventory-ui.js',import.meta.url),'utf8');
const inventoryRules=fs.readFileSync(new URL('../scripts/character-sheet-inventory-rules.js',import.meta.url),'utf8');
const ownership=fs.readFileSync(new URL('../scripts/character-builder/equipment-ownership.js',import.meta.url),'utf8');
const gameplay=fs.readFileSync(new URL('../scripts/character-sheet-gameplay-ui.js',import.meta.url),'utf8');
for(const token of['Inventário e economia de campanha','Registrar movimentação','Saldo atual','Movimentar moedas','Equipar','Desequipar','gameplayIgnore'])assert.ok(ui.includes(token),`UI de inventário sem ${token}`);
for(const token of["buy:'Comprar'","sell:'Vender'","gain:'Receber'","lose:'Perder'","income:'Receber moedas'","expense:'Gastar moedas'"])assert.ok(inventoryRules.includes(token),`Fonte normativa de movimentações sem ${token}`);
for(const forbidden of['WEALTH_BY_LEVEL','creationBudgetCp(','creationBudgetBreakdown('])assert.equal(ui.includes(forbidden),false,`Inventário pós-criação não pode chamar ${forbidden}`);
assert.ok(ownership.includes('includeCampaign=true'),'Inventário mecânico deve aceitar a camada de campanha.');
assert.ok(ownership.includes('applyCampaignInventoryRows'),'Inventário mecânico deve aplicar as movimentações pós-criação.');
assert.ok(gameplay.includes("import'./character-sheet-inventory-ui.js"),'Modo de Jogo deve carregar o inventário de campanha.');

console.log('OK — inventário e caixa de campanha preservam origem, saldo atual, snapshot e movimentações sem reaplicar criação.');
