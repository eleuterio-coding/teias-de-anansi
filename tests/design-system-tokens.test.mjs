import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const tokens = read('hub-design-tokens.css');
const shell = read('hub-ux.css');
const layout = read('hub-layout.css');
const library = read('biblioteca-light.css');

const required = {
  '--hub-bg': '#080d14',
  '--hub-sidebar': '#09111a',
  '--hub-surface': '#101923',
  '--hub-border': '#223245',
  '--hub-text': '#f4f7fb',
  '--hub-accent': '#2f9cff',
  '--hub-focus': '#67b8ff',
  '--hub-green': '#36d77c',
  '--hub-red': '#ff6b6b',
  '--hub-reader-bg': '#f4f7fb',
  '--hub-reader-paper': '#fff',
  '--hub-reader-ink': '#172638',
  '--hub-space-1': '4px',
  '--hub-space-2': '8px',
  '--hub-space-3': '12px',
  '--hub-space-4': '16px',
  '--hub-space-5': '24px',
  '--hub-space-6': '32px',
  '--hub-radius': '14px',
  '--hub-control-radius': '10px',
  '--hub-panel-radius': '14px',
  '--hub-touch': '44px',
  '--hub-sidebar-width': '258px',
  '--hub-topbar-height': '64px'
};

test('tokens da identidade visual preservam os valores anteriores', () => {
  for (const [name, value] of Object.entries(required)) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`${escaped}\\s*:\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*;`);
    assert.match(tokens, pattern, `Token ${name} deve manter ${value}`);
  }
  assert.match(tokens, /--hub-font-sans:\s*Inter,/);
  assert.match(tokens, /--hub-shadow:\s*0 18px 50px rgba\(0,0,0,\.22\);/);
  assert.match(tokens, /@media\s*\(max-width:\s*980px\)\s*\{\s*:root\s*\{\s*--hub-sidebar-width:\s*220px;/);
});

test('as folhas base usam tokens globais antes de outras regras', () => {
  for (const [name, css] of [['hub-ux.css', shell], ['hub-layout.css', layout], ['biblioteca-light.css', library]]) {
    const withoutOpeningComment = css.replace(/^\s*\/\*[\s\S]*?\*\//, '').trimStart();
    assert.match(withoutOpeningComment, /^@import url\("\.\/hub-design-tokens\.css\?v=20261104-design-system-v1"\);/, name);
  }
});

test('cores e dimensoes estruturais nao ficam redefinidas nos CSS antigos', () => {
  assert.doesNotMatch(shell, /--hub-bg\s*:\s*#080d14\s*;/);
  assert.doesNotMatch(shell, /--hub-sidebar-width\s*:\s*(?:258|220)px\s*;/);
  assert.doesNotMatch(layout, /--hub-reader-bg\s*:\s*#f4f7fb\s*;/);
  assert.doesNotMatch(layout, /--hub-space-1\s*:\s*4px\s*;/);
});

test('o tema atual e as fontes compartilham as mesmas referencias', () => {
  assert.match(shell, /:root\s*\{\s*color-scheme:\s*dark\s*\}/);
  assert.match(shell, /font-family:var\(--hub-font-sans\)!important;/);
  assert.match(library, /font-family:\s*var\(--hub-font-sans\);/);
});
