import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const rules = fs.readFileSync(new URL('scripts/concentracao-expandida-selos.js', root), 'utf8');
const sheetJS = fs.readFileSync(new URL('scripts/character-sheet-unified-spells.js', root), 'utf8');
const sheetHTML = fs.readFileSync(new URL('ficha-personagem.html', root), 'utf8');
const libraryHTML = fs.readFileSync(new URL('magias.html', root), 'utf8');

const window = {};
vm.runInNewContext(rules, {
  window,
  document: { getElementById: () => null },
  setInterval: () => { throw new Error('Biblioteca não deve inicializar na Ficha Digital'); }
}, { filename: 'concentracao-expandida-selos.js' });

const ce = window.HubConcentracaoExpandida;
assert.equal(typeof ce?.present, 'function', 'A Ficha deve usar a mesma classificação da Biblioteca');
const spell = (name, concentration = true, ruleset = '5.5e') =>
  ce.present({ nome_original: name, concentracao: concentration, ruleset });

assert.equal(spell('Hold Person').category, 'CM');
assert.equal(spell('Hold Person').html, '<span class="ce-category">CM — Concentração Maior</span>');
assert.ok(!spell('Hold Person').html.includes('Nível '));
assert.equal(spell('Conjure Celestial', true, '5e').category, 'CI');
assert.equal(spell('Conjure Celestial', true, '5.5e').category, 'CZ');
assert.equal(spell('Bless').category, 'CL');
assert.equal(spell('Unknown Concentration Spell').category, 'NC');
assert.equal(spell('Unknown Concentration Spell').html, '<span class="ce-category">Pendente de classificação</span>');
assert.equal(spell('Fireball', false).category, 'SC');
assert.equal(spell('Fireball', false).html, '<span class="ce-category">—</span>');
assert.equal(spell('Unverified Spell', null).category, 'ND');
assert.equal(spell('Unverified Spell', null).html, '<span class="ce-category">Concentração não informada</span>');


const catalog = JSON.parse(fs.readFileSync(new URL('dados/magias-catalogo.json', root), 'utf8')).itens;
const counts = { CM: 0, CI: 0, CZ: 0, CL: 0, SC: 0, NC: 0, ND: 0 };
for (const record of catalog) {
  const got = spell(record.nome_original, record.concentracao, record.ruleset);
  assert.ok(Object.hasOwn(counts, got.category), 'Categoria desconhecida: ' + record.nome_original);
  counts[got.category]++;
  assert.ok(!got.html.includes('ce-compat-list') && !got.html.includes('ce-guidance'), 'Card não pode repetir regras: ' + record.nome_original);
  if (record.concentracao === false) assert.equal(got.html, '<span class="ce-category">—</span>');
}
assert.deepEqual(counts, { CM: 47, CI: 20, CZ: 60, CL: 98, SC: 285, NC: 0, ND: 27 });
assert.equal(spell('Conjure Celestial', true, '5.5e').category, 'CZ', 'Manter exceção 2024');
assert.equal(spell('Conjure Celestial', true, '5e').category, 'CI', 'Manter exceção 2014');

assert.match(sheetJS, /HubConcentracaoExpandida/);
assert.match(sheetJS, /ceBlock\(ce\)/);
assert.ok(sheetJS.includes('<h5>Concentração Expandida</h5>'), 'Card CE da Ficha deve ter título simples.');
assert.ok(!sheetJS.includes('<h5><a href="regras.html#regra-expanded-concentration-house-rule">Concentração Expandida</a></h5>'), 'Ficha não deve linkar título CE.');
assert.ok(libraryHTML.includes('scripts/concentracao-expandida-selos.js?v=20261029-ce-card-simples2'), 'Biblioteca precisa atualizar versão do script CE.');
assert.match(sheetJS, /ruleset:x\.ruleset\|\|m\.ruleset/);
assert.match(sheetJS, /concentration:x\.concentracao==null\?null/);
const libraryTag = 'scripts/concentracao-expandida-selos.js?';
const sheetModule = 'scripts/character-sheet-unified-spells.js?';
assert.ok(sheetHTML.indexOf(libraryTag) >= 0 && sheetHTML.indexOf(libraryTag) < sheetHTML.indexOf(sheetModule));
assert.ok(libraryHTML.includes(libraryTag));
console.log('Concentração Expandida: Biblioteca e Ficha Digital aprovadas.');
