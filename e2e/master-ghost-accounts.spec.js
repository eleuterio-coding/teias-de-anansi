import{test,expect}from'@playwright/test';

const GHOST='e2e-player-mvbex9ae-bc9f76ead8';
const official=[{username:'bruno',displayName:'Bruno'},{username:'gustavo',authUsername:'gus',displayName:'Gustavo'},{username:'leo',displayName:'Léo'},{username:'fernanda',displayName:'Fernanda'}];
const campaign={id:'e2e-ghost-roster',name:'Campanha de teste',status:'active',members:[
 {id:'ghost',username:GHOST,name:GHOST,role:'player',active:true},
 {id:'fernanda',username:'fernanda',name:'Fernanda',role:'player',active:true}
],sessions:[]};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password',ownerUsername:'rafael',playerAccounts:official})}));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'mestre',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify([{id:'e2e-char',name:'Teste',ownerUsername:data.ghost,ownerUid:'e2e-orphan'}]));
 },{campaign,ghost:GHOST});
});
test('Mestre não mostra usuário de teste armazenado em campanha nem ficha',async({page})=>{
 await page.goto('/painel.html');
 const select=page.locator('[data-hub-preview-user]');
 await expect(select).toBeVisible();
 await expect(select.locator('option')).toHaveText(['Mestre','Fernanda']);
 await expect(select).not.toContainText(GHOST);
 await select.selectOption('fernanda');
 await expect(select).toHaveValue('fernanda');
});
test('visualização salva de usuário órfão retorna automaticamente ao Mestre',async({page})=>{
 await page.addInitScript(ghost=>{
  localStorage.setItem('hub-rpg:master-preview:v1',JSON.stringify({uid:'ghost',username:ghost,displayName:ghost,memberships:[]}));
  localStorage.setItem('hub-rpg:master-preview-cache:v1',JSON.stringify({campaigns:{},playerCharacters:{}}));
 },GHOST);
 await page.goto('/painel.html');
 await expect(page.locator('[data-hub-preview-user]')).toHaveValue('');
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('hub-rpg:master-preview:v1'))).toBeNull();
 await expect(page.locator('[data-hub-preview-user] option')).toHaveText(['Mestre','Fernanda']);
});
