import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(path, 'utf8');
}

const packageJson = JSON.parse(read('package.json'));
const lockfile = JSON.parse(read('package-lock.json'));
const workflow = read('.github/workflows/verificar-tecnologias.yml');
const gitignore = read('.gitignore');
const exampleEnv = read('.env.example');
const bootstrap = read('src/app/main.tsx');
const viteConfig = read('vite.config.ts');

// As versoes instaladas precisam reproduzir o que o manifest declara.
const directDeps = packageJson.dependencies;
const lockedDeps = lockfile.packages[''].dependencies;
const directDevDeps = packageJson.devDependencies;
const lockedDevDeps = lockfile.packages[''].devDependencies;
assert.deepEqual(lockedDeps, directDeps, 'O lockfile diverge das dependencias diretas.');
assert.deepEqual(lockedDevDeps, directDevDeps, 'O lockfile diverge das dependencias de desenvolvimento.');

for (const name of ['typecheck', 'lint', 'test:run', 'format:check', 'build', 'pages:check']) {
  assert.ok(packageJson.scripts[name], `Script de verificacao ausente: ${name}`);
}
assert.ok(!('firebase-admin' in directDeps), 'firebase-admin nao deve integrar o frontend.');

// O exemplo de ambiente pode listar apenas campos publicos e deve permanecer vazio.
const assignments = exampleEnv.split(/\r?\n/).filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line));
assert.ok(assignments.length >= 4, 'Campos de configuracao Web nao documentados.');
for (const line of assignments) {
  const [key, value] = [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)];
  assert.ok(key.startsWith('VITE_FIREBASE_'), `Variavel inesperada no .env.example: ${key}`);
  assert.equal(value, '', `Valor deve ficar vazio em .env.example: ${key}`);
}
assert.match(gitignore, /^\.env$/m);
assert.match(gitignore, /^\.env\.\*$/m);
assert.match(gitignore, /^!\.env\.example$/m);

// Nenhum arquivo de credenciais privadas pode ser versionado.
const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const forbidden = tracked.filter((path) => {
  const name = path.split('/').at(-1) ?? '';
  return (
    (/^\.env(?:\..+)?$/i.test(name) && name !== '.env.example') ||
    /^(?:service[-_]?account|firebase[-_]?admin[-_]?sdk|private[-_]?key)\.(?:json|pem)$/i.test(name)
  );
});
assert.deepEqual(forbidden, [], 'Arquivo com nome reservado a credenciais esta versionado.');

// Guardrails temporarios: mudancas futuras exigem nova autorizacao do Mestre.
assert.match(viteConfig, /base:\s*['"]\/teias-de-anansi\/['"]/);
assert.doesNotMatch(bootstrap, /(?:from\s*['"][^'"]*(?:services\/firebase|firebase\/)|\bprepareHubFirebaseApp\s*\()/);
assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
assert.doesNotMatch(workflow, /actions\/deploy-pages|actions\/upload-pages-artifact|firebase\s+deploy/);
assert.doesNotMatch(workflow, /(?:pages|id-token):\s*write/);

console.log('Limites da fundacao verificados: dependencias, variaveis, arquivos e CI.');
console.log('Esta verificacao preventiva nao substitui auditoria de seguranca do Firebase.');
