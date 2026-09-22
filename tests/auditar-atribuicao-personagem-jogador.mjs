import assert from'node:assert/strict';
import fs from'node:fs';

const creation=fs.readFileSync(new URL('../criacao-personagem.html',import.meta.url),'utf8');
const sheet=fs.readFileSync(new URL('../ficha-personagem.html',import.meta.url),'utf8');
const builder=fs.readFileSync(new URL('../scripts/character-builder.js',import.meta.url),'utf8');
const assignment=fs.readFileSync(new URL('../scripts/character-player-assignment-ui.js',import.meta.url),'utf8');
const provider=fs.readFileSync(new URL('../scripts/firebase-collaboration-provider.js',import.meta.url),'utf8');
const wizard=fs.readFileSync(new URL('../scripts/character-builder/wizard-ui.js',import.meta.url),'utf8');

assert.ok(creation.includes('<select id="profile-player">'),'Criação deve usar seletor de jogador.');
assert.ok(sheet.includes('<select id="profile-player">'),'Resumo da ficha deve usar seletor de jogador.');
assert.ok(creation.includes('scripts/hub-ux.js'),'Criação precisa carregar a sessão/autenticação do Hub.');
assert.ok(builder.includes('character-player-assignment-ui.js')&&builder.includes('initCharacterPlayerAssignmentUi'),'Construtor deve iniciar o vínculo personagem → jogador.');
assert.ok(sheet.includes('character-player-assignment-ui.js'),'Ficha deve carregar o controle de atribuição.');
for(const token of['readCollaborationSession','collaborationAccessMode',"mode==='player'","mode==='master'",'ownerUid','ownerUsername','listUsers','profile.player','guardMasterSave','Selecione o jogador responsável'])assert.ok(assignment.includes(token),`Atribuição sem ${token}`);
assert.ok(wizard.includes('stampPlayerOwnership'),'Criação do jogador deve preservar a gravação de propriedade já existente.');
assert.ok(provider.includes("f.where('characterId','==',charId)"),'Reatribuição deve localizar vínculos antigos do personagem.');
assert.ok(provider.includes("if(profile.id!==ownerUid)batch.delete"),'Reatribuição deve remover cópias pessoais antigas.');
assert.ok(provider.includes("canonicalUsername(row.data()?.username)!==ownerName"),'Vínculo de campanha incompatível deve ser desassociado.');
assert.ok(provider.includes("text(character.ownerUid)||text(old.data()?.ownerUid)"),'Cópia de campanha deve priorizar a nova atribuição.');
assert.ok(provider.includes("canonicalUsername(character.ownerUsername||old.data()?.ownerUsername"),'Nome do novo jogador deve prevalecer na cópia de campanha.');

console.log('OK — personagem fica atribuído ao jogador criador; Mestre escolhe e pode reatribuir o jogador pelo Resumo.');
