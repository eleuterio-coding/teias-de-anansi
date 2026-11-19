import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const host = '127.0.0.1';
const port = 4173;
const base = `http://${host}:${port}/teias-de-anansi/`;
const evidenceDir = resolve('proof');
const runs = [
  { slug: 'inicio', route: '#/', check: '<h2 id="home-title">Início provisório</h2>' },
  {
    slug: 'biblioteca',
    route: '#/biblioteca',
    check: '<h2 id="module-title">Biblioteca</h2>',
  },
  {
    slug: 'nao-encontrada',
    route: '#/rota-inexistente',
    check: '<h2 id="not-found-title">Página não encontrada</h2>',
  },
];

const browserCandidates = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];
function findBrowser() {
  for (const cmd of browserCandidates) {
    const result = spawnSync('which', [cmd], { encoding: 'utf8' });
    if (result.status === 0) return result.stdout.trim();
  }
  throw new Error('Chrome/Chromium não disponível no runner; prova visual não foi executada.');
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(base, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return;
    } catch {
      // O servidor ainda está iniciando.
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  throw new Error('Servidor Vite preview não iniciou em localhost:4173.');
}

function runChrome(browser, url, flag, outputPath) {
  const args = [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--virtual-time-budget=6500',
    '--window-size=1280,900',
    flag === 'screenshot' ? `--screenshot=${outputPath}` : '--dump-dom',
    url,
  ];
  const result = spawnSync(browser, args, {
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 6 * 1024 * 1024,
  });
  assert.equal(
    result.status,
    0,
    `Chrome falhou ao executar ${flag} para ${url}: ${result.stderr?.slice(-1600)}`,
  );
  return result.stdout;
}

await mkdir(evidenceDir, { recursive: true });

const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
let startupLogs = '';
server.stdout.on('data', (chunk) => { startupLogs += String(chunk); });
server.stderr.on('data', (chunk) => { startupLogs += String(chunk); });

try {
  await waitForPreview();
  const homeResponse = await fetch(base);
  assert.equal(homeResponse.status, 200);
  const html = await homeResponse.text();
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /id="root"/);

  const urls = [...html.matchAll(/(?:src|href)="(\/teias-de-anansi\/assets\/[^"]+)"/g)]
    .map((match) => match[1]);
  assert.ok(urls.some((url) => url.endsWith('.js')));
  assert.ok(urls.some((url) => url.endsWith('.css')));
  for (const path of urls) {
    const response = await fetch(new URL(path, base));
    assert.equal(response.status, 200, `Recurso HTTP ausente: ${path}`);
    assert.ok((await response.text()).length > 0, `Recurso vazio: ${path}`);
  }

  const browser = findBrowser();
  const evidence = [];
  for (const entry of runs) {
    const url = base + entry.route;
    const dom = runChrome(browser, url, 'dom');
    assert.ok(dom.includes(entry.check), `Rota ${entry.route} não renderizou o título esperado.`);
    const screenshotPath = resolve(evidenceDir, `${entry.slug}.png`);
    runChrome(browser, url, 'screenshot', screenshotPath);
    const screenshot = await readFile(screenshotPath);
    assert.deepEqual(
      [...screenshot.subarray(0, 8)],
      [137, 80, 78, 71, 13, 10, 26, 10],
      `Captura PNG inválida: ${entry.slug}`,
    );
    const screenshotStat = await stat(screenshotPath);
    assert.ok(screenshotStat.size > 2000, `Captura vazia: ${entry.slug}`);
    evidence.push({
      rota: entry.route,
      urlLocal: url,
      tituloEncontrado: true,
      captura: `${entry.slug}.png`,
      bytes: screenshotStat.size,
    });
    console.log(`Navegador local OK: ${entry.route} -> ${entry.slug}.png`);
  }

  const report = {
    dataUTC: new Date().toISOString(),
    modo: 'preview local isolado; sem publicação, sem Firebase remoto',
    porta: port,
    caminhoBase: '/teias-de-anansi/',
    navegador: browser,
    assetsConferidos: urls.length,
    paginasVerificadas: evidence,
    observacoes: [
      'Capturas não são a identidade visual definitiva.',
      'O teste não valida regras reais do Firebase, autenticação, persistência ou site público.',
    ],
  };
  await writeFile(resolve(evidenceDir, 'relatorio.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('Prova local concluída, com 3 capturas e relatorio.json.');
} catch (error) {
  console.error(startupLogs.slice(-2500));
  throw error;
} finally {
  server.kill('SIGTERM');
}
