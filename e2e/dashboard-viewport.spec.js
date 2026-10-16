import {test,expect} from '@playwright/test';

const session={uid:'u-dashboard-master',username:'rafael',isMaster:true,memberships:[]};
const campaigns=Array.from({length:17},(_,i)=>({
 id:'c-dashboard-'+i,name:'Campanha de teste '+(i+1),status:i===0?'active':'planned',
 setting:'Cenário',updatedAt:'2026-09-01T10:00:00Z',sessions:[]
}));

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(data.session));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify(data.campaigns));
 },{session,campaigns});
});

async function checkBounds(page,expectedMode,count){
 await expect(page.locator('body')).toHaveAttribute('data-dashboard-mode',expectedMode);
 const sizes=await page.evaluate(()=>{
  const cards=[...document.querySelectorAll('.dashboard-card,.focus-card')].filter(el=>el.getClientRects().length);
  const views=cards.map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}});
  const visibleLists=[...document.querySelectorAll('.dashboard-list')].filter(el=>el.getClientRects().length);
  return {
   screenWidth:document.documentElement.clientWidth,
   scrollWidth:document.documentElement.scrollWidth,
   screenHeight:window.innerHeight,
   scrollHeight:document.documentElement.scrollHeight,
   views,
   listOverflow:visibleLists.map(el=>getComputedStyle(el).overflowY)
  }
 });
 expect(sizes.views).toHaveLength(count);
 expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.screenWidth+2);
 expect(sizes.scrollHeight).toBeLessThanOrEqual(sizes.screenHeight+2);
 for(const rect of sizes.views){
  expect(rect.left).toBeGreaterThanOrEqual(-1);
  expect(rect.right).toBeLessThanOrEqual(sizes.screenWidth+2);
  expect(rect.top).toBeGreaterThanOrEqual(-1);
  expect(rect.bottom).toBeLessThanOrEqual(sizes.screenHeight+2);
 }
 expect(sizes.listOverflow.every(value=>value==='hidden')).toBe(true);
}

test('card fitting and viewport-aware pages on desktop, notebook and phone',async({page})=>{
 await page.goto('/painel.html');
 await page.setViewportSize({width:1440,height:900});
 await checkBounds(page,'full',7);
 await page.setViewportSize({width:1050,height:720});
 await checkBounds(page,'group',3);
 await expect(page.locator('#dashboard-page-status')).toContainText('Página 1 de 2');
 await page.locator('[data-dashboard-next]').click();
 await expect(page.locator('#current-session')).toBeVisible();
 await expect(page.locator('#next-session')).toBeVisible();
 await checkBounds(page,'group',4);
 await expect(page.locator('#dashboard-page-status')).toContainText('Página 2 de 2');
 await page.setViewportSize({width:390,height:844});
 await checkBounds(page,'single',1);
 await expect(page.locator('#dashboard-page-status')).toContainText('Página 1 de 7');
 for(let index=1;index<7;index++){
  await page.locator('[data-dashboard-next]').click();
  await checkBounds(page,'single',1);
  await expect(page.locator('#dashboard-page-status')).toContainText('Página '+(index+1)+' de 7');
 }
 await expect(page.locator('[data-dashboard-next]')).toBeDisabled();
});

test('a collection with more rows than the screen uses item pagination',async({page})=>{
 await page.setViewportSize({width:1050,height:720});
 await page.goto('/painel.html');
 await expect(page.locator('body')).toHaveAttribute('data-dashboard-mode','group');
 const list=page.locator('#campaign-dashboard-list');
 await expect(list.locator('.dash-row')).toHaveCount(17);
 const pager=page.locator('#campaign-dashboard-list + .dashboard-list-pager');
 await expect(pager).toBeVisible();
 const first=await list.locator('.dash-row:visible').first().textContent();
 await pager.locator('[data-list-next]').click();
 await expect(pager.locator('[data-list-prev]')).toBeEnabled();
 const after=await list.locator('.dash-row:visible').first().textContent();
 expect(after).not.toBe(first);
 const dimensions=await list.evaluate(el=>({
  height:el.clientHeight,visibleRows:[...el.querySelectorAll('.dash-row')].filter(row=>!row.hidden).length,
  innerScroll:getComputedStyle(el).overflowY
 }));
 expect(dimensions.visibleRows).toBeGreaterThan(0);
 expect(dimensions.innerScroll).toBe('hidden');
});

test('Painel Geral não transforma textos em links de verbetes',async({page})=>{
 await page.goto('/painel.html');
 await expect(page.locator('#campaign-dashboard-list .dash-row')).toHaveCount(17);
 let indexRequests=0;
 await page.route('**/dados/referencias-hub-index.json*',route=>{indexRequests++;return route.abort()});
 // A proteção deve funcionar até se o script global for carregado por engano.
 await page.addScriptTag({url:'/scripts/referencias-hub.js'});
 await expect(page.locator('a.hub-ref')).toHaveCount(0);
 expect(indexRequests).toBe(0);
 await expect(page.locator('#campaign-dashboard-list .dash-row').first()).toHaveAttribute('href',/mesa\.html\?id=/);
 await expect(page.locator('.panel-head a[href="campanhas.html"]')).toHaveCount(1);
});


test('current status and explicit Campaign/Adventure relationships are visible in overview cards',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/painel.html');
 await page.evaluate(()=>{
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([
   {id:'campaign-old',name:'Campanha Antiga',status:'active',sessions:[{id:'session-old',title:'Sessão Antiga',status:'active'}]},
   {id:'campaign-silver',name:'Reinos de Prata',status:'current',sessions:[{id:'session-queens',number:1,title:'Encontro das Rainhas',status:'current',adventureId:'adventure-queens',date:'2026-10-16'}]}
  ]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([
   {id:'adventure-queens',campaignId:'campaign-silver',title:'As Rainhas',status:'current',scenes:[]}
  ]));
 });
 await page.reload();
 await expect(page.locator('#current-campaign h2')).toContainText('Reinos de Prata');
 await expect(page.locator('#current-adventure h2')).toContainText('As Rainhas');
 await expect(page.locator('#current-session h2')).toContainText('Encontro das Rainhas');
 await expect(page.locator('#adventure-dashboard-list .relationship-chip')).toContainText('Campanha: Reinos de Prata');
 await expect(page.locator('#session-dashboard-list .relation-campaign')).toContainText('Campanha: Reinos de Prata');
 await expect(page.locator('#session-dashboard-list .relation-adventure')).toContainText('Aventura: As Rainhas');
 for(const id of ['campaign-dashboard-list','adventure-dashboard-list','session-dashboard-list']){
  await expect(page.locator('#'+id+' .badge.current').first()).toHaveText('Atual');
 }
 await expect(page.locator('#current-adventure .focus-card-copy')).toContainText('Campanha: Reinos de Prata');
 await expect(page.locator('#current-session .focus-card-copy')).toContainText('Aventura: As Rainhas');
});
