import { test, expect } from '@playwright/test';

const campaign={
 id:'e2e-cards-lift',name:'A Cidadela',status:'active',system:'D&D 5.5e',
 members:[{id:'m1',name:'Jogador',username:'jogador',role:'player',characterId:'pc1'}],
 sessions:[{id:'next1',number:3,title:'A Passagem',status:'next',date:'2026-10-25'}],
 importantLocations:'Taverna\nMuralha\nMercado',
 activeMissions:'Ato I\nAto II\nAto III',
 timeline:'Primeiro evento\nSegundo evento'
};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password',playerAccounts:[]})
 }));
 await page.addInitScript(c=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'dm-cards',username:'rafael',isMaster:true,memberships:[]}));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([c]));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify([{id:'pc1',name:'Personagem principal'}]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([{id:'ad1',title:'As Rainhas',campaignId:c.id,status:'active'}]));
 },campaign);
});
test('resumo usa ordem fixa, links diretos e flexão gramatical',async({page})=>{
 await page.goto('/mesa.html?id=e2e-cards-lift');
 const cards=page.locator('.campaign-product-summary .metric');
 await expect(cards).toHaveCount(4);
 expect(await cards.locator('span').allTextContents()).toEqual(['Status','Sessões','Personagens','Próxima sessão']);
 await expect(cards.nth(1)).toHaveAttribute('href','#sessoes');
 await expect(cards.nth(2)).toHaveAttribute('href','#jogadores');
 await expect(cards.nth(3)).toHaveAttribute('href','sessoes.html?campaign=e2e-cards-lift&id=next1');
 await expect(page.locator('.campaign-product-meta')).toContainText('1 jogador');
 await expect(page.locator('.campaign-product-meta')).toContainText('1 aventura');
 await cards.nth(1).click();
 await expect(page).toHaveURL(/#sessoes$/);
 await cards.nth(2).click();
 await expect(page).toHaveURL(/#jogadores$/);
});
test('setas reorganizam Atos e Locais e salvam ordem',async({page})=>{
 await page.goto('/mesa.html?id=e2e-cards-lift');
 const acts=page.locator('#missoes [data-line-drag]');
 const places=page.locator('#locais [data-line-drag]');
 await expect(acts).toHaveCount(3);
 await expect(acts.nth(0).locator('.campaign-reorder-grip')).toBeVisible();
 await expect(acts.nth(0).locator('[data-line-move="up"]')).toBeDisabled();
 await acts.nth(0).locator('[data-line-move="down"]').click();
 await places.nth(2).locator('[data-line-move="up"]').click();
 await expect(page.locator('#missoes [data-edit-line]').first()).toHaveValue('Ato II');
 await expect(page.locator('#locais [data-edit-line]').nth(1)).toHaveValue('Mercado');
 await page.reload();
 await expect(page.locator('#missoes [data-edit-line]').first()).toHaveValue('Ato II');
 await expect(page.locator('#locais [data-edit-line]').nth(1)).toHaveValue('Mercado');
});
test('clique e segure faz o card se destacar e seguir o cursor',async({page,browserName})=>{
 test.skip(browserName!=='chromium' || test.info().project.name!=='desktop-chromium','Gestos de mouse verificados no desktop');
 await page.goto('/mesa.html?id=e2e-cards-lift');
 const grip=page.locator('#missoes [data-line-drag]').first().locator('.campaign-reorder-grip');
 const target=page.locator('#missoes [data-line-drag]').nth(2);
 await grip.scrollIntoViewIfNeeded();
 const origin=await grip.boundingBox(),destination=await target.boundingBox();
 expect(origin).toBeTruthy();expect(destination).toBeTruthy();
 await page.mouse.move(origin.x+origin.width/2,origin.y+origin.height/2);
 await page.mouse.down();
 await expect(page.locator('.campaign-floating-card')).toBeVisible({timeout:1500});
 const before=await page.locator('.campaign-floating-card').boundingBox();
 await page.mouse.move(destination.x+destination.width/2,destination.y+destination.height*.8,{steps:12});
 const after=await page.locator('.campaign-floating-card').boundingBox();
 expect(after.y).toBeGreaterThan(before.y+10);
 await page.mouse.up();
 await expect(page.locator('.campaign-floating-card')).toHaveCount(0);
 await expect(page.locator('#missoes [data-edit-line]').last()).toHaveValue('Ato I');
});
