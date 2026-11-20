import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  extractModuleRoutes,
  isReservedPlaceholder,
  validateBootstrap,
  validateModule,
  validateRouter,
} from './design-system-contract.mjs';

const ROOT = process.cwd();

function text(path) {
  return readFileSync(join(ROOT, path), 'utf8');
}

function collectFiles(directory, root = directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(full, root));
    else if (entry.isFile()) {
      files.push({ path: relative(root, full), content: readFileSync(full, 'utf8') });
    }
  }
  return files;
}

const violations = [];
violations.push(...validateBootstrap(text('src/app/main.tsx')));
violations.push(...validateRouter(text('src/app/App.tsx')));

const routeCatalog = extractModuleRoutes(text('src/app/routes.ts'));
assert.ok(routeCatalog.size > 0, 'Catálogo de rotas vazio ou com contrato alterado.');

const moduleRoot = join(ROOT, 'src/modules');
assert.ok(existsSync(moduleRoot), 'Crie src/modules/ antes de adicionar módulos.');

const directories = readdirSync(moduleRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const routeOwners = new Map();
let reservedCount = 0;
let implementedCount = 0;
for (const id of directories) {
  const location = join(moduleRoot, id);
  const sourceFiles = collectFiles(location);
  if (isReservedPlaceholder(id, sourceFiles)) {
    reservedCount += 1;
    continue;
  }
  implementedCount += 1;
  const manifestPath = join(location, 'module.json');
  const entryPath = join(location, 'index.tsx');
  const manifestText = existsSync(manifestPath) ? readFileSync(manifestPath, 'utf8') : null;
  const entryText = existsSync(entryPath) ? readFileSync(entryPath, 'utf8') : null;

  const report = validateModule({
    id,
    manifestText,
    entryText,
    sourceFiles,
    knownRoutes: routeCatalog,
    testExists: existsSync(join(ROOT, 'tests/modules', id + '.test.tsx')),
    documentationExists: existsSync(join(ROOT, 'docs/modules', id + '.md')),
  });
  violations.push(...report);

  if (manifestText) {
    try {
      const { route } = JSON.parse(manifestText);
      if (typeof route === 'string') {
        const owner = routeOwners.get(route);
        if (owner) {
          violations.push({
            code: 'MODULE_DUPLICATE_ROUTE',
            detail: 'Rota ' + route + ' compartilhada por ' + owner + ' e ' + id,
          });
        } else routeOwners.set(route, id);
      }
    } catch {
      // JSON inválido já é reportado por validateModule.
    }
  }
}

for (const issue of violations) {
  console.error('[2.11:' + issue.code + '] ' + issue.detail);
}

assert.equal(
  violations.length,
  0,
  'Padrão obrigatório violado: ' + violations.length + ' ocorrência(s).',
);
console.log(
  'Padrão do Hub verificado: layout global e ' +
    implementedCount +
    ' módulo(s) implementado(s) com contrato válido; ' +
    reservedCount + ' pasta(s) reservada(s) preservada(s).',
);
console.log(
  'Os oito módulos oficiais permanecem placeholders até sua etapa; ' +
    'verificação estática não substitui testes, acessibilidade ou autorização.',
);
