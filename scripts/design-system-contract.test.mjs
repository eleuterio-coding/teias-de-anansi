import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SHARED_STYLES,
  RESERVED_PLACEHOLDER_IDS,
  isReservedPlaceholder,
  extractModuleRoutes,
  validateBootstrap,
  validateModule,
  validateRouter,
} from './design-system-contract.mjs';

const baseRoutes = extractModuleRoutes(
  "{ path: '/biblioteca', label: 'Biblioteca', etapa: 'Etapa 4' },\n" +
  "{ path: '/campanhas', label: 'Campanhas', etapa: 'Etapa 6' },",
);

const goodManifest = {
  id: 'biblioteca',
  label: 'Biblioteca',
  route: '/biblioteca',
  stage: 4,
  status: 'draft',
};

function moduleFixture(overrides = {}) {
  return {
    id: 'biblioteca',
    manifestText: JSON.stringify(goodManifest),
    entryText: 'export default function Biblioteca() { return null; }\n',
    sourceFiles: [
      { path: 'README.md', content: '# Módulo em desenvolvimento' },
      {
        path: 'index.tsx',
        content: [
          "import { Card, Button } from '../../components/ui';",
          'export default function Biblioteca() { return <Card><Button>Abrir</Button></Card>; }',
        ].join('\n'),
      },
    ],
    knownRoutes: baseRoutes,
    testExists: true,
    documentationExists: true,
    ...overrides,
  };
}

function codes(input) {
  return validateModule(input).map(({ code }) => code);
}

test('contrato aceita módulo válido com rota, documentação e testes', () => {
  assert.deepEqual(validateModule(moduleFixture()), []);
});

test('contrato rejeita módulo sem manifesto e pasta inválida', () => {
  const errors = codes(moduleFixture({ id: 'Biblioteca', manifestText: null }));
  assert.ok(errors.includes('MODULE_SLUG'));
  assert.ok(errors.includes('MODULE_MANIFEST'));
});

test('contrato rejeita JSON inválido', () => {
  assert.ok(codes(moduleFixture({ manifestText: '{' })).includes('MODULE_MANIFEST_JSON'));
});

test('contrato exige id igual à pasta, rótulo e etapa válida', () => {
  const manifest = { ...goodManifest, id: 'outro', label: ' ', stage: 9 };
  const errors = codes(moduleFixture({ manifestText: JSON.stringify(manifest) }));
  assert.ok(errors.includes('MODULE_ID'));
  assert.ok(errors.includes('MODULE_LABEL'));
  assert.ok(errors.includes('MODULE_STAGE'));
});

test('contrato exige status conhecido e rota cadastrada', () => {
  const manifest = { ...goodManifest, status: 'published', route: '/inexistente' };
  const errors = codes(moduleFixture({ manifestText: JSON.stringify(manifest) }));
  assert.ok(errors.includes('MODULE_STATUS'));
  assert.ok(errors.includes('MODULE_NOT_REGISTERED'));
});

test('contrato exige rota com formato consistente', () => {
  const manifest = { ...goodManifest, route: 'http://exemplo.test' };
  assert.ok(
    codes(moduleFixture({ manifestText: JSON.stringify(manifest) })).includes(
      'MODULE_ROUTE',
    ),
  );
});

test('contrato rejeita rótulo e etapa diferentes do catálogo', () => {
  const manifest = { ...goodManifest, label: 'Outro nome', stage: 5 };
  const errors = codes(moduleFixture({ manifestText: JSON.stringify(manifest) }));
  assert.ok(errors.includes('MODULE_ROUTE_LABEL'));
  assert.ok(errors.includes('MODULE_ROUTE_STAGE'));
});

test('contrato requer README no módulo funcional', () => {
  const errors = codes(
    moduleFixture({
      sourceFiles: [{ path: 'index.tsx', content: 'export default function X() {}' }],
    }),
  );
  assert.ok(errors.includes('MODULE_README'));
});

test('contrato requer entrada React, teste e documentação por módulo', () => {
  const errors = codes(
    moduleFixture({
      entryText: 'export const Biblioteca = () => null;',
      testExists: false,
      documentationExists: false,
    }),
  );
  assert.ok(errors.includes('MODULE_ENTRY'));
  assert.ok(errors.includes('MODULE_TEST'));
  assert.ok(errors.includes('MODULE_DOC'));
});

test('contrato impede CSS independente por módulo', () => {
  const errors = codes(
    moduleFixture({
      sourceFiles: [{ path: 'styles/card.css', content: '.x { color: red; }' }],
    }),
  );
  assert.ok(errors.includes('MODULE_LOCAL_STYLE'));
});

test('contrato detecta cores literais e utilitários cromáticos ad hoc', () => {
  const hex = codes(
    moduleFixture({
      sourceFiles: [{ path: 'index.tsx', content: "const ink = '#aabbcc';" }],
    }),
  );
  const utilities = codes(
    moduleFixture({
      sourceFiles: [{ path: 'index.tsx', content: '<div className="bg-red-500" />' }],
    }),
  );
  assert.ok(hex.includes('MODULE_COLOR'));
  assert.ok(utilities.includes('MODULE_COLOR'));
});

test('contrato rejeita cópia de componente compartilhado', () => {
  const errors = codes(
    moduleFixture({
      sourceFiles: [{ path: 'components/Button.tsx', content: 'export function Button() {}' }],
    }),
  );
  assert.ok(errors.includes('MODULE_DUPLICATE_UI'));
});

test('contrato exige importação pelas APIs públicas das bibliotecas', () => {
  const errors = codes(
    moduleFixture({
      sourceFiles: [
        { path: 'index.tsx', content: "import { Button } from '../../components/ui/Button';" },
      ],
    }),
  );
  assert.ok(errors.includes('MODULE_IMPORT_PRIVATE'));
});

test('contrato impede importação de CSS local e folhas globais', () => {
  const errors = codes(
    moduleFixture({
      sourceFiles: [{ path: 'index.tsx', content: "import '../../styles/tokens.css';" }],
    }),
  );
  assert.ok(errors.includes('MODULE_STYLE_IMPORT'));
});

test('contrato impede importar SDK Firebase diretamente no componente', () => {
  const errors = codes(
    moduleFixture({
      sourceFiles: [
        { path: 'index.tsx', content: "import { getDoc } from 'firebase/firestore';" },
      ],
    }),
  );
  assert.ok(errors.includes('MODULE_FIREBASE'));
});

test('contrato impede I/O direto no módulo de interface', () => {
  const errors = codes(
    moduleFixture({
      sourceFiles: [
        { path: 'index.tsx', content: "fetch('/api'); localStorage.setItem('chave', 'valor');" },
      ],
    }),
  );
  assert.ok(errors.includes('MODULE_DIRECT_IO'));
});

test('contrato impede HTML arbitrário sem sanitização', () => {
  const errors = codes(
    moduleFixture({
      sourceFiles: [
        { path: 'index.tsx', content: '<div dangerouslySetInnerHTML={{ __html: x }} />' },
      ],
    }),
  );
  assert.ok(errors.includes('MODULE_RAW_HTML'));
});

test('catálogo estático extrai caminho, rótulo e etapa sem executar código', () => {
  assert.deepEqual(baseRoutes.get('/biblioteca'), { label: 'Biblioteca', stage: 4 });
  assert.deepEqual(baseRoutes.get('/campanhas'), { label: 'Campanhas', stage: 6 });
});

test('bootstrap exige ordem dos estilos centrais', () => {
  const imports = SHARED_STYLES.map((name) => "import '../styles/" + name + "';").join('\n');
  const code = "import App from './App';\n" + imports;
  assert.deepEqual(validateBootstrap(code), []);
  const missing = validateBootstrap(
    "import App from './App';\n" + imports.replace("import '../styles/tokens.css';\n", ''),
  );
  assert.ok(missing.some(({ code: reason }) => reason === 'SHELL_CSS_MISSING'));
});

test('bootstrap rejeita duplicação e inversão da ordem de estilos', () => {
  const imports = SHARED_STYLES.map((name) => "import '../styles/" + name + "';");
  const duplicated = validateBootstrap(
    "import App from './App';\n" + [...imports, imports[0]].join('\n'),
  );
  assert.ok(duplicated.some(({ code }) => code === 'SHELL_CSS_DUPLICATED'));

  const reversed = validateBootstrap(
    "import App from './App';\n" + [...imports].reverse().join('\n'),
  );
  assert.ok(reversed.some(({ code }) => code === 'SHELL_CSS_ORDER'));
});

test('roteador preserva HashRouter, AppShell, fronteira de erros e catálogo', () => {
  const good = '<HashRouter><AppShell><PageErrorBoundary />' +
    '{moduleRoutes.map((module) => null)}</AppShell></HashRouter>';
  assert.deepEqual(validateRouter(good), []);

  const errors = validateRouter('<BrowserRouter><Route /></BrowserRouter>');
  assert.deepEqual(
    new Set(errors.map(({ code }) => code)),
    new Set(['ROUTER_HASH', 'ROUTER_SHELL', 'ROUTER_ERROR', 'ROUTER_CATALOG']),
  );
});

test('reconhece somente reservas estabelecidas pela Etapa 1', () => {
  assert.equal(RESERVED_PLACEHOLDER_IDS.size, 9);
  assert.equal(isReservedPlaceholder('biblioteca', [{ path: 'README.md' }]), true);
  assert.equal(isReservedPlaceholder('usuarios', [{ path: 'README.md' }]), true);
});

test('rejeita dispensa para pasta nova não autorizada', () => {
  assert.equal(isReservedPlaceholder('inventado', [{ path: 'README.md' }]), false);
});

test('reserva perde dispensa ao receber código de implementação', () => {
  assert.equal(
    isReservedPlaceholder('personagens', [
      { path: 'README.md' },
      { path: 'index.tsx', content: 'export default function Page() {}' },
    ]),
    false,
  );
});
