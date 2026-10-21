import{test,expect}from'@playwright/test';

const campaigns=[
 {id:'c-1',name:'A Cidadela',status:'active',members:[],sessions:[]},
 {id:'c-2',name:'Reinos de Prata',status:'active',members:[],sessions:[]}
];
const adventures=[
 ...Array.from({length:5},(_,i)=>({
  id:'c1-a'+(i+1),campaignId:'c-1',title:'Aventura '+(i+1),
  status:i===0?'active':i===1?'completed':i===2?'paused':'planned',
  order:i+1,type:'main',chapters:[],scenes:[],missions:[]
 })),
 {id:'c2-a1',campaignId:'c-2',title:'As Rainhas',status:'active',
  order:1,type:'main',chapters:[],scenes:[],missions:[]}
];
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({
   uid:'group-master',username:'rafael',isMaster:true,memberships:[]
  }));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify(data.campaigns));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify(data.adventures));
 },{campaigns,adventures});
});

test('Remove Início, agrupa por campanha e mostra exatamente três cards antes do scroll',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('/aventuras.html');
 await expect(page.getByRole('link',{name:'← Início'})).toHaveCount(0);
 await expect(page.locator('#adventure-list .adventure-campaign-group')).toHaveCount(2);
 const group=page.locator('[data-adventure-campaign-group="c-1"]');
 await expect(group.locator('[data-adventure-card]')).toHaveCount(5);
 await expect(group.locator('h3 a')).toHaveAttribute('href','mesa.html?id=c-1');
 const layout=await group.locator('.adventure-campaign-track').evaluate(el=>{
  const track=el.getBoundingClientRect();
  const cards=[...el.querySelectorAll('[data-adventure-card]')].map(c=>c.getBoundingClientRect().toJSON());
  return{right:track.right,client:el.clientWidth,scroll:el.scrollWidth,cards};
 });
 expect(layout.scroll).toBeGreaterThan(layout.client);
 expect(layout.cards[2].right).toBeLessThanOrEqual(layout.right+4);
 expect(layout.cards[3].left).toBeGreaterThanOrEqual(layout.right-4);
 const next=group.getByRole('button',{name:'Ver próximas aventuras de A Cidadela'});
 await expect(next).toBeEnabled();
 await next.click();
 await expect.poll(()=>group.locator('[data-adventure-track]').evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
 await expect(group.getByRole('button',{name:'Ver aventuras anteriores de A Cidadela'})).toBeEnabled();
});

test('Filtros de Status e Campanha se combinam e mantêm Nova aventura',async({page})=>{
 await page.goto('/aventuras.html');
 await page.locator('#adventure-status-filter').selectOption('active');
 await expect(page.locator('#adventure-list [data-adventure-card]')).toHaveCount(2);
 await page.locator('#adventure-campaign-filter').selectOption('c-2');
 await expect(page.locator('#adventure-list .adventure-campaign-group')).toHaveCount(1);
 await expect(page.locator('#adventure-list [data-adventure-card]')).toHaveCount(1);
 await expect(page.locator('#adventure-list')).toContainText('As Rainhas');
 await page.locator('#adventure-status-filter').selectOption('archived');
 await expect(page.locator('.adventure-groups-empty')).toBeVisible();
 await expect(page.locator('#open-adventure-create')).toBeVisible();
 await page.locator('#adventure-status-filter').selectOption('all');
 await expect(page.locator('[data-adventure-card="c2-a1"]')).toBeVisible();
});

test('Selo de campanha não vaza do card e mantém link clicável',async({page})=>{
 await page.goto('/aventuras.html');
 const card=page.locator('[data-adventure-card="c1-a1"]');
 const pill=card.locator('.adventure-card-campaign .hub-parent-link');
 await expect(pill).toContainText('A Cidadela');
 await expect(pill.getByRole('link',{name:'Abrir campanha A Cidadela'}))
  .toHaveAttribute('href','mesa.html?id=c-1');
 const info=await pill.evaluate(el=>{
  const card=el.closest('.campaign-card').getBoundingClientRect();
  const pill=el.getBoundingClientRect();
  return{cardLeft:card.left,cardRight:card.right,pillLeft:pill.left,pillRight:pill.right};
 });
 expect(info.pillLeft).toBeGreaterThanOrEqual(info.cardLeft);
 expect(info.pillRight).toBeLessThanOrEqual(info.cardRight+1);
});

test('No celular, apenas uma aventura cabe por rolagem sem overflow de página',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/aventuras.html');
 const group=page.locator('[data-adventure-campaign-group="c-1"]');
 const layout=await group.locator('.adventure-campaign-track').evaluate(el=>{
  const bounds=el.getBoundingClientRect();
  const cards=[...el.querySelectorAll('[data-adventure-card]')].map(c=>c.getBoundingClientRect().toJSON());
  return{trackLeft:bounds.left,trackRight:bounds.right,first:cards[0],second:cards[1],
    doc:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth};
 });
 expect(layout.first.right).toBeLessThanOrEqual(layout.trackRight+4);
 expect(layout.second.left).toBeGreaterThanOrEqual(layout.trackRight-4);
 expect(layout.doc).toBeLessThanOrEqual(layout.viewport+2);
 await expect(group.getByRole('button',{name:'Ver próximas aventuras de A Cidadela'})).toBeVisible();
});

test('Link para campanha recebido na URL inicial seleciona o filtro, mas usuário pode trocá-lo',async({page})=>{
 await page.goto('/aventuras.html?campaign=c-1');
 await expect(page.locator('#adventure-campaign-filter')).toHaveValue('c-1');
 await expect(page.locator('#adventure-list .adventure-campaign-group')).toHaveCount(1);
 await page.locator('#adventure-campaign-filter').selectOption('all');
 await expect(page.locator('#adventure-list .adventure-campaign-group')).toHaveCount(2);
});
