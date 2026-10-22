import assert from 'node:assert/strict';
import fs from 'node:fs';
import {characterInCampaign,characterInAdventure,npcInAdventure,sessionHistory,adventuresOf,currentAdventure,previousAdventures,adventureCurrentLocation,statuses} from '../scripts/roster-context.js';
import {publicNpcEntries,sessionSharedProjection,campaignSharedProjection,revealedAdventureProjection} from '../scripts/collaboration-model.js';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const secret='NAO_PODE_VAZAR_SEGREDO_2026';
const pc={id:'pc1',name:'Arannis'};
const npc={id:'npc1',name:'Merlin'};
const campaign={
 id:'campaign1',name:'Reinos de Prata',members:[{characterId:'pc1'}],locations:[{id:'local1',name:'Taverna'}],
 npcDirectory:[{id:'npc1',name:'Verdadeiro vilão',notes:secret,visibleToPlayers:true,publicName:'Sábio',publicClass:'Mago',publicSpecies:'Elfo',publicLevel:8}],
 sessions:[
  {id:'s1',title:'Sessão concluída',status:'completed',adventureId:'ad1',participantCharacterIds:['pc1'],scenes:[{id:'scene1',status:'completed',npcIds:['npc1']},{id:'scene2',status:'planned',npcIds:['npc2']}]},
  {id:'s2',title:'Sessão futura',status:'planned',adventureId:'ad1',participantCharacterIds:['pc1'],scenes:[]}
 ]
};
const adventure={id:'ad1',title:'As Rainhas',campaignId:'campaign1',characterIds:['pc1'],npcIds:['npc1'],locationIds:['local1'],status:'active',activeSceneId:'s-actual',scenes:[{id:'s-actual',status:'active',locationId:'local1'}]};
const earlier={id:'ad0',title:'O Prelúdio',campaignId:'campaign1',status:'completed',characterIds:['pc1'],npcIds:['npc1']};
assert.equal(characterInCampaign(pc,campaign),true);
assert.equal(characterInAdventure(pc,adventure,campaign),true);
assert.equal(characterInAdventure({id:'pc2'},adventure,campaign),false);
assert.equal(npcInAdventure(npc,adventure),true);
assert.deepEqual(sessionHistory(pc,campaign,[adventure]).map(s=>s.id),['s1']);
assert.equal(currentAdventure([earlier,adventure],[campaign])?.id,'ad1');
assert.deepEqual(previousAdventures([earlier,adventure],adventure,[campaign],pc).map(a=>a.id),['ad0']);
assert.equal(adventureCurrentLocation(adventure,campaign),'Taverna');
assert.deepEqual(statuses.map(s=>s[1]),['Desaparecido','Morto','NPC','Vivo']);
assert.equal(publicNpcEntries(campaign)[0].name,'Sábio');
assert.equal(publicNpcEntries(campaign)[0].species,'Elfo');
assert.equal(publicNpcEntries(campaign)[0].level,8);
const shared=campaignSharedProjection(campaign);
assert.equal(JSON.stringify(shared).includes(secret),false);
assert.equal(JSON.stringify(shared).includes('Verdadeiro vilão'),false);
assert.deepEqual(sessionSharedProjection(campaign.sessions[0],campaign).publicNpcIds,['npc1']);
assert.deepEqual(sessionSharedProjection(campaign.sessions[1],campaign).publicNpcIds,[]);
assert.deepEqual(sessionSharedProjection({...campaign.sessions[0],scenes:[]},campaign,[{id:'ad1',campaignId:'campaign1',scenes:[{sessionId:'s1',status:'completed',npcIds:['npc1']},{sessionId:'s1',status:'planned',npcIds:['npc2']}]}]).publicNpcIds,['npc1']);
const advShared=revealedAdventureProjection(adventure,campaign);
assert.equal(advShared.currentLocation,'Taverna');
assert.equal(advShared.npcs[0].name,'Sábio');
assert.equal(JSON.stringify(advShared).includes(secret),false);
const hidden={...campaign,npcDirectory:campaign.npcDirectory.map(n=>({...n,visibleToPlayers:false}))};
assert.deepEqual(publicNpcEntries(hidden),[]);
assert.deepEqual(sessionSharedProjection(campaign.sessions[0],hidden).publicNpcIds,[]);
assert.deepEqual(revealedAdventureProjection(adventure,hidden).npcs,[]);
for(const type of ['personagens','npcs']){
 const home=read(type+'.html'),directory=read(type==='personagens'?'lista-personagens.html':'lista-npcs.html');
 assert.equal((home.match(/hub-area-menu-title/g)||[]).length,4,type+' deve possuir quatro cards.');
 for(const token of ['Abrir fichas','Campanhas','Aventuras'])assert.ok(home.includes(token),type+' sem '+token);
 assert.ok(!home.includes('Abrir fichas / Jogar'));
 assert.ok(home.includes('hub-roster.css'));
 assert.ok(directory.includes('roster-picker-ui.js'));
 assert.ok(directory.includes('hub-roster.css'));
}
assert.ok(read('scripts/app-shell.js').includes('"lista-npcs.html"'));
assert.ok(!read('scripts/app-shell.js').includes('label:"Novo personagem"'));
assert.ok(read('hub-roster.css').includes('repeat(2,minmax(0,1fr))'));
console.log('PASS — Menus, elencos, históricos, status e privacidade de NPCs.');
