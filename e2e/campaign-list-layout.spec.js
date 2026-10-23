import{test,expect}from'@playwright/test';

const coverImageUrl='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#375676"/></svg>');
const campaigns=[
 {id:'layout-campaign-1',name:'Reinos de Prata',description:'Uma jornada pelo continente em busca de antigas alianças.',status:'active',coverImageUrl,members:[],sessions:[{id:'session-1',title:'O Conselho da Cidade'}],activeSessionId:'session-1'},
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

test('cards desktop: largura total, capa em toda a altura e controles com margens simétricas',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('/campanhas.html');
 const grid=page.locator('#campaign-list>.campaign-list-grid');
 const cards=grid.locator('[data-campaign-card]');
 await expect(cards).toHaveCount(2);
 await expect(grid.locator('.campaign-create-tile .campaign-create-plus')).toHaveText('+');
 await expect(grid.locator('.campaign-create-tile .campaign-create-tile-label')).toHaveText('Nova Campanha');
 await expect(cards.first().locator('.campaign-card-stat')).toHaveCount(2);
 await expect(cards.first().locator('.campaign-card-stat span')).toHaveText(['Aventuras','Sessão']);
 await expect(cards.first().locator('.campaign-card-actions a')).toHaveCount(1);
 await expect(cards.first().locator('.campaign-card-actions button')).toHaveCount(1);
 await expect(cards.first().locator('.campaign-card-actions a')).toHaveText('Abrir');
 await expect(cards.first().locator('.campaign-card-actions button')).toHaveText('Excluir');
 await expect(cards.first().locator('.campaign-status-disclosure')).toBeVisible();
 await expect(cards.first().locator('.campaign-card-cover')).toBeVisible();
 const layout=await grid.evaluate(node=>{
  const first=node.querySelector('[data-campaign-card]'),
   second=node.querySelectorAll('[data-campaign-card]')[1],
   card=first.getBoundingClientRect(),art=first.querySelector('.campaign-card-art').getBoundingClientRect(),
   img=first.querySelector('.campaign-card-cover').getBoundingClientRect(),
   detail=first.querySelector('.campaign-card-details').getBoundingClientRect(),
   open=first.querySelector('.campaign-card-actions a').getBoundingClientRect(),
   del=first.querySelector('.campaign-card-actions button').getBoundingClientRect(),
   status=first.querySelector('.campaign-card-status').getBoundingClientRect();
  return{
   columns:getComputedStyle(node).gridTemplateColumns.trim().split(' ').filter(Boolean).length,
   gridWidth:node.getBoundingClientRect().width,cardWidth:card.width,cardHeight:card.height,
   secondTop:second.getBoundingClientRect().top,cardBottom:card.bottom,
   artHeight:art.height,artBottom:art.bottom,imgHeight:img.height,
   artLeft:art.left,cardLeft:card.left,
   detailsLeft:detail.left,detailsRight:detail.right,
   artWidth:art.width,detailsWidth:detail.width,
   openLeft:open.left,delRight:del.right,
   bottomGap:card.bottom-del.bottom,
   rightGap:card.right-del.right,
   openLeftGap:open.left-detail.left,
   statusTopGap:status.top-card.top,
   statusRightGap:card.right-status.right,
   pageWidth:document.documentElement.scrollWidth,
   viewportWidth:document.documentElement.clientWidth
  };
 });
 expect(layout.columns).toBe(1);
 expect(layout.cardWidth).toBeGreaterThanOrEqual(layout.gridWidth-2);
 expect(layout.cardHeight).toBeGreaterThanOrEqual(450);
 expect(layout.artWidth).toBeGreaterThan(layout.detailsWidth);
 expect(layout.artWidth/layout.cardWidth).toBeGreaterThan(0.64);
 expect(layout.artHeight).toBeGreaterThanOrEqual(layout.cardHeight-2);
 expect(layout.imgHeight).toBeGreaterThanOrEqual(layout.artHeight-2);
 expect(Math.abs(layout.artBottom-layout.cardBottom)).toBeLessThanOrEqual(2);
 expect(Math.abs(layout.artLeft-layout.cardLeft)).toBeLessThanOrEqual(2);
 expect(Math.abs(layout.bottomGap-layout.rightGap)).toBeLessThanOrEqual(2);
 expect(Math.abs(layout.openLeftGap-layout.rightGap)).toBeLessThanOrEqual(2);
 expect(Math.abs(layout.statusTopGap-layout.statusRightGap)).toBeLessThanOrEqual(2);
 expect(Math.abs(layout.statusRightGap-layout.rightGap)).toBeLessThanOrEqual(2);
 expect(layout.secondTop).toBeGreaterThanOrEqual(layout.cardBottom);
 expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth+2);
});

test('mobile: imagem horizontal, dois indicadores, duas ações e nenhuma rolagem lateral',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/campanhas.html');
 const grid=page.locator('#campaign-list>.campaign-list-grid');
 const cards=grid.locator('[data-campaign-card]');
 await expect(cards).toHaveCount(2);
 await expect(cards.first().locator('.campaign-card-stat')).toHaveCount(2);
 await expect(cards.first().locator('.campaign-card-actions a')).toHaveCount(1);
 await expect(cards.first().locator('.campaign-card-actions button')).toHaveCount(1);
 await expect(grid.locator('.campaign-create-tile .campaign-create-plus')).toHaveText('+');
 await expect(grid.locator('.campaign-create-tile .campaign-create-tile-label')).toHaveText('Nova Campanha');
 const layout=await grid.evaluate(node=>{
  const first=node.querySelector('[data-campaign-card]'),
   rows=[...node.children].map(x=>x.getBoundingClientRect()),
   card=first.getBoundingClientRect(),
   art=first.querySelector('.campaign-card-art').getBoundingClientRect(),
   img=first.querySelector('img').getBoundingClientRect(),
   status=first.querySelector('.campaign-card-status').getBoundingClientRect(),
   del=first.querySelector('[data-delete]').getBoundingClientRect(),
   open=first.querySelector('.campaign-card-actions a').getBoundingClientRect();
  return{
   columns:getComputedStyle(node).gridTemplateColumns.trim().split(' ').filter(Boolean).length,
   coverHeight:art.height,imgHeight:img.height,cardWidth:card.width,gridWidth:node.getBoundingClientRect().width,
   secondTop:rows[1].top,firstBottom:rows[0].bottom,thirdTop:rows[2].top,secondBottom:rows[1].bottom,
   leftGap:open.left-card.left,rightGap:card.right-del.right,bottomGap:card.bottom-del.bottom,
   statusTopGap:status.top-card.top,statusRightGap:card.right-status.right,
   viewportWidth:document.documentElement.clientWidth,pageWidth:document.documentElement.scrollWidth
  };
 });
 expect(layout.columns).toBe(1);
 expect(layout.cardWidth).toBeGreaterThanOrEqual(layout.gridWidth-2);
 expect(layout.coverHeight).toBeGreaterThanOrEqual(205);
 expect(layout.imgHeight).toBeGreaterThanOrEqual(layout.coverHeight-2);
 expect(layout.secondTop).toBeGreaterThanOrEqual(layout.firstBottom);
 expect(layout.thirdTop).toBeGreaterThanOrEqual(layout.secondBottom);
 expect(Math.abs(layout.leftGap-layout.rightGap)).toBeLessThanOrEqual(2);
 expect(Math.abs(layout.bottomGap-layout.rightGap)).toBeLessThanOrEqual(2);
 expect(Math.abs(layout.statusTopGap-layout.statusRightGap)).toBeLessThanOrEqual(2);
 expect(Math.abs(layout.statusRightGap-layout.rightGap)).toBeLessThanOrEqual(2);
 expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth+2);
 await expect(cards.nth(1).locator('.campaign-card-cover-placeholder')).toBeVisible();
});

test('Nova Campanha usa CTA elegante com apenas o símbolo + e o título',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/campanhas.html');
 const tile=page.locator('#open-campaign-create');
 await expect(tile).toHaveAttribute('href','nova-campanha.html');
 await expect(tile.locator(':scope > *')).toHaveCount(2);
 await expect(tile.locator('.campaign-create-plus')).toHaveText('+');
 await expect(tile.locator('.campaign-create-tile-label')).toHaveText('Nova Campanha');
 const desktop=await tile.evaluate(node=>{
  const css=getComputedStyle(node),plus=node.querySelector('.campaign-create-plus');
  const circle=getComputedStyle(plus),bounds=node.getBoundingClientRect();
  return{display:css.display,direction:css.flexDirection,
   borderStyle:css.borderTopStyle,background:css.backgroundImage,
   height:bounds.height,circleWidth:plus.getBoundingClientRect().width,
   circleHeight:plus.getBoundingClientRect().height,
   circleRadius:circle.borderRadius};
 });
 expect(desktop.display).toBe('flex');
 expect(desktop.direction).toBe('row');
 expect(desktop.borderStyle).toBe('solid');
 expect(desktop.background).toContain('gradient');
 expect(desktop.height).toBeGreaterThanOrEqual(124);
 expect(desktop.circleWidth).toBe(desktop.circleHeight);
 expect(desktop.circleRadius).toBe('50%');
 await page.setViewportSize({width:390,height:844});
 const mobile=await tile.evaluate(node=>({
  height:node.getBoundingClientRect().height,
  columns:getComputedStyle(node).flexDirection,
  pageWidth:document.documentElement.scrollWidth,
  viewportWidth:document.documentElement.clientWidth
 }));
 expect(mobile.columns).toBe('row');
 expect(mobile.height).toBeGreaterThanOrEqual(102);
 expect(mobile.pageWidth).toBeLessThanOrEqual(mobile.viewportWidth+2);
});
