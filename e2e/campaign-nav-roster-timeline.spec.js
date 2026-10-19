import {test,expect} from '@playwright/test';

const campaign={
 id:'campaign-nav-ui-e2e',name:'Reinos de Prata',status:'active',system:'D&D 5.5e',
 members:[{id:'m-fernanda',name:'Fernanda',username:'fernanda',role:'player',characterId:'char-aluria'}],
 sessions:[],timelineNodes:[
  {id:'evt-1',text:'A primeira pista',children:[]},
  {id:'evt-2',text:'A chegada',children:[]}
 ]
};

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password',playerAccounts:[]})
 }));
 await page.addInitScript(c=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({
   uid:'dm-nav-ui',username:'rafael',isMaster:true,memberships:[]
  }));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([c]));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify([
   {id:'char-aluria',name:'Aluria',refSnapshots:{class:{name:'Patrulheiro'}},choices:{class:{level:4}}}
  ]));
 },campaign);
});

test('jogador e personagem dividem a linha e os botões são compactos no desktop',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='desktop-chromium','layout desktop');
 await page.goto('/mesa.html?id=campaign-nav-ui-e2e');
 const row=page.locator('#jogadores .roster-player').first();
 await expect(row).toBeVisible();
 const sizes=await row.evaluate(el=>{
  const rect=selector=>el.querySelector(selector).getBoundingClientRect();
  const player=rect('.roster-player-name'),character=rect('[data-member-character]');
  const open=rect('.roster-open-button'),remove=rect('[data-remove-member]');
  return {
   playerY:player.y,characterY:character.y,playerRight:player.right,
   characterX:character.x,openHeight:open.height,removeHeight:remove.height,
   openWidth:open.width,removeWidth:remove.width
  };
 });
 expect(Math.abs(sizes.playerY-sizes.characterY)).toBeLessThanOrEqual(2);
 expect(sizes.characterX).toBeGreaterThan(sizes.playerRight);
 expect(sizes.openHeight).toBeLessThanOrEqual(44);
 expect(sizes.removeHeight).toBeLessThanOrEqual(44);
 expect(sizes.openWidth).toBeLessThanOrEqual(90);
 expect(sizes.removeWidth).toBeLessThanOrEqual(90);
 await expect(row.locator('[data-member-character]')).toHaveValue('char-aluria');
});

test('linha do tempo apresenta selo ao lado do título',async({page})=>{
 await page.goto('/mesa.html?id=campaign-nav-ui-e2e');
 const group=page.locator('#linha-tempo .hub-timeline-title-group');
 await expect(group).toBeVisible();
 await expect(group.locator('h2')).toHaveText('Linha do tempo');
 await expect(group.locator('.campaign-editor-count')).toHaveText('2 eventos');
 const aligned=await group.evaluate(el=>{
  const title=el.querySelector('h2').getBoundingClientRect();
  const badge=el.querySelector('.campaign-editor-count').getBoundingClientRect();
  return {right:title.right,badgeX:badge.x,delta:Math.abs((title.top+title.height/2)-(badge.top+badge.height/2))};
 });
 expect(aligned.badgeX).toBeGreaterThan(aligned.right);
 expect(aligned.delta).toBeLessThan(4);
});

test('indicador de abas acompanha seleção e o clique navega até a seção',async({page})=>{
 await page.goto('/mesa.html?id=campaign-nav-ui-e2e');
 const nav=page.locator('.section-nav');
 await expect(nav.locator('.section-nav-indicator')).toHaveCount(1);
 await expect(nav).toHaveAttribute('data-indicator-ready','true');
 const target=nav.locator('a[href="#jogadores"]');
 await target.click();
 await expect(target).toHaveAttribute('aria-current','location');
 await expect(page).toHaveURL(/#jogadores$/);
 await expect.poll(async()=>nav.evaluate(el=>{
  const a=el.querySelector('a[aria-current="location"]');
  const indicator=el.querySelector('.section-nav-indicator');
  const computed=getComputedStyle(indicator);
  const match=/matrix\\(([^)]+)\\)/.exec(computed.transform);
  return Boolean(a&&indicator&&parseFloat(computed.width)>0&&el.dataset.indicatorReady==='true');
 })).toBe(true);
 // scroll-margin compensa o topo global e a navegação sticky.
 await expect.poll(async()=>page.locator('#jogadores').evaluate(el=>Math.round(el.getBoundingClientRect().top)),{timeout:5000}).toBeGreaterThan(0);
});

test('em tela móvel o card empilha sem transbordar e preserva área de toque',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='mobile-chromium','layout móvel');
 await page.goto('/mesa.html?id=campaign-nav-ui-e2e');
 const row=page.locator('#jogadores .roster-player').first();
 await expect(row).toBeVisible();
 const result=await row.evaluate(el=>{
  const player=el.querySelector('.roster-player-name').getBoundingClientRect();
  const select=el.querySelector('[data-member-character]').getBoundingClientRect();
  const open=el.querySelector('.roster-open-button').getBoundingClientRect();
  return {below:select.top>=player.bottom,openHeight:open.height,
   horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
 });
 expect(result.below).toBe(true);
 expect(result.openHeight).toBeGreaterThanOrEqual(44);
 if(result.horizontalOverflow>3){
  const debug=await page.evaluate(()=>{
   const width=document.documentElement.clientWidth;
   const css=el=>getComputedStyle(el);
   const isClipped=el=>{let parent=el.parentElement;while(parent){
    const style=css(parent),rect=parent.getBoundingClientRect();
    if(/auto|scroll|hidden|clip/.test(style.overflowX)&&rect.right<=width+2)return true;
    parent=parent.parentElement;
   }return false};
   return [...document.querySelectorAll('body *')].map(el=>({el,rect:el.getBoundingClientRect()}))
    .filter(x=>x.rect.width>0&&x.rect.right>width+3&&!isClipped(x.el))
    .sort((a,b)=>b.rect.right-a.rect.right).slice(0,18)
    .map(x=>({tag:x.el.tagName,cls:String(x.el.className).slice(0,100),id:x.el.id,left:Math.round(x.rect.left),right:Math.round(x.rect.right),width:Math.round(x.rect.width)}));
  });
  console.log('MOBILE_OVERFLOW_DIAGNOSTIC',JSON.stringify(debug));
 }
 expect(result.horizontalOverflow).toBeLessThanOrEqual(3);
});

test('ações da ficha são ícones quadrados na mesma linha dos campos',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='desktop-chromium','alinhamento em layout desktop');
 await page.goto('/mesa.html?id=campaign-nav-ui-e2e');
 const row=page.locator('#jogadores .roster-player').first();
 await expect(row.locator('.roster-open-button svg')).toHaveCount(1);
 await expect(row.locator('.roster-remove-button svg')).toHaveCount(1);
 await expect(row.locator('.roster-open-button')).toHaveAttribute('aria-label',/Abrir ficha/);
 await expect(row.locator('.roster-remove-button')).toHaveAttribute('aria-label',/Remover jogador/);
 const geo=await row.evaluate(el=>{
  const bounds=selector=>el.querySelector(selector).getBoundingClientRect();
  const name=bounds('.roster-player-name'),character=bounds('[data-member-character]');
  const open=bounds('.roster-open-button'),remove=bounds('.roster-remove-button');
  return {name:name.toJSON(),character:character.toJSON(),open:open.toJSON(),remove:remove.toJSON()};
 });
 console.log('ROSTER_LAYOUT',JSON.stringify(await row.evaluate(el=>{
  const rect=s=>el.querySelector(s).getBoundingClientRect().toJSON();
  return {row:el.getBoundingClientRect().toJSON(),grid:getComputedStyle(el).gridTemplateColumns,
   character:rect('.roster-player-character'),label:rect('.roster-player-character label'),
   select:rect('[data-member-character]'),name:rect('.roster-player-name'),
   actions:rect('.roster-player-actions'),open:rect('.roster-open-button'),
   remove:rect('.roster-remove-button'),
   characterArea:getComputedStyle(el.querySelector('.roster-player-character')).gridColumn,
   actionsArea:getComputedStyle(el.querySelector('.roster-player-actions')).gridColumn}
 })));
 expect(geo.open.left).toBeGreaterThanOrEqual(geo.character.right);
 expect(geo.remove.left).toBeGreaterThan(geo.open.right);
 expect(Math.abs(geo.open.top-geo.character.top)).toBeLessThanOrEqual(5);
 expect(geo.open.width).toBe(geo.open.height);
 expect(geo.remove.width).toBe(geo.remove.height);
});

test('ações da capa têm o mesmo azul semitransparente e não exibem Todas as campanhas',async({page})=>{
 await page.goto('/mesa.html?id=campaign-nav-ui-e2e');
 const actions=page.locator('.campaign-product-actions');
 await expect(actions.locator('a')).toHaveCount(2);
 await expect(actions).not.toContainText('Todas as campanhas');
 await expect(actions.getByRole('link',{name:'Nova Aventura'})).toBeVisible();
 await expect(actions.getByRole('link',{name:'Nova Sessão'})).toBeVisible();
 const fills=await actions.locator('a').evaluateAll(links=>links.map(link=>getComputedStyle(link).backgroundColor));
 expect(fills[0]).toBe(fills[1]);
 expect(fills[0]).toMatch(/rgba\(47, 156, 255, 0\.5\)/);
});
