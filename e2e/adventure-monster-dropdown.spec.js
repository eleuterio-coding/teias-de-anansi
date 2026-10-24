import{test,expect}from'@playwright/test';

test('card Monstros usa seleção suspensa sem renderizar o catálogo inteiro',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.route('**/dados/monstros-pdf-extras.json*',route=>route.fulfill({status:200,contentType:'application/json',body:'{"items":[]}'}));
 await page.route('**/dados/monstros-fontes/*.json*',route=>route.fulfill({status:200,contentType:'application/json',body:'{"monster":[]}'}));
 await page.route('https://apisearch.thedmstoolkit.com/api/2024/monsters**',route=>{
  const url=route.request().url();
  const response=url.includes('?')?{data:[{name:'Goblin de teste',slug:'goblin-teste'}]}:
   {data:{name:'Goblin de teste',properties:{'Armor Class':'15','Hit Points':'7','Challenge':'1/4','Dexterity':'14'}}};
  return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(response)});
 });
 await page.addInitScript(()=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master-dropdown',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([{id:'cmp-dropdown',name:'Mesa',members:[],npcs:[],sessions:[],locations:[]}]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([{id:'adv-dropdown',campaignId:'cmp-dropdown',title:'Aventura',status:'planned',chapters:[],scenes:[],monsters:[]}]));
 });
 await page.goto('/aventuras.html?campaign=cmp-dropdown&id=adv-dropdown');
 const card=page.locator('#monstros'),picker=card.locator('#new-adventure-monster');
 await expect(card.locator('#adventure-monster-search, #adventure-monster-results, #adventure-monster-more')).toHaveCount(0);
 await expect(picker).toBeEnabled();
 await expect(picker.locator('option')).toHaveCount(1);
 await expect(card.locator('#adventure-monster-consult')).toBeDisabled();
 await expect(card.locator('#add-adventure-monster')).toBeDisabled();
 await picker.focus();
 await expect(picker.locator('option')).toHaveCount(2);
 await expect(picker.locator('option').nth(1)).toHaveText('Goblin de teste');
 await picker.selectOption('srd:goblin-teste');
 await expect(card.locator('#adventure-monster-consult')).toBeEnabled();
 await expect(card.locator('#add-adventure-monster')).toBeEnabled();
 await card.locator('#adventure-monster-consult').click();
 await expect(card.locator('#adventure-monster-preview')).toContainText('Goblin de teste');
 await card.locator('#add-adventure-monster').click();
 await expect.poll(async()=>page.evaluate(()=>{
  const row=JSON.parse(localStorage.getItem('hub-rpg:adventures:v1')||'[]').find(item=>item.id==='adv-dropdown');
  return row?.monsters?.length||0;
 })).toBe(1);
 await expect(card.locator('.adventure-monsters-attached summary')).toContainText('(1)');
 await card.locator('.adventure-monsters-attached summary').click();
 await expect(card.locator('.adventure-monsters-attached .story-card')).toContainText('Goblin de teste');
 expect(errors).toEqual([]);
});
