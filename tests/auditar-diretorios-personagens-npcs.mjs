import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sanitizeCampaign} from '../scripts/campaign-state.js';
import {campaignSharedProjection,revealedAdventureProjection,publicNpcEntries} from '../scripts/collaboration-model.js';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const privateMarker='SEGREDO_DA_TRAMA_NUNCA_PUBLICAR';
const privateName='Verdadeiro Senhor das Sombras';
function campaign(visible=true){
 return sanitizeCampaign({
  id:'camp-1',name:'Reinos de Prata',members:[],sessions:[],
  importantNpcIds:['npc-1'],importantNpcPublicNames:{'npc-1':'Lorde Seren'},
  importantNpcVisibility:{'npc-1':true},
  npcDirectory:[{id:'npc-1',name:privateName,role:'Vilão',faction:'Seita secreta',notes:privateMarker,
    status:'vivo',visibleToPlayers:visible,publicName:'Lorde Seren',publicCategory:'ally',
    publicRole:'Diplomata',publicRelationship:'Amigável',publicLocation:'Castelo visto ontem',
    publicStatus:'Vivo (última notícia)',publicDescription:'Um nobre cordial.'}],
  npcs:[{id:'npc-1',name:privateName,role:'Antagonista',description:privateMarker,notes:privateMarker}]
 });
}
const shared=campaignSharedProjection(campaign());
const serialized=JSON.stringify(shared);
assert.equal(shared.npcPublicEntries.length,1);
assert.equal(shared.npcPublicEntries[0].name,'Lorde Seren');
assert.equal(shared.npcPublicEntries[0].role,'Diplomata');
assert.equal(shared.npcPublicEntries[0].category,'ally');
assert.equal(shared.npcPublicEntries[0].location,'Castelo visto ontem');
assert.equal(serialized.includes(privateMarker),false,'Nota privada não pode integrar campanha compartilhada.');
assert.equal(serialized.includes(privateName),false,'Nome verdadeiro não pode integrar campanha compartilhada.');
assert.equal(serialized.includes('Seita secreta'),false,'Facção real não pode integrar campanha compartilhada.');
assert.equal('npcDirectory' in shared,false,'Diretório interno não deve ser serializado ao jogador.');
assert.equal('characterDirectory' in shared,false,'Notas de personagens não devem ser serializadas ao jogador.');

const adventure={id:'adv-1',campaignId:'camp-1',npcIds:['npc-1'],scenes:[],missions:[],handouts:[],clues:[]};
const projectedAdventure=revealedAdventureProjection(adventure,campaign());
assert.equal(projectedAdventure.npcs.length,1);
assert.equal(projectedAdventure.npcs[0].name,'Lorde Seren');
assert.equal(JSON.stringify(projectedAdventure).includes(privateMarker),false);
assert.equal(JSON.stringify(projectedAdventure).includes(privateName),false);

const hidden=campaign(false),hiddenShared=campaignSharedProjection(hidden);
assert.deepEqual(hiddenShared.npcPublicEntries,[],'Um NPC ocultado deve ser excluído da projeção.');
assert.deepEqual(hiddenShared.importantNpcEntries,[],'A visibilidade legada não pode reexibir NPC ocultado.');
assert.deepEqual(revealedAdventureProjection(adventure,hidden).npcs,[],'A vinculação à aventura não autoriza revelar NPC.');
assert.deepEqual(publicNpcEntries(hidden),[]);

const unconfigured=sanitizeCampaign({id:'camp-2',npcs:[{id:'npc-2',name:privateName,notes:privateMarker}]});
assert.deepEqual(publicNpcEntries(unconfigured),[],'NPC da campanha não deve ser publicado automaticamente.');

const legacy=sanitizeCampaign({id:'camp-3',importantNpcIds:['npc-legacy'],importantNpcPublicNames:{'npc-legacy':'Contato conhecido'},importantNpcVisibility:{'npc-legacy':true}});
assert.deepEqual(publicNpcEntries(legacy),[{id:'npc-legacy',name:'Contato conhecido'}],'Nomes legados explicitamente publicados continuam visíveis.');

const names=['personagens.html','lista-personagens.html','npcs.html'];
for(const path of names){
 const html=read(path);
 assert.ok(html.includes('hub-directories.css'),'Página não utiliza estilos do Hub: '+path);
 assert.ok(html.includes('hub-ux.js'),'Página sem o app shell: '+path);
}
assert.ok(read('scripts/app-shell.js').includes('{page:"npcs.html",label:"NPCs",icon:"player"}'),'NPCs precisa aparecer para ambos os perfis.');
assert.ok(!read('scripts/npc-list-ui.js').includes("location.replace('personagens.html')"),'Jogadores não podem ser expulsos da lista de NPCs.');
assert.ok(read('scripts/character-list-ui.js').includes('deleteCharacterAsMaster'),'Exclusão existente deve ser preservada.');
console.log('PASS: diretórios, compatibilidade e limites de publicação dos NPCs.');
