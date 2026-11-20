/**
 * Etapa 2.11 — regras verificáveis para novos módulos do Teias de Anansi.
 * Sem dependências externas, sem I/O e sem executar código dos módulos.
 *
 * NOTA: expressões regulares identificam padrões conhecidos; não são
 * análise semântica completa nem auditoria de acessibilidade/segurança.
 */

export const SHARED_STYLES = [
  'tokens.css',
  'index.css',
  'responsive.css',
  'components.css',
  'data.css',
  'forms.css',
  'feedback.css',
];

export const SHARED_LIBRARIES = ['ui', 'data', 'form', 'feedback'];

const SHARED_COMPONENT_NAMES = new Set([
  'Button',
  'HubLink',
  'Card',
  'Badge',
  'Alert',
  'Accordion',
  'Tabs',
  'ActionMenu',
  'Dialog',
  'ConfirmDialog',
  'DataTable',
  'DataList',
  'DataExplorer',
  'Pagination',
  'ProgressMeter',
  'EmptyState',
  'DataLoading',
  'SearchField',
  'FilterSelect',
  'TextField',
  'TextAreaField',
  'SelectField',
  'CheckboxField',
  'RadioGroupField',
  'FormPanel',
  'FormSection',
  'FormErrorSummary',
  'ToastProvider',
  'ToastNotice',
  'OperationFeedback',
]);

const COLOR_LITERAL = /#[\da-f]{3,4}\b|#[\da-f]{6,8}\b|\b(?:rgb|hsl)a?\s*\(/i;
const TAILWIND_LITERAL_COLOR =
  /\b(?:bg|text|border|from|via|to)-(?:red|blue|green|amber|yellow|gray|grey|slate|zinc|rose|pink|orange|purple|teal|emerald|cyan|indigo|stone|lime|fuchsia|sky)-\d{2,3}\b/i;

const IMPORT_DIRECT_COMPONENT =
  /(?:from\s*|import\s*\()['"][^'"]*(?:components\/(?:ui|data|form|feedback)\/(?:[^'"]+))['"]/;
const IMPORT_FIREBASE =
  /(?:from\s*|import\s*\()['"][^'"]*(?:firebase(?:\/[^'"]*)?|services\/firebase[^'"]*)['"]/i;
const IMPORT_LOCAL_STYLES =
  /(?:from\s*|import\s*\()['"][^'"]*(?:\/styles\/[^'"]+\.css|\.\/[^'"]+\.css)['"]/i;

function violation(code, detail) {
  return { code, detail };
}

/**
 * A leitura da lista de rotas é estática: nunca avaliamos src/app/routes.ts.
 * Mantemos um contrato simples (path, label, etapa), vigente na Etapa 2.
 */
export function extractModuleRoutes(source) {
  const routes = new Map();
  const pattern =
    /\{\s*path:\s*['"]([^'"]+)['"]\s*,\s*label:\s*['"]([^'"]+)['"]\s*,\s*etapa:\s*['"]Etapa (\d+)['"]\s*\}/g;
  for (const match of source.matchAll(pattern)) {
    routes.set(match[1], { label: match[2], stage: Number(match[3]) });
  }
  return routes;
}

export function validateBootstrap(source) {
  const issues = [];
  let lastOffset = -1;
  for (const style of SHARED_STYLES) {
    const marker = "import '../styles/" + style + "';";
    const firstOffset = source.indexOf(marker);
    if (firstOffset === -1) {
      issues.push(violation('SHELL_CSS_MISSING', 'Import global ausente: ' + style));
      continue;
    }
    if (source.indexOf(marker, firstOffset + marker.length) !== -1) {
      issues.push(violation('SHELL_CSS_DUPLICATED', 'Import duplicado: ' + style));
    }
    if (firstOffset < lastOffset) {
      issues.push(violation('SHELL_CSS_ORDER', 'Ordem dos estilos incorreta: ' + style));
    }
    lastOffset = firstOffset;
  }
  if (!source.includes("import App from './App';")) {
    issues.push(violation('SHELL_APP_MISSING', 'Entrada deve importar o App central'));
  }
  return issues;
}

export function validateRouter(source) {
  const issues = [];
  if (!/<HashRouter\b/.test(source)) {
    issues.push(violation('ROUTER_HASH', 'HashRouter é obrigatório na arquitetura atual'));
  }
  if (!/<AppShell\b/.test(source)) {
    issues.push(violation('ROUTER_SHELL', 'Todas as rotas devem usar AppShell'));
  }
  if (!/<PageErrorBoundary\b/.test(source)) {
    issues.push(violation('ROUTER_ERROR', 'Rotas devem manter fronteira de erros'));
  }
  if (!/moduleRoutes\.map\s*\(/.test(source)) {
    issues.push(violation('ROUTER_CATALOG', 'Catálogo único de módulos não localizado'));
  }
  return issues;
}

/**
 * module: { id, manifestText, entryText, sourceFiles, testExists,
 *           documentationExists, knownRoutes }
 *
 * sourceFiles: [{ path: 'index.tsx', content: '...' }, ...]
 */
export function validateModule(module) {
  const issues = [];
  const { id, manifestText, entryText, sourceFiles = [], knownRoutes } = module;

  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)) {
    issues.push(violation('MODULE_SLUG', 'Nome de pasta inválido: ' + id));
  }
  if (manifestText == null) {
    issues.push(violation('MODULE_MANIFEST', id + ': module.json ausente'));
    return issues;
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestText);
  } catch {
    issues.push(violation('MODULE_MANIFEST_JSON', id + ': module.json inválido'));
    return issues;
  }

  if (manifest.id !== id) {
    issues.push(violation('MODULE_ID', id + ': id do manifesto deve ser igual à pasta'));
  }
  if (typeof manifest.label !== 'string' || !manifest.label.trim()) {
    issues.push(violation('MODULE_LABEL', id + ': rótulo acessível ausente'));
  }
  if (typeof manifest.route !== 'string' || !/^\/[a-z][a-z0-9-]*$/.test(manifest.route)) {
    issues.push(violation('MODULE_ROUTE', id + ': rota inválida'));
  }
  if (!Number.isInteger(manifest.stage) || manifest.stage < 3 || manifest.stage > 8) {
    issues.push(violation('MODULE_STAGE', id + ': etapa fora do plano (3–8)'));
  }
  if (!['draft', 'ready'].includes(manifest.status)) {
    issues.push(violation('MODULE_STATUS', id + ': status deve ser draft ou ready'));
  }

  if (typeof manifest.route === 'string') {
    const registered = knownRoutes?.get(manifest.route);
    if (!registered) {
      issues.push(violation('MODULE_NOT_REGISTERED', id + ': rota não consta no catálogo'));
    } else {
      if (registered.label !== manifest.label) {
        issues.push(violation('MODULE_ROUTE_LABEL', id + ': rótulo diferente do catálogo'));
      }
      if (registered.stage !== manifest.stage) {
        issues.push(violation('MODULE_ROUTE_STAGE', id + ': etapa diferente do catálogo'));
      }
    }
  }

  if (entryText == null || !/\bexport\s+default\b/.test(entryText)) {
    issues.push(violation('MODULE_ENTRY', id + ': index.tsx deve ter export default'));
  }
  if (!module.testExists) {
    issues.push(violation('MODULE_TEST', id + ': tests/modules/' + id + '.test.tsx ausente'));
  }
  if (!module.documentationExists) {
    issues.push(violation('MODULE_DOC', id + ': docs/modules/' + id + '.md ausente'));
  }

  for (const { path, content } of sourceFiles) {
    const normalizedPath = path.replaceAll('\\', '/');
    const basename = normalizedPath.split('/').at(-1) ?? '';

    if (/\.(?:css|scss|sass|less)$/i.test(basename)) {
      issues.push(violation('MODULE_LOCAL_STYLE', id + '/' + path + ': CSS local não permitido'));
      continue;
    }
    if (!/\.(?:tsx?|jsx?)$/i.test(basename)) continue;

    if (SHARED_COMPONENT_NAMES.has(basename.replace(/\.[^.]+$/, ''))) {
      issues.push(
        violation('MODULE_DUPLICATE_UI', id + '/' + path + ': use componente compartilhado'),
      );
    }
    if (COLOR_LITERAL.test(content) || TAILWIND_LITERAL_COLOR.test(content)) {
      issues.push(violation('MODULE_COLOR', id + '/' + path + ': cor literal fora dos tokens'));
    }
    if (IMPORT_DIRECT_COMPONENT.test(content)) {
      issues.push(
        violation('MODULE_IMPORT_PRIVATE', id + '/' + path + ': use o index público da biblioteca'),
      );
    }
    if (IMPORT_LOCAL_STYLES.test(content)) {
      issues.push(violation('MODULE_STYLE_IMPORT', id + '/' + path + ': CSS deve ser global'));
    }
    if (IMPORT_FIREBASE.test(content)) {
      issues.push(
        violation('MODULE_FIREBASE', id + '/' + path + ': acesso a dados pertence aos serviços'),
      );
    }
    if (/\b(?:window\.)?(?:fetch|localStorage|sessionStorage)\s*(?:\(|\[|\.)/.test(content)) {
      issues.push(
        violation('MODULE_DIRECT_IO', id + '/' + path + ': I/O direto deve ser delegado a serviço'),
      );
    }
    if (/\bdangerouslySetInnerHTML\b/.test(content)) {
      issues.push(violation('MODULE_RAW_HTML', id + '/' + path + ': HTML arbitrário proibido'));
    }
  }

  return issues;
}
