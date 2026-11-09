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
  if(!new URLSearchParams(location.search).has('currentStatusFixture'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify(data.campaigns));
 },{session,campaigns});
});

async function verifyScrollableCards(page){
 await expect(page.locator('body')).toHaveClass(/dashboard-page/);
 await expect(page.locator('#campaign-dashboard-list .dash-row')).toHaveCount(17);
 const geometry=await page.evaluate(()=>{
  const cards=[...document.querySelectorAll('.dashboard-collections > .dashboard-card,.dashboard-context .focus-card')];
  const rects=cards.map(el=>el.getBoundingClientRect()),w=document.documentElement.clientWidth;
  return{count:cards.length,width:w,scrollWidth:document.documentElement.scrollWidth,
   height:document.scrollingElement.scrollHeight,viewport:innerHeight,
   cropped:rects.filter(r=>!r.width||!r.height||r.left < -1||r.right > w+2).length,
   hidden:[...document.querySelectorAll('#campaign-dashboard-list .dash-row')]
      .filter(el=>el.hidden||getComputedStyle(el).display==='none').length,
   overflow:[...document.querySelectorAll('.dashboard-list')].map(el=>getComputedStyle(el).overflowY),
   pagers:document.querySelectorAll('#dashboard-pagination,.dashboard-list-pager').length};
 });
 expect(geometry.count).toBe(7);
 expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width+2);
 expect(geometry.height).toBeGreaterThan(geometry.viewport);
 expect(geometry.cropped).toBe(0);
 expect(geometry.hidden).toBe(0);
 expect(geometry.overflow.every(v=>v==='visible')).toBe(true);
 expect(geometry.pagers).toBe(0);
 const last=page.locator('#campaign-dashboard-list .dash-row').last();
 await last.scrollIntoViewIfNeeded();
 await expect(last).toBeInViewport();
 await page.locator('#current-session').scrollIntoViewIfNeeded();
 await expect(page.locator('#current-session')).toBeInViewport();
}

test('cards completos e alcancaveis com rolagem responsiva, sem corte',async({page})=>{
 await page.goto('/painel.html');
 for(const viewport of [{width:1440,height:900},{width:1050,height:720},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  await verifyScrollableCards(page);
 }
});

test('colecoes extensas exibem todas as linhas sem paginacao artificial',async({page})=>{
 await page.setViewportSize({width:1050,height:720});
 await page.goto('/painel.html');
 const list=page.locator('#campaign-dashboard-list');
 await expect(list.locator('.dash-row')).toHaveCount(17);
 await expect(page.locator('#dashboard-pagination,.dashboard-list-pager')).toHaveCount(0);
 const names=await list.locator('.dash-row strong').allTextContents();
 expect(names).toHaveLength(17);
 expect(new Set(names).size).toBe(17);
 const last=list.locator('.dash-row').last();
 await last.scrollIntoViewIfNeeded();
 await expect(last).toBeInViewport();
 const all=await list.locator('.dash-row').evaluateAll(rows=>rows.every(el=>!el.hidden&&getComputedStyle(el).display!=='none'));
 expect(all).toBe(true);
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
 await page.goto('/painel.html?currentStatusFixture=1');
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
 await expect(page.locator('#current-campaign .focus-card-name')).toContainText('Reinos de Prata');
 await expect(page.locator('#current-adventure .focus-card-name')).toContainText('As Rainhas');
 await expect(page.locator('#current-session .focus-card-name')).toContainText('Encontro das Rainhas');
 await expect(page.locator('#adventure-dashboard-list .relationship-chip')).toContainText('Campanha: Reinos de Prata');
 await expect(page.locator('#session-dashboard-list .relation-campaign').first()).toContainText('Campanha: Reinos de Prata');
 await expect(page.locator('#session-dashboard-list .relation-adventure').first()).toContainText('Aventura: As Rainhas');
 for(const id of ['campaign-dashboard-list','adventure-dashboard-list','session-dashboard-list']){
  await expect(page.locator('#'+id+' .badge.current').first()).toHaveText('Atual');
 }
 await expect(page.locator('#current-adventure .focus-card-copy')).toContainText('Campanha: Reinos de Prata');
 await expect(page.locator('#current-session .focus-card-copy')).toContainText('Aventura: As Rainhas');
});
