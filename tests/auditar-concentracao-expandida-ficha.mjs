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
assert.match(spell('Hold Person').html, /CM \+ CI/);
assert.match(spell('Hold Person').html, /Nível 20\+/);
assert.equal(spell('Conjure Celestial', true, '5e').category, 'CI');
assert.equal(spell('Conjure Celestial', true, '5.5e').category, 'CZ');
assert.equal(spell('Bless').category, 'CL');
assert.equal(spell('Unknown Concentration Spell').category, 'NC');
assert.match(spell('Unknown Concentration Spell').html, /não participa automaticamente/);
assert.equal(spell('Fireball', false).category, 'SC');
assert.match(spell('Fireball', false).html, /não ocupa uma posição/);
assert.equal(spell('Unverified Spell', null).category, 'ND');
assert.match(spell('Unverified Spell', null).html, /não informa se esta magia exige concentração/);

assert.match(sheetJS, /HubConcentracaoExpandida/);
assert.match(sheetJS, /ceBlock\(ce\)/);
assert.match(sheetJS, /ruleset:x\.ruleset\|\|m\.ruleset/);
assert.match(sheetJS, /concentration:x\.concentracao==null\?null/);
const libraryTag = 'scripts/concentracao-expandida-selos.js?';
const sheetModule = 'scripts/character-sheet-unified-spells.js?';
assert.ok(sheetHTML.indexOf(libraryTag) >= 0 && sheetHTML.indexOf(libraryTag) < sheetHTML.indexOf(sheetModule));
assert.ok(libraryHTML.includes(libraryTag));
console.log('Concentração Expandida: Biblioteca e Ficha Digital aprovadas.');
