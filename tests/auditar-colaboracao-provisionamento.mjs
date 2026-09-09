import assert from'node:assert/strict';
import fs from'node:fs';

const cfg=JSON.parse(fs.readFileSync('dados/firebase-config.json','utf8'));
assert.equal(cfg.enabled,true,'Firebase deve permanecer habilitado.');
assert.equal(cfg.provider,'firebase');
assert.equal(cfg.platform,'web-site-only');
assert.equal(cfg.hosting,'github-pages');
assert.equal(cfg.firebaseHostingEnabled,false);
assert.equal(cfg.nativeAppEnabled,false);
assert.equal(cfg.firebasePlan,'spark');
assert.equal(cfg.billingForbidden,true);
assert.equal(cfg.paymentMethodForbidden,true);
assert.equal(cfg.authMode,'username-password');
assert.equal(cfg.usernameDomain,'teias.invalid');
assert.equal(cfg.ownerUsername,'rafael');
assert.deepEqual(cfg.playerUsernames,['gus','leo','bruno']);
assert.equal(cfg.accountProvisioning,'firebase-console-manual','As contas são criadas manualmente pelo proprietário no Firebase Authentication.');
assert.equal(cfg.collaborationModel,'trusted-private','O Hub continua pessoal e usado por um pequeno grupo de confiança.');
assert.equal(cfg.accessModel,'explicit-player-assignments','Campanhas, Sessões e Aventuras devem ser atribuídas explicitamente pelo Mestre.');
assert.equal(cfg.roleVisibility,'master-player-only','O Hub deve possuir apenas Mestre e Jogador.');
assert.ok(cfg.projectId&&cfg.apiKey&&cfg.authDomain&&cfg.appId,'Configuração web Firebase deve estar materializada.');

const rules=fs.readFileSync('firebase/firestore.rules','utf8');
for(const token of['isMember','canManage','isPlayer','assignedSession','assignedAdventure','linkedCharacter','sessionIds','adventureIds'])assert.ok(rules.includes(token),`Rules sem controle obrigatório: ${token}`);
for(const forbidden of['isDm','assignedSharedRecord',"== 'observer'"])assert.equal(rules.includes(forbidden),false,`Rules ainda contêm modelo antigo: ${forbidden}`);
assert.match(rules,/match \/private\/\{documentId\}/,'Conteúdo privado do Mestre deve possuir regra própria.');
assert.match(rules,/match \/sessions\/\{sessionId\}/,'Sessões compartilhadas devem ser documentos filtráveis.');
assert.match(rules,/match \/adventureViews\/\{adventureId\}/,'Aventuras compartilhadas devem ser documentos filtráveis.');
assert.doesNotMatch(rules,/allow read, write: if request\.auth != null;/,'Não é permitido voltar ao acesso irrestrito para todo usuário autenticado.');
assert.doesNotMatch(rules,/authorizedUsers|isAdmin\(/,'Não deve voltar a existir segunda autorização global ou papel Administrador.');

const provider=fs.readFileSync('scripts/firebase-collaboration-provider.js','utf8');
assert.match(provider,/signInWithEmailAndPassword/,'Login deve continuar usando Firebase Authentication.');
assert.match(provider,/usernameDomain/,'O e-mail técnico deve continuar oculto atrás do nome de usuário.');
for(const token of['sessionIds','adventureIds','fetchAssigned','saveCampaignCharacter','listCampaignCharacters'])assert.ok(provider.includes(token),`Provider sem atribuição obrigatória: ${token}`);
assert.doesNotMatch(provider,/array-contains|assignedSharedRecord/,'Provider não deve voltar a inferir acesso de Sessão/Aventura pela ficha.');
assert.doesNotMatch(provider,/authorizedUsers|upsertAuthorizedUser|setAuthorizedUserActive/,'Não deve existir autorização paralela ao Firebase Authentication.');

console.log('OK: login simples preservado; Rafael é Mestre único e Jogadores recebem Campanhas, Sessões, Aventuras e ficha por atribuição explícita.');
