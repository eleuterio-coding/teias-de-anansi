import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const ui=await readFile('scripts/character-sheet-resolution-ui.js','utf8');
const rules=await readFile('scripts/character-sheet-resolution-rules.js','utf8');
const sheet=await readFile('scripts/character-sheet-equipment-ownership.js','utf8');
const magicUi=await readFile('scripts/character-sheet-magic-item-resolution-ui.js','utf8');
const magicRules=await readFile('scripts/character-sheet-magic-item-resolution.js','utf8');
const deathUi=await readFile('scripts/character-sheet-death-ui.js','utf8');
const deathRules=await readFile('scripts/character-sheet-death-rules.js','utf8');
const roadmap=await readFile('ROADMAP-V1.md','utf8');

assert.ok(sheet.includes("import('./character-sheet-resolution-ui.js"),'11 · Ficha precisa carregar o painel de resolução');
assert.ok(sheet.includes("import('./character-sheet-magic-item-resolution-ui.js"),'11 · Ficha precisa carregar a resolução dos itens mágicos');
assert.ok(sheet.includes("import('./character-sheet-death-ui.js"),'11 · Ficha precisa carregar Salvaguardas contra a Morte');
for(const marker of['resolution-target-ac','resolution-target-res','resolution-target-imm','resolution-target-vuln','resolution-target-save'])assert.ok(ui.includes(marker),`11 · alvo transitório precisa expor ${marker}`);
for(const action of['skill','ability','save','initiative','spell-attack','spell-save','spell-damage','spell-heal','self-damage','self-heal'])assert.ok(ui.includes(`data-resolution-action=\"${action}\"`)||ui.includes(`action==='${action}'`)||ui.includes(`['skill','ability','save','initiative']`),`11 · ação ${action} precisa existir na Ficha`);
assert.ok(ui.includes('[data-weapon-attack],[data-light-extra]'),'11 · ataques já existentes devem alimentar o motor de resolução');
assert.ok(ui.includes('activeConcentration')&&ui.includes('concentrationDc')&&ui.includes('endConcentration'),'11 · dano precisa resolver Concentração pela mesma Ficha');
assert.ok(ui.includes('Resistências, imunidades, vulnerabilidades e PV temporários'),'11 · Ficha deve explicitar aplicação automática das defesas');
assert.ok(rules.includes('applyDamageDefenses')&&rules.includes('resolveWeaponAttack')&&rules.includes('resolveSpellAttack'),'11 · contratos centrais de resolução precisam existir');
assert.ok(rules.includes('globalAbilityCheckBonus')&&rules.includes('globalSavingThrowBonus'),'11 · bônus persistentes do Bloco 10 precisam alimentar Testes de d20');
assert.ok(rules.includes('magicItemWeaponBonuses'),'11 · bônus persistentes de arma do Bloco 10 precisam alimentar ataques');
for(const action of['activate','init-charges','spend-charge','restore-charges','consume'])assert.ok(magicUi.includes(`'${action}'`)||magicUi.includes(`\"${action}\"`),`11 · itens mágicos precisam expor ação operacional ${action}`);
assert.ok(magicRules.includes('capacityExpression')&&magicRules.includes('spendMagicItemCharges'),'11 · cargas precisam ser estado mecânico, não anotação textual');
assert.ok(deathUi.includes('resolution-self-critical')&&deathUi.includes('rollDeathSave'),'11 · Ficha precisa distinguir dano crítico a 0 PV e rolar Salvaguarda contra a Morte');
for(const rule of['natural===20','natural===1','applyDamageAtZeroConsequences','dano massivo'])assert.ok(deathRules.includes(rule),`11 · regra de morte ausente: ${rule}`);
assert.ok(roadmap.includes('11. Rolagens e resolução de jogo — ✅ Aceito'),'11 · roadmap precisa refletir aceite do bloco');
assert.ok(!/supabase/i.test(`${ui}\n${rules}\n${sheet}\n${magicUi}\n${magicRules}\n${deathUi}\n${deathRules}`),'11 · resolução não pode introduzir Supabase');

console.log('Bloco 11 · integração da resolução na Ficha: OK');
