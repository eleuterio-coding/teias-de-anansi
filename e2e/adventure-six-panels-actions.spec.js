import{test,expect}from'@playwright/test';

const campaign={id:'qa-six-panels',name:'Reinos de Prata',status:'active',members:[],sessions:[],npcs:[],locations:[]};
const adventure={id:'qa-six-adventure',campaignId:campaign.id,title:'As Rainhas',status:'active',
 participantUsernames:[],characterIds:[],chapters:[],scenes:[],missions:[],monsters:[],npcIds:[],locationIds:[]};
const getAdventure=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1')||'[]').find(a=>a.id==='qa-six-adventure'));
const getCampaign=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]').find(c=>c.id==='qa-six-panels'));

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.addInitScript(({campaign,adventure})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'qa-master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([adventure]));
  localStorage.setItem('hub-rpg:characters:v4','[]');
 },{campaign,adventure});
});

test('cards restantes registram ações sem depender de Capítulos, Locais ou Tesouros',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/aventuras.html?campaign=qa-six-panels&id=qa-six-adventure');
 await expect(page.locator('#adventure-assignment')).toHaveValue('qa-six-panels');
 for(const id of ['#capitulos','#locais','#tesouros'])await expect(page.locator('.hub-detail-grid > '+id)).toHaveCount(0);
 await expect(page.locator('.section-nav a[href="#monstros"]')).toHaveText('Monstros');
 await expect(page.locator('#monstros #adventure-monster-search')).toHaveCount(1);
 await expect(page.locator('#criar-area,#criar-mapa')).toHaveCount(2);

 await page.locator('#ex-new-level input[name="name"]').fill('Palácio');
 await page.locator('#ex-new-level button[type="submit"]').click();
 await expect.poll(async()=> (await getAdventure(page)).exploration.levels.length).toBe(1);
 await page.locator('#ex-new-area input[name="code"]').fill('Salão do Conselho');
 await page.locator('#ex-new-area select[name="levelId"]').selectOption((await getAdventure(page)).exploration.levels[0].id);
 await page.locator('#ex-new-area button[type="submit"]').click();
 await expect.poll(async()=> (await getAdventure(page)).exploration.areas.length).toBe(1);

 await page.locator('#new-mission-title').fill('Proteger o palácio');
 await page.locator('#add-mission').click();
 await expect.poll(async()=> (await getAdventure(page)).missions.length).toBe(1);

 await page.locator('#new-npc-name').fill('Guardiã da Corte');
 await page.locator('#add-campaign-npc').click();
 await expect.poll(async()=> (await getCampaign(page)).npcs.length).toBe(1);
 await expect.poll(async()=> (await getAdventure(page)).npcIds.length).toBe(1);

 await expect(page.locator('#add-adventure-monster')).toHaveCount(1);

 await page.locator('#new-scene-title').fill('Conselho Real');
 await page.locator('#new-scene-location').selectOption((await getAdventure(page)).exploration.areas[0].id);
 await page.locator('#add-scene').click();
 await expect(page.locator('#cenas [data-scene-row]')).toHaveCount(1);
 await expect(page.locator('#cenas [data-scene-row] [data-scene-field="areaId"]')).toHaveCount(1);
 await expect.poll(async()=> (await getAdventure(page)).scenes.length).toBe(1);
 expect((await getAdventure(page)).scenes[0].title).toBe('Conselho Real');
 expect((await getAdventure(page)).scenes[0].areaId).toBe((await getAdventure(page)).exploration.areas[0].id);
 await expect(page.locator('#new-scene-monster,#new-scene-chapter,#new-scene-area')).toHaveCount(0);
 await expect(page.locator('#cenas [data-scene-field="chapterId"],#cenas [data-scene-field="locationId"],#cenas [data-scene-link="monsterIds"]')).toHaveCount(0);
 await expect(page.locator('#linha-tempo .adventure-timeline-scene')).toHaveCount(1);
 await expect(page.locator('#linha-tempo .adventure-timeline-scene')).toContainText('Conselho Real');

 await expect(page.locator('#exploracao .explore-area-card')).toHaveCount(1);
 await expect(page.locator('#mapas .explore-level-card')).toHaveCount(1);
 await expect(page.locator('#missoes .story-card')).toHaveCount(1);
 await expect(page.locator('#npcs .story-card')).toHaveCount(1);
 await expect(page.locator('#cenas .story-card')).toHaveCount(1);
 await expect(page.locator('#exploracao > .explore-title h2')).toHaveText('Locais');
 await expect(page.locator('#mapas > .explore-title h2')).toHaveText('Mapas');
 await expect(page.locator('#cenas [data-adventure-visible="scenes"]')).toHaveCount(1);
 await expect(page.locator('#npcs [data-adventure-visible],#missoes [data-adventure-visible],#faccoes [data-ex-publish],#monstros [data-adventure-visible]')).toHaveCount(0);
 await expect(page.locator('#cenas [data-scene-field="areaId"]')).toHaveCount(1);
 await page.locator('#cenas [data-adventure-visible="scenes"]').check();
 await expect.poll(async()=> (await getAdventure(page)).scenes[0].visibleToPlayers).toBe(true);
 expect(errors.filter(message=>/ReferenceError|bindAdventureNotes/.test(message))).toEqual([]);
});

test('cena existente permite editar, iniciar, concluir e preservar o conteúdo',async({page})=>{
 await page.goto('/aventuras.html?campaign=qa-six-panels&id=qa-six-adventure');
 await page.locator('#new-scene-title').fill('Primeiro encontro');
 await page.locator('#add-scene').click();
 const item=page.locator('#cenas [data-scene-row]').first();
 await item.locator('[data-scene-editor] summary').click();
 await expect(item.locator('[data-scene-field="title"]')).toBeVisible();
 await item.locator('[data-scene-field="title"]').fill('Encontro das Rainhas');
 await item.locator('[data-scene-field="title"]').press('Tab');
 await expect.poll(async()=> (await getAdventure(page)).scenes[0].title).toBe('Encontro das Rainhas');
 await expect(page.locator('#cenas [data-scene-editor]')).toHaveAttribute('open','');
 await page.locator('#cenas [data-start-scene]').first().click();
 await expect.poll(async()=> (await getAdventure(page)).scenes[0].status).toBe('active');
 await page.locator('#cenas [data-complete-scene]').first().click();
 await expect.poll(async()=> (await getAdventure(page)).scenes[0].status).toBe('completed');
 await expect(page.locator('#linha-tempo .adventure-timeline-scene')).toHaveCount(1);
 await expect(page.locator('#linha-tempo .adventure-timeline-scene')).toContainText('Concluída');
 await expect(page.locator('#linha-tempo .adventure-timeline-scene')).toContainText('Encontro das Rainhas');
 await page.locator('#new-timeline-title').fill('Registo manual');
 await page.locator('#new-timeline-text').fill('Os heróis encontraram a trilha.');
 await page.locator('#add-timeline').click();
 await expect(page.locator('#linha-tempo .timeline-row')).toHaveCount(2);
 await expect(page.locator('#linha-tempo .adventure-timeline-scene')).toHaveCount(1);
 await expect(page.locator('#linha-tempo .adventure-timeline-list')).toContainText('Registo manual');
 await expect(page.locator('#linha-tempo [data-adventure-visible="timelineEvents"]')).toHaveCount(1);
 await page.locator('#linha-tempo [data-adventure-visible="timelineEvents"]').check();
 await expect.poll(async()=> (await getAdventure(page)).timelineEvents.some(event=>event.title==='Registo manual'&&event.visibleToPlayers===true)).toBe(true);
 await expect(page.locator('#linha-tempo .adventure-timeline-scene [data-adventure-visible]')).toHaveCount(0);
 await page.locator('#linha-tempo [data-timeline-view="flowchart"]').click();
 await expect(page.locator('#linha-tempo .hub-diagram-sequence-step')).toHaveCount(2);
 await expect(page.locator('#linha-tempo .hub-diagram-kind').first()).toContainText(/Cena|Evento/);
 await page.locator('#linha-tempo [data-timeline-view="list"]').click();
 await expect(page.locator('#linha-tempo .adventure-timeline-scene')).toHaveCount(1);
});

test('Notas do Mestre não bloqueiam as demais ações e são persistidas',async({page})=>{
 await page.goto('/aventuras.html?campaign=qa-six-panels&id=qa-six-adventure');
 await page.locator('#notas-mestre [data-new-master-note]').fill('Pista exclusiva do mestre');
 await page.locator('#notas-mestre [data-note-add]').click();
 await expect.poll(async()=> (await getAdventure(page)).dmNoteEntries.length).toBe(1);
 expect((await getAdventure(page)).dmNoteEntries[0].text).toBe('Pista exclusiva do mestre');
 await page.locator('#ex-new-area input[name="code"]').fill('Área após nota');
 await page.locator('#ex-new-area button[type="submit"]').click();
 await expect.poll(async()=> (await getAdventure(page)).exploration.areas.length).toBe(1);
 expect((await getAdventure(page)).dmNoteEntries).toHaveLength(1);
});
