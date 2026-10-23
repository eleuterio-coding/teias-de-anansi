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

test('os seis cards registram ações e salvam os vínculos sem interromper a inicialização',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/aventuras.html?campaign=qa-six-panels&id=qa-six-adventure');
 await expect(page.locator('#adventure-assignment')).toHaveValue('qa-six-panels');
 await expect(page.locator('#add-chapter')).toBeVisible();

 await page.locator('#new-chapter-title').fill('A chegada');
 await page.locator('#add-chapter').click();
 await expect.poll(async()=> (await getAdventure(page)).chapters.length).toBe(1);

 await page.locator('#new-location-name').fill('Palácio das Rainhas');
 await page.locator('#add-campaign-location').click();
 await expect.poll(async()=> (await getCampaign(page)).locations.length).toBe(1);
 await expect.poll(async()=> (await getAdventure(page)).locationIds.length).toBe(1);

 await page.locator('#new-mission-title').fill('Proteger o palácio');
 await page.locator('#add-mission').click();
 await expect.poll(async()=> (await getAdventure(page)).missions.length).toBe(1);

 await page.locator('#new-npc-name').fill('Guardiã da Corte');
 await page.locator('#add-campaign-npc').click();
 await expect.poll(async()=> (await getCampaign(page)).npcs.length).toBe(1);
 await expect.poll(async()=> (await getAdventure(page)).npcIds.length).toBe(1);

 // Sem monstro selecionado, o clique deve produzir feedback (e não ser ignorado).
 await page.locator('#add-adventure-monster').click();
 await expect(page.locator('#adventure-feedback')).toContainText('Selecione um monstro');

 await page.locator('#new-scene-title').fill('Conselho Real');
 await page.locator('#new-scene-chapter').selectOption((await getAdventure(page)).chapters[0].id);
 await page.locator('#new-scene-location').selectOption((await getAdventure(page)).locationIds[0]);
 await page.locator('#add-scene').click();
 await expect.poll(async()=> (await getAdventure(page)).scenes.length).toBe(1);
 expect((await getAdventure(page)).scenes[0].title).toBe('Conselho Real');

 await expect(page.locator('#capitulos .story-card')).toHaveCount(1);
 await expect(page.locator('#locais .story-card')).toHaveCount(1);
 await expect(page.locator('#missoes .story-card')).toHaveCount(1);
 await expect(page.locator('#npcs .story-card')).toHaveCount(1);
 await expect(page.locator('#cenas .story-card')).toHaveCount(1);
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
});

test('Notas do Mestre não bloqueiam as demais ações e são persistidas',async({page})=>{
 await page.goto('/aventuras.html?campaign=qa-six-panels&id=qa-six-adventure');
 await page.locator('#notas-mestre [data-new-master-note]').fill('Pista exclusiva do mestre');
 await page.locator('#notas-mestre [data-note-add]').click();
 await expect.poll(async()=> (await getAdventure(page)).dmNoteEntries.length).toBe(1);
 expect((await getAdventure(page)).dmNoteEntries[0].text).toBe('Pista exclusiva do mestre');
 await page.locator('#new-chapter-title').fill('Capítulo após nota');
 await page.locator('#add-chapter').click();
 await expect.poll(async()=> (await getAdventure(page)).chapters.length).toBe(1);
});
