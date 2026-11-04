import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const components = file('hub-components.css');
const ux = file('hub-ux.css');
const menus = file('hub-area-menus.css');
const roster = file('hub-roster.css');

test('o estilo global importa componentes após os tokens de identidade', () => {
  assert.match(ux, /^@import url\("\.\/hub-design-tokens\.css\?v=20261104-design-system-v1"\);\s*@import url\("\.\/hub-components\.css\?v=20261104-components-v1"\);/);
});

test('cards de navegação e seleção usam uma única declaração de fundo, borda e cantos', () => {
  assert.match(components, /\.hub-ui-card,\s*\.hub-area-menu a,\s*\.hub-roster-choice\s*\{/);
  assert.match(components, /background:\s*var\(--hub-surface,/);
  assert.match(components, /border:\s*1px solid var\(--hub-border,/);
  assert.match(components, /border-radius:\s*var\(--hub-radius,/);
  assert.doesNotMatch(menus, /\.hub-area-menu a\s*\{[^}]*\bbackground:/);
  assert.doesNotMatch(menus, /\.hub-area-menu a\s*\{[^}]*\bborder-radius:/);
  assert.doesNotMatch(roster, /\.hub-roster-choice\s*\{[^}]*\bbackground:/);
  assert.doesNotMatch(roster, /\.hub-roster-choice\s*\{[^}]*\bborder-radius:/);
});

test('hover, foco e seleção são compartilhados sem remover comportamento local', () => {
  assert.match(components, /\.hub-area-menu a:is\(:hover, :focus-visible\)/);
  assert.match(components, /\.hub-roster-choice:is\(:hover, :focus-visible, \.is-selected\)/);
  assert.match(menus, /\.hub-area-menu a:hover,\.hub-area-menu a:focus-visible\{transform:translateY\(-1px\)\}/);
  assert.match(roster, /\.hub-roster-menu \[data-master-only\]\{display:none!important\}/);
  assert.match(roster, /\.hub-roster-menu>li,\.hub-roster-menu>li>a/);
});

test('primitivos opt-in estão disponíveis sem reestilizar todas as tags do HUB', () => {
  for (const cls of ['hub-ui-card','hub-ui-page-header','hub-ui-button','hub-ui-field','hub-ui-badge','hub-ui-dialog']) {
    assert.ok(components.includes('.' + cls), cls);
  }
  assert.doesNotMatch(components, /(^|\n)\s*(?:button|input|select|textarea|dialog)\s*\{/);
});
