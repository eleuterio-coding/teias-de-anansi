import{test,expect}from'@playwright/test';
const master={uid:'master-e2e',username:'rafael',isMaster:true,memberships:[]};
const config={enabled:false,authMode:'username-password',playerAccounts:[
 {username:'fernanda',displayName:'Fernanda'},
 {username:'gustavo',displayName:'Gustavo'},
 {username:'bruno',displayName:'Bruno'}
]};
const pc=[
 {id:'pc-a',name:'Áuria'}, {id:'pc-b',name:'Belerion'},
 {id:'pc-free',name:'Cedric'}
];
const campaigns=[
 {id:'campaign-a',name:'Campanha A',status:'active',members:[
  {id:'a-fernanda',username:'fernanda',name:'Fernanda',role:'player',characterId:'pc-a'}
 ],sessions:[]},
 {id:'campaign-b',name:'Campanha B',status:'planned',members:[],sessions:[]}
];
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(config)}));
 await page.addInitScript(data=>{
  if(!localStorage.getItem('hub-rpg:collaboration-session:v1'))localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(data.master));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify(data.campaigns));
  if(!localStorage.getItem('hub-rpg:characters:v4'))localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(data.pc));
 },{master,campaigns,pc});
});
test('personagem atribuído à A não aparece para qualquer jogador da B',async({page})=>{
 await page.goto('/mesa.html?id=campaign-b');
 const select=page.locator('#new-member-character');
 await expect(select).toBeVisible();
 await expect(select.locator('option[value="pc-a"]')).toHaveCount(0);
 await expect(select.locator('option[value="pc-b"]')).toHaveCount(1);
 await page.locator('#new-member-user').selectOption('fernanda');
 await expect(select.locator('option[value="pc-a"]')).toHaveCount(0);
 await page.locator('#new-member-user').selectOption('gustavo');
 await expect(select.locator('option[value="pc-a"]')).toHaveCount(0);
});
test('personagens de campanhas diferentes não alteram os vínculos umas das outras',async({page})=>{
 await page.goto('/mesa.html?id=campaign-b');
 await page.locator('#new-member-user').selectOption('fernanda');
 await page.locator('#new-member-character').selectOption('pc-b');
 await page.locator('#add-member').click();
 await expect(page.locator('#jogadores [data-member-row]')).toHaveCount(1);
 const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]'));
 expect(result.find(c=>c.id==='campaign-a').members.find(m=>m.id==='a-fernanda').characterId).toBe('pc-a');
 expect(result.find(c=>c.id==='campaign-b').members.find(m=>m.username==='fernanda').characterId).toBe('pc-b');
 await expect(page.locator('#new-member-character option[value="pc-a"]')).toHaveCount(0);
 await expect(page.locator('#new-member-character option[value="pc-b"]')).toHaveCount(0);
});
test('desvincular da campanha original libera personagem à campanha seguinte',async({page})=>{
 await page.goto('/mesa.html?id=campaign-a');
 await expect(page.locator('[data-member-row="a-fernanda"] [data-member-character]')).toHaveValue('pc-a');
 await page.locator('[data-member-row="a-fernanda"] [data-member-character]').selectOption('');
 await expect(page.locator('[data-member-row="a-fernanda"] [data-member-character]')).toHaveValue('');
 await page.goto('/mesa.html?id=campaign-b');
 await expect(page.locator('#new-member-character option[value="pc-a"]')).toHaveCount(1);
 await page.locator('#new-member-user').selectOption('fernanda');
 await page.locator('#new-member-character').selectOption('pc-a');
 await page.locator('#add-member').click();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]'));
 expect(after.find(c=>c.id==='campaign-a').members.find(m=>m.id==='a-fernanda').characterId).toBe(null);
 expect(after.find(c=>c.id==='campaign-b').members.find(m=>m.username==='fernanda').characterId).toBe('pc-a');
});
