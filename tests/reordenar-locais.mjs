import assert from 'node:assert/strict';
import { normalizeExploration, reorderExplorationAreas, reorderExplorationEntities } from '../scripts/adventure-exploration-state.js';
import { sanitizeAdventure, updateAdventure } from '../scripts/adventure-state.js';

const initial=normalizeExploration({
 levels:[{id:'level-1',name:'Palácio'}],
 areas:[
  {id:'area-1',name:'Entrada',code:'A01',order:1,levelId:'level-1',description:'Anotação privada',visibleToPlayers:true,connectionIds:['area-3']},
  {id:'area-2',name:'Pátio',code:'A02',order:2,levelId:'level-1',status:'visited',xp:150},
  {id:'area-3',name:'Torre',code:'A03',order:3,levelId:'level-1'},
  {id:'area-4',name:'Salão',code:'A04',order:4,levelId:'level-1'}
 ]
});
const original=JSON.stringify(initial);
const before=reorderExplorationAreas(initial,'area-4','area-2','before');
assert.equal(before.changed,true);
assert.deepEqual(before.exploration.areas.map(x=>[x.id,x.order]),[['area-1',1],['area-4',2],['area-2',3],['area-3',4]]);
assert.equal(JSON.stringify(initial),original,'Não modificar estado original');
assert.deepEqual(before.exploration.areas.find(x=>x.id==='area-1').connectionIds,['area-3']);
assert.equal(before.exploration.areas.find(x=>x.id==='area-1').visibleToPlayers,true);
assert.equal(before.exploration.areas.find(x=>x.id==='area-2').xp,150);
const after=reorderExplorationAreas(before.exploration,'area-4','area-3','after');
assert.equal(after.changed,true);
assert.deepEqual(after.exploration.areas.map(x=>x.id),['area-1','area-2','area-3','area-4']);
const same=reorderExplorationAreas(after.exploration,'area-4','area-4');
assert.equal(same.changed,false);
const noChange=reorderExplorationAreas(after.exploration,'area-1','area-2','before');
assert.equal(noChange.changed,false);
assert.ok(reorderExplorationAreas(after.exploration,'missing','area-3').error);
assert.ok(reorderExplorationAreas(after.exploration,'area-3','missing').error);
assert.ok(reorderExplorationAreas(after.exploration,'area-3','area-4','other').error);
const adventure=sanitizeAdventure({id:'adv-reorder',campaignId:'campaign-reorder',title:'Teste',exploration:before.exploration});
assert.deepEqual(adventure.exploration.areas.map(x=>x.id),['area-1','area-4','area-2','area-3']);
const persisted=updateAdventure([adventure],adventure.id,{exploration:after.exploration});
assert.equal(persisted.ok,true);
assert.deepEqual(persisted.adventure.exploration.areas.map(x=>x.id),['area-1','area-2','area-3','area-4']);
assert.equal(persisted.adventure.exploration.areas[0].description,'Anotação privada');
assert.equal(persisted.adventure.exploration.areas[0].visibleToPlayers,true);
assert.equal(persisted.adventure.exploration.areas[1].status,'visited');

const explorationWithGroups=normalizeExploration({
 levels:[{id:'map-a',name:'Castelo',order:1},{id:'map-b',name:'Jardim',order:2}],
 factions:[{id:'faction-a',name:'Realeza',order:1,description:'Privado'},{id:'faction-b',name:'Guarda',order:2}],
 areas:[{id:'area-x',name:'Sala',order:1,levelId:'map-a',factionIds:['faction-a']}]
},{factionIds:['faction-a','faction-b']});
const movedMaps=reorderExplorationEntities(explorationWithGroups,'level','map-b','map-a','before');
assert.deepEqual(normalizeExploration(movedMaps.exploration).levels.map(x=>x.id),['map-b','map-a']);
assert.equal(movedMaps.exploration.areas[0].levelId,'map-a','O mapa de cada Local continua vinculado');
const movedFactions=reorderExplorationEntities(movedMaps.exploration,'faction','faction-b','faction-a','before');
assert.deepEqual(normalizeExploration(movedFactions.exploration).factions.map(x=>x.id),['faction-b','faction-a']);
assert.equal(movedFactions.exploration.factions.find(x=>x.id==='faction-a').description,'Privado');
assert.equal(movedFactions.exploration.areas[0].factionIds[0],'faction-a');
assert.ok(reorderExplorationEntities(movedFactions.exploration,'unknown','faction-a','faction-b').error);

console.log('OK — Reordenação de Locais, Mapas e Facções: antes/depois, posições sequenciais, vínculos, privacidade e persistência.');
