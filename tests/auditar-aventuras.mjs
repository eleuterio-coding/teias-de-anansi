import assert from'node:assert/strict';
import fs from'node:fs';
import{ADVENTURE_KEY,ADVENTURE_SCHEMA,sanitizeAdventure,readAdventures,writeAdventures,createAdventure,updateAdventure,reassignAdventureCampaign,removeAdventure,removeAdventuresForCampaign,adventuresForCampaign,addAdventureChapter,addAdventureScene,addAdventureLocation,addAdventureNpc,addAdventureClue,addAdventureHandout,addAdventureTreasure,addAdventureMission,addAdventureTimelineEntry,updateAdventureEntity,removeAdventureEntity,startAdventureScene,completeAdventureScene,skipAdventureScene,setAdventureClueStatus,setAdventureHandoutRevealed,setAdventureTreasureStatus,setAdventureMissionStatus,linkSceneToSession,linkSceneToEncounter,adventureContextForSession}from'../scripts/adventure-state.js';
import{sanitizeCampaign,addCampaignNpc,addCampaignLocation,removeCampaignLocation}from'../scripts/campaign-state.js';
import{reconcileAdventureCampaignRefs}from'../scripts/adventure-integrity.js';
import{revealedAdventureProjection}from'../scripts/collaboration-model.js';

class MemoryStorage{constructor(){this.map=new Map}getItem(key){return this.map.has(key)?this.map.get(key):null}setItem(key,value){this.map.set(key,String(value))}}

let list=[];let made=createAdventure(list,{campaignId:'cmp-1',title:'Sombras sobre Sharn',arc:'Arco 1',pitch:'Uma conspiração começa nos níveis inferiores.',participantUsernames:['bruno'],characterIds:['pc-1'],participantAccessConfigured:true});assert.equal(made.ok,true);list=made.list;const adventureId=made.adventure.id;assert.equal(made.adventure.schema,ADVENTURE_SCHEMA);assert.equal(adventuresForCampaign(list,'cmp-1').length,1);assert.equal(createAdventure(list,{title:'Sem campanha'}).ok,false,'Aventura precisa pertencer a uma Campanha.');assert.deepEqual(made.adventure.participantUsernames,['bruno']);assert.deepEqual(made.adventure.characterIds,['pc-1']);assert.equal(made.adventure.participantAccessConfigured,true);

let r=addAdventureChapter(list,adventureId,{title:'A pista inicial',arc:'Ato I'});list=r.list;const chapterId=r.entity.id;
r=addAdventureLocation(list,adventureId,{name:'Baixa Sharn',type:'Distrito'});list=r.list;const legacyLocationId=r.entity.id;
r=addAdventureNpc(list,adventureId,{name:'Mira ir’Talan',role:'Patrona'});list=r.list;const legacyNpcId=r.entity.id;
let campaign=sanitizeCampaign({id:'cmp-1',name:'Teste',members:[{id:'m1',username:'bruno',name:'Bruno',role:'player',characterId:'pc-1'}],sessions:[{id:'session-1',number:1,title:'Primeira',participantCharacterIds:['pc-1'],encounters:[{id:'enc-1',title:'Emboscada'}]}]});
let reconciled=reconcileAdventureCampaignRefs(list,campaign);assert.equal(reconciled.changed,true,'Entidades legadas devem migrar para a Campanha.');list=reconciled.list;campaign=reconciled.campaign;assert.ok(campaign.npcs.some(n=>n.id===legacyNpcId));assert.ok(campaign.locations.some(l=>l.id===legacyLocationId));let migrated=list.find(x=>x.id===adventureId);assert.equal(migrated.legacyNpcs.length,0);assert.equal(migrated.legacyLocations.length,0);assert.ok(migrated.npcIds.includes(legacyNpcId));assert.ok(migrated.locationIds.includes(legacyLocationId));

let campResult=addCampaignNpc([campaign],'cmp-1',{name:'Capitão Voss',role:'Antagonista'});campaign=campResult.campaign;const npcId=campResult.entity.id;campResult=addCampaignLocation([campaign],'cmp-1',{name:'Forja Antiga',type:'Ruína'});campaign=campResult.campaign;const locationId=campResult.entity.id;
r=updateAdventure(list,adventureId,{npcIds:[...migrated.npcIds,npcId],locationIds:[...migrated.locationIds,locationId]});list=r.list;
r=addAdventureClue(list,adventureId,{title:'Selo quebrado',text:'Um selo arcano foi removido.',locationId,npcId});list=r.list;const clueId=r.entity.id;
r=addAdventureHandout(list,adventureId,{title:'Carta cifrada',content:'Mensagem entregue ao grupo.'});list=r.list;const materialId=r.entity.id;
r=addAdventureTreasure(list,adventureId,{name:'Espada +1',type:'magic-item',libraryItemId:'magic-test',locationId,recipientCharacterId:'pc-1'});list=r.list;const treasureId=r.entity.id;
r=addAdventureMission(list,adventureId,{title:'Encontrar a forja',kind:'main',characterIds:['pc-1']});list=r.list;const missionId=r.entity.id;
r=addAdventureScene(list,adventureId,{title:'O beco',chapterId,locationId,npcIds:[npcId],clueIds:[clueId],handoutIds:[materialId],treasureIds:[treasureId],missionIds:[missionId],objective:'Encontrar o contato'});assert.equal(r.ok,true);list=r.list;const sceneId=r.entity.id;let scene=r.adventure.scenes.find(x=>x.id===sceneId);assert.equal(scene.chapterId,chapterId);assert.deepEqual(scene.npcIds,[npcId]);assert.deepEqual(scene.missionIds,[missionId]);

r=linkSceneToSession(list,adventureId,sceneId,'session-1');list=r.list;r=linkSceneToEncounter(list,adventureId,sceneId,{sessionId:'session-1',encounterId:'enc-1'});list=r.list;scene=r.adventure.scenes.find(x=>x.id===sceneId);assert.equal(scene.sessionId,'session-1');assert.equal(scene.encounterRef.encounterId,'enc-1');let ctx=adventureContextForSession(list,'cmp-1','session-1');assert.equal(ctx.length,1);assert.equal(ctx[0].scene.id,sceneId);

reconciled=reconcileAdventureCampaignRefs(list,campaign);assert.equal(reconciled.list.find(x=>x.id===adventureId).scenes.find(x=>x.id===sceneId).encounterRef.encounterId,'enc-1');reconciled=reconcileAdventureCampaignRefs(list,{...campaign,sessions:[{...campaign.sessions[0],encounters:[]}]});scene=reconciled.list.find(x=>x.id===adventureId).scenes.find(x=>x.id===sceneId);assert.equal(scene.sessionId,'session-1');assert.equal(scene.encounterRef.encounterId,null);
reconciled=reconcileAdventureCampaignRefs(list,{...campaign,sessions:[]});scene=reconciled.list.find(x=>x.id===adventureId).scenes.find(x=>x.id===sceneId);assert.equal(scene.sessionId,null);assert.equal(scene.encounterRef.sessionId,null);

r=startAdventureScene(list,adventureId,sceneId);assert.equal(r.ok,true);list=r.list;assert.equal(r.adventure.status,'active');assert.equal(r.adventure.activeSceneId,sceneId);assert.ok(r.adventure.timelineEvents.some(e=>e.title.includes('Cena iniciada')));r=completeAdventureScene(list,adventureId,sceneId,{outcome:'O contato foi encontrado.'});list=r.list;assert.equal(r.adventure.activeSceneId,null);assert.ok(r.adventure.timelineEvents.some(e=>e.title.includes('Cena concluída')));
r=addAdventureScene(list,adventureId,{title:'Segunda cena'});list=r.list;const scene2=r.entity.id;r=startAdventureScene(list,adventureId,scene2);list=r.list;r=skipAdventureScene(list,adventureId,scene2);list=r.list;assert.equal(r.adventure.activeSceneId,null);

r=setAdventureClueStatus(list,adventureId,clueId,'discovered');list=r.list;assert.equal(r.entity.status,'discovered');r=setAdventureHandoutRevealed(list,adventureId,materialId,true);list=r.list;assert.equal(r.entity.revealed,true);r=setAdventureTreasureStatus(list,adventureId,treasureId,'found');list=r.list;assert.equal(r.entity.status,'found');r=setAdventureMissionStatus(list,adventureId,missionId,'completed');list=r.list;assert.equal(r.entity.status,'completed');r=addAdventureTimelineEntry(list,adventureId,{title:'Registro manual',text:'Teste'});list=r.list;assert.equal(r.entity.automatic,false);

const malformed=sanitizeAdventure({campaignId:'cmp-1',characterIds:['pc-1'],npcIds:['n1'],locationIds:['l1'],chapters:[{id:'c1',title:'Um'}],missions:[{id:'m1',title:'M',characterIds:['pc-1','pc-x']}],clues:[{id:'q1',title:'Q',npcId:'n-x',locationId:'l-x',discoveredByCharacterId:'pc-x'}],treasures:[{id:'t1',name:'T',recipientCharacterId:'pc-x'}],scenes:[{id:'s1',title:'Cena 1',status:'active',chapterId:'c1',npcIds:['n1','n-x'],locationId:'l1'},{id:'s2',title:'Cena 2',status:'active',chapterId:'inexistente'}],activeSceneId:'s1'});assert.equal(malformed.scenes.filter(x=>x.status==='active').length,1);assert.equal(malformed.scenes.find(x=>x.id==='s2').chapterId,null);assert.deepEqual(malformed.missions[0].characterIds,['pc-1']);assert.equal(malformed.clues[0].npcId,null);assert.equal(malformed.clues[0].locationId,null);assert.equal(malformed.treasures[0].recipientCharacterId,null);

const safe=revealedAdventureProjection(list.find(x=>x.id===adventureId),campaign);assert.equal(safe.materials.length,1);assert.equal(safe.clues.length,1);assert.equal(safe.missions.some(m=>m.id===missionId),false,'Objetivos sem revelação explícita não devem aparecer ao jogador.');const publiclyVisible=updateAdventureEntity(list,adventureId,'missions',missionId,{visibleToPlayers:true});assert.equal(publiclyVisible.ok,true);const withMission=revealedAdventureProjection(publiclyVisible.list.find(x=>x.id===adventureId),campaign);assert.equal(withMission.missions.some(m=>m.id===missionId),true);assert.equal('dmNotes'in safe,false);assert.equal(safe.npcs.some(n=>n.id===npcId),false,'NPC sem revelação explícita não deve aparecer em aventura do jogador.');const publicCampaign={...campaign,importantNpcIds:[npcId],importantNpcVisibility:{[npcId]:true},importantNpcPublicNames:{[npcId]:'Capitão conhecido'}};const publicAdventureResult=updateAdventure(list,adventureId,{npcVisibility:{[npcId]:true}});assert.equal(publicAdventureResult.ok,true);const publicSafe=revealedAdventureProjection(publicAdventureResult.adventure,publicCampaign);assert.equal(publicSafe.npcs.some(n=>n.id===npcId&&n.name==='Capitão conhecido'),true);assert.equal(safe.npcs.some(n=>'notes'in n),false);

let c2=sanitizeCampaign({id:'cmp-x',locations:[{id:'loc-x',name:'X'}],npcs:[{id:'npc-x',name:'N',currentLocationId:'loc-x'}]});let removedLocation=removeCampaignLocation([c2],'cmp-x','loc-x');assert.equal(removedLocation.ok,true);assert.equal(removedLocation.campaign.npcs[0].currentLocationId,null,'Excluir Local deve limpar localização atual dos NPCs.');

const storage=new MemoryStorage;writeAdventures(list,storage);assert.ok(storage.getItem(ADVENTURE_KEY));const roundtrip=readAdventures(storage);assert.equal(roundtrip.length,1);assert.equal(roundtrip[0].campaignId,'cmp-1');assert.equal(roundtrip[0].participantAccessConfigured,true);assert.ok(roundtrip[0].missions.length);assert.ok(roundtrip[0].timelineEvents.length);
const payload=JSON.stringify(roundtrip);for(const forbidden of['currentHp','spellSlotsUsed','inventoryCampaign','progressionHistory','initiativeOrder'])assert.equal(payload.includes(forbidden),false,`Aventura não deve copiar estado mecânico: ${forbidden}`);
let other=createAdventure(list,{campaignId:'cmp-2',title:'Outra Campanha'});const cleaned=removeAdventuresForCampaign(other.list,'cmp-1');assert.equal(cleaned.some(x=>x.campaignId==='cmp-1'),false);assert.equal(cleaned.some(x=>x.campaignId==='cmp-2'),true);assert.equal(removeAdventure(updateAdventure(list,adventureId,{summary:'Resumo consolidado.'}).list,adventureId).ok,true);

// Reatribuir uma Aventura troca somente seu vínculo — nunca duplica o registro.
const oldCampaignWithLinks=sanitizeCampaign({...campaign,sessions:campaign.sessions.map(s=>({...s,adventureId,scenes:[{id:'ssc-1',title:'Cena vinculada',adventureSceneId:sceneId},{id:'ssc-2',title:'Outra cena'}]}))});
const destination=sanitizeCampaign({id:'cmp-2',name:'Novo destino',members:[{id:'m2',username:'maria',role:'player',characterId:'pc-2'}],npcs:[{id:'npc-dest',name:'NPC destino'}]});
const snapshot=JSON.stringify(list),before=list.find(a=>a.id===adventureId);
const moved=reassignAdventureCampaign(list,[oldCampaignWithLinks,destination],adventureId,'cmp-2');
assert.equal(moved.ok,true);
assert.equal(moved.list.length,list.length,'A transferência não cria uma segunda Aventura.');
assert.equal(moved.list.filter(a=>a.id===adventureId).length,1,'O ID original deve continuar único.');
assert.equal(moved.adventure.id,adventureId);
assert.equal(moved.adventure.createdAt,before.createdAt);
assert.equal(moved.adventure.campaignId,'cmp-2');
assert.equal(adventuresForCampaign(moved.list,'cmp-1').length,0);
assert.equal(adventuresForCampaign(moved.list,'cmp-2').length,1);
assert.equal(moved.adventure.title,before.title);
for(const key of['chapters','scenes','missions','clues','handouts','treasures','timelineEvents'])
 assert.deepEqual(moved.adventure[key].map(x=>x.id),before[key].map(x=>x.id),`Conteúdo de ${key} deve ser preservado.`);
assert.deepEqual(moved.adventure.characterIds,[],'Personagens da campanha antiga não são copiados.');
assert.deepEqual(moved.adventure.participantUsernames,[],'Acesso dos jogadores antigos não migra automaticamente.');
assert.deepEqual(moved.adventure.npcIds,[],'NPCs de outra campanha não migram automaticamente.');
assert.deepEqual(moved.adventure.locationIds,[],'Locais de outra campanha não migram automaticamente.');
assert.equal(moved.adventure.scenes.find(s=>s.id===sceneId).sessionId,null);
assert.equal(moved.adventure.scenes.find(s=>s.id===sceneId).encounterRef.encounterId,null);
assert.equal(moved.campaigns[0].sessions[0].id,'session-1','Sessão original fica na campanha anterior.');
assert.equal(moved.campaigns[0].sessions[0].adventureId,null);
assert.equal(moved.campaigns[0].sessions[0].scenes[0].adventureSceneId,null);
assert.equal(moved.campaigns[0].sessions[0].scenes[1].id,'ssc-2');
assert.equal(JSON.stringify(moved.campaigns[1]),JSON.stringify(destination),'Campanha de destino não é sobrescrita.');
assert.equal(JSON.stringify(list),snapshot,'A operação não pode mutar os argumentos.');
assert.equal(reassignAdventureCampaign(moved.list,moved.campaigns,adventureId,'cmp-2').changed,false);
assert.equal(reassignAdventureCampaign(list,[oldCampaignWithLinks,destination],adventureId,'missing').ok,false);
assert.equal(reassignAdventureCampaign(list,[oldCampaignWithLinks,destination],'inexistente','cmp-2').ok,false);
assert.equal(updateAdventure(moved.list,adventureId,{summary:'Após a transferência'}).list.length,list.length);

const state=fs.readFileSync(new URL('../scripts/adventure-state.js',import.meta.url),'utf8'),integrity=fs.readFileSync(new URL('../scripts/adventure-integrity.js',import.meta.url),'utf8'),integrityUi=fs.readFileSync(new URL('../scripts/adventure-integrity-ui.js',import.meta.url),'utf8'),ui=fs.readFileSync(new URL('../scripts/adventure-ui.js',import.meta.url),'utf8'),router=fs.readFileSync(new URL('../scripts/adventure-router.js',import.meta.url),'utf8'),provider=fs.readFileSync(new URL('../scripts/firebase-collaboration-provider.js',import.meta.url),'utf8'),collab=fs.readFileSync(new URL('../scripts/collaboration-model.js',import.meta.url),'utf8'),campaignState=fs.readFileSync(new URL('../scripts/campaign-state.js',import.meta.url),'utf8'),page=fs.readFileSync(new URL('../aventuras.html',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../adventures.css',import.meta.url),'utf8'),mesaBridge=fs.readFileSync(new URL('../scripts/campaign-table-adventure-ui.js',import.meta.url),'utf8');
for(const token of['missions','timelineEvents','participantUsernames','characterIds','participantAccessConfigured','linkSceneToEncounter','adventureContextForSession'])assert.ok(state.includes(token),`Estado de Aventuras sem ${token}`);
for(const token of['Visão geral','Participantes','Áreas e Salas','Mapas e Níveis','Adicionar área','Adicionar mapa','Objetivos','Cenas','NPCs','Facções','Sessões da Aventura','Linha do tempo','Entregar ao personagem','Item da Biblioteca'])assert.ok(ui.includes(token),`Workspace sem ${token}`);
assert.ok(!ui.includes('${monstersHtml(a)}'),'O card Monstros não deve ser renderizado no detalhamento da Aventura.');
assert.ok(ui.includes('deriveAdventureTimelineEvents'),'A Linha do Tempo deve derivar Cenas automaticamente.');
assert.equal(ui.includes('>Handouts<'),false,'A interface não deve exibir Handouts como rótulo.');
assert.ok(ui.includes('itens-magicos.html?ref='),'Tesouros devem abrir referência da Biblioteca.');
assert.ok(campaignState.includes('addCampaignNpc')&&campaignState.includes('addCampaignLocation'),'NPCs e Locais devem existir como catálogos reutilizáveis da Campanha.');
assert.ok(integrity.includes('migrateLegacyAdventureEntities')&&integrityUi.includes('writeCampaigns'),'A migração deve preservar NPCs e Locais antigos e persistir a Campanha.');
assert.ok(provider.includes('participantAccessConfigured')&&provider.includes('adventureIds'),'Participantes selecionados devem controlar acesso remoto à Aventura.');
assert.ok(collab.includes('materials:')&&collab.includes('visibleMissions'),'A projeção do jogador deve compartilhar apenas conteúdo permitido.');
assert.ok(router.includes('Materiais para os Jogadores')&&router.includes('Missões / Objetivos'),'Jogador deve receber a nova estrutura em modo somente leitura.');
assert.ok(ui.includes('id="adventure-assignment"')&&ui.includes('reassignSelectedAdventure'),'A edição precisa permitir mudar a Campanha sem criar outra Aventura.');
assert.ok(ui.includes('adventureCreateTile')&&ui.includes('id="create-adventure"')&&ui.includes('Campanha da aventura'),'Criação deve usar tile próprio e campo explícito, sem criar outra aventura ao navegar.');
assert.equal(ui.includes('Adicionar sessão'),false,'Aventura não deve criar Sessões.');
assert.ok(page.includes('adventure-router.js')&&page.includes('adventures.css'));assert.ok(css.includes('adventure-operational')&&css.includes('@media'));assert.ok(mesaBridge.includes('adventureContextForSession'));
console.log('OK — Aventuras v2: workspace narrativo, acesso por participantes, catálogos reutilizáveis, materiais em PT-BR e compatibilidade legada.');