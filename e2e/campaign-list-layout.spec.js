import{test,expect}from'@playwright/test';

const campaigns=[
 {id:'layout-campaign-1',name:'Reinos de Prata',status:'active',members:[],sessions:[]},
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

test('Campanhas usa exatamente duas colunas no desktop, inclusive para Nova campanha',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('/campanhas.html');
 const grid=page.locator('#campaign-list>.campaign-list-grid');
 await expect(grid.locator('[data-campaign-card]')).toHaveCount(2);
 await expect(grid.locator('.campaign-create-tile')).toHaveCount(1);
 const layout=await grid.evaluate(node=>{
  const items=[...node.children].map(item=>item.getBoundingClientRect());
  return{
   columns:getComputedStyle(node).gridTemplateColumns.trim().split(/\\s+/).length,
   firstTop:items[0].top,secondTop:items[1].top,thirdTop:items[2].top,
   firstBottom:items[0].bottom,firstWidth:items[0].width,secondWidth:items[1].width
  };
 });
 expect(layout.columns).toBe(2);
 expect(Math.abs(layout.firstTop-layout.secondTop)).toBeLessThanOrEqual(1);
 expect(Math.abs(layout.firstWidth-layout.secondWidth)).toBeLessThanOrEqual(1);
 expect(layout.thirdTop).toBeGreaterThanOrEqual(layout.firstBottom-1);
});

test('Campanhas usa uma coluna no celular, sem transbordamento horizontal',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/campanhas.html');
 const grid=page.locator('#campaign-list>.campaign-list-grid');
 await expect(grid.locator('[data-campaign-card]')).toHaveCount(2);
 await expect(grid.locator('.campaign-create-tile')).toHaveCount(1);
 const layout=await grid.evaluate(node=>{
  const items=[...node.children].map(item=>item.getBoundingClientRect());
  return{
   columns:getComputedStyle(node).gridTemplateColumns.trim().split(/\\s+/).length,
   tops:items.map(item=>item.top),
   bottoms:items.map(item=>item.bottom),
   pageWidth:document.documentElement.scrollWidth,
   viewportWidth:document.documentElement.clientWidth
  };
 });
 expect(layout.columns).toBe(1);
 expect(layout.tops[1]).toBeGreaterThanOrEqual(layout.bottoms[0]-1);
 expect(layout.tops[2]).toBeGreaterThanOrEqual(layout.bottoms[1]-1);
 expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth+2);
});
