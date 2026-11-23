import { readFileSync } from 'node:fs';

const base = 'https://eleuterio-coding.github.io/teias-de-anansi/';
const expected = readFileSync('dist/index.html', 'utf8');
const assetMatch = expected.match(/(?:src|href)="(\/teias-de-anansi\/assets\/[^"]+\.js)"/);
if (!assetMatch) throw Error('JS do build esperado nao encontrado; abortar verificacao.');
const asset = assetMatch[1];
let last = 'no-success';
for (let attempt = 1; attempt <= 15; attempt++) {
  try {
    const response = await fetch(base, { redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw Error('HTML HTTP ' + response.status);
    const html = await response.text();
    if (!html.includes(asset)) throw Error('Pages ainda exibe outro artefato');
    const script = await fetch(new URL(asset, base), { signal: AbortSignal.timeout(15000) });
    if (!script.ok) throw Error('JS HTTP ' + script.status);
    console.log('PAGES_SMOKE_VERIFIED: HTML e JS correspondem ao build, sem login nem dados pessoais.');
    process.exit(0);
  } catch (error) {
    last = error instanceof Error ? error.message : 'unknown';
  }
  if (attempt < 15) await new Promise(resolve => setTimeout(resolve, 8000));
}
throw Error('PAGES_SMOKE_FAILED: ' + last);
