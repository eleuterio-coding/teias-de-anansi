import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const read=path=>fs.readFileSync(path,'utf8');
for(const script of [
 'scripts/app-shell.js','scripts/firebase-collaboration-provider.js',
 'scripts/user-profile-ui.js','scripts/character-builder/profile-ui.js',
 'scripts/character-builder.js','scripts/collaboration-ui.js'
])execFileSync(process.execPath,['--check',script],{stdio:'pipe'});

const page=read('usuario.html'),shell=read('scripts/app-shell.js');
const profile=read('scripts/user-profile-ui.js'),provider=read('scripts/firebase-collaboration-provider.js');
assert.match(page,/<h1>Usuários<\/h1>/);
assert.match(shell,/<span>Usuários<\/span>/);
for(const id of ['user-directory-list','user-profile-card','user-display-name','user-name-save','user-avatar-preview','user-avatar-input','user-avatar-remove'])assert.ok(page.includes('id="'+id+'"'),'Campo ausente: '+id);
assert.match(profile,/await provider\.listUsers\(\)/);
assert.match(profile,/isMaster=mine\.username===provider\.config\.ownerUsername/);
assert.match(profile,/nameInput\.disabled=!isMaster/);
assert.match(profile,/return Boolean\(user&&!previewing&&\(isMaster\|\|user\.uid===ownUid\)\)/);
assert.match(profile,/preview\?\.addEventListener\('click'/);
assert.match(profile,/saveUserProfile\(\{uid:user\.uid,displayName\}\)/);
assert.match(profile,/saveUserProfile\(\{uid:user\.uid,avatarDataUrl:url\}\)/);
assert.match(provider,/async saveUserProfile\(\{uid,displayName,avatarDataUrl\}/);
assert.match(provider,/if\(targetUid!==actor\.uid&&!isMaster\)throw/);
assert.match(provider,/if\(!isMaster\)throw new Error\('Somente o Mestre pode alterar nomes/);
assert.match(provider,/if\(!text\(saved\.displayName\)\)changes\.displayName=displayName/);

const creation=read('criacao-personagem.html');
const origin=creation.split('data-wizard-panel="origem"')[1].split('data-wizard-panel="atributos"')[0];
assert.ok(origin.indexOf('hub-character-identity-row')<origin.indexOf('Características Físicas'));
assert.ok(origin.indexOf('Detalhes do Personagem')<origin.indexOf('Imagem do Personagem'));
assert.ok(origin.indexOf('Imagem do Personagem')<origin.indexOf('Características Físicas'));
assert.match(origin,/for="creation-portrait-file" id="creation-portrait-picker"/);
assert.match(read('scripts/character-builder/profile-ui.js'),/creation-portrait-picker'\)\?\.addEventListener\('keydown'/);
assert.match(read('character-pages.css'),/\.hub-character-identity-row/);
assert.match(read('user-profiles.css'),/\.hub-user-layout/);
console.log('OK: diretório, edição por papel, retrato acessível e ordem da Origem.');
