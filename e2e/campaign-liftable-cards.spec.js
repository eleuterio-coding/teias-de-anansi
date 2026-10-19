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
test('setas reorganizam Locais e salvam sua ordem sem exibir Atos',async({page})=>{
 await page.goto('/mesa.html?id=e2e-cards-lift');
 await expect(page.locator('#missoes')).toHaveCount(0);
 const places=page.locator('#locais [data-line-drag]');
 await expect(places).toHaveCount(3);
 await expect(places.first().locator('.campaign-reorder-grip')).toBeVisible();
 await expect(places.first().locator('[data-line-move="up"]')).toBeDisabled();
 await places.nth(2).locator('[data-line-move="up"]').click();
 await expect(page.locator('#locais [data-edit-line]').nth(1)).toHaveValue('Mercado');
 await page.reload();
 await expect(page.locator('#locais [data-edit-line]').nth(1)).toHaveValue('Mercado');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0]);
 expect(saved.activeMissions).toBe('Ato I\nAto II\nAto III');
});

test('clique e segure faz o card se destacar e seguir o cursor',async({page,browserName})=>{
 test.skip(browserName!=='chromium' || test.info().project.name!=='desktop-chromium','Gestos de mouse verificados no desktop');
 await page.goto('/mesa.html?id=e2e-cards-lift');
 const grip=page.locator('#locais [data-line-drag]').first().locator('.campaign-reorder-grip');
 const target=page.locator('#locais [data-line-drag]').nth(2);
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
 await expect(page.locator('#locais [data-edit-line]').last()).toHaveValue('Taverna');
});


test('botões da Campanha abrem criação de Aventura ou Sessão pré-vinculada',async({page})=>{
 await page.goto('/mesa.html?id=e2e-cards-lift');
 const actions=page.locator('.campaign-product-hero .campaign-product-actions');
 await expect(actions.locator('a')).toHaveCount(3);
 await expect(actions.getByRole('link',{name:'Nova Aventura'})).toHaveAttribute('href','aventuras.html?campaign=e2e-cards-lift&new=1#adventure-create-card');
 await expect(actions.getByRole('link',{name:'Nova Sessão'})).toHaveAttribute('href','sessoes.html?campaign=e2e-cards-lift&new=1#session-create-card');
 await actions.getByRole('link',{name:'Nova Aventura'}).click();
 await expect(page).toHaveURL(/aventuras\.html\?campaign=e2e-cards-lift&new=1#adventure-create-card/);
 await expect(page.locator('#adventure-campaign')).toHaveValue('e2e-cards-lift');
 await expect(page.locator('#new-adventure-title')).toBeVisible();
 await expect(page.locator('#visao-geral')).toHaveCount(0);
 await page.goto('/mesa.html?id=e2e-cards-lift');
 await page.locator('.campaign-product-actions').getByRole('link',{name:'Nova Sessão'}).click();
 await expect(page).toHaveURL(/sessoes\.html\?campaign=e2e-cards-lift&new=1#session-create-card/);
 await expect(page.locator('#new-session-campaign')).toHaveValue('e2e-cards-lift');
 await expect(page.locator('#new-session-adventure')).toHaveValue('');
 await expect(page.locator('#new-session-title')).toBeVisible();
 await expect(page.locator('#proxima-sessao .campaign-next-action')).toHaveCount(0);
});
test('criar Aventura vinda da Campanha salva o vínculo com a Campanha correta',async({page})=>{
 await page.goto('/aventuras.html?campaign=e2e-cards-lift&new=1#adventure-create-card');
 await expect(page.locator('#adventure-campaign')).toHaveValue('e2e-cards-lift');
 await page.locator('#new-adventure-title').fill('A Jornada da Cidadela');
 await page.locator('#create-adventure').click();
 await expect(page).toHaveURL(/aventuras\.html\?campaign=e2e-cards-lift&id=/);
 await expect(page.locator('#adventure-assignment')).toHaveValue('e2e-cards-lift');
 const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1')||'[]'));
 const created=rows.filter(a=>a.title==='A Jornada da Cidadela');
 expect(created).toHaveLength(1);
 expect(created[0].campaignId).toBe('e2e-cards-lift');
});
test('criar Sessão vinculada à Campanha sem Aventura salva dentro da Campanha',async({page})=>{
 await page.goto('/sessoes.html?campaign=e2e-cards-lift&new=1#session-create-card');
 await expect(page.locator('#new-session-campaign')).toHaveValue('e2e-cards-lift');
 await page.locator('#new-session-title').fill('Sessão sem aventura');
 await page.locator('#create-session').click();
 await expect(page).toHaveURL(/sessoes\.html\?campaign=e2e-cards-lift&id=/);
 const saved=await page.evaluate(()=>({
  campaigns:JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]'),
  standalone:JSON.parse(localStorage.getItem('hub-rpg:sessions:v1')||'[]')
 }));
 const target=saved.campaigns.find(c=>c.id==='e2e-cards-lift');
 const session=target.sessions.find(s=>s.title==='Sessão sem aventura');
 expect(session).toBeTruthy();
 expect(session.adventureId).toBeNull();
 expect(saved.standalone.some(s=>s.id===session.id)).toBe(false);
 await page.reload();
 await expect(page.locator('[data-session-id="'+session.id+'"]')).toHaveCount(1);
});
test('criar Sessão com Aventura da Campanha preserva os dois vínculos',async({page})=>{
 await page.goto('/sessoes.html?campaign=e2e-cards-lift&new=1#session-create-card');
 await expect(page.locator('#new-session-campaign')).toHaveValue('e2e-cards-lift');
 await page.locator('#new-session-adventure').selectOption('ad1');
 await page.locator('#new-session-title').fill('Sessão das Rainhas');
 await page.locator('#create-session').click();
 await expect(page).toHaveURL(/sessoes\.html\?campaign=e2e-cards-lift/);
 const target=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]').find(c=>c.id==='e2e-cards-lift'));
 const session=target.sessions.find(s=>s.title==='Sessão das Rainhas');
 expect(session).toBeTruthy();
 expect(session.adventureId).toBe('ad1');
});
