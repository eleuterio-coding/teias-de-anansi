import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

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
