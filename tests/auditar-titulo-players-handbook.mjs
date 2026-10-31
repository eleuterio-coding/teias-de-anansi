import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const extensions = new Set(['.html', '.json', '.js', '.mjs', '.md', '.txt', '.py', '.yml', '.yaml']);
const ignored = new Set(['.git', 'node_modules', '.cache', 'dist']);
const checks = [
  { name: 'apóstrofo fora do padrão', pattern: /Player\x27s Handbook/g },
  { name: 'ano ou revisão anexada ao título', pattern: /Player['’]s Handbook\s*(?:\(\s*20(?:14|24)\s*\)|de\s+20(?:14|24)\b|[—–-]\s*revisão\s*20(?:14|24)\b|20(?:14|24)\b)/g },
  { name: 'sigla com ano em texto', pattern: /\bPHB\s+20(?:14|24)\b/g }
];
let scanned = 0, violations = 0;
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = join(dir, entry.name);
    if (entry.isDirectory()) { walk(file); continue; }
    if (!entry.isFile() || !extensions.has(extname(entry.name))) continue;
    scanned++;
    const content = readFileSync(file, 'utf8');
    for (const check of checks) {
      for (const match of content.matchAll(check.pattern)) {
        const line = content.slice(0, match.index).split('\n').length;
        console.error(`${relative(root, file)}:${line}: ${check.name} — ${match[0]}`);
        violations++;
      }
    }
  }
}
walk(root);
if (violations) {
  console.error(`Título inconsistente em ${violations} ocorrência(s).`);
  process.exitCode = 1;
} else {
  console.log(`Nome Player’s Handbook validado em ${scanned} arquivos textuais.`);
}
