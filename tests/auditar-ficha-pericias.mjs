import assert from 'node:assert/strict';
import fs from 'node:fs';

const sheetHtml=fs.readFileSync('ficha-personagem.html','utf8');
const sheetCore=fs.readFileSync('scripts/character-sheet.js','utf8');
const sheetSkills=fs.readFileSync('scripts/character-sheet-skill-checks.js','utf8');
const rules=fs.readFileSync('scripts/character-builder/rules.js','utf8');
const mechanics=fs.readFileSync('scripts/character-builder/skill-check-mechanics.js','utf8');

assert.ok(sheetHtml.includes('scripts/character-sheet-skill-checks.js?v=20260831-skill-checks1'),'Ficha não carrega o adaptador mecânico de perícias com revisão explícita.');
assert.ok(sheetHtml.indexOf('scripts/character-sheet.js')<sheetHtml.indexOf('scripts/character-sheet-skill-checks.js'),'Adaptador de perícias deve carregar depois do núcleo da ficha.');
assert.ok(/deriveSkillCheckMechanics/.test(rules),'rules.js não consome o motor único de perícias.');
assert.ok(/expertise:expert/.test(mechanics)&&/jackOfAllTrades/.test(mechanics)&&/passivePerception/.test(mechanics),'Motor de perícias não cobre Especialização, Pau para Toda Obra e Percepção Passiva.');
assert.ok(/const d=derive\(\),checks=d\.skillChecks\|\|\{\}/.test(sheetSkills),'Ficha não consome d.skillChecks derivado pelo motor central.');
assert.ok(/check\.expertise/.test(sheetSkills)&&/check\.proficient/.test(sheetSkills)&&/check\.jackOfAllTrades/.test(sheetSkills),'Ficha não distingue Especialização, Proficiência e Pau para Toda Obra.');
assert.ok(/signed\(check\.value\)/.test(sheetSkills),'Ficha não exibe o valor mecânico derivado da perícia.');
assert.ok(/\['Percepção passiva',d\.passive\]/.test(sheetCore),'Ficha não usa Percepção Passiva derivada pelo mesmo motor.');

console.log('Ficha digital validada contra o motor único de perícias: proficiência, especialização, Pau para Toda Obra e Percepção Passiva.');
