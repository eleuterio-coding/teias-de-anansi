import assert from'node:assert/strict';
import fs from'node:fs';
import{readCollaborationSession,sharedCampaignRows,sharedAdventures,assignedCharacterIds,canOpenCharacter}from'../scripts/collaboration-view.js';

const memory=new Map();const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
storage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'u-gus',username:'gus',isMaster:false,memberships:[{campaignId:'c1',uid:'u-gus',role:'player',characterId:'pc-gus',active:true}]}));
storage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify({campaigns:{c1:{membership:{campaignId:'c1',uid:'u-gus',role:'player',characterId:'pc-gus',active:true},payload:{campaign:{id:'c1',name:'Mesa Gus',sessions:[{id:'s1',participantCharacterIds:['pc-gus']}]},revealedAdventures:[{id:'a1',campaignId:'c1',title:'Aventura Gus'}]}},c2:{membership:{campaignId:'c2',uid:'u-outro',role:'player',characterId:'pc-outro',active:true},payload:{campaign:{id:'c2',name:'Mesa de Outro'},revealedAdventures:[]}}}}));
assert.equal(readCollaborationSession(storage).username,'gus');
assert.deepEqual(sharedCampaignRows(storage).map(r=>r.campaign.id),['c1']);
assert.deepEqual(sharedAdventures(storage).map(a=>a.id),['a1']);
assert.deepEqual(assignedCharacterIds(storage),['pc-gus']);
assert.equal(canOpenCharacter('pc-gus',storage),true);
assert.equal(canOpenCharacter('pc-outro',storage),false);

const files={
 campaigns:fs.readFileSync(new URL('../scripts/campaign-list-ui.js',import.meta.url),'utf8'),
 table:fs.readFileSync(new URL('../scripts/campaign-table-router.js',import.meta.url),'utf8'),
 sessions:fs.readFileSync(new URL('../scripts/campaign-sessions-ui.js',import.meta.url),'utf8'),
 adventures:fs.readFileSync(new URL('../scripts/adventure-router.js',import.meta.url),'utf8'),
 characters:fs.readFileSync(new URL('../scripts/character-list-ui.js',import.meta.url),'utf8'),
 mesa:fs.readFileSync(new URL('../mesa.html',import.meta.url),'utf8'),
 adventurePage:fs.readFileSync(new URL('../aventuras.html',import.meta.url),'utf8')
};
for(const token of['playerMode','sharedCampaignRows'])assert.ok(files.campaigns.includes(token),`Lista de Campanhas sem ${token}`);
assert.ok(files.campaigns.includes('Somente leitura'));
assert.ok(files.table.includes('sharedCampaignById')&&files.table.includes('Conteúdo atribuído a você'));
assert.ok(files.sessions.includes('sharedCampaignRows')&&files.sessions.includes('Nenhuma Sessão foi atribuída'));
assert.ok(files.adventures.includes('sharedAdventures')&&files.adventures.includes('somente leitura'));
assert.ok(files.characters.includes('assignedCharacterIds')&&files.characters.includes('Ficha atribuída'));
assert.equal(files.mesa.includes('encounter-ui.js'),false,'Mesa não deve carregar ferramentas do Mestre diretamente; o router decide.');
assert.equal(files.adventurePage.includes('adventure-ui.js'),false,'Aventuras não deve carregar editor do Mestre diretamente; o router decide.');
console.log('OK — UI do Jogador é derivada de Mesa/personagem atribuídos e permanece somente leitura fora da própria ficha.');