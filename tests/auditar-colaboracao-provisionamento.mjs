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
assert.equal(cfg.accountProvisioning,'firebase-console-manual','As contas são criadas manualmente pelo proprietário no Firebase Authentication.');
assert.equal(cfg.collaborationModel,'trusted-private','O Hub é pessoal e usado por um pequeno grupo de confiança.');
assert.equal(cfg.accessModel,'login-only','O Firebase Authentication deve ser a única barreira de entrada.');
assert.equal(cfg.roleVisibility,'application','Mestre/Jogador é uma regra funcional do Hub, não uma camada adicional de segurança.');
assert.ok(cfg.projectId&&cfg.apiKey&&cfg.authDomain&&cfg.appId,'Configuração web Firebase deve estar materializada.');

const rules=fs.readFileSync('firebase/firestore.rules','utf8');
assert.match(rules,/request\.auth\s*!=\s*null/,'Firestore deve exigir apenas usuário autenticado.');
assert.doesNotMatch(rules,/authorizedUsers|isAdmin\(|isMember\(|permission-denied/i,'Regras rígidas de autorização não fazem parte do escopo atual.');

const provider=fs.readFileSync('scripts/firebase-collaboration-provider.js','utf8');
assert.match(provider,/signInWithEmailAndPassword/,'Login deve continuar usando Firebase Authentication.');
assert.match(provider,/usernameDomain/,'O e-mail técnico deve continuar oculto atrás do nome de usuário.');
assert.doesNotMatch(provider,/authorizedUsers|upsertAuthorizedUser|setAuthorizedUserActive/,'Não deve existir autorização paralela ao Firebase Authentication.');

console.log('OK: Firebase provisionado para login simples, grupo confiável e papéis funcionais de Mesa.');
