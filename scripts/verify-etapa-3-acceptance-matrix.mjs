import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const matrix = readFileSync('docs/etapas/etapa-3/3.09-matriz-aceite-acesso.md', 'utf8');
const manual = readFileSync('.github/workflows/publicar-etapa-3-manual.yml', 'utf8');
const routes = readFileSync('src/app/routes.ts', 'utf8');
const app = readFileSync('src/app/App.tsx', 'utf8');

for (let n = 1; n <= 15; n++) {
  const code = 'A' + String(n).padStart(2, '0');
  assert.ok(matrix.includes('| ' + code + ' |'), 'Critério de aceite ausente: ' + code);
}
for (const code of ['A11', 'A12', 'A13', 'A14', 'A15']) {
  const row = matrix.split('\n').find((line) => line.startsWith('| ' + code + ' |'));
  assert.ok(row && row.includes('**P**'), 'Não declarar aceito o critério pós-publicação ' + code);
}
for (const legacy of ['L01', 'L02', 'L03', 'L04']) {
  assert.ok(matrix.includes('| ' + legacy + ' |'), 'Exceção legada sem registro: ' + legacy);
}
assert.match(matrix, /302 Vitest, 266 Emulator, 4 testes/);
assert.match(matrix, /ESCOPO_ACESSO_DOCUMENTADO/);
assert.match(matrix, /NÃO concedido/);
assert.match(matrix, /sem UI integral homologada/);
assert.match(matrix, /Não coletar senha, token, UID/);
assert.match(manual, /escopo_etapa3:/);
assert.match(manual, /github.event.inputs.escopo_etapa3 == 'ESCOPO_ACESSO_DOCUMENTADO'/);
assert.doesNotMatch(manual, /LEGADO_VALIDADO|compatibilidade_legada/);
assert.match(routes, /path: '\/usuarios'/);
assert.match(app, /<SectionPlaceholder/);
console.log('ETAPA_3_ACCEPTANCE_MATRIX_OK: 15 critérios, 5 pendentes obrigatórios, 4 exceções e escopo limitado conferidos.');
