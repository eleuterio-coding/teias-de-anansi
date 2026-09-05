import assert from'node:assert/strict';
import fs from'node:fs';
import{execFileSync}from'node:child_process';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const exists=path=>fs.existsSync(new URL(path,root));

for(const path of['README.md','ROADMAP-V1.md','docs/MANUAL.md','docs/ARQUITETURA.md','docs/HOMOLOGACAO-V1.md','package.json','playwright.config.js','e2e/hub.spec.js','.github/workflows/homologar-release-v1.yml']){
 assert.equal(exists(path),true,`Release v1 sem artefato obrigatório: ${path}`)
}

const pkg=JSON.parse(read('package.json'));
assert.ok(pkg.scripts?.['test:e2e'],'package.json deve expor test:e2e.');
assert.equal(pkg.devDependencies?.['@playwright/test'],'1.62.1','Playwright do gate deve permanecer pinado durante o fechamento da v1.');
const config=read('playwright.config.js'),e2e=read('e2e/hub.spec.js'),workflow=read('.github/workflows/homologar-release-v1.yml');
for(const token of['desktop-chromium','mobile-chromium','webServer'])assert.ok(config.includes(token),`Config E2E sem ${token}.`);
for(const token of['Configurações persistem','Nova Mesa consome defaults','backup completo sobrevive','Usuários mantém acesso fechado'])assert.ok(e2e.includes(token),`E2E sem cenário obrigatório: ${token}.`);
assert.ok(workflow.includes('npm run test:e2e')&&workflow.includes('playwright install --with-deps chromium'),'Workflow não executa Chromium real.');

const readme=read('README.md'),manual=read('docs/MANUAL.md'),architecture=read('docs/ARQUITETURA.md'),homologation=read('docs/HOMOLOGACAO-V1.md');
assert.ok(readme.length>1500,'README ainda está curto demais para release.');
for(const token of['Personagens','Campanhas','Dados / Backup','Usuários','Configurações'])assert.ok(readme.includes(token),`README sem área principal: ${token}.`);
for(const token of['Criação de Personagem','Ficha Digital','Subir de Level','Backup','Colaboração'])assert.ok(manual.includes(token),`Manual sem fluxo: ${token}.`);
for(const token of['localStorage','Firebase','GitHub Pages','Firestore','schema'])assert.ok(architecture.includes(token),`Arquitetura sem tópico: ${token}.`);
for(const token of['Desktop','Mobile','Level 1','Level 20','multiusuário','recuperação','rede'])assert.ok(homologation.includes(token),`Plano de homologação sem critério: ${token}.`);

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
console.log('OK — gate estrutural do Bloco 18: documentação, E2E e regressões críticas presentes e verdes.');
