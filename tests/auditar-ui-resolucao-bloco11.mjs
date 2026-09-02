import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const ui=await readFile('scripts/character-sheet-resolution-ui.js','utf8');
const rules=await readFile('scripts/character-sheet-resolution-rules.js','utf8');
const sheet=await readFile('scripts/character-sheet-equipment-ownership.js','utf8');
const roadmap=await readFile('ROADMAP-V1.md','utf8');

assert.ok(sheet.includes("import('./character-sheet-resolution-ui.js"),'11 · Ficha precisa carregar o painel de resolução');
for(const marker of['resolution-target-ac','resolution-target-res','resolution-target-imm','resolution-target-vuln','resolution-target-save'])assert.ok(ui.includes(marker),`11 · alvo transitório precisa expor ${marker}`);
for(const action of['skill','ability','save','initiative','spell-attack','spell-save','spell-damage','spell-heal','self-damage','self-heal'])assert.ok(ui.includes(`data-resolution-action=\"${action}\"`)||ui.includes(`action==='${action}'`)||ui.includes(`['skill','ability','save','initiative']`),`11 · ação ${action} precisa existir na Ficha`);
assert.ok(ui.includes('[data-weapon-attack],[data-light-extra]'),'11 · ataques já existentes devem alimentar o motor de resolução');
assert.ok(ui.includes('activeConcentration')&&ui.includes('concentrationDc')&&ui.includes('endConcentration'),'11 · dano precisa resolver Concentração pela mesma Ficha');
assert.ok(ui.includes('Resistências, imunidades, vulnerabilidades e PV temporários'),'11 · Ficha deve explicitar aplicação automática das defesas');
assert.ok(rules.includes('applyDamageDefenses')&&rules.includes('resolveWeaponAttack')&&rules.includes('resolveSpellAttack'),'11 · contratos centrais de resolução precisam existir');
assert.ok(rules.includes('globalAbilityCheckBonus')&&rules.includes('globalSavingThrowBonus'),'11 · bônus persistentes do Bloco 10 precisam alimentar Testes de d20');
assert.ok(rules.includes('magicItemWeaponBonuses'),'11 · bônus persistentes de arma do Bloco 10 precisam alimentar ataques');
assert.ok(roadmap.includes('11. Rolagens e resolução de jogo — Em implementação'),'11 · roadmap precisa refletir execução do bloco');
assert.ok(!/supabase/i.test(`${ui}\n${rules}\n${sheet}`),'11 · resolução não pode introduzir Supabase');

console.log('Bloco 11 · integração da resolução na Ficha: OK');
