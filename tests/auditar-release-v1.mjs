import assert from'node:assert/strict';
import fs from'node:fs';
import{execFileSync}from'node:child_process';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const exists=path=>fs.existsSync(new URL(path,root));

for(const path of['README.md','ROADMAP-V1.md','docs/MANUAL.md','docs/ARQUITETURA.md','docs/HOMOLOGACAO-V1.md','docs/AUDITORIA-BRANCHES-V1.md','docs/RELEASE-NOTES-V1.0.0.md','package.json','playwright.config.js','e2e/hub.spec.js','e2e/collaboration-real.spec.js','.github/workflows/homologar-release-v1.yml','.github/workflows/homologar-firebase-real.yml','.github/workflows/finalizar-release-v1.yml']){
 assert.equal(exists(path),true,`Release v1 sem artefato obrigatório: ${path}`)
}

const pkg=JSON.parse(read('package.json'));
assert.ok(['1.0.0-rc.1','1.0.0'].includes(pkg.version),'Versão do fechamento v1 deve permanecer RC1 até a promoção final ou ser 1.0.0 após o aceite.');
assert.ok(pkg.scripts?.['test:e2e'],'package.json deve expor test:e2e.');
assert.ok(pkg.scripts?.['test:e2e:firebase'],'package.json deve expor o gate Firebase real.');
assert.equal(pkg.devDependencies?.['@playwright/test'],'1.62.1','Playwright do gate deve permanecer pinado durante o fechamento da v1.');
const config=read('playwright.config.js'),e2e=read('e2e/hub.spec.js'),workflow=read('.github/workflows/homologar-release-v1.yml');
for(const token of['desktop-chromium','mobile-chromium','webServer'])assert.ok(config.includes(token),`Config E2E sem ${token}.`);
for(const token of['Configurações persistem','Nova Mesa consome defaults','backup completo sobrevive','Usuários mantém acesso fechado'])assert.ok(e2e.includes(token),`E2E sem cenário obrigatório: ${token}.`);
assert.ok(workflow.includes('npm run test:e2e')&&workflow.includes('playwright install --with-deps chromium'),'Workflow não executa Chromium real.');

const firebaseE2e=read('e2e/collaboration-real.spec.js'),firebaseWorkflow=read('.github/workflows/homologar-firebase-real.yml');
for(const token of['E2E_FIREBASE_ADMIN_USERNAME','E2E_FIREBASE_PLAYER_UID','browser.newContext','PRIVATE_MARK','setOffline(true)','permission-denied','characterId'])assert.ok(firebaseE2e.includes(token),`Gate Firebase real sem contrato: ${token}.`);
for(const token of['workflow_dispatch','E2E_FIREBASE_ADMIN_PASSWORD','E2E_FIREBASE_PLAYER_PASSWORD','Exigir credenciais E2E reais','npm run test:e2e:firebase'])assert.ok(firebaseWorkflow.includes(token),`Workflow Firebase real sem ${token}.`);
assert.equal(/password\s*[:=]\s*['"][^'"]+['"]/i.test(firebaseE2e),false,'Teste Firebase não pode conter senha literal.');
assert.equal(firebaseWorkflow.includes('push:'),false,'Gate Firebase real não deve rodar automaticamente sem credenciais de homologação.');
assert.equal(firebaseWorkflow.includes('pull_request:'),false,'Gate Firebase real não deve aceitar execução de PR com credenciais de homologação.');

const finalizer=read('.github/workflows/finalizar-release-v1.yml');
for(const token of['workflow_run','Homologar Firebase real v1','conclusion == \'success\'','head_branch == \'main\'','FIREBASE_HEAD_SHA','v1.0.0','gh release create'])assert.ok(finalizer.includes(token),`Finalizador v1 sem trava/ação: ${token}.`);
assert.ok(finalizer.includes('node tests/auditar-release-v1.mjs')&&finalizer.includes('npm run test:e2e'),'Finalizador deve revalidar gate estrutural e E2E antes da tag.');

const readme=read('README.md'),manual=read('docs/MANUAL.md'),architecture=read('docs/ARQUITETURA.md'),homologation=read('docs/HOMOLOGACAO-V1.md'),branches=read('docs/AUDITORIA-BRANCHES-V1.md'),releaseNotes=read('docs/RELEASE-NOTES-V1.0.0.md');
assert.ok(readme.length>1500,'README ainda está curto demais para release.');
for(const token of['Personagens','Campanhas','Dados / Backup','Usuários','Configurações'])assert.ok(readme.includes(token),`README sem área principal: ${token}.`);
for(const token of['Criação de Personagem','Ficha Digital','Subir de Level','Backup','Colaboração'])assert.ok(manual.includes(token),`Manual sem fluxo: ${token}.`);
for(const token of['localStorage','Firebase','GitHub Pages','Firestore','schema'])assert.ok(architecture.includes(token),`Arquitetura sem tópico: ${token}.`);
for(const token of['Desktop','Mobile','Level 1','Level 20','multiusuário','recuperação','rede','Homologar Firebase real v1'])assert.ok(homologation.includes(token),`Plano de homologação sem critério: ${token}.`);
for(const token of['#123','#94','#30','codex/bloco-1-ficha-modo-jogo','codex/bloco-16-painel-geral','Limpeza física executada','PR técnico do Bloco 18'])assert.ok(branches.includes(token),`Auditoria de branches sem evidência final: ${token}.`);
for(const token of['v1.0.0','Ficha Digital','Level 20','Campanhas','Firebase','GitHub Pages'])assert.ok(releaseNotes.includes(token),`Notas de release sem tópico obrigatório: ${token}.`);

const critical=[
 'tests/auditar-progressao-level.mjs',
 'tests/auditar-campanhas-mesas.mjs',
 'tests/auditar-aventuras.mjs',
 'tests/auditar-persistencia-portabilidade.mjs',
 'tests/auditar-colaboracao-provisionamento.mjs',
 'tests/auditar-colaboracao-sync.mjs',
 'tests/auditar-painel-geral.mjs',
 'tests/auditar-configuracoes.mjs',
 'tests/auditar-ux-mobile-final.mjs'
];
for(const path of critical){
 assert.equal(exists(path),true,`Auditoria crítica ausente: ${path}`);
 execFileSync(process.execPath,[new URL(path,root).pathname],{stdio:'inherit'})
}

const roadmap=read('ROADMAP-V1.md');
assert.ok(roadmap.includes('18. Homologação, documentação e release final'),'Roadmap sem Bloco 18.');
console.log('OK — gate estrutural do Bloco 18: documentação, E2E local, harness Firebase real, finalizador, auditoria de branches e regressões críticas presentes e verdes.');
