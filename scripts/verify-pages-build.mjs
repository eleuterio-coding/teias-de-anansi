import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const base = '/teias-de-anansi/';
const dist = resolve('dist');
const htmlPath = resolve(dist, 'index.html');

assert.ok(existsSync(htmlPath), 'Build ausente: dist/index.html não foi encontrado.');

const html = readFileSync(htmlPath, 'utf8');
const assetUrls = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((match) => match[1]);

assert.ok(assetUrls.length >= 2, 'Build sem referências verificáveis a JS e CSS.');
assert.ok(assetUrls.some((url) => url.endsWith('.js')), 'Build sem arquivo JavaScript.');
assert.ok(assetUrls.some((url) => url.endsWith('.css')), 'Build sem arquivo CSS.');

for (const url of assetUrls) {
  assert.ok(url.startsWith(base), `URL fora do caminho-base do GitHub Pages: ${url}`);

  const relativePath = url.slice(base.length);
  assert.ok(
    relativePath.length > 0 && !relativePath.includes('..'),
    `Caminho de recurso inválido: ${url}`,
  );

  const assetPath = resolve(dist, relativePath);
  assert.ok(assetPath.startsWith(dist + sep), `Caminho fora do dist: ${url}`);
  assert.ok(
    existsSync(assetPath) && statSync(assetPath).isFile(),
    `Recurso ausente do dist: ${url}`,
  );
}

console.log(
  `GitHub Pages: caminho-base ${base} e ${assetUrls.length} recursos do HTML verificados.`,
);
console.log('Artefato de build validado; nenhuma publicação foi realizada.');
