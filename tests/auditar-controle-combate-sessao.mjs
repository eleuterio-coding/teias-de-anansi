import assert from'node:assert/strict';
import fs from'node:fs';
import{
 createCombat,createCombatFromEncounter,addCombatant,addCombatants,startCombat,nextCombatTurn,addCondition,applyCombatDamage,finishCombat,sanitizeCombatSessionFields,reorderCombatant,reorderCombatantTo,sortCombatInitiative,initiativeOrder
}from'../scripts/combat-state.js';
import{sanitizeSession}from'../scripts/campaign-state.js';

const session={id:'s1',title:'Sessão de teste',encounters:[{id:'e1',title:'Emboscada',kind:'combat',status:'planned',sessionSceneId:'scene-1',combatants:[{id:'legacy-goblin',kind:'monster',name:'Goblin',ac:15,maxHp:7,currentHp:7,initiativeModifier:2}]}],scenes:[{id:'scene-1',title:'Corredor',status:'planned',order:1}]};
const from=createCombatFromEncounter(session,'e1');assert.equal(from.ok,true);assert.equal(from.combat.encounterId,'e1');assert.equal(from.combat.combatants.length,1);assert.notEqual(from.combat.combatants[0].id,'legacy-goblin','Combate deve clonar o blueprint, não reutilizar a instância do Encontro.');
addCombatant(from.combat,{kind:'character',characterId:'pc1',name:'Lyra',ac:16,maxHp:30,currentHp:30,initiative:18,reactionAvailable:false});
from.combat.combatants.find(c=>c.kind==='monster').initiative=12;
const started=startCombat(session,from.combat.id);assert.equal(started.ok,true);assert.equal(session.activeCombatId,from.combat.id);assert.equal(started.combat.status,'active');assert.equal(started.combat.activeCombatantId,started.combat.combatants.find(c=>c.name==='Lyra').id);
const lyra=started.combat.combatants.find(c=>c.name==='Lyra');assert.equal(lyra.reactionAvailable,true,'Reação restaura no início do turno.');
const goblinBeforeOrder=started.combat.combatants.find(c=>c.name==='Goblin');let reordered=reorderCombatantTo(started.combat,goblinBeforeOrder.id,lyra.id,'before');assert.equal(reordered.ok,true);assert.equal(started.combat.manualInitiativeOrder,true,'Arrastar deve ativar ordem manual.');assert.equal(initiativeOrder(started.combat)[0].name,'Goblin','Ordem manual deve aceitar monstro antes de iniciativa maior.');let manualTurn=nextCombatTurn(started.combat);assert.equal(manualTurn.combatant.name,'Lyra','Próximo turno deve respeitar ordem manual persistida.');reordered=reorderCombatant(started.combat,lyra.id,-1);assert.equal(reordered.ok,true);assert.equal(initiativeOrder(started.combat)[0].name,'Lyra','Botão subir deve ser alternativa ao drag and drop.');sortCombatInitiative(started.combat);assert.equal(started.combat.manualInitiativeOrder,false);assert.equal(initiativeOrder(started.combat)[0].name,'Lyra','Ordenar pela iniciativa deve restaurar a ordem numérica.');
addCondition(started.combat,lyra.id,{name:'Envenenado',duration:'rounds',remainingRounds:2});
let turn=nextCombatTurn(started.combat);assert.equal(turn.combatant.name,'Goblin');turn=nextCombatTurn(started.combat);assert.equal(turn.round,2);assert.equal(started.combat.combatants.find(c=>c.id===lyra.id).conditions[0].remainingRounds,1,'Condições por rodada devem decrementar ao fechar a rodada.');
const goblin=started.combat.combatants.find(c=>c.name==='Goblin');const damage=applyCombatDamage(started.combat,goblin.id,3,{automaticDefenses:false});assert.equal(damage.ok,true);assert.equal(goblin.currentHp,4);assert.equal(session.encounters[0].combatants[0].currentHp,7,'Dano do Combate não pode alterar o blueprint do Encontro.');
const finished=finishCombat(session,started.combat.id,{outcome:'Vitória'});assert.equal(finished.ok,true);assert.equal(finished.combat.status,'completed');assert.equal(session.activeCombatId,null);
const fields=sanitizeCombatSessionFields(session);assert.equal(fields.combats.length,1);assert.equal(fields.combats[0].outcome,'Vitória');
const clean=sanitizeSession(session);assert.equal(clean.combats.length,1,'sanitizeSession deve persistir combates.');assert.equal(clean.encounters.length,1,'Encontros devem continuar existindo separadamente.');

const quick={id:'s2',encounters:[],scenes:[]};const q=createCombat(quick,{title:'Combate rápido'}).combat;addCombatants(q,{kind:'monster',name:'Goblin',maxHp:7,currentHp:7,initiativeModifier:2},3,{groupInitiative:true});assert.equal(q.combatants.length,3);assert.ok(q.combatants.every(c=>c.groupInitiativeKey===q.combatants[0].groupInitiativeKey),'Grupo deve compartilhar chave de iniciativa.');

const ui=fs.readFileSync(new URL('../scripts/session-combat-ui.js',import.meta.url),'utf8');
const encounterUi=fs.readFileSync(new URL('../scripts/session-encounter-ui.js',import.meta.url),'utf8');
const sessionHtml=fs.readFileSync(new URL('../sessoes.html',import.meta.url),'utf8');
const combatCss=fs.readFileSync(new URL('../combat.css',import.meta.url),'utf8');
for(const token of['CONTROLE DE COMBATE','Criar combate rápido','Criar a partir do Encontro','Próximo turno','Concentração','Reação','Adicionar condição','Iniciativa em grupo','Finalizar combate','Histórico','Personagem','Inic.','Ordenar pela iniciativa','data-drag-handle','data-move-combatant'])assert.ok(ui.includes(token),'Controle de combate sem '+token);
assert.ok(encounterUi.includes('Participantes previstos'),'Encontro deve permanecer como preparação.');
assert.equal(encounterUi.includes('Próximo turno'),false,'Encontro não deve continuar executando turnos.');
assert.ok(sessionHtml.includes('combat.css'),'Sessões devem carregar o CSS de combate.');
assert.ok(sessionHtml.includes('session-combat-ui.js'),'Sessões devem carregar o módulo de combate.');
for(const token of['combat-initiative-table','combat-table-header','combat-drag-handle','drop-before','drop-after'])assert.ok(combatCss.includes(token),'Tabela de iniciativa sem estilo '+token);
console.log('OK — Sessão separa Encontro e Combate, preserva histórico e executa turnos/condições/PV.');
