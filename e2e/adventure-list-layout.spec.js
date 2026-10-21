import{test,expect}from'@playwright/test';

const campaign={id:'adventure-layout-campaign',name:'A Cidadela',status:'active',system:'D&D 5.5e',members:[],sessions:[]};
const adventure={id:'adventure-layout-card',campaignId:campaign.id,title:'O Cerco',type:'main',status:'planned',description:'Os portões da cidadela estão sob ataque.'};

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'u-layout',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([data.adventure]));
 },{campaign,adventure});
});

test('card da lista usa fundo e texto de alto contraste no tema escuro',async({page})=>{
 await page.goto('/aventuras.html?campaign=adventure-layout-campaign');
 const card=page.locator('[data-adventure-card="adventure-layout-card"]');
 await expect(card).toBeVisible();
 await expect(card.locator('.campaign-card-details h2')).toHaveText('O Cerco');
 await expect(card.locator('.campaign-card-details>p:not(.mini)')).toContainText('Os portões da cidadela estão sob ataque.');
 await expect(card.locator('.hub-parent-link')).toContainText('A Cidadela');
 await expect(card.getByRole('link',{name:'Abrir',exact:true})).toHaveCount(1);
 await expect(card.getByRole('button',{name:'Excluir'})).toHaveCount(1);
 const ui=await card.evaluate(node=>{
  const color=value=>{const c=value.match(/[\d.]+/g);return c?.slice(0,3).map(Number)||[0,0,0]};
  const lum=rgb=>rgb.reduce((s,n,i)=>{const u=n/255,v=u<=.04045?u/12.92:((u+.055)/1.055)**2.4;return s+v*[.2126,.7152,.0722][i]},0);
  const ratio=(a,b)=>{const x=lum(color(a)),y=lum(color(b));return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  const r=node.getBoundingClientRect(),actions=node.querySelector('.campaign-card-actions').getBoundingClientRect();
  return{background:getComputedStyle(node).backgroundColor,
   text:getComputedStyle(node.querySelector('.campaign-card-details h2')).color,
   description:getComputedStyle(node.querySelector('.campaign-card-details>p:not(.mini)')).color,
   ratio:ratio(getComputedStyle(node.querySelector('.campaign-card-details h2')).color,getComputedStyle(node).backgroundColor),
   actionsRight:actions.right,cardRight:r.right,actionsLeft:actions.left,cardLeft:r.left,
   hubDark:document.body.classList.contains('hub-shell-enabled')&&!document.body.classList.contains('hub-content-light')};
 });
 expect(ui.hubDark).toBe(true);
 expect(ui.background).not.toBe('rgb(255, 255, 255)');
 expect(ui.ratio).toBeGreaterThanOrEqual(4.5);
 expect(ui.actionsLeft).toBeGreaterThan(ui.cardLeft);
 expect(ui.actionsRight).toBeLessThanOrEqual(ui.cardRight+1);
});

test('card organiza ações abaixo do conteúdo e evita transbordamento no celular',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/aventuras.html?campaign=adventure-layout-campaign');
 const card=page.locator('[data-adventure-card="adventure-layout-card"]');
 await expect(card.locator('.campaign-card-details h2')).toBeVisible();
 const ui=await card.evaluate(node=>{
  const box=el=>el.getBoundingClientRect(),main=box(node.querySelector('.campaign-card-main')),
   actions=box(node.querySelector('.campaign-card-actions')),card=box(node);
  return{mainBottom:main.bottom,actionsTop:actions.top,actionsRight:actions.right,cardRight:card.right,
   actionsWidth:actions.width,documentWidth:document.documentElement.scrollWidth,viewportWidth:document.documentElement.clientWidth,
   buttons:[...node.querySelectorAll('.campaign-card-actions :is(a,button)')].map(btn=>({width:box(btn).width,height:box(btn).height}))}
 });
 expect(ui.actionsTop).toBeGreaterThanOrEqual(ui.mainBottom-1);
 expect(ui.actionsRight).toBeLessThanOrEqual(ui.cardRight+1);
 expect(ui.documentWidth).toBeLessThanOrEqual(ui.viewportWidth+2);
 for(const btn of ui.buttons){expect(btn.height).toBeGreaterThanOrEqual(44);expect(btn.width).toBeGreaterThan(40)}
});

test('status da Aventura usa o mesmo seletor visual de Campanhas',async({page})=>{
 await page.goto('/aventuras.html?campaign=adventure-layout-campaign');
 const card=page.locator('[data-adventure-card="adventure-layout-card"]');
 await card.locator('.campaign-status-trigger').click();
 await card.getByRole('button',{name:'Em andamento'}).click();
 await expect(card.locator('.campaign-card-status')).toContainText('Em andamento');
 await expect(card.locator('.campaign-card-status')).toHaveClass(/status-active/);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1')||'[]'));
 expect(stored.find(a=>a.id==='adventure-layout-card')?.status).toBe('active');
});
