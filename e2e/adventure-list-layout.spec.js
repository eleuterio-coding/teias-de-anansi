import {test,expect} from '@playwright/test';

const campaign={
 id:'adventure-layout-campaign',name:'A Cidadela',status:'active',
 system:'D&D 5.5e',members:[],sessions:[]
};
const adventure={
 id:'adventure-layout-card',campaignId:campaign.id,title:'O Cerco',
 order:1,type:'main',status:'planned',
 description:'Os portões da cidadela estão sob ataque.',
 chapters:[],scenes:[],missions:[]
};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',
   JSON.stringify({uid:'u-layout',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([data.adventure]));
 },{campaign,adventure});
});
test('Aventura: conteúdo legível, imagem à esquerda e ações no painel panorâmico',async({page})=>{
 await page.setViewportSize({width:1600,height:1000});
 await page.goto('/aventuras.html?campaign=adventure-layout-campaign');
 const card=page.locator('[data-adventure-card="adventure-layout-card"]');
 await expect(card).toBeVisible();
 await expect(card.locator('.campaign-card-details h2')).toHaveText('Aventura 1 · O Cerco');
 await expect(card.locator('.campaign-card-description')).toContainText('Os portões');
 await expect(card.locator('.hub-parent-link')).toContainText('A Cidadela');
 await expect(card.getByRole('link',{name:'Abrir',exact:true})).toHaveCount(1);
 await expect(card.getByRole('button',{name:'Excluir'})).toHaveCount(1);
 const ui=await card.evaluate(node=>{
  const rect=sel=>node.querySelector(sel).getBoundingClientRect();
  const box=node.getBoundingClientRect(),image=rect('.campaign-card-art'),
   info=rect('.campaign-card-details'),footer=rect('.campaign-card-actions'),
   status=rect('.campaign-card-status');
  const heading=node.querySelector('.campaign-card-details h2');
  return{
   layout:getComputedStyle(node).display,
   background:getComputedStyle(node).backgroundImage,
   color:getComputedStyle(heading).color,
   imageWidth:image.width,
   cardWidth:box.width,
   infoStart:info.left,imageEnd:image.right,
   footerStart:footer.left,footerEnd:footer.right,
   statusTop:status.top,
   campaignBottom:rect('.campaign-card-ancestry-status > .hub-parent-link').bottom,
   statusLeft:status.left,
   campaignLeft:rect('.campaign-card-ancestry-status > .hub-parent-link').left,
   cardTop:box.top,footerBottom:footer.bottom,cardBottom:box.bottom
  };
 });
 expect(ui.layout).toBe('grid');
 expect(ui.background).toContain('gradient');
 expect(ui.imageWidth/ui.cardWidth).toBeGreaterThan(.58);
 expect(ui.imageWidth/ui.cardWidth).toBeLessThan(.62);
 expect(ui.infoStart).toBeGreaterThanOrEqual(ui.imageEnd-3);
 expect(ui.footerStart).toBeGreaterThanOrEqual(ui.imageEnd-3);
 expect(ui.footerEnd).toBeLessThanOrEqual(1600);
 expect(ui.statusTop).toBeGreaterThanOrEqual(ui.campaignBottom-2);
 expect(Math.abs(ui.statusLeft-ui.campaignLeft)).toBeLessThan(3);
 expect(ui.footerBottom-ui.cardBottom).toBeLessThan(4);
});
test('Aventura: visual responsivo evita overflow em celular',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/aventuras.html?campaign=adventure-layout-campaign');
 const card=page.locator('[data-adventure-card="adventure-layout-card"]');
 await expect(card).toBeVisible();
 const ui=await card.evaluate(node=>{
  const cover=node.querySelector('.campaign-card-art').getBoundingClientRect(),
   info=node.querySelector('.campaign-card-details').getBoundingClientRect(),
   buttons=[...node.querySelectorAll('.campaign-card-actions :is(a,button)')]
    .map(x=>x.getBoundingClientRect());
  return{
   imageBottom:cover.bottom,infoTop:info.top,
   viewport:document.documentElement.clientWidth,
   scroll:document.documentElement.scrollWidth,
   widths:buttons.map(b=>b.width),heights:buttons.map(b=>b.height)
  };
 });
 expect(ui.imageBottom).toBeLessThanOrEqual(ui.infoTop+3);
 expect(ui.scroll).toBeLessThanOrEqual(ui.viewport+2);
 expect(ui.widths.every(x=>x>=80)).toBe(true);
 expect(ui.heights.every(x=>x>=40)).toBe(true);
});
test('Aventura: alteração de status mantém seletor e persistência',async({page})=>{
 await page.goto('/aventuras.html?campaign=adventure-layout-campaign');
 const card=page.locator('[data-adventure-card="adventure-layout-card"]');
 await card.locator('.campaign-status-trigger').click();
 await card.getByRole('button',{name:'Em andamento'}).click();
 await expect(card.locator('.campaign-card-status')).toHaveClass(/status-active/);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1')||'[]'));
 expect(stored.find(x=>x.id==='adventure-layout-card')?.status).toBe('active');
});

test('Nova aventura ocupa toda a largura e abre a oficina de criação',async({page})=>{
 await page.setViewportSize({width:1400,height:900});
 await page.goto('/aventuras.html?campaign=adventure-layout-campaign');
 const row=page.locator('.adventure-create-tile-row');
 const link=row.locator('#open-adventure-create');
 await expect(link).toBeVisible();
 const sizes=await row.evaluate(el=>{
  const a=el.getBoundingClientRect(),b=el.querySelector('a').getBoundingClientRect();
  return {rowWidth:a.width,linkWidth:b.width,leftDelta:Math.abs(a.left-b.left)};
 });
 expect(sizes.linkWidth).toBeGreaterThan(0);
 expect(Math.abs(sizes.rowWidth-sizes.linkWidth)).toBeLessThanOrEqual(3);
 expect(sizes.leftDelta).toBeLessThanOrEqual(3);
 await link.click();
 await page.locator('#new-adventure-title').fill('A Jornada');
 await page.locator('#create-adventure').click();
 await expect(page.locator('#adventure-create-content')).toBeVisible();
 await expect(page.locator('#criar-cena')).toBeVisible();
});
