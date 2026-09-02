import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const SCRIPTS = path.join(ROOT, 'scripts');
const BUILDER = path.join(SCRIPTS, 'character-builder');

const normalize = value => value.split('?')[0].split('#')[0];
const rel = file => path.relative(ROOT, file).replaceAll('\\', '/');

function allFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? allFiles(full) : [full];
  });
}

function resolveImport(fromFile, specifier) {
  const clean = normalize(specifier);
  if (!clean.startsWith('.')) return null;
  let candidate = path.resolve(path.dirname(fromFile), clean);
  if (!path.extname(candidate)) candidate += '.js';
  if (!candidate.startsWith(ROOT) || !fs.existsSync(candidate)) return null;
  return candidate;
}

function importsOf(file) {
  const source = fs.readFileSync(file, 'utf8');
  const specs = [];
  const patterns = [
    /\bimport\s*(?:[^'";]+?\s*from\s*)?['"]([^'"]+)['"]/g,
    /\bexport\s*[^'";]*?\s*from\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specs.push(match[1]);
  }
  if (path.resolve(file) === path.join(SCRIPTS, 'character-builder.js')) {
    for (const match of source.matchAll(/['"](\.\/character-builder\/[^'"]+\.js(?:\?[^'"]*)?)['"]/g)) specs.push(match[1]);
  }
  return specs.map(spec => resolveImport(file, spec)).filter(Boolean);
}

const roots = [
  path.join(SCRIPTS, 'character-builder.js'),
  path.join(BUILDER, 'rules.js'),
  path.join(BUILDER, 'rules-base.js'),
  ...allFiles(SCRIPTS).filter(file => /^character-sheet.*\.js$/i.test(path.basename(file))),
].filter(file => fs.existsSync(file));

if (!roots.length) {
  console.error('Bloco 10: nenhum entrypoint da ficha/construtor foi encontrado.');
  process.exit(1);
}

const reachable = new Set();
const queue = [...roots];
while (queue.length) {
  const file = queue.shift();
  if (reachable.has(file)) continue;
  reachable.add(file);
  for (const dep of importsOf(file)) if (!reachable.has(dep)) queue.push(dep);
}

const mechanics = allFiles(BUILDER).filter(file => /-mechanics\.js$/i.test(file));
if (!mechanics.length) {
  console.error('Bloco 10: nenhum módulo mecânico foi encontrado; auditoria não pode operar em modo fail-closed.');
  process.exit(1);
}

const orphaned = mechanics.filter(file => !reachable.has(file));
console.log(`Bloco 10 · módulos mecânicos: ${mechanics.length}`);
console.log(`Bloco 10 · módulos alcançáveis pelo runtime: ${mechanics.length - orphaned.length}/${mechanics.length}`);

if (orphaned.length) {
  console.error('\nMódulos mecânicos órfãos (não alcançáveis a partir da ficha/construtor):');
  for (const file of orphaned) console.error(` - ${rel(file)}`);
  console.error('\nTodo módulo mecânico do escopo v1.0 deve estar ligado ao runtime ou ser removido/reclassificado explicitamente.');
  process.exit(1);
}

console.log('OK · nenhum módulo *-mechanics.js está órfão do runtime da ficha.');

// 10B · Um módulo alcançável ainda pode estar morto no pipeline. As integrações
// adicionadas durante o Bloco 10 precisam participar explicitamente tanto da
// sanitização das escolhas quanto da derivação mecânica da ficha.
const rulesSource = fs.readFileSync(path.join(BUILDER, 'rules.js'), 'utf8');
const requiredRuntimeCalls = [
  ['sanitizeClassToolChoices', 'class-tool-mechanics.js', 'sanitização das ferramentas de classe'],
  ['classToolOutcome', 'class-tool-mechanics.js', 'derivação das ferramentas de classe'],
  ['sanitizeTashaFeatChoices', 'tasha-feat-mechanics.js', 'sanitização dos talentos de Tasha'],
  ['applyTashaFeatEffects', 'tasha-feat-mechanics.js', 'derivação dos talentos de Tasha'],
];
const missingCalls = requiredRuntimeCalls.filter(([name]) => !new RegExp(`\\b${name}\\s*\\(`).test(rulesSource));
if (missingCalls.length) {
  console.error('\nIntegrações mecânicas alcançáveis, porém não chamadas pelo pipeline central:');
  for (const [name, module, purpose] of missingCalls) console.error(` - ${module}: ${name}() · ${purpose}`);
  process.exit(1);
}
console.log(`OK · contratos centrais ativos: ${requiredRuntimeCalls.length}/${requiredRuntimeCalls.length}.`);

// 10C · Teste comportamental puro das proficiências de ferramenta de classe.
const classToolUrl = `${pathToFileURL(path.join(BUILDER, 'class-tool-mechanics.js')).href}?audit=block10`;
const { classToolOutcome, sanitizeClassToolChoices } = await import(classToolUrl);

const bard = { slug: 'bard' };
const incompleteBard = classToolOutcome(bard, { 'musical-instruments': ['Flauta', 'Flauta', 'Instrumento inexistente'] });
assert.equal(incompleteBard.complete, false, 'Bardo não pode ficar completo sem três instrumentos válidos e distintos.');
assert.deepEqual(incompleteBard.selected, ['Flauta']);
assert.equal(incompleteBard.pending[0]?.remaining, 2);
const completeBard = classToolOutcome(bard, { 'musical-instruments': ['Flauta', 'Lira', 'Tambor', 'Viola'] });
assert.equal(completeBard.complete, true, 'Bardo com três escolhas válidas deve concluir a proficiência de ferramentas.');
assert.deepEqual(completeBard.selected, ['Flauta', 'Lira', 'Tambor']);

const rogue = classToolOutcome({ slug: 'rogue' }, {});
assert.equal(rogue.complete, true);
assert.ok(rogue.tools.includes('Ferramentas de Ladrão'), 'Ladino deve derivar Ferramentas de Ladrão como proficiência fixa.');

const artificerInvalid = sanitizeClassToolChoices({ slug: 'artificer' }, { 'artisan-tools': ['Ferramentas de Funileiro', 'Ferramentas de Ferreiro'] });
assert.deepEqual(artificerInvalid['artisan-tools'], ['Ferramentas de Ferreiro'], 'A escolha do Artífice não pode repetir Ferramentas de Funileiro, que já são fixas.');
const artificer = classToolOutcome({ slug: 'artificer' }, artificerInvalid);
assert.equal(artificer.complete, true);
assert.ok(artificer.tools.includes('Ferramentas de Ladrão'));
assert.ok(artificer.tools.includes('Ferramentas de Funileiro'));
assert.ok(artificer.tools.includes('Ferramentas de Ferreiro'));
console.log('OK · ferramentas de classe produzem escolhas, pendências e proficiências observáveis na ficha.');

// 10D · Talento com escolha não pode existir apenas como texto/estado de UI.
// Fighting Initiate (Archery) deve alterar o ataque derivado de uma arma à distância.
const stateUrl = pathToFileURL(path.join(BUILDER, 'state.js')).href;
const tashaUrl = `${pathToFileURL(path.join(BUILDER, 'tasha-feat-mechanics.js')).href}?audit=block10-tasha`;
const { state } = await import(stateUrl);
const { sanitizeTashaFeatChoices, applyTashaFeatEffects } = await import(tashaUrl);
state.catalogs.classes = [{ id: 'fighter-audit', slug: 'fighter', featSlots: [4] }];
state.catalogs.backgrounds = [];
state.catalogs.feats = [{ id: 'fighting-initiate-audit', name: 'Fighting Initiate' }];
state.catalogs.spells = [];
state.catalogs.weapons = [];
state.c = {
  refs: { class: 'fighter-audit', background: null, species: null, subclass: null },
  choices: {
    class: { level: 4, skills: [], equipment: 'A' },
    species: { traitChoices: {} },
    feats: { 'slot-4-0': 'fighting-initiate-audit' },
    featMechanics: {},
    tashaFeatMechanics: { 'class:slot-4-0': { style: 'Archery' } },
  },
};
const cleanTasha = sanitizeTashaFeatChoices();
assert.equal(cleanTasha['class:slot-4-0']?.style, 'Archery', 'Fighting Initiate deve preservar um Estilo de Luta válido.');
const rangedDerived = {
  attack: 5,
  weapon: { id: 'longbow-audit', categoria: 'Arma à distância' },
  featMechanics: { combatFlags: [] },
  fightingStyles: [],
};
applyTashaFeatEffects(rangedDerived);
assert.equal(rangedDerived.attack, 7, 'Archery via Fighting Initiate deve somar +2 ao ataque à distância.');
assert.ok(rangedDerived.fightingStyles.includes('Archery'));
assert.ok(rangedDerived.featMechanics.combatFlags.includes('archery'));
console.log('OK · talento de Tasha produz efeito mecânico observável na ficha derivada.');
