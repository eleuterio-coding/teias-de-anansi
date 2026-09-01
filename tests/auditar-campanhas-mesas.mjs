import assert from'node:assert/strict';
import fs from'node:fs';
import{
 CAMPAIGN_KEY,createCampaign,updateCampaign,addCampaignMember,assignCharacterToMember,addCampaignSession,startCampaignSession,finishCampaignSession,campaignContextForCharacter,allCampaignSessions,writeCampaigns,readCampaigns,sanitizeCampaign
}from'../scripts/campaign-state.js';

class MemoryStorage{constructor(){this.map=new Map}getItem(key){return this.map.has(key)?this.map.get(key):null}setItem(key,value){this.map.set(key,String(value))}}
let list=[];
let created=createCampaign(list,{name:'Mesa Um',dmName:'Ana',setting:'Eberron'});assert.equal(created.ok,true);list=created.list;const first=created.campaign;
created=createCampaign(list,{name:'Mesa Dois',dmName:'Beto',setting:'Forgotten Realms'});list=created.list;const second=created.campaign;
assert.equal(list.length,2);
let memberOne=addCampaignMember(list,first.id,{name:'Lia',role:'player'});assert.equal(memberOne.ok,true);list=memberOne.list;const m1=memberOne.member;
let memberTwo=addCampaignMember(list,second.id,{name:'Lia',role:'player'});list=memberTwo.list;const m2=memberTwo.member;
let linked=assignCharacterToMember(list,first.id,m1.id,'pc-1');assert.equal(linked.ok,true);list=linked.list;assert.equal(campaignContextForCharacter(list,'pc-1').campaign.id,first.id);
linked=assignCharacterToMember(list,second.id,m2.id,'pc-1');assert.equal(linked.ok,true);assert.equal(linked.movedFrom.campaignId,first.id);list=linked.list;assert.equal(campaignContextForCharacter(list,'pc-1').campaign.id,second.id);assert.equal(list.find(c=>c.id===first.id).members.find(m=>m.id===m1.id).characterId,null,'Mover a ficha deve limpar o vínculo antigo.');

let updated=updateCampaign(list,second.id,{currentArc:'Arco 2',currentLocation:'Sharn',partyGoal:'Encontrar o artefato',sharedNotes:'Pista comum'});assert.equal(updated.ok,true);list=updated.list;
let session=addCampaignSession(list,second.id,{title:'A Chegada',date:'2026-09-05',location:'Sharn',participantCharacterIds:['pc-1']});assert.equal(session.ok,true);list=session.list;const s1=session.session;
session=addCampaignSession(list,second.id,{title:'A Torre',date:'2026-09-12'});list=session.list;const s2=session.session;
let started=startCampaignSession(list,second.id,s1.id);assert.equal(started.ok,true);list=started.list;let blocked=startCampaignSession(list,second.id,s2.id);assert.equal(blocked.ok,false,'A Mesa não pode ter duas sessões ativas.');
let ctx=campaignContextForCharacter(list,'pc-1');assert.equal(ctx.activeSession.id,s1.id);assert.equal(ctx.campaign.partyGoal,'Encontrar o artefato');
let finished=finishCampaignSession(list,second.id,s1.id,{summary:'Grupo chegou a Sharn.'});assert.equal(finished.ok,true);list=finished.list;assert.equal(finished.campaign.activeSessionId,null);started=startCampaignSession(list,second.id,s2.id);assert.equal(started.ok,true);list=started.list;assert.equal(campaignContextForCharacter(list,'pc-1').activeSession.id,s2.id);

const malformed=sanitizeCampaign({name:'Teste',sessions:[{id:'a',status:'active'},{id:'b',status:'active'}]});assert.equal(malformed.sessions.filter(s=>s.status==='active').length,1,'Sanitização deve preservar no máximo uma sessão ativa.');
const all=allCampaignSessions(list);assert.equal(all.length,2);assert.ok(all.some(s=>s.campaignName==='Mesa Dois'&&s.id===s2.id));
const storage=new MemoryStorage;writeCampaigns(list,storage);assert.ok(storage.getItem(CAMPAIGN_KEY));const roundtrip=readCampaigns(storage);assert.equal(roundtrip.length,2);assert.equal(campaignContextForCharacter(roundtrip,'pc-1').campaign.name,'Mesa Dois');
const payload=JSON.stringify(roundtrip);for(const forbidden of['currentHp','spellSlotsUsed','inventoryCampaign','progressionHistory'])assert.equal(payload.includes(forbidden),false,`Campanha não deve copiar estado mecânico da ficha: ${forbidden}`);

const campaignState=fs.readFileSync(new URL('../scripts/campaign-state.js',import.meta.url),'utf8');const listUi=fs.readFileSync(new URL('../scripts/campaign-list-ui.js',import.meta.url),'utf8');const tableUi=fs.readFileSync(new URL('../scripts/campaign-table-ui.js',import.meta.url),'utf8');const sessionsUi=fs.readFileSync(new URL('../scripts/campaign-sessions-ui.js',import.meta.url),'utf8');const sheetUi=fs.readFileSync(new URL('../scripts/character-sheet-campaign-ui.js',import.meta.url),'utf8');const gameplay=fs.readFileSync(new URL('../scripts/character-sheet-gameplay-ui.js',import.meta.url),'utf8');const characterList=fs.readFileSync(new URL('../lista-personagens.html',import.meta.url),'utf8');const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const file of['campanhas.html','mesa.html','sessoes.html'])assert.ok(fs.existsSync(new URL(`../${file}`,import.meta.url)),`Página ausente: ${file}`);
for(const token of['hub-rpg:campaigns:v1','assignCharacterToMember','startCampaignSession','campaignContextForCharacter'])assert.ok(campaignState.includes(token),`Estado de campanha sem ${token}`);
for(const token of['Elenco da Mesa','Contexto da Mesa','Planejar sessão','Notas do Mestre'])assert.ok(tableUi.includes(token),`Mesa sem ${token}`);
assert.ok(listUi.includes('Campanhas / Mesas')||fs.readFileSync(new URL('../campanhas.html',import.meta.url),'utf8').includes('Campanhas / Mesas'));
assert.ok(sessionsUi.includes('Abrir Mesa'),'Visão de sessões deve voltar à Mesa.');
assert.ok(sheetUi.includes('sheet-campaign-context')&&sheetUi.includes('Abrir Mesa'),'Ficha deve mostrar contexto da campanha.');
assert.ok(gameplay.includes("character-sheet-campaign-ui.js"),'Modo de Jogo deve carregar a integração de campanha.');
assert.ok(characterList.includes('character-list-campaign-ui.js')&&characterList.includes('Campanhas / Mesas'),'Lista de personagens deve integrar Mesas.');
assert.ok(index.includes('href="campanhas.html')&&index.includes('href="sessoes.html'),'Início deve ativar Campanhas e Sessões.');
assert.equal([campaignState,listUi,tableUi,sessionsUi,sheetUi].join('\n').toLowerCase().includes('supabase'),false);
console.log('OK — Campanhas/Mesas preservam vínculos, sessões, contexto e independência mecânica da Ficha Digital.');
