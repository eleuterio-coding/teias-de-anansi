import assert from'node:assert/strict';
import fs from'node:fs';
import{execFileSync}from'node:child_process';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const exists=path=>fs.existsSync(new URL(path,root));

for(const path of['README.md','ROADMAP-V1.md','FIREBASE-PROVISIONAMENTO.md','docs/MANUAL.md','docs/ARQUITETURA.md','package.json','playwright.config.js','e2e/hub.spec.js','e2e/collaboration-real.spec.js','.github/workflows/homologar-release-v1.yml','.github/workflows/homologar-firebase-real.yml'])assert.equal(exists(path),true,`Versão atual sem artefato obrigatório: ${path}`);
for(const removed of['dados.html','portabilidade.css','scripts/backup-engine.js','scripts/backup-relations.js','scripts/backup-ui.js','tests/auditar-persistencia-portabilidade.mjs','tests/auditar-persistencia-relacoes.mjs','.github/workflows/auditar-persistencia-portabilidade.yml','.github/workflows/finalizar-release-v1.yml'])assert.equal(exists(removed),false,`Artefato removido do escopo ainda existe: ${removed}`);

const pkg=JSON.parse(read('package.json'));
assert.equal(pkg.version,'1.0.1','A simplificação pós-v1.0.0 deve ser versionada como 1.0.1.');
assert.ok(pkg.scripts?.['test:e2e']);
assert.ok(pkg.scripts?.['test:e2e:firebase']);
assert.equal(pkg.devDependencies?.['@playwright/test'],'1.62.1');

const config=read('playwright.config.js'),e2e=read('e2e/hub.spec.js'),workflow=read('.github/workflows/homologar-release-v1.yml');
for(const token of['desktop-chromium','mobile-chromium','webServer'])assert.ok(config.includes(token),`Config E2E sem ${token}.`);
for(const token of['Configurações persistem','Nova Mesa consome defaults','Usuários usa apenas nome de usuário e senha'])assert.ok(e2e.includes(token),`E2E sem cenário atual: ${token}.`);
assert.equal(e2e.includes('dados.html'),false,'E2E não deve depender da antiga área de Backup.');
assert.equal(e2e.toLowerCase().includes('backup completo'),false);
assert.ok(workflow.includes('npm run test:e2e')&&workflow.includes('playwright install --with-deps chromium'),'Workflow deve executar Chromium real.');

const firebaseE2e=read('e2e/collaboration-real.spec.js'),firebaseWorkflow=read('.github/workflows/homologar-firebase-real.yml');
for(const token of['E2E_FIREBASE_ADMIN_USERNAME','createUserWithEmailAndPassword','deleteUser','browser.newContext','PRIVATE_MARK','SHARED_MARK','setOffline(true)','characterId'])assert.ok(firebaseE2e.includes(token),`Gate Firebase real sem contrato: ${token}.`);
for(const forbidden of['upsertAuthorizedUser','setAuthorizedUserActive','permission-denied','E2E_FIREBASE_PLAYER_'])assert.equal(firebaseE2e.includes(forbidden),false,`Gate Firebase ainda cobra segurança removida: ${forbidden}.`);
for(const token of['workflow_dispatch','push:','E2E_FIREBASE_ADMIN_USERNAME','E2E_FIREBASE_ADMIN_PASSWORD','npm run test:e2e:firebase'])assert.ok(firebaseWorkflow.includes(token),`Workflow Firebase sem ${token}.`);
assert.equal(/password\s*[:=]\s*['"][^'"]+['"]/i.test(firebaseE2e),false,'Teste Firebase não pode conter senha literal.');

const home=read('index.html'),users=read('usuarios.html'),provider=read('scripts/firebase-collaboration-provider.js'),rules=read('firebase/firestore.rules'),firebaseConfig=JSON.parse(read('dados/firebase-config.json'));
assert.equal(home.includes('dados.html'),false,'Home não deve expor Backup.');
assert.equal(users.includes('authorize-user-form'),false);
assert.equal(users.includes('admin-tools'),false);
assert.equal(users.includes('type="email"'),false,'Hub não deve pedir e-mail real.');
assert.equal(provider.includes('authorizedUsers'),false);
assert.equal(provider.includes('isAdmin'),false);
assert.match(rules,/allow read, write: if request\.auth != null;/);
assert.equal(rules.includes('authorizedUsers'),false);
assert.equal(firebaseConfig.accountProvisioning,'firebase-console-manual');
assert.equal(firebaseConfig.collaborationModel,'trusted-private');
assert.equal(firebaseConfig.accessModel,'login-only');
assert.equal(firebaseConfig.roleVisibility,'application');

const readme=read('README.md');
for(const token of['Personagens','Campanhas / Mesas','Usuários','Configurações','Backup/exportação/restauração não fazem parte','Mestre','Jogador','v1.0.1'])assert.ok(readme.includes(token),`README sem decisão atual: ${token}.`);

const critical=[
 'tests/auditar-progressao-level.mjs',
 'tests/auditar-campanhas-mesas.mjs',
 'tests/auditar-aventuras.mjs',
 'tests/auditar-colaboracao-provisionamento.mjs',
 'tests/auditar-colaboracao-sync.mjs',
 'tests/auditar-painel-geral.mjs',
 'tests/auditar-configuracoes.mjs',
 'tests/auditar-ux-mobile-final.mjs'
];
for(const path of critical){assert.equal(exists(path),true,`Auditoria crítica ausente: ${path}`);execFileSync(process.execPath,[new URL(path,root).pathname],{stdio:'inherit'})}

console.log('OK — gate v1.0.1: sem Backup, login simples, visibilidade Mestre/Jogador e regressões críticas validados.');
