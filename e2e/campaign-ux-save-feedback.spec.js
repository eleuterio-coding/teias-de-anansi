import{test,expect}from'@playwright/test';

const session={uid:'u-e2e-master',username:'rafael',isMaster:true,memberships:[]};
const campaign={
 id:'e2e-campaign-ux',name:'Reinos de Prata',status:'current',system:'D&D 5.5e',
 description:'Campanha para validar a interface.',updatedAt:'2026-10-16T12:00:00Z',
 members:[
  {id:'m1',username:'fernanda',name:'Fernanda',role:'player',active:true},
  {id:'m2',username:'bruno',name:'Bruno',role:'player',active:true}
 ],sessions:[]
};

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(data.session));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
 },{session,campaign});
});

test('card inteiro abre campanha e preserva Abrir e status editável',async({page})=>{
 await page.goto('/campanhas.html');
 const card=page.locator('[data-campaign-card="e2e-campaign-ux"]');
 await expect(card.locator('.campaign-card-stretched-link')).toHaveAttribute('href','mesa.html?id=e2e-campaign-ux');
 await expect(card.getByRole('link',{name:'Abrir',exact:true})).toHaveCount(1);
 await card.locator('.campaign-status-trigger').click();
 await expect(page).toHaveURL(/campanhas\.html/);
 await expect(card.locator('[data-status-disclosure]')).toHaveAttribute('open','');
 await card.locator('.campaign-status-trigger').click();
 await card.locator('.campaign-card-stretched-link').click({position:{x:8,y:70}});
 await expect(page).toHaveURL(/mesa\.html\?id=e2e-campaign-ux/);
});

test('jogadores organizados e confirmação acessível após salvar',async({page})=>{
 await page.goto('/mesa.html?id=e2e-campaign-ux');
 const rows=page.locator('#jogadores .roster-player');
 await expect(rows).toHaveCount(2);
 await expect(page.locator('.roster-count')).toContainText('2 jogadores');
 for(const row of await rows.all()){
  await expect(row.locator('[data-member-user]')).toBeVisible();
  await expect(row.locator('[data-member-character]')).toBeVisible();
  await expect(row.getByRole('button',{name:'Notas'})).toBeVisible();
  await expect(row.getByRole('button',{name:'Remover'})).toBeVisible();
 }
 await page.locator('#jogadores [data-save-campaign-section]').click();
 await expect(page.locator('#hub-save-notice')).toBeVisible();
 await expect(page.locator('#hub-save-notice .hub-save-title')).toHaveText('Alterações salvas');
 await expect(page.locator('#hub-save-notice')).toHaveAttribute('role','status');
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]'));
 expect(persisted.find(c=>c.id==='e2e-campaign-ux')?.members).toHaveLength(2);
});

test('layout de jogadores não provoca overflow em tela estreita',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/mesa.html?id=e2e-campaign-ux');
 await expect(page.locator('#jogadores .roster-player')).toHaveCount(2);
 const bounds=await page.evaluate(()=>{
  const region=document.querySelector('#jogadores'),rect=region.getBoundingClientRect();
  return{scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,
   left:rect.left,right:rect.right}
 });
 expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth+2);
 expect(bounds.left).toBeGreaterThanOrEqual(-1);
 expect(bounds.right).toBeLessThanOrEqual(bounds.clientWidth+2);
});
