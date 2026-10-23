import{test,expect}from'@playwright/test';

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.addInitScript(()=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'test-master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([{id:'cmp-explore',name:'Mesa de teste',dmName:'Rafael',sessions:[],members:[],npcs:[],locations:[]}]));
  if(!localStorage.getItem('hub-rpg:adventures:v1'))localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([{id:'adv-explore',campaignId:'cmp-explore',title:'Aventura para testar exploração',status:'planned',chapters:[],scenes:[]}]));
 });
});

test('Mestre cria níveis, áreas e crônica sem modificar uma cena',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/aventuras.html?campaign=cmp-explore&id=adv-explore');
 await expect(page.locator('#exploracao h2')).toHaveText('Exploração');
 await expect(page.locator('#exploracao .explore-summary')).toContainText('0');
 await page.locator('#ex-level-manager summary').click();
 await page.locator('#ex-new-level input[name="name"]').fill('Primeiro andar');
 await page.locator('#ex-new-level button[type="submit"]').click();
 await expect(page.locator('#ex-level-filter')).toContainText('Primeiro andar');
 await page.locator('#ex-create-area summary').click();
 await page.locator('#ex-new-area input[name="code"]').fill('A01');
 await page.locator('#ex-new-area input[name="name"]').fill('Portão norte');
 await page.locator('#ex-new-area button[type="submit"]').click();
 await expect(page.locator('#explore-area-detail h3')).toContainText('Portão norte');
 await page.locator('#explore-area-detail [data-ex-field="description"]').fill('Nota secreta do mestre');
 await page.locator('#explore-area-detail [data-ex-field="publicDescription"]').fill('Um portão antigo.');
 await page.locator('#explore-area-detail [data-ex-field="mapX"]').fill('25');
 await page.locator('#explore-area-detail [data-ex-field="mapY"]').fill('65');
 await page.locator('#explore-area-detail [data-ex-publish]').check();
 await page.locator('[data-ex-save-area]').click();
 await page.selectOption('#ex-area-status','visited');
 await page.locator('#ex-visit-notes').fill('Grupo examinou o portão');
 await page.locator('[data-ex-record]').click();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1'))[0]);
 expect(state.exploration.levels).toHaveLength(1);
 expect(state.exploration.areas).toHaveLength(1);
 expect(state.exploration.areas[0]).toMatchObject({code:'A01',name:'Portão norte',status:'visited',mapX:25,mapY:65,visibleToPlayers:true});
 expect(state.exploration.history).toHaveLength(1);
 expect(state.scenes).toHaveLength(0);
 await page.reload();
 await expect(page.locator('#exploracao')).toContainText('Portão norte');
 await expect(page.locator('#exploracao .explore-summary')).toContainText('1');
 expect(errors).toEqual([]);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 expect(overflow,'A exploração não pode criar overflow horizontal').toBeLessThanOrEqual(2);
});
