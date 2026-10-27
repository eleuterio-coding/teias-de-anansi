import {test,expect} from '@playwright/test';

const campaign={id:'qa-oficina-campanha',name:'Reinos de Prata',status:'active',members:[],sessions:[],npcs:[],locations:[]};
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

test('formulários ficam na Oficina; cenas criadas aparecem na Visão Geral e podem ser editadas',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/aventuras.html?campaign=qa-oficina-campanha&id=qa-oficina-aventura');
 await expect(page.locator('#adventure-overview-content')).toBeVisible();
 await expect(page.locator('#adventure-create-content')).toBeHidden();
 await expect(page.locator('#cenas')).toBeVisible();
 await expect(page.locator('#criar-cena')).toBeHidden();
 await expect(page.locator('.adventure-nav a[href="#criar-cena"]')).toHaveCount(0);
 await page.locator('#adventure-create-tab').click();
 await expect(page.locator('#adventure-create-content')).toBeVisible();
 await expect(page.locator('#criar-cena')).toBeVisible();
 await expect(page.locator('#adventure-overview-content')).toBeHidden();
 await page.locator('#new-scene-title').fill('A Traição da Rainha');
 await page.locator('#add-scene').click();
 await expect(page.locator('#adventure-overview-content')).toBeVisible();
 await expect(page.locator('#cenas [data-scene-row]')).toHaveCount(1);
 expect((await saved(page)).scenes[0].title).toBe('A Traição da Rainha');
 await page.locator('#cenas [data-scene-editor] summary').click();
 await expect(page.locator('#adventure-create-content')).toBeVisible();
 await expect(page.locator('.adventure-creation-slot.is-editing [data-scene-field="readAloud"]')).toBeVisible();
 await page.locator('.adventure-creation-slot.is-editing [data-scene-field="readAloud"]').fill('A rainha revela o segredo.');
 await page.locator('.adventure-creation-slot.is-editing [data-scene-field="readAloud"]').blur();
 await expect.poll(async()=>(await saved(page)).scenes[0].readAloud).toBe('A rainha revela o segredo.');
 await page.locator('#adventure-overview-tab').click();
 await expect(page.locator('#cenas [data-scene-row]')).toHaveCount(1);
 await expect(page.locator('#adventure-create-content')).toBeHidden();
 expect(errors).toEqual([]);
});

test('Mapa, Local e NPC são criados com seus formulários originais e reaparecem nos cards',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/aventuras.html?campaign=qa-oficina-campanha&id=qa-oficina-aventura');
 await page.locator('#adventure-create-tab').click();
 await page.locator('[data-adventure-creation-kind="map"]').click();
 await expect(page.locator('#ex-new-level')).toBeVisible();
 await page.locator('#ex-new-level [name="name"]').fill('Castelo das Rainhas');
 await page.locator('#ex-new-level button[type="submit"]').click();
 await expect(page.locator('#adventure-overview-content')).toBeVisible();
 await expect(page.locator('#mapas [data-ex-level]')).toHaveCount(1);
 await page.locator('#adventure-create-tab').click();
 await page.locator('[data-adventure-creation-kind="area"]').click();
 await page.locator('#ex-new-area [name="code"]').fill('Salão do Trono');
 await page.locator('#ex-new-area button[type="submit"]').click();
 await expect(page.locator('#exploracao [data-ex-area]')).toHaveCount(1);
 await page.locator('#adventure-create-tab').click();
 await page.locator('[data-adventure-creation-kind="npc"]').click();
 await page.locator('#new-npc-name').fill('Rainha Elyra');
 await page.locator('#add-campaign-npc').click();
 await expect(page.locator('#npcs [data-campaign-npc]')).toHaveCount(1);
 await expect(page.locator('#adventure-overview-content')).toBeVisible();
 const npcList=page.locator('#npcs .adventure-attached-list');
 if(await npcList.getAttribute('open')===null)await npcList.locator('summary').click();
 await page.locator('#npcs [data-adventure-open-editor="npc"]').click();
 await expect(page.locator('.adventure-creation-slot.is-editing [data-campaign-npc-field="name"]')).toBeVisible();
 await expect(page.locator('#adventure-overview-content')).toBeHidden();
 expect(errors).toEqual([]);
});

test('Monstros usam a Biblioteca existente, sem novo menu e sem criar outro banco de dados',async({page})=>{
 await page.goto('/aventuras.html?campaign=qa-oficina-campanha&id=qa-oficina-aventura');
 await expect(page.locator('#monstros')).toBeVisible();
 await expect(page.locator('#monstros #new-adventure-monster')).toHaveCount(0);
 await page.locator('#adventure-create-tab').click();
 await page.locator('[data-adventure-creation-kind="monster"]').click();
 await expect(page.locator('#new-adventure-monster')).toBeVisible();
 await expect(page.locator('#adventure-monster-consult')).toBeVisible();
 await expect(page.locator('#add-adventure-monster')).toBeVisible();
 await expect(page.locator('#adventure-overview-content')).toBeHidden();
});
