import {test,expect} from '@playwright/test';

const campaign={id:'qa-oficina-campanha',name:'Reinos de Prata',status:'active',
 members:[{username:'ana',name:'Ana',active:true},{username:'bruno',name:'Bruno',active:true}],
 sessions:[],npcs:[],locations:[]};
const adventure={id:'qa-oficina-aventura',campaignId:campaign.id,title:'As Rainhas',status:'active',
 participantUsernames:[],characterIds:[],npcIds:[],locationIds:[],scenes:[],missions:[],monsters:[]};
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1')||'[]').find(a=>a.id==='qa-oficina-aventura'));
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.addInitScript(({campaign,adventure})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'qa-oficina-master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([adventure]));
  localStorage.setItem('hub-rpg:characters:v4','[]');
  localStorage.setItem('hub-rpg:npcs:v1','[]');
 },{campaign,adventure});
});
const visit=async page=>page.goto('/aventuras.html?campaign=qa-oficina-campanha&id=qa-oficina-aventura');
const create=async(page,kind)=>{await page.locator('#adventure-create-tab').click();await page.locator('[data-adventure-creation-kind="'+kind+'"]').click()};

test('Visão Geral mostra apenas informações sem campos, exclusão ou alteração',async({page})=>{
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await visit(page);
 await expect(page.locator('.adventure-read-intro')).toHaveCount(0);
 await expect(page.locator('#adventure-overview-content')).toBeVisible();
 await expect(page.locator('#adventure-create-content')).toBeHidden();
 await expect(page.locator('#adventure-overview-content :is(button,input,select,textarea)')).toHaveCount(0);
 await expect(page.locator('#adventure-overview-content [draggable="true"]')).toHaveCount(0);
 for(const id of ['overview-participantes','overview-cenas','overview-locais','overview-mapas','overview-npcs','overview-monstros'])
  await expect(page.locator('#'+id)).toBeVisible();
 await expect(page.locator('#participantes')).toBeHidden();
 await expect(page.locator('#visao-geral')).toBeHidden();
 expect(errors).toEqual([]);
});

test('Jogadores são adicionados e editados somente na Oficina; card final é informativo',async({page})=>{
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await visit(page);
 await create(page,'player');
 await expect(page.locator('#participantes')).toBeVisible();
 await expect(page.locator('#new-adventure-member-user')).toBeVisible();
 await page.locator('#new-adventure-member-user').selectOption('ana');
 await page.locator('#add-adventure-member').click();
 await expect(page.locator('#adventure-create-content')).toBeVisible();
 await expect(page.locator('[data-adventure-creation-kind="player"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#participantes')).toBeVisible();
 await page.locator('#adventure-overview-tab').click();
 await expect(page.locator('#overview-participantes .adventure-read-player')).toHaveCount(1);
 await expect(page.locator('#overview-participantes')).toContainText('Ana');
 await expect(page.locator('#overview-participantes :is(button,input,select,textarea)')).toHaveCount(0);
 expect((await saved(page)).participantUsernames).toContain('ana');
 await create(page,'player');
 await expect(page.locator('#adventure-member-list [data-member-row="ana"]')).toBeVisible();
 await expect(page.locator('#adventure-member-list [data-adventure-remove-member="ana"]')).toBeVisible();
 await expect(page.locator('#overview-participantes')).toBeHidden();
 expect(errors).toEqual([]);
});

test('Cenas criadas reaparecem na Visão Geral e editores preservam campos avançados',async({page})=>{
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await visit(page);
 await create(page,'scene');
 await expect(page.locator('#criar-cena')).toBeVisible();
 await expect(page.locator('#cenas')).toBeVisible();
 await expect(page.locator('#adventure-workspace-hint')).toHaveCount(0);
 await expect(page.locator('#adventure-create-tab')).toHaveText('Criar conteúdo');
 await expect(page.locator('[data-adventure-creation-kind="scene"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('#new-scene-title').fill('A Traição da Rainha');
 await page.locator('#add-scene').click();
 await expect(page.locator('#adventure-create-content')).toBeVisible();
 await expect(page.locator('#criar-cena')).toBeVisible();
 await expect(page.locator('#adventure-active-section-title')).toHaveText('Cenas');
 await page.locator('#adventure-overview-tab').click();
 await expect(page.locator('#overview-cenas .adventure-read-card')).toHaveCount(1);
 await expect(page.locator('#overview-cenas')).toContainText('A Traição da Rainha');
 expect((await saved(page)).scenes[0].title).toBe('A Traição da Rainha');
 await create(page,'scene');
 const editor=page.locator('#cenas [data-scene-editor]');
 await editor.locator('summary').click();
 await expect(page.locator('#cenas [data-scene-field="readAloud"]')).toBeVisible();
 await page.locator('#cenas [data-scene-field="readAloud"]').fill('A rainha revela seu segredo.');
 await page.locator('#cenas [data-scene-field="readAloud"]').blur();
 await expect.poll(async()=>(await saved(page)).scenes[0].readAloud).toBe('A rainha revela seu segredo.');
 await page.locator('#adventure-overview-tab').click();
 await expect(page.locator('#overview-cenas')).toContainText('A rainha revela seu segredo.');
 await expect(page.locator('#adventure-overview-content :is(button,input,select,textarea)')).toHaveCount(0);
 expect(errors).toEqual([]);
});

test('Mapas, locais e NPCs usam cadastros existentes e aparecem como cards de leitura',async({page})=>{
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await visit(page);
 await create(page,'map');
 await expect(page.locator('#ex-new-level')).toBeVisible();
 await page.locator('#ex-new-level [name="name"]').fill('Castelo das Rainhas');
 await page.locator('#ex-new-level button[type="submit"]').click();
 await expect(page.locator('#adventure-create-content')).toBeVisible();
 await expect(page.locator('#adventure-active-section-title')).toHaveText('Mapas');
 await expect(page.locator('#mapas .explore-level-card')).toHaveCount(1);
 await page.locator('#adventure-overview-tab').click();
 await expect(page.locator('#overview-mapas .adventure-read-card')).toHaveCount(1);
 await create(page,'area');
 await page.locator('#ex-new-area [name="code"]').fill('Salão do Trono');
 await page.locator('#ex-new-area button[type="submit"]').click();
 await expect(page.locator('#adventure-create-content')).toBeVisible();
 await expect(page.locator('#adventure-active-section-title')).toHaveText('Locais');
 await expect(page.locator('#exploracao .explore-area-card')).toHaveCount(1);
 await page.locator('#adventure-overview-tab').click();
 await expect(page.locator('#overview-locais .adventure-read-card')).toHaveCount(1);
 await create(page,'npc');
 await page.locator('#new-npc-name').fill('Rainha Elyra');
 await page.locator('#add-campaign-npc').click();
 await expect(page.locator('#adventure-create-content')).toBeVisible();
 await expect(page.locator('#adventure-active-section-title')).toHaveText('NPCs');
 await page.locator('#adventure-overview-tab').click();
 await expect(page.locator('#overview-npcs .adventure-read-card')).toHaveCount(1);
 await expect(page.locator('#overview-npcs')).toContainText('Rainha Elyra');
 await create(page,'npc');
 await expect(page.locator('#npcs [data-campaign-npc]')).toHaveCount(1);
 const npcList=page.locator('#npcs .adventure-attached-list');
 if(await npcList.getAttribute('open')===null)await npcList.locator('summary').click();
 await expect(page.locator('#npcs [data-campaign-npc-field="name"]')).toBeVisible();
 expect(errors).toEqual([]);
});

test('Biblioteca de monstros e configurações ficam exclusivas na área de criação',async({page})=>{
 await visit(page);
 await create(page,'monster');
 await expect(page.locator('#new-adventure-monster')).toBeVisible();
 await expect(page.locator('#adventure-monster-consult')).toBeVisible();
 await expect(page.locator('#add-adventure-monster')).toBeVisible();
 await expect(page.locator('#visao-geral')).toBeHidden();
 await page.locator('[data-adventure-creation-kind="more"]').click();
 await expect(page.locator('#visao-geral')).toBeVisible();
 await expect(page.locator('#missoes')).toBeVisible();
 await expect(page.locator('#notas-mestre')).toBeVisible();
 await expect(page.locator('#new-adventure-monster')).toBeHidden();
 await page.locator('#adventure-overview-tab').click();
 await expect(page.locator('#adventure-overview-content :is(button,input,select,textarea)')).toHaveCount(0);
});
