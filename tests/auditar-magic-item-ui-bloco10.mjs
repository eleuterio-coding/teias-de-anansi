import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const ui=await readFile('scripts/character-sheet-magic-item-ui.js','utf8');
const sheet=await readFile('scripts/character-sheet-equipment-ownership.js','utf8');
const ownership=await readFile('scripts/character-builder/equipment-ownership.js','utf8');
const state=await readFile('scripts/character-sheet-magic-item-state.js','utf8');

assert.ok(sheet.includes("import('./character-sheet-magic-item-ui.js"),'10I · Ficha deve carregar o painel mecânico de itens mágicos');
assert.ok(ownership.includes('magicRefFromPurchaseId'),'10I · compras antigas de item mágico precisam recuperar o refId mecânico pela chave de compra');
assert.ok(ownership.includes("kind=magicRef?'magic'"),'10I · item mágico comprado deve chegar ao inventário atual como kind magic');
for(const field of['equipped','attuned','active'])assert.ok(ui.includes(`data-magic-field=\"${field}\"`),`10I · Ficha precisa expor controle persistente ${field}`);
for(const parameter of['magicBonus','damageType','strengthScore','flyingSpeed','acTransfer','targetRefId'])assert.ok(ui.includes(`data-magic-param=\"${parameter}\"`),`10I · parâmetro mecânico ${parameter} precisa ser editável na Ficha`);
assert.ok(ui.includes('setMagicItemUsage'),'10I · UI deve persistir estado pela API canônica');
assert.ok(ui.includes('classifyMagicItemResponsibility'),'10I · UI deve respeitar fronteira Bloco 10/11 do catálogo congelado');
assert.ok(ui.includes('Resolução · Bloco 11'),'10I · efeito instantâneo precisa ser delegado de forma explícita, não silenciosa');
assert.ok(state.includes('globalAbilityCheckBonus')&&state.includes('globalSavingThrowBonus'),'10I · bônus persistentes globais precisam chegar ao estado derivado');
assert.ok(state.includes('magicItemMovement')&&state.includes('magicItemWeaponBonuses'),'10I · movimento e modificadores de arma precisam permanecer estruturados para consumo mecânico');
assert.ok(!/supabase/i.test(`${ui}\n${sheet}\n${ownership}\n${state}`),'10I · Bloco 10 não pode introduzir Supabase');

console.log('10I · Ponte inventário, controles da Ficha e parâmetros persistentes: OK');
