import assert from'node:assert/strict';
import fs from'node:fs';
import{execFileSync}from'node:child_process';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const exists=path=>fs.existsSync(new URL(path,root));

for(const path of['README.md','ROADMAP-V1.md','FIREBASE-PROVISIONAMENTO.md','docs/MANUAL.md','docs/ARQUITETURA.md','package.json','playwright.config.js','e2e/hub.spec.js','e2e/player-visibility.spec.js','e2e/collaboration-real.spec.js','tests/auditar-acesso-jogador-ui.mjs','.github/workflows/homologar-release-v1.yml','.github/workflows/homologar-firebase-real.yml','.github/workflows/publicar-v1-0-2.yml'])assert.equal(exists(path),true,`Versão atual sem artefato obrigatório: ${path}`);
for(const removed of['dados.html','portabilidade.css','scripts/backup-engine.js','scripts/backup-relations.js','scripts/backup-ui.js','tests/auditar-persistencia-portabilidade.mjs','tests/auditar-persistencia-relacoes.mjs','.github/workflows/auditar-persistencia-portabilidade.yml','.github/workflows/finalizar-release-v1.yml','.github/workflows/publicar-v1-0-1.yml'])assert.equal(exists(removed),false,`Artefato removido/encerrado ainda existe: ${removed}`);

const pkg=JSON.parse(read('package.json'));
assert.equal(pkg.version,'1.0.2','A autorização por participação deve ser versionada como 1.0.2.');
assert.ok(pkg.scripts?.['test:e2e']);
assert.ok(pkg.scripts?.['test:e2e:firebase']);
assert.equal(pkg.devDependencies?.['@playwright/test'],'1.62.1');

const config=read('playwright.config.js'),e2e=read('e2e/hub.spec.js'),playerE2e=read('e2e/player-visibility.spec.js'),workflow=read('.github/workflows/homologar-release-v1.yml');
for(const token of['desktop-chromium','mobile-chromium','webServer'])assert.ok(config.includes(token),`Config E2E sem ${token}.`);
for(const token of['Configurações persistem','Nova Mesa consome defaults','Usuários usa apenas nome de usuário e senha'])assert.ok(e2e.includes(token),`E2E sem cenário atual: ${token}.`);
for(const token of['Mesa do Gus','Sessão do Gus','Aventura do Gus','Ficha do Gus','bibliotecas.html','MESA SECRETA DO MESTRE','FICHA DE OUTRO JOGADOR'])assert.ok(playerE2e.includes(token),`E2E do Jogador sem cenário: ${token}.`);
assert.equal(e2e.includes('dados.html'),false);
assert.ok(workflow.includes('npm run test:e2e')&&workflow.includes('playwright install --with-deps chromium'));

const firebaseE2e=read('e2e/collaboration-real.spec.js'),firebaseWorkflow=read('.github/workflows/homologar-firebase-real.yml');
for(const token of['E2E_FIREBASE_ADMIN_USERNAME','createUserWithEmailAndPassword','deleteUser','browser.newContext','PRIVATE_MARK','SHARED_MARK','OTHER_MARK','setOffline(true)','characterId','campaign-update','private-read','membership-update','other-character-read','saveCharacter'])assert.ok(firebaseE2e.includes(token),`Gate Firebase real sem contrato: ${token}.`);
for(const forbidden of['upsertAuthorizedUser','setAuthorizedUserActive','E2E_FIREBASE_PLAYER_'])assert.equal(firebaseE2e.includes(forbidden),false,`Gate Firebase ainda depende de autorização global removida: ${forbidden}.`);
for(const token of['workflow_dispatch','push:','E2E_FIREBASE_ADMIN_USERNAME','E2E_FIREBASE_ADMIN_PASSWORD','npm run test:e2e:firebase'])assert.ok(firebaseWorkflow.includes(token),`Workflow Firebase sem ${token}.`);
assert.equal(/password\s*[:=]\s*['"][^'"]+['"]/i.test(firebaseE2e),false,'Teste Firebase não pode conter senha literal.');

const home=read('index.html'),users=read('usuarios.html'),provider=read('scripts/firebase-collaboration-provider.js'),rules=read('firebase/firestore.rules'),firebaseConfig=JSON.parse(read('dados/firebase-config.json')),storageRegistry=read('scripts/storage-registry.js');
assert.equal(home.includes('dados.html'),false);
assert.equal(users.includes('authorize-user-form'),false);
assert.equal(users.includes('type="email"'),false);
assert.ok(users.includes('membership-character')&&users.includes('master-publish-tools'),'Mestre precisa atribuir personagem e possuir ferramentas próprias.');
assert.equal(provider.includes('authorizedUsers'),false);
assert.equal(provider.includes('isAdmin'),false);
for(const token of['isMember','isDm','canManage','assignedSharedRecord','linkedCharacter'])assert.ok(rules.includes(token),`Rules sem ${token}.`);
assert.equal(rules.includes('allow read, write: if request.auth != null;'),false,'Acesso irrestrito da v1.0.1 deve permanecer removido.');
assert.equal(rules.includes('authorizedUsers'),false);
assert.equal(firebaseConfig.accountProvisioning,'firebase-console-manual');
assert.equal(firebaseConfig.collaborationModel,'trusted-private');
assert.equal(firebaseConfig.accessModel,'membership-character-scoped');
assert.equal(firebaseConfig.roleVisibility,'firestore-and-application');
assert.equal(storageRegistry.includes('recovery-backup'),false,'Não pode restar registro técnico de Backup.');

const readme=read('README.md');
for(const token of['Personagens','Campanhas / Mesas','Usuários','Configurações','Backup/exportação/restauração não fazem parte','Mestre','Jogador','v1.0.1'])assert.ok(readme.includes(token),`README sem base atual: ${token}.`);

const critical=['tests/auditar-progressao-level.mjs','tests/auditar-campanhas-mesas.mjs','tests/auditar-aventuras.mjs','tests/auditar-colaboracao-provisionamento.mjs','tests/auditar-colaboracao-sync.mjs','tests/auditar-acesso-jogador-ui.mjs','tests/auditar-painel-geral.mjs','tests/auditar-configuracoes.mjs','tests/auditar-ux-mobile-final.mjs'];
for(const path of critical){assert.equal(exists(path),true,`Auditoria crítica ausente: ${path}`);execFileSync(process.execPath,[new URL(path,root).pathname],{stdio:'inherit'})}

console.log('OK — gate v1.0.2: sem Backup, login simples, acesso por participação, UI restrita e ficha própria validados.');