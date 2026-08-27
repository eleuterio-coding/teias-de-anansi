import fs from'node:fs';
import assert from'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const rules=read('scripts/character-builder/rules.js'),ui=read('scripts/character-builder/class-skill-ui.js'),druidUi=read('scripts/character-builder/druid-subclass-ui.js'),languages=read('scripts/character-builder/language-mechanics.js');
assert.ok(rules.includes("applyDruidSubclassMechanics(d)"),'derive() não aplica as mecânicas das subclasses de Druida.');
assert.ok(ui.includes('initDruidSubclassUi'),'Construtor não inicializa a interface das subclasses de Druida.');
for(const token of['data-druid-subclass-pending','data-druid-subclass-combat','data-druid-subclass-spells'])assert.ok(druidUi.includes(token),`Integração de Druida ausente: ${token}`);
assert.ok(languages.includes('Circle of the Shepherd')&&languages.includes('subclass:shepherd:speech-of-the-woods')&&languages.includes("fixed:['Silvestre']"),'Speech of the Woods não está integrado ao sistema central de idiomas.');
console.log('Integração de Druida validada: derive, UI, combate, magias, pendências e idiomas.');
