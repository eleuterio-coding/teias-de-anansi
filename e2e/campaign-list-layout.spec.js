import{test,expect}from'@playwright/test';

const campaigns=[
 {id:'layout-campaign-1',name:'Reinos de Prata',description:'Uma jornada pelo continente em busca de antigas alianças.',status:'active',members:[],sessions:[{id:'session-1',title:'O Conselho da Cidade'}],activeSessionId:'session-1'},
 {id:'layout-campaign-2',name:'Segunda Campanha',status:'planned',members:[],sessions:[]}
];

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(rows=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'campaign-layout-test',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify(rows));
 },campaigns);
});

test('Campanhas exibe cards panorâmicos de largura total e maior altura no desktop',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('/campanhas.html');
 const grid=page.locator('#campaign-list>.campaign-list-grid');
 const cards=grid.locator('[data-campaign-card]');
 await expect(cards).toHaveCount(2);
 await expect(grid.locator('.campaign-create-tile')).toHaveCount(1);
 const layout=await grid.evaluate(node=>{
  const rect=node.getBoundingClientRect(),items=[...node.children].map(item=>item.getBoundingClientRect());
  const first=node.querySelector('[data-campaign-card]'),art=first.querySelector('.campaign-card-art').getBoundingClientRect();
  return{
   columns:getComputedStyle(node).gridTemplateColumns.trim().split(' ').filter(Boolean).length,
   gridWidth:rect.width,
   firstTop:items[0].top,firstBottom:items[0].bottom,firstWidth:items[0].width,
   firstHeight:items[0].height,secondTop:items[1].top,secondWidth:items[1].width,
   thirdTop:items[2].top,artHeight:art.height,artWidth:art.width,
   viewportWidth:document.documentElement.clientWidth,pageWidth:document.documentElement.scrollWidth
  };
 });
 expect(layout.columns).toBe(1);
 expect(layout.firstWidth).toBeGreaterThanOrEqual(layout.gridWidth-2);
 expect(layout.secondWidth).toBeGreaterThanOrEqual(layout.gridWidth-2);
 expect(layout.firstHeight).toBeGreaterThanOrEqual(430);
 expect(layout.artHeight).toBeGreaterThanOrEqual(345);
 expect(layout.artWidth).toBeGreaterThanOrEqual(240);
 expect(layout.secondTop).toBeGreaterThanOrEqual(layout.firstBottom-1);
 expect(layout.thirdTop).toBeGreaterThan(layout.secondTop);
 expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth+2);
 await expect(cards.first().locator('.campaign-card-stat')).toHaveCount(5);
 await expect(cards.first().locator('.campaign-card-current')).toContainText('O Conselho da Cidade');
 await expect(cards.first().locator('.campaign-card-actions a')).toHaveCount(3);
 await expect(cards.first().locator('.campaign-card-status')).toBeVisible();
});

test('Campanhas mantém largura total e não transborda no celular',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/campanhas.html');
 const grid=page.locator('#campaign-list>.campaign-list-grid');
 const cards=grid.locator('[data-campaign-card]');
 await expect(cards).toHaveCount(2);
 await expect(grid.locator('.campaign-create-tile')).toHaveCount(1);
 const layout=await grid.evaluate(node=>{
  const items=[...node.children].map(item=>item.getBoundingClientRect());
  const first=node.querySelector('[data-campaign-card]');
  const cover=first.querySelector('.campaign-card-art').getBoundingClientRect();
  return{
   columns:getComputedStyle(node).gridTemplateColumns.trim().split(' ').filter(Boolean).length,
   tops:items.map(item=>item.top),bottoms:items.map(item=>item.bottom),
   cardWidth:items[0].width,gridWidth:node.getBoundingClientRect().width,
   coverHeight:cover.height,pageWidth:document.documentElement.scrollWidth,
   viewportWidth:document.documentElement.clientWidth
  };
 });
 expect(layout.columns).toBe(1);
 expect(layout.cardWidth).toBeGreaterThanOrEqual(layout.gridWidth-2);
 expect(layout.coverHeight).toBeGreaterThanOrEqual(190);
 expect(layout.tops[1]).toBeGreaterThanOrEqual(layout.bottoms[0]-1);
 expect(layout.tops[2]).toBeGreaterThanOrEqual(layout.bottoms[1]-1);
 expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth+2);
 await expect(cards.first().locator('.campaign-card-stat')).toHaveCount(5);
 await expect(cards.first().locator('.campaign-card-actions a').first()).toBeVisible();
 await expect(cards.first().locator('.campaign-card-cover-placeholder')).toBeVisible();
});
