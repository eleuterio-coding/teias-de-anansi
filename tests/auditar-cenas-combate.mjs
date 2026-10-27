import assert from 'node:assert/strict';
import{sanitizeAdventure,SCENE_TYPE_LABELS}from'../scripts/adventure-state.js';
import{combatSceneOptions,ensureSceneEncounter,isCombatScene,resolveCombatScene}from'../scripts/adventure-combat-scenes.js';

assert.equal(Object.keys(SCENE_TYPE_LABELS).length,9);
const adventure=sanitizeAdventure({
 id:'adv',campaignId:'cmp',npcIds:['npc-1'],
 monsters:[{id:'monster-1',name:'Ogro',monsterId:'ogre',maxHp:59,ac:11}],
 scenes:[
  {id:'battle',title:'Emboscada',sceneType:'combat',npcIds:['npc-1'],monsterIds:['monster-1']},
  {id:'talk',title:'Conversa',sceneType:'dialogue'},
  {id:'old',title:'Cena antiga'}
 ]
});
const old=adventure.scenes.find(s=>s.id==='old');
assert.equal(old.sceneType,'other','Cenas anteriores não devem ser classificadas como combate automaticamente.');
assert.equal(isCombatScene(adventure.scenes[0]),true);
const session={id:'session-1',adventureId:'adv',scenes:[],encounters:[]};
const ctx={session,adventure,campaign:{npcs:[{id:'npc-1',name:'Bandido'}]}};
const opts=combatSceneOptions(session,adventure);
assert.match(opts,/adventure:battle/);
assert.doesNotMatch(opts,/adventure:talk/);
assert.doesNotMatch(opts,/adventure:old/);
assert.equal(resolveCombatScene(ctx,'adventure:talk').ok,false);
const result=ensureSceneEncounter(ctx,'adventure:battle');
assert.equal(result.ok,true);
assert.equal(result.created,true);
assert.equal(result.encounter.kind,'combat');
assert.equal(session.scenes.length,1);
assert.equal(session.scenes[0].adventureSceneId,'battle');
assert.equal(session.encounters.length,1);
assert.deepEqual(result.encounter.combatants.map(c=>c.name),['Bandido','Ogro']);
const repeat=ensureSceneEncounter(ctx,'adventure:battle');
assert.equal(repeat.created,false);
assert.equal(repeat.encounter.id,result.encounter.id);
assert.equal(session.scenes.length,1);
assert.equal(session.encounters.length,1);
assert.equal(ensureSceneEncounter(ctx,'adventure:talk').ok,false);
const elsewhere={...adventure,scenes:adventure.scenes.map(s=>s.id==='battle'?{...s,sessionId:'another-session'}:s)};
assert.equal(resolveCombatScene({...ctx,adventure:elsewhere},'adventure:battle').ok,false);
console.log('OK — Tipos de cena, seleção de combate, herança de participantes e deduplicação.');
