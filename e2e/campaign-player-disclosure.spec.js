import{test,expect}from'@playwright/test';
const cid='campaign-disclosure-ui';
const base={
 id:cid,name:'Reinos de Prata',status:'active',description:'História compartilhada',
 importantNpcIds:['npc-public','npc-hidden'],importantNpcPublicNames:{'npc-public':'NPC Revelado','npc-hidden':'NPC Oculto'},importantNpcVisibility:{'npc-public':true,'npc-hidden':false},
 importantLocations:'Portal Antigo\nLugar Secreto',
 importantLocationEntries:[{id:'location-public',name:'Portal Antigo',image:null,visibleToPlayers:true},{id:'location-hidden',name:'Lugar Secreto',image:null,visibleToPlayers:false}],
 timelineNodes:[{id:'event-public',text:'Chegada à cidade',visibleToPlayers:true,children:[]},{id:'event-hidden',text:'Conspiração escondida',visibleToPlayers:false,children:[]}],
 members:[{id:'m1',username:'fernanda',name:'Fernanda',role:'player',characterId:'char-f',active:true},{id:'m2',username:'gustavo',name:'Gustavo',role:'player',characterId:'char-g',active:true}],
 sessions:[{id:'session-1',number:1,title:'O chamado',status:'planned',coverImageUrl:'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22200%22%20height=%22120%22/%3E'}]
};
const characterRows=[{id:'char-f',name:'Aluria',refSnapshots:{class:{name:'Patrulheiro'}},choices:{class:{level:4}}},{id:'char-g',name:'Dongron',refSnapshots:{class:{name:'Patrulheiro'}},choices:{class:{level:3}}}];
const playerCampaign={
 ...base,importantNpcEntries:[{id:'npc-public',name:'NPC Revelado'}],
 importantNpcs:'',importantLocations:'Portal Antigo',
 importantLocationEntries:[{id:'location-public',name:'Portal Antigo',image:null}],
 timeline:'Chegada à cidade',timelineNodes:[{id:'event-public',text:'Chegada à cidade',children:[]}]
};
const membership={id:'membership-f',campaignId:cid,uid:'f-id',username:'fernanda',role:'player',characterId:'char-f',active:true,sessionIds:['session-1'],adventureIds:['adventure-1']};
const adventure={id:'adventure-1',campaignId:cid,title:'As Rainhas',coverImageUrl:'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22200%22%20height=%22120%22/%3E'};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
});
test('Mestre define a visibilidade individual de NPCs, locais e eventos',async({page})=>{
 await page.addInitScript(({base,characterRows})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master',username:'rafael',isMaster:true,memberships:[]}));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([base]));
  localStorage.setItem('hub-rpg:npcs:v1',JSON.stringify([{id:'npc-public',name:'NPC Revelado'},{id:'npc-hidden',name:'NPC Oculto'}]));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(characterRows));
 },{base,characterRows});
 await page.goto('/mesa.html?id='+cid);
 await expect(page.locator('#npcs [data-visible-npc]')).toHaveCount(2);
 await expect(page.locator('#locais [data-visible-location]')).toHaveCount(2);
 await expect(page.locator('#linha-tempo [data-visible-event]')).toHaveCount(2);
 await expect(page.locator('[data-visible-npc="npc-public"]')).toBeChecked();
 await expect(page.locator('[data-visible-location="location-hidden"]')).not.toBeChecked();
 await page.locator('[data-visible-npc="npc-hidden"]').check();
 await page.locator('[data-visible-location="location-hidden"]').check();
 await page.locator('[data-visible-event="event-hidden"]').check();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]')[0]);
 expect(saved.importantNpcVisibility['npc-hidden']).toBe(true);
 expect(saved.importantLocationEntries.find(row=>row.id==='location-hidden').visibleToPlayers).toBe(true);
 expect(saved.timelineNodes.find(row=>row.id==='event-hidden').visibleToPlayers).toBe(true);
 await page.reload();
 await expect(page.locator('[data-visible-npc="npc-hidden"]')).toBeChecked();
 await expect(page.locator('[data-visible-location="location-hidden"]')).toBeChecked();
 await expect(page.locator('[data-visible-event="event-hidden"]')).toBeChecked();
});
test('Jogador vê cards com links de ficha, capas e registros públicos sem edição',async({page})=>{
 await page.addInitScript(({membership,playerCampaign,characterRows,adventure})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'f-id',username:'fernanda',isMaster:false,memberships:[membership]}));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify({schema:'hub-rpg/collaboration-cache/v1',campaigns:{[membership.campaignId]:{membership,payload:{campaign:playerCampaign,revealedAdventures:[adventure]},characters:characterRows,characterIds:characterRows.map(c=>c.id)}}}));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(characterRows));
 },{membership,playerCampaign,characterRows,adventure});
 await page.goto('/mesa.html?id='+cid);
 await expect(page.getByRole('heading',{name:'Jogadores participantes'})).toBeVisible();
 const roster=page.locator('#jogadores .campaign-player-roster-row');
 await expect(roster).toHaveCount(2);
 await expect(roster.last()).toContainText('Dongron');
 await expect(roster.last().locator('.campaign-player-character-link')).toHaveAttribute('href','ficha-personagem.html?id=char-g');
 await expect(page.locator('#jogadores select,#jogadores input,#jogadores button')).toHaveCount(0);
 await expect(page.locator('#aventuras .campaign-player-story-card')).toHaveCount(1);
 await expect(page.locator('#sessoes .campaign-player-story-card')).toHaveCount(1);
 await expect(page.locator('#aventuras .campaign-player-story-image')).toHaveCount(1);
 await expect(page.locator('#sessoes .campaign-player-story-image')).toHaveCount(1);
 await expect(page.locator('#aventuras .badge,#sessoes .badge')).toHaveCount(0);
 await expect(page.locator('#npcs .campaign-player-important-card')).toHaveCount(1);
 await expect(page.locator('#locais .campaign-player-important-card')).toHaveCount(1);
 await expect(page.locator('#linha-tempo .campaign-player-event-item')).toHaveCount(1);
 await expect(page.locator('#npcs')).toContainText('NPC Revelado');
 await expect(page.locator('#locais')).toContainText('Portal Antigo');
 await expect(page.locator('#linha-tempo')).toContainText('Chegada à cidade');
 for(const hidden of ['NPC Oculto','Lugar Secreto','Conspiração escondida']){
  await expect(page.locator('#table-root')).not.toContainText(hidden);
 }
 await expect(page.locator('#npcs input,#locais input,#linha-tempo input,#npcs [data-del-npc],#locais [data-del-line]')).toHaveCount(0);
});
