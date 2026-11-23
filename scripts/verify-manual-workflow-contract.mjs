import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = readFileSync('.github/workflows/publicar-etapa-3-manual.yml', 'utf8');
const order = [
  'name: Guardas de origem e estado',
  'name: Bloquear corte se Pages ainda usar modo de publicacao por branch',
  'name: Verificar aplicacao, testes e build de Pages',
  'name: Testar processo de deploy contra Firebase simulado',
  'name: Validar Rules no emulador isolado',
  'name: Auditar metadados de midia e chunks legados',
  'node scripts/deploy-etapa-3-rules.mjs prepare',
  'actions/upload-artifact@v4',
  'node scripts/deploy-etapa-3-rules.mjs publish',
  'actions/upload-pages-artifact@v3',
  'actions/deploy-pages@v4',
  'node scripts/deploy-etapa-3-rules.mjs verify',
  'node scripts/verify-live-hub-pages.mjs',
];
let previous = -1;
for (const marker of order) {
  const i = file.indexOf(marker);
  assert.ok(i >= 0, 'Marcador ausente: ' + marker);
  assert.ok(i > previous, 'Ordem insegura de etapas: ' + marker);
  previous = i;
}
assert.match(file, /workflow_dispatch:/);
assert.match(file, /test \"\$GITHUB_REF\" = \"refs\/heads\/main\"/);
assert.doesNotMatch(file, /^\s+(?:push|schedule|pull_request):/m);
assert.match(file, /github.event.inputs.confirmacao == 'PUBLICAR_A_E_B'/);
assert.match(file, /github.event.inputs.compatibilidade_legada == 'LEGADO_VALIDADO'/);
assert.match(file, /pages: write/);
assert.match(file, /id-token: write/);
assert.match(file, /contents: read/);
assert.match(file, /build_type !== "workflow"/);
assert.doesNotMatch(file, /git -C \.deploy-site push|git push origin HEAD:main|git worktree add/);
assert.doesNotMatch(file, /environment: etapa-3-producao/);
assert.ok(file.indexOf('FIREBASE_SERVICE_ACCOUNT_TEIAS_DE_ANANSI:') > file.indexOf('    steps:'), 'Secret nao deve estar no env global do job');
console.log('MANUAL_DEPLOY_CONTRACT_OK: Actions Pages, ordem A+B, backup e bloqueios conferidos sem rede');
