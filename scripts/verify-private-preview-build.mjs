import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';

/** Build-only validation. This script never makes requests or publishes files. */
const dist = resolve('dist');
const htmlPath = resolve(dist, 'index.html');
assert.ok(existsSync(htmlPath), 'Prévia sem dist/index.html.');

const html = readFileSync(htmlPath, 'utf8');
const links = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]);
assert.ok(links.some((url) => url.endsWith('.js')), 'Prévia não contém JS.');
assert.ok(links.some((url) => url.endsWith('.css')), 'Prévia não contém CSS.');
assert.ok(!html.includes('/teias-de-anansi/assets/'), 'Base do Pages persistiu na prévia.');

for (const url of links) {
  assert.ok(
    url.startsWith('/assets/') && !url.includes('..') && !url.includes('?'),
    'A prévia deve referenciar somente assets locais sob /assets/.',
  );
  const path = resolve(dist, url.slice(1));
  assert.ok(path.startsWith(dist + sep), 'Asset fora do diretório compilado.');
  assert.ok(existsSync(path) && statSync(path).isFile(), 'Asset ausente do build da prévia.');
}

// O build precisa ser estritamente estático. Isso não testa controles do
// provedor: acesso HTTPS/autenticação são verificações externas obrigatórias.
assert.ok(!html.includes('firebase-admin'), 'O bundle HTML não pode carregar Admin SDK.');
console.log('Prévia estática validada em /, sem envio a hospedagem.');
console.log('ATENÇÃO: build aprovado não comprova acesso privado, SSL ou deploy.');
