import assert from 'node:assert/strict';
import {sanitizeAdventure,addAdventureScene,addAdventureDevelopment,updateAdventureEntity,removeAdventureEntity,addAdventureMonster,reassignAdventureCampaign} from '../scripts/adventure-state.js';
import {sanitizeCampaign,sanitizeSession} from '../scripts/campaign-state.js';
import {normalizeExploration} from '../scripts/adventure-exploration-state.js';
import {renderDevelopmentEditor,renderDevelopmentOverview,renderSessionAdventureOverview,renderSessionAdventureCreation} from '../scripts/adventure-session-structure.js';

// Cada elemento conserva uma única fonte de verdade na Aventura.
const campaignId='campanha-teste';
let adv=sanitizeAdventure({
 id:'aventura-teste',campaignId,title:'As ruínas de Anansi',
 scenes:[{id:'cena-teste',title:'A negociação',status:'planned',order:1}],
 missions:[{id:'objetivo-teste',title:'Resgatar o emissário'}],
 exploration:{levels:[{id:'mapa-teste',name:'Ruínas antigas',type:'Masmorra'}],
 factions:[{id:'faccao-teste',name:'Vigias',operationArea:'Porto',description:'Guarda local'}]}
});
assert.equal(adv.exploration.factions[0].operationArea,'Porto');
assert.equal(normalizeExploration(adv.exploration).factions[0].operationArea,'Porto');

const session=sanitizeSession({
 id:'sessao-teste',adventureId:adv.id,mapIds:['mapa-teste','mapa-teste'],
 objectiveIds:['objetivo-teste'],
 scenes:[{id:'cena-da-sessao',title:'A negociação',adventureSceneId:'cena-teste'}]
});
assert.deepEqual(session.mapIds,['mapa-teste']);
assert.deepEqual(session.objectiveIds,['objetivo-teste']);

const created=addAdventureDevelopment([adv],adv.id,{
 description:'Os jogadores selaram uma aliança',sceneId:'cena-teste',sessionId:session.id
});
assert.equal(created.ok,true);
adv=created.adventure;
assert.equal(adv.developments.length,1);
assert.equal(adv.developments[0].sceneId,'cena-teste');
assert.equal(adv.developments[0].sessionId,session.id);
const dId=adv.developments[0].id;
assert.match(renderDevelopmentEditor(adv,{sessions:[{id:session.id,adventureId:adv.id,title:'Sessão I'}]}),/Os jogadores selaram uma aliança/);
assert.match(renderDevelopmentOverview(adv,{sessions:[]}),/Os jogadores selaram uma aliança/);

const overview=renderSessionAdventureOverview(session,adv);
assert.match(overview,/Ruínas antigas/);
assert.match(overview,/Resgatar o emissário/);
assert.match(overview,/A negociação/);
assert.match(overview,/Os jogadores selaram uma aliança/);
const creation=renderSessionAdventureCreation(session,adv);
assert.match(creation,/data-session-add-ref="mapIds"/);
assert.match(creation,/data-session-add-ref="objectiveIds"/);
assert.match(creation,/data-session-create-development/);

const modified=updateAdventureEntity([adv],adv.id,'developments',dId,{description:'A aliança foi rompida'});
assert.equal(modified.ok,true);
assert.equal(modified.adventure.developments[0].description,'A aliança foi rompida');
adv=modified.adventure;

const monster=addAdventureMonster([adv],adv.id,{name:'Sentinela',ac:12,maxHp:16,sheet:{actions:'Lança +4',languages:'Comum'}});
assert.equal(monster.adventure.monsters[0].sheet.actions,'Lança +4');
assert.equal(sanitizeAdventure(monster.adventure).monsters[0].sheet.languages,'Comum');
adv=monster.adventure;

const sceneGone=removeAdventureEntity([adv],adv.id,'scenes','cena-teste');
assert.equal(sceneGone.ok,true);
assert.equal(sceneGone.adventure.developments.length,1,'O histórico precisa sobreviver à exclusão de uma Cena');
assert.equal(sceneGone.adventure.developments[0].sceneId,null);
adv=sceneGone.adventure;

const deleted=removeAdventureEntity([adv],adv.id,'developments',dId);
assert.equal(deleted.ok,true);
assert.equal(deleted.adventure.developments.length,0);

const originalCampaign=sanitizeCampaign({id:campaignId,sessions:[session]});
const destination=sanitizeCampaign({id:'outro-mundo'});
const moved=reassignAdventureCampaign([adv],[originalCampaign,destination],adv.id,destination.id);
assert.equal(moved.ok,true);
assert.equal(moved.adventure.campaignId,destination.id);
assert.equal(moved.adventure.developments.length,1);
assert.equal(moved.adventure.developments[0].sessionId,null,'Desenrolares históricos continuam sem sessão de origem ao transferir');
console.log('✓ Aventuras/Sessões: referências, desenrolares, fichas e histórico preservados.');
