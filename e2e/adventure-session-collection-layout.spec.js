import {test,expect} from '@playwright/test';

/**
 * Auditoria dos cards reais de Aventuras e Sessões.
 * O layout panorâmico segue a geometria dos cards de Campanhas:
 * capa esquerda, informações direita, status no alto, ações na base.
 */
const campaign={
 id:'collection-c1',name:'Reinos de Prata',status:'active',members:[],
 sessions:[{id:'collection-s1',number:1,order:1,title:'A convocação',
   status:'current',adventureId:'collection-a1',
   summary:'Os heróis são convocados.',scenes:[{id:'scene-1',title:'O encontro'}],encounters:[]},
 {id:'collection-s2',number:2,order:2,title:'A emboscada',
   status:'planned',adventureId:'collection-a1',
   summary:'A jornada continua.',scenes:[],encounters:[]}]
};
const adventure={
 id:'collection-a1',title:'As Rainhas',order:2,campaignId:campaign.id,
 status:'planned',type:'main',description:'As intrigas de um reino antigo.',
 chapters:[{id:'ch-1',title:'Primeiro ato'}],scenes:[],missions:[]
};
const secondAdventure={id:'collection-a2',title:'O Cerco',order:3,
 campaignId:campaign.id,status:'active',type:'side',
 description:'Uma nova ameaça à fortaleza.',chapters:[],scenes:[],missions:[]};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',
   JSON.stringify({uid:'master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([data.adventure,data.secondAdventure]));
  localStorage.setItem('hub-rpg:standalone-sessions:v1',JSON.stringify([]));
 },{campaign,adventure,secondAdventure});
});
const cases=[
 {url:'/aventuras.html',selector:'[data-adventure-card="collection-a1"]',
  heading:'Aventura 2 · As Rainhas',description:'intrigas',status:'Planejada',
  group:'[data-adventure-campaign-group="collection-c1"]',create:'#open-adventure-create',
  panel:'#adventure-create-card',cancel:'#cancel-adventure-create'},
 {url:'/sessoes.html',selector:'[data-session-list-id="collection-s1"]',
  heading:'Sessão 1 · A convocação',description:'Os heróis',status:'Atual',
  group:'.session-adventure-group',create:'#open-session-create',
  panel:'#session-create-card',cancel:'#cancel-session-create'}
];
async function geometry(card){
 return card.evaluate(node=>{
  const rect=x=>{const r=x.getBoundingClientRect();return{x:r.x,y:r.y,
   left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
  const art=node.querySelector('.campaign-card-art');
  const detail=node.querySelector('.campaign-card-details');
  const actions=node.querySelector('.campaign-card-actions');
  const badge=node.querySelector('.campaign-card-status');
  const stats=node.querySelector('.campaign-card-metrics');
  const open=actions.querySelector('a.btn');
  const del=actions.querySelector('button.danger');
  const card=rect(node);
  return {card,art:rect(art),detail:rect(detail),actions:rect(actions),
   badge:rect(badge),stats:rect(stats),open:rect(open),del:del?rect(del):null,
   display:getComputedStyle(node).display,
   columns:getComputedStyle(node).gridTemplateColumns,
   scrollWidth:document.documentElement.scrollWidth,
   viewportWidth:document.documentElement.clientWidth
  };
 });
}
test('cards panorâmicos preservam conteúdo, vínculos, ações e criação',async({page})=>{
 for(const item of cases){
  await page.goto(item.url);
  const card=page.locator(item.selector);
  await expect(page.locator(item.group)).toHaveCount(1);
  await expect(card).toBeVisible();
  await expect(card).toHaveClass(/campaign-card-featured/);
  await expect(card.locator('.campaign-card-details h2')).toHaveText(item.heading);
  await expect(card.locator('.campaign-card-description')).toContainText(item.description);
  await expect(card.locator('.campaign-card-status')).toContainText(item.status);
  await expect(card.locator('.campaign-card-art')).toHaveCount(1);
  await expect(card.locator('.campaign-card-metrics .campaign-card-stat')).toHaveCount(item.url.includes('aventuras')?1:2);
  await expect(card.locator('.campaign-card-stat-icon svg')).toHaveCount(item.url.includes('aventuras')?1:2);
  await expect(card.locator('a.hub-ref,a[data-ref-id],a[href^="referencia.html?id="]')).toHaveCount(0);
  await expect(card.getByRole('link',{name:'Abrir',exact:true})).toHaveCount(1);
  await expect(card.getByRole('button',{name:/Excluir/})).toHaveCount(1);
  const actions=card.locator('.campaign-card-actions');
  await expect(actions.locator('a.btn')).toHaveText('Abrir');
  await expect(actions.locator('button.danger')).toHaveText('Excluir');
  await expect(actions.locator('svg,.campaign-card-actions-icon')).toHaveCount(0);
  const create=page.locator(item.create);
  await expect(create).toBeVisible();
  await expect(create).toHaveClass(/campaign-create-tile/);
  await create.click();
  await expect(page.locator(item.panel)).toBeVisible();
  await page.locator(item.cancel).click();
  await expect(page.locator(item.panel)).toBeHidden();
 }
});
test('Aventuras: exibir apenas quantidade real de sessões à esquerda',async({page})=>{
 await page.goto('/aventuras.html');
 const own=page.locator('[data-adventure-card="collection-a1"]');
 const other=page.locator('[data-adventure-card="collection-a2"]');
 for(const [card,count] of [[own,'2'],[other,'0']]){
  await expect(card.locator('.campaign-card-metrics .campaign-card-stat')).toHaveCount(1);
  await expect(card.locator('.campaign-card-metrics strong')).toHaveText(count);
  await expect(card.locator('.campaign-card-metrics')).toContainText('Sessões');
  await expect(card.locator('.campaign-card-metrics')).not.toContainText('Capítulos');
  await expect(card.locator('.campaign-card-metrics')).not.toContainText('Cenas');
  const styles=await card.locator('.campaign-card-metrics').evaluate(n=>({
   columns:getComputedStyle(n).gridTemplateColumns.split(' ').filter(Boolean),
   statLeft:n.querySelector('.campaign-card-stat').getBoundingClientRect().left,
   containerLeft:n.getBoundingClientRect().left
  }));
  expect(styles.columns).toHaveLength(2);
  expect(Math.abs(styles.statLeft-styles.containerLeft)).toBeLessThanOrEqual(2);
 }
});
test('Clique no corpo e na imagem de cada card abre diretamente a entidade correspondente',async({page})=>{
 for(const item of cases){
  await page.goto(item.url);
  const card=page.locator(item.selector);
  await expect(card).toBeVisible();
  await card.scrollIntoViewIfNeeded();
  const image=await card.locator('.campaign-card-art').boundingBox();
  expect(image).toBeTruthy();
  await page.mouse.click(image.x+image.width/2,image.y+image.height/2);
  await expect(page).toHaveURL(item.url.includes('aventuras')
   ?/aventuras\.html\?.*id=collection-a1/
   :/sessoes\.html\?.*id=collection-s1/);
  await page.goto(item.url);
  const title=page.locator(item.selector+' .campaign-card-details h2');
  await title.scrollIntoViewIfNeeded();
  const b=await title.boundingBox();
  await page.mouse.click(b.x+b.width/2,b.y+b.height/2);
  await expect(page).toHaveURL(item.url.includes('aventuras')
   ?/aventuras\.html\?.*id=collection-a1/
   :/sessoes\.html\?.*id=collection-s1/);
 }
});
test('Abrir e Excluir permanecem sem ícones, incluindo versões antigas injetadas',async({page})=>{
 for(const item of cases){
  await page.goto(item.url);
  const card=page.locator(item.selector);
  await expect(card).toBeVisible();
  const links=card.locator('.campaign-card-actions>a.btn');
  const buttons=card.locator('.campaign-card-actions>button.danger');
  await expect(links).toHaveText('Abrir');
  await expect(buttons).toHaveText('Excluir');
  await expect(card.locator('.campaign-card-actions :is(svg,i,img,.campaign-card-actions-icon)')).toHaveCount(0);
  const coverage=await card.evaluate(node=>{
   const controls=[...node.querySelectorAll('.campaign-card-actions>a.btn,.campaign-card-actions>button.danger')];
   return controls.map(control=>{
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('aria-hidden','true');
    control.appendChild(svg);
    const hidden=getComputedStyle(svg).display==='none';
    const before=getComputedStyle(control,'::before').content;
    const after=getComputedStyle(control,'::after').content;
    svg.remove();
    return {hidden,before,after};
   });
  });
  expect(coverage).toHaveLength(2);
  for(const check of coverage){
   expect(check.hidden).toBe(true);
   expect(['none','normal','""']).toContain(check.before);
   expect(['none','normal','""']).toContain(check.after);
  }
 }
});
test('desktop: Aventuras e Sessões aparecem em duas colunas de cards',async({page})=>{
 await page.setViewportSize({width:1600,height:1000});
 for(const item of cases){
  await page.goto(item.url);
  const track=page.locator(item.url.includes('aventuras')
   ?'#adventure-list .adventure-campaign-track'
   :'#sessions-list .session-adventure-track').first();
  await expect(track).toBeVisible();
  const cards=track.locator('.campaign-card-featured');
  await expect(cards).toHaveCount(2);
  const columns=await track.evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').filter(Boolean));
  expect(columns).toHaveLength(2);
  const bounds=await cards.evaluateAll(nodes=>nodes.map(x=>{
   const r=x.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}
  }));
  expect(Math.abs(bounds[0].y-bounds[1].y)).toBeLessThan(3);
  expect(Math.abs(bounds[0].width-bounds[1].width)).toBeLessThan(3);
  expect(bounds[1].x).toBeGreaterThan(bounds[0].x+bounds[0].width);
 }
});
test('desktop: capa à esquerda, painel à direita, status no alto e ações na base',async({page},testInfo)=>{
 await page.setViewportSize({width:1600,height:1000});
 for(const item of cases){
  await page.goto(item.url);
  const card=page.locator(item.selector);
  await expect(card).toBeVisible();
  const g=await geometry(card);
  expect(g.display).toBe('grid');
  expect(g.art.width/g.card.width).toBeGreaterThan(.58);
  expect(g.art.width/g.card.width).toBeLessThan(.62);
  expect(Math.abs(g.art.left-g.card.left)).toBeLessThan(3);
  expect(Math.abs(g.art.top-g.card.top)).toBeLessThan(3);
  expect(g.art.bottom).toBeGreaterThan(g.card.bottom-4);
  expect(g.detail.left).toBeGreaterThanOrEqual(g.art.right-3);
  expect(g.badge.right).toBeLessThanOrEqual(g.card.right-5);
  expect(g.badge.top-g.card.top).toBeLessThan(45);
  expect(g.actions.left).toBeGreaterThanOrEqual(g.art.right-2);
  expect(g.actions.bottom).toBeLessThanOrEqual(g.card.bottom+3);
  expect(g.actions.top).toBeGreaterThanOrEqual(g.stats.bottom-2);
  expect(g.open.left).toBeLessThan(g.del.left);
  expect(Math.abs(g.open.width-g.del.width)).toBeLessThan(2);
  expect(Math.abs(g.open.height-g.del.height)).toBeLessThan(2);
  expect(Math.abs(g.open.top-g.del.top)).toBeLessThan(2);
  expect(g.open.height).toBeGreaterThanOrEqual(42);
  await testInfo.attach((item.url.includes('aventuras')?'aventura':'sessao')+'-desktop',
    {body:await card.screenshot(),contentType:'image/png'});
 }
});
test('notebook: a capa permanece à esquerda mesmo com o painel lateral do Hub',async({page},testInfo)=>{
 await page.setViewportSize({width:1120,height:900});
 for(const item of cases){
  await page.goto(item.url);
  const card=page.locator(item.selector);
  await expect(card).toBeVisible();
  const g=await geometry(card);
  const track=page.locator(item.url.includes('aventuras')
    ?'#adventure-list .adventure-campaign-track'
    :'#sessions-list .session-adventure-track').first();
  const cols=await track.evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').filter(Boolean));
  expect(cols).toHaveLength(2);
  expect(g.card.width).toBeGreaterThan(320);
  expect(g.display).toBe('grid');
  expect(g.art.width/g.card.width).toBeGreaterThan(.51);
  expect(g.art.width/g.card.width).toBeLessThan(.55);
  expect(g.art.right).toBeLessThanOrEqual(g.detail.left+3);
  expect(g.art.bottom).toBeGreaterThan(g.actions.bottom-4);
  expect(g.badge.right).toBeLessThanOrEqual(g.card.right-5);
  expect(g.open.left).toBeLessThan(g.del.left);
  expect(Math.abs(g.open.width-g.del.width)).toBeLessThan(2);
  expect(Math.abs(g.open.top-g.del.top)).toBeLessThan(2);
  await testInfo.attach((item.url.includes('aventuras')?'aventura':'sessao')+'-notebook',
    {body:await card.screenshot(),contentType:'image/png'});
 }
});
test('celular: capa acima das informações, ações abaixo e sem overflow horizontal',async({page},testInfo)=>{
 await page.setViewportSize({width:390,height:844});
 for(const item of cases){
  await page.goto(item.url);
  const card=page.locator(item.selector);
  await expect(card).toBeVisible();
  const g=await geometry(card);
  expect(g.scrollWidth).toBeLessThanOrEqual(g.viewportWidth+2);
  expect(g.card.width).toBeLessThanOrEqual(g.viewportWidth);
  expect(g.art.bottom).toBeLessThanOrEqual(g.detail.top+3);
  expect(g.actions.top).toBeGreaterThanOrEqual(g.detail.bottom-2);
  expect(g.open.width).toBeGreaterThanOrEqual(80);
  expect(g.open.height).toBeGreaterThanOrEqual(42);
  expect(Math.abs(g.open.width-g.del.width)).toBeLessThan(2);
  expect(Math.abs(g.open.top-g.del.top)).toBeLessThan(2);
  expect(g.del.right).toBeLessThanOrEqual(g.card.right+2);
  await testInfo.attach((item.url.includes('aventuras')?'aventura':'sessao')+'-celular',
    {body:await card.screenshot(),contentType:'image/png'});
 }
});
test('status das Sessões continua editável com persistência',async({page})=>{
 await page.goto('/sessoes.html');
 const card=page.locator(cases[1].selector);
 await card.locator('.campaign-status-trigger').click();
 await card.getByRole('button',{name:'Próxima'}).click();
 await expect(card.locator('.campaign-card-status')).toHaveClass(/status-next/);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]'));
 expect(stored[0].sessions.find(row=>row.id==='collection-s1')?.status).toBe('next');
});
