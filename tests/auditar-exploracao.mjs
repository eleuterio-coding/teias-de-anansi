import assert from'node:assert/strict';
import{normalizeExploration,createExplorationEntity,updateExplorationEntity,removeExplorationEntity,reorderExplorationAreas,changeAreaStatus,setCurrentExplorationArea,explorationProgress}from'../scripts/adventure-exploration-state.js';
import{sanitizeAdventure,createAdventure,updateAdventure,addAdventureScene,reassignAdventureCampaign}from'../scripts/adventure-state.js';
import{sanitizeCampaign}from'../scripts/campaign-state.js';
import{revealedAdventureProjection,sharedExplorationProjection}from'../scripts/collaboration-model.js';

let old=sanitizeAdventure({id:'old',campaignId:'c1',title:'Aventura anterior',chapters:[{id:'chapter-1',title:'Capítulo'}],scenes:[{id:'scene-1',title:'Cena antiga'}]});
assert.deepEqual(old.exploration,{levels:[],areas:[],factions:[],history:[],activeAreaId:null},'Migrar registros antigos sem perder cenas');
assert.equal(old.scenes.length,1);
assert.equal(old.title,'Aventura anterior');

let e=old.exploration,ret=createExplorationEntity(e,'level',{name:'Distrito superior',mapUrl:'https://example.org/mapa.png'});
e=ret.exploration;const levelId=ret.entity.id;
ret=createExplorationEntity(e,'area',{code:'A1',name:'Portão',levelId,description:'SEGREDO INTERNO',publicDescription:'Um portão.',mapX:24,mapY:42,visibleToPlayers:false});
e=ret.exploration;const gateId=ret.entity.id;
ret=createExplorationEntity(e,'area',{code:'A2',name:'Pátio',levelId,parentId:gateId,connectionIds:[gateId],mapX:60,mapY:80});
e=ret.exploration;const yardId=ret.entity.id;
ret=createExplorationEntity(e,'faction',{name:'Aliança Local',objective:'PLANO SIGILOSO',publicDescription:'Grupo reconhecido',visibleToPlayers:false});
e=ret.exploration;const factionId=ret.entity.id;
ret=updateExplorationEntity(e,'area',gateId,{visibleToPlayers:true,factionIds:[factionId],npcIds:['npc-1'],clueIds:['clue-1']});
e=ret.exploration;
ret=changeAreaStatus(e,gateId,'visited',{sessionId:'session-1',notes:'Grupo entrou pelo portão.',visibleToPlayers:true});
e=ret.exploration;
assert.equal(explorationProgress(e).visited,1);
assert.equal(e.history.length,1);
assert.equal(e.history[0].sessionId,'session-1');
assert.equal(e.areas[0].status,'visited');
assert.equal(e.areas[1].status,'unknown','Áreas não avançam automaticamente');
e=setCurrentExplorationArea(e,gateId).exploration;
assert.equal(e.activeAreaId,gateId,'Área atual é separada do status narrativo');
assert.ok(changeAreaStatus(e,gateId,'invalido').error);
assert.ok(removeExplorationEntity(e,'level',levelId).error,'Impedir remoção de nível com áreas');

let adventure=sanitizeAdventure({id:'a1',campaignId:'c1',title:'Aventura genérica',npcIds:['npc-1'],chapters:[{id:'chapter-1',title:'Ato'}],clues:[{id:'clue-1',title:'Pista'}],exploration:e});
assert.equal(adventure.exploration.areas[0].npcIds[0],'npc-1');
assert.equal(adventure.exploration.areas[0].clueIds[0],'clue-1');
assert.equal(adventure.exploration.areas[0].factionIds[0],factionId);
assert.equal(adventure.exploration.areas[0].parentId,null);
assert.equal(adventure.exploration.areas[1].parentId,gateId);

const shared0=revealedAdventureProjection(adventure,{});
assert.equal(shared0.exploration.areas.length,1,'Somente área marcada e descoberta');
assert.equal(shared0.exploration.levels.length,0,'Nível não publicado');
assert.equal(shared0.exploration.factions.length,0,'Facção não publicada');
assert.equal(shared0.exploration.history.length,1,'Histórico explicitamente publicado');
const payload0=JSON.stringify(shared0);
for(const secret of ['SEGREDO INTERNO','PLANO SIGILOSO','mapa.png','mapX','mapY','checks','hazards','dmNotes','connectionIds','npcIds','factionIds'])assert.equal(payload0.includes(secret),false,'Não enviar conteúdo interno: '+secret);
assert.equal(payload0.includes('Um portão.'),true);

const updated=updateExplorationEntity(e,'level',levelId,{visibleToPlayers:true});e=updated.exploration;
const factionUpdate=updateExplorationEntity(e,'faction',factionId,{visibleToPlayers:true,npcIds:['npc-1','npc-invalid']});e=factionUpdate.exploration;
const withFactionNpcs=sanitizeAdventure({id:'a-npc',campaignId:'c1',npcIds:['npc-1'],exploration:e});
assert.deepEqual(withFactionNpcs.exploration.factions[0].npcIds,['npc-1'],'Facções referenciam somente NPCs válidos');
const publicProjection=sharedExplorationProjection(e);
assert.equal(publicProjection.levels[0].name,'Distrito superior');
assert.equal(publicProjection.factions[0].name,'Aliança Local');
assert.equal(publicProjection.factions[0].description,'Grupo reconhecido');
assert.equal(JSON.stringify(publicProjection).includes('PLANO SIGILOSO'),false);
assert.equal(JSON.stringify(publicProjection).includes('npc-1'),false,'IDs de NPCs vinculados a facções são privados');
assert.equal(JSON.stringify(publicProjection).includes('https://example.org'),false);

let sceneRet=addAdventureScene([adventure],adventure.id,{title:'Interrogatório',areaId:gateId});
assert.equal(sceneRet.adventure.scenes[0].areaId,gateId);
const before=sceneRet.adventure.exploration;
ret=removeExplorationEntity(before,'area',gateId);
assert.equal(ret.exploration.history[0].areaId,null,'Manter crônica órfã sem expor área removida');
const after=updateAdventure(sceneRet.list,adventure.id,{exploration:ret.exploration}).adventure;
assert.equal(after.scenes[0].areaId,null,'Limpar vínculo da cena excluída');
assert.equal(after.exploration.activeAreaId,null,'Ao excluir a área atual, limpar o foco');
assert.equal(after.exploration.areas[0].parentId,null,'Limpar hierarquia de áreas');
assert.deepEqual(after.exploration.areas[0].connectionIds,[]);

const invalid=normalizeExploration({levels:[{id:'l1',name:'Um',mapUrl:'javascript:alert(1)'}],areas:[{id:'q1',levelId:'l1',name:'Um',parentId:'q2',connectionIds:['q1','foo'],mapX:999,mapY:-10},{id:'q2',levelId:'l1',name:'Dois',parentId:'q1'}]});
assert.equal(invalid.levels[0].mapUrl,'','Bloquear URL inadequada');
assert.equal(invalid.areas[0].mapX,100);assert.equal(invalid.areas[0].mapY,0);
assert.deepEqual(invalid.areas[0].connectionIds,[]);
assert.equal(invalid.areas.some(a=>a.parentId===null),true,'Romper ciclo hierárquico');

// Arrastar Locais deve conservar dados narrativos, IDs e vínculos ao persistir.
const reorderBase=normalizeExploration({levels:[{id:'l-reorder',name:'Mapa'}],areas:[
 {id:'a-first',code:'A01',name:'Entrada',order:1,levelId:'l-reorder',description:'Segredo privado',visibleToPlayers:true,connectionIds:['a-third']},
 {id:'a-second',code:'A02',name:'Pátio',order:2,levelId:'l-reorder',status:'visited',xp:120},
 {id:'a-third',code:'A03',name:'Torre',order:3,levelId:'l-reorder'}
]});
const reorderSnapshot=JSON.stringify(reorderBase);
let reordered=reorderExplorationAreas(reorderBase,'a-third','a-first','before');
assert.equal(reordered.changed,true);
assert.deepEqual(reordered.exploration.areas.map(a=>[a.id,a.order]),[['a-third',1],['a-first',2],['a-second',3]]);
assert.equal(reordered.exploration.areas[1].description,'Segredo privado');
assert.deepEqual(reordered.exploration.areas[1].connectionIds,['a-third']);
assert.equal(reordered.exploration.areas[2].xp,120);
assert.equal(JSON.stringify(reorderBase),reorderSnapshot,'Ordenação não pode modificar o registro original');
reordered=reorderExplorationAreas(reordered.exploration,'a-third','a-second','after');
assert.deepEqual(normalizeExploration(reordered.exploration).areas.map(a=>a.id),['a-first','a-second','a-third']);
assert.equal(reorderExplorationAreas(reorderBase,'a-first','a-first').changed,false);
assert.ok(reorderExplorationAreas(reorderBase,'inexistente','a-first').error);
assert.ok(reorderExplorationAreas(reorderBase,'a-first','a-second','invalid').error);

const migrated=createAdventure([],{campaignId:'c1',title:'Exemplo',exploration:e});
const c1=sanitizeCampaign({id:'c1',name:'Origem'});
const c2=sanitizeCampaign({id:'c2',name:'Destino'});
const moved=reassignAdventureCampaign(migrated.list,[c1,c2],migrated.adventure.id,'c2');
assert.equal(moved.ok,true);
assert.equal(moved.adventure.exploration.history[0].sessionId,null,'Não apontar para sessão da campanha anterior');
assert.equal(moved.adventure.exploration.areas.length,2,'Preservar conteúdo narrativo na troca de campanha');
assert.equal(moved.adventure.exploration.factions.length,1);
assert.equal(revealedAdventureProjection(sanitizeAdventure({campaignId:'c1'}),{}).exploration.areas.length,0);
const hiddenScene=sanitizeAdventure({id:'hidden-scene',campaignId:'c1',locationIds:['secret-room'],scenes:[{id:'scene-hidden',title:'Cena oculta',status:'active',locationId:'secret-room'}],activeSceneId:'scene-hidden'});
assert.equal(revealedAdventureProjection(hiddenScene,{locations:[{id:'secret-room',name:'LOCAL SECRETO'}]}).currentLocation,'','Local de cena não publicada deve permanecer oculto');
console.log('OK — exploração genérica, integridade de vínculos, migração, publicação explícita e retenção de crônica.');
