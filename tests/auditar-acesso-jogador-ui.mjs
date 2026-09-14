import assert from'node:assert/strict';
import fs from'node:fs';
import{readCollaborationSession,sharedCampaignRows,sharedAdventures,sharedParticipants,participantsForSession,participantsForAdventure,assignedCharacterIds,visibleCharacterIds,canOpenCharacter,canEditCharacter,collaborationAccessMode}from'../scripts/collaboration-view.js';

const memory=new Map();const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
storage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'u-gus',username:'gus',isMaster:false,memberships:[{campaignId:'c1',username:'gus',email:'gus@teias.invalid',role:'player',characterId:'pc-gus',sessionIds:['s1'],adventureIds:['a1'],active:true}]}));
storage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify({campaigns:{c1:{membership:{campaignId:'c1',username:'gus',email:'gus@teias.invalid',role:'player',characterId:'pc-gus',sessionIds:['s1'],adventureIds:['a1'],active:true},payload:{campaign:{id:'c1',name:'Mesa Gus',members:[{id:'m-gus',name:'Gus',role:'player',characterId:'pc-gus',active:true},{id:'m-leo',name:'Leo',role:'player',characterId:'pc-leo',active:true}],sessions:[{id:'s1'}]},participants:[{username:'gus',role:'player',characterId:'pc-gus',sessionIds:['s1'],adventureIds:['a1'],active:true},{username:'leo',role:'player',characterId:'pc-leo',sessionIds:['s1'],adventureIds:['a1'],active:true}],revealedAdventures:[{id:'a1',campaignId:'c1',title:'Aventura Gus'}]},characterIds:['pc-gus','pc-leo']},c2:{membership:{campaignId:'c2',username:'leo',email:'leo@teias.invalid',role:'player',characterId:'pc-leo-2',active:true},payload:{campaign:{id:'c2',name:'Mesa Leo'},participants:[],revealedAdventures:[]},characterIds:['pc-leo-2']}}}}));
assert.equal(readCollaborationSession(storage).username,'gus');
assert.equal(collaborationAccessMode(storage),'player');
assert.deepEqual(sharedCampaignRows(storage).map(r=>r.campaign.id),['c1']);
assert.deepEqual(sharedAdventures(storage).map(a=>a.id),['a1']);
assert.deepEqual(assignedCharacterIds(storage),['pc-gus']);
assert.deepEqual(visibleCharacterIds(storage).sort(),['pc-gus','pc-leo'].sort());
assert.deepEqual(sharedParticipants('c1',storage).map(p=>p.username),['gus','leo']);
assert.deepEqual(participantsForSession('c1','s1',storage).map(p=>p.username),['gus','leo']);
assert.deepEqual(participantsForAdventure('c1','a1',storage).map(p=>p.username),['gus','leo']);
assert.equal(canOpenCharacter('pc-gus',storage),true);
assert.equal(canOpenCharacter('pc-leo',storage),true,'Jogador deve ler ficha de co-participante da mesma Campanha.');
assert.equal(canEditCharacter('pc-gus',storage),true);
assert.equal(canEditCharacter('pc-leo',storage),false,'Jogador não pode editar ficha alheia.');
assert.equal(canOpenCharacter('pc-leo-2',storage),false,'Jogador de outra Campanha não deve vazar para a conta atual.');

const guest=new Map(),guestStorage={getItem:k=>guest.get(k)||null,setItem:(k,v)=>guest.set(k,v),removeItem:k=>guest.delete(k)};
assert.equal(collaborationAccessMode(guestStorage),'guest');assert.equal(canOpenCharacter('pc-gus',guestStorage),false);assert.equal(canEditCharacter('pc-gus',guestStorage),false);

const files={
 campaigns:fs.readFileSync(new URL('../scripts/campaign-list-ui.js',import.meta.url),'utf8'),
 table:fs.readFileSync(new URL('../scripts/campaign-table-router.js',import.meta.url),'utf8'),
 sessions:fs.readFileSync(new URL('../scripts/campaign-sessions-ui.js',import.meta.url),'utf8'),
 adventures:fs.readFileSync(new URL('../scripts/adventure-router.js',import.meta.url),'utf8'),
 characters:fs.readFileSync(new URL('../scripts/character-list-ui.js',import.meta.url),'utf8'),
 sheetAccess:fs.readFileSync(new URL('../scripts/character-sheet-access-ui.js',import.meta.url),'utf8'),
 hubUx:fs.readFileSync(new URL('../scripts/hub-ux.js',import.meta.url),'utf8'),
 mesa:fs.readFileSync(new URL('../mesa.html',import.meta.url),'utf8'),
 adventurePage:fs.readFileSync(new URL('../aventuras.html',import.meta.url),'utf8')
};
for(const token of['playerMode','sharedCampaignRows'])assert.ok(files.campaigns.includes(token),`Lista de Campanhas sem ${token}`);
assert.ok(files.campaigns.includes('Somente leitura'));
assert.ok(files.table.includes('sharedCampaignById')&&files.table.includes('somente leitura'));
assert.equal(files.table.includes('Conteúdo atribuído a você'),false,'Mesa do Jogador não deve exibir tutorial de permissão.');
assert.ok(files.sessions.includes('sharedCampaignRows')&&files.sessions.includes('Nenhuma Sessão foi atribuída'));
assert.ok(files.adventures.includes('sharedAdventures')&&files.adventures.includes('somente leitura'));
assert.ok(files.characters.includes('visibleCharacterIds')&&files.characters.includes('Seu personagem')&&files.characters.includes('Outro jogador'));
assert.ok(files.sheetAccess.includes('canOpenCharacter')&&files.sheetAccess.includes('canEditCharacter')&&files.sheetAccess.includes('Somente leitura'));
assert.ok(files.hubUx.includes('enforceLogin')&&files.hubUx.includes('usuarios.html'));
assert.equal(files.mesa.includes('encounter-ui.js'),false,'Mesa não deve carregar ferramentas do Mestre diretamente; o router decide.');
assert.equal(files.adventurePage.includes('adventure-ui.js'),false,'Aventuras não deve carregar editor do Mestre diretamente; o router decide.');
console.log('OK — login define a visão; co-participantes do mesmo contexto são visíveis e cada Jogador edita somente a própria ficha.');