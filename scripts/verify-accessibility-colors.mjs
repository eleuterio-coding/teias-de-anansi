import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * Verificação objetiva, porém parcial, de contrastes da identidade 2.02.
 * Um teste de tokens não comprova acessibilidade da interface renderizada.
 */
const css = readFileSync('src/styles/tokens.css', 'utf8');
const variables = new Map(
  [...css.matchAll(/^\s*(--ds-[\w-]+):\s*(#[0-9a-f]{6}|var\(--ds-[\w-]+\))\s*;/gim)]
    .map((match) => [match[1], match[2]]),
);

function resolve(name, seen = new Set()) {
  assert.ok(!seen.has(name), 'Referência circular de token: ' + name);
  const value = variables.get(name);
  assert.ok(value, 'Token sem definição: ' + name);
  if (value.startsWith('#')) return value;
  const ref = value.match(/^var\((--ds-[\w-]+)\)$/)?.[1];
  assert.ok(ref, 'Valor de cor não suportado: ' + name);
  return resolve(ref, new Set([...seen, name]));
}

function luminance(hex) {
  const linear = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground, background) {
  const a = luminance(resolve(foreground));
  const b = luminance(resolve(background));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const checks = [
  ['--ds-fg', '--ds-bg', 4.5, 'texto principal'],
  ['--ds-fg-secondary', '--ds-panel-raised', 4.5, 'texto secundário'],
  ['--ds-fg-muted', '--ds-panel-special', 4.5, 'texto discreto sobre couro'],
  ['--ds-accent', '--ds-panel-special', 4.5, 'destaque dourado sobre couro'],
  ['--ds-on-accent', '--ds-accent', 4.5, 'texto sobre ação dourada'],
  ['--ds-success-fg', '--ds-success-bg', 4.5, 'sucesso'],
  ['--ds-danger-fg', '--ds-danger-bg', 4.5, 'erro'],
  ['--ds-info-fg', '--ds-info-bg', 4.5, 'informação'],
  ['--ds-warning-fg', '--ds-warning-bg', 4.5, 'atenção'],
  ['--ds-border-control', '--ds-panel-raised', 3, 'contorno de controle'],
  ['--ds-border-control', '--ds-panel-special', 3, 'contorno sobre couro'],
  ['--ds-focus', '--ds-panel', 3, 'indicador de foco'],
];

for (const [fg, bg, minimum, label] of checks) {
  const ratio = contrast(fg, bg);
  assert.ok(
    ratio >= minimum,
    `Contraste insuficiente para ${label}: ${ratio.toFixed(2)}:1 < ${minimum}:1`,
  );
  console.log(`OK ${label}: ${ratio.toFixed(2)}:1`);
}

// Ocre é cor identitária/decorativa, não plano de fundo para texto normal marfim.
const unsuitable = contrast('--ds-ivory', '--ds-ochre');
assert.ok(
  unsuitable < 4.5,
  'A restrição documentada do ocre mudou: reavaliar a regra de uso.',
);
console.log(
  `AVISO marfim sobre ocre: ${unsuitable.toFixed(2)}:1; não usar como texto normal.`,
);
console.log('Tokens selecionados verificados; auditoria da UI continua obrigatória.');
