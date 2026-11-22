import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';

/**
 * Apenas confere o artefato local. Nao publica nem faz chamada ao Firebase.
 * O build da aplicacao nao pode ser publicado com dados reais antes de
 * aprovacao separada da revisao das Firestore Rules de producao.
 */
const base = '/teias-de-anansi-homologacao/';
const dist = resolve('dist');
const index = resolve(dist, 'index.html');

assert.ok(existsSync(index), 'Artefato de homologacao ausente.');
const html = readFileSync(index, 'utf8');
const assets = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]);

assert.ok(assets.some((url) => url.endsWith('.js')), 'JavaScript nao encontrado.');
assert.ok(assets.some((url) => url.endsWith('.css')), 'CSS nao encontrado.');
assert.ok(!html.includes('/teias-de-anansi/assets/'), 'Base de producao ainda presente.');

for (const url of assets) {
  assert.ok(url.startsWith(base), 'Recurso fora da URL de homologacao.');
  const relative = url.slice(base.length);
  assert.ok(relative.length > 0 && !relative.includes('..'), 'Caminho invalido.');
  const file = resolve(dist, relative);
  assert.ok(file.startsWith(dist + sep), 'Caminho fora do artefato.');
  assert.ok(existsSync(file) && statSync(file).isFile(), 'Asset inexistente.');
}

console.log('GitHub Pages homologacao: assets verificados com base isolada.');
console.log('Artefato validado sem deploy; a liberacao de dados reais continua bloqueada.');
