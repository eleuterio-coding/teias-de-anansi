import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 coinBalanceCp,
 creationBalanceCp,
 currentCoinSnapshot,
 economyMode,
 ensureEconomyMetadata,
 markCurrentEconomy,
 recordCreationBalanceAndRestoreCurrent
} from '../scripts/character-builder/economy-state.js';

const character={
 id:'pc-current-balance-test',
 sheet:{inventory:{cp:0,sp:0,ep:0,gp:205,pp:0}}
};

ensureEconomyMetadata(character);
assert.equal(economyMode(character),'creation','Personagem novo deve manter o saldo vinculado à criação.');
assert.equal(creationBalanceCp(character),20500,'Saldo inicial deve ser registrado em PC.');
assert.equal(coinBalanceCp(character),20500);

markCurrentEconomy(character);
const protectedCurrent=currentCoinSnapshot(character);
character.sheet.inventory.gp=180;
assert.equal(economyMode(character),'current','Alteração na ficha deve desacoplar o saldo atual da criação.');
assert.equal(creationBalanceCp(character),20500,'Desacoplar não pode alterar o saldo inicial registrado.');

const savedCurrent=currentCoinSnapshot(character);
character.sheet.inventory.gp=781;
assert.equal(recordCreationBalanceAndRestoreCurrent(character,savedCurrent),true,'O construtor deve registrar o novo saldo de criação e restaurar o saldo atual.');
assert.equal(creationBalanceCp(character),78100,'Alterações no histórico de criação devem atualizar apenas o saldo inicial calculado.');
assert.equal(coinBalanceCp(character),18000,'Reabrir ou alterar o construtor não pode sobrescrever o saldo atual da ficha.');
assert.deepEqual(currentCoinSnapshot(character),savedCurrent);

const roundTrip=JSON.parse(JSON.stringify(character));
assert.equal(economyMode(roundTrip),'current','O modo pós-criação deve sobreviver ao salvamento.');
assert.equal(creationBalanceCp(roundTrip),78100,'O saldo inicial recalculado deve sobreviver ao salvamento.');
assert.equal(coinBalanceCp(roundTrip),18000,'O saldo atual deve sobreviver ao salvamento.');

const packageSource=readFileSync(new URL('../scripts/character-builder/package-b-purchase-ui.js',import.meta.url),'utf8');
assert.match(packageSource,/initPostCreationEconomyGuard/,'A Etapa 6 deve inicializar a proteção do saldo pós-criação.');
assert.ok(packageSource.indexOf('initPostCreationEconomyGuard()')<packageSource.indexOf('initWealthPurchaseUi()'),'A proteção precisa capturar o saldo atual antes do cálculo automático de criação.');

const guardSource=readFileSync(new URL('../scripts/character-builder/post-creation-economy-guard.js',import.meta.url),'utf8');
assert.match(guardSource,/recordCreationBalanceAndRestoreCurrent/,'O guardião deve registrar o saldo de criação antes de restaurar o saldo atual.');
assert.match(guardSource,/currentBalancePreserved/,'A restauração deve anunciar atualização do inventário sem entrar em loop.');

const sheetSource=readFileSync(new URL('../scripts/character-sheet-equipment-ownership.js',import.meta.url),'utf8');
assert.match(sheetSource,/markCurrentEconomy/,'Alterar moedas na ficha deve marcar a economia como pós-criação.');
assert.match(sheetSource,/Saldo inicial após compras/,'A ficha deve distinguir saldo inicial após compras.');
assert.match(sheetSource,/Saldo atual/,'A ficha deve exibir o saldo atual separadamente.');

console.log('OK — saldo atual pós-criação fica separado do orçamento inicial e sobrevive ao round-trip.');
