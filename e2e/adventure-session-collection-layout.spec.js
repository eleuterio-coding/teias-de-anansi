import{test,expect}from'@playwright/test';

const campaign={id:'collection-c1',name:'Reinos de Prata',status:'active',members:[],sessions:[
 {id:'collection-s1',number:1,title:'A convocação',status:'current',adventureId:'collection-a1',
  summary:'Os heróis são convocados.',scenes:[{id:'scene-1',title:'O encontro'}],encounters:[]}
]};
const adventure={id:'collection-a1',title:'As Rainhas',campaignId:campaign.id,status:'planned',
 type:'main',description:'As intrigas de um reino antigo.',chapters:[{id:'ch-1',title:'Primeiro ato'}],scenes:[],missions:[]};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([data.adventure]));
  localStorage.setItem('hub-rpg:standalone-sessions:v1',JSON.stringify([]));
 },{campaign,adventure});
});

test('Aventuras usa topo e grade de Campanhas; card inteiro abre detalhes e tile revela criação',async({page})=>{
 await page.goto('/aventuras.html');
 await expect(page.locator('.hub-collection-top h1')).toHaveText('Aventuras');
 await expect(page.locator('.campaign-list-heading h2')).toHaveText('Lista de Aventuras');
 const grid=page.locator('.hub-collection-grid');
 await expect(grid.locator('.hub-collection-card')).toHaveCount(2);
 const item=page.locator('[data-adventure-card="collection-a1"]');
 await expect(item.locator('.hub-collection-image')).toBeVisible();
 await expect(item.locator('.hub-collection-status')).toContainText('Planejada');
 await expect(item.locator('.hub-collection-description')).toContainText('intrigas');
 await expect(item.locator('.hub-parent-link')).toContainText('Reinos de Prata');
 await expect(item.getByRole('button',{name:'Abrir'})).toHaveCount(1);
 await expect(item.getByRole('button',{name:'Excluir'})).toHaveCount(1);
 await expect(page.locator('#adventure-create-card')).toBeHidden();
 await page.getByRole('link',{name:'Nova aventura'}).click();
 await expect(page.locator('#adventure-create-card')).toBeVisible();
 await page.locator('#cancel-adventure-create').click();
 await expect(page.locator('#adventure-create-card')).toBeHidden();
 await item.getByRole('button',{name:'Abrir'}).click();
 await expect(page.locator('#visao-geral')).toBeVisible();
 await expect(page.locator('.hub-collection-detail-back a')).toHaveAttribute('href','aventuras.html');
 await expect(page.locator('.hub-collection-grid')).toHaveCount(0);
});

test('Sessões usa mesmo cabeçalho, imagem, status e novo tile, mantendo detalhe isolado',async({page})=>{
 await page.goto('/sessoes.html');
 await expect(page.locator('.hub-collection-top h1')).toHaveText('Sessões');
 await expect(page.locator('#session-list-section .campaign-list-heading h2')).toHaveText('Lista de Sessões');
 const list=page.locator('#sessions-list');
 await expect(list.locator('.hub-collection-card')).toHaveCount(2);
 const item=list.locator('[data-session-list-id="collection-s1"]');
 await expect(item.locator('.hub-collection-status')).toContainText('Atual');
 await expect(item.locator('.hub-collection-description')).toContainText('Os heróis');
 await expect(item.locator('.hub-collection-context')).toContainText('Reinos de Prata');
 await expect(item.locator('.hub-collection-context')).toContainText('As Rainhas');
 await expect(item.getByRole('link',{name:'Abrir',exact:true})).toHaveCount(1);
 await expect(item.getByRole('button',{name:'Excluir sessão A convocação'})).toHaveCount(1);
 await expect(page.locator('#session-create-card')).toBeHidden();
 await list.getByRole('link',{name:'Nova sessão'}).click();
 await expect(page.locator('#session-create-card')).toBeVisible();
 await page.locator('#cancel-session-create').click();
 await expect(page.locator('#session-create-card')).toBeHidden();
 await item.getByRole('link',{name:'Abrir',exact:true}).click();
 await expect(page.locator('#sessions-list .session-card[data-session-id="collection-s1"]')).toBeVisible();
 await expect(page.locator('#sessions-list')).not.toHaveClass(/hub-collection-grid/);
 await expect(page.locator('#session-list-section .campaign-list-heading')).toBeHidden();
});
test('Nenhuma das duas páginas transforma conteúdo em link para verbetes',async({page})=>{
 for(const url of ['/aventuras.html','/sessoes.html']){
  await page.goto(url);
  await page.evaluate(()=>{
   const host=document.querySelector('main');
   const example=document.createElement('a');example.href='referencia.html?id=verbete-teste';
   example.className='hub-ref';example.textContent='Termo de cenário';host.appendChild(example)
  });
  await expect(page.locator('a.hub-ref,a[href^="referencia.html?id="]')).toHaveCount(0);
 }
});
test('Cards se adaptam sem overflow horizontal no celular',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const url of ['/aventuras.html','/sessoes.html']){
  await page.goto(url);
  await expect(page.locator('.hub-collection-grid .hub-collection-card')).toHaveCount(2);
  const layout=await page.evaluate(()=>({
   viewport:document.documentElement.clientWidth,
   document:document.documentElement.scrollWidth,
   cards:[...document.querySelectorAll('.hub-collection-grid .hub-collection-card')].map(x=>x.getBoundingClientRect().width)
  }));
  expect(layout.document).toBeLessThanOrEqual(layout.viewport+2);
  expect(layout.cards.every(width=>width<layout.viewport)).toBeTruthy();
 }
});

test('cards Nova Aventura e Nova Sessão reproduzem o Nova campanha, não um botão azul',async({page})=>{
 for(const [url,tileSelector] of [
  ['/aventuras.html','#open-adventure-create'],
  ['/sessoes.html','#open-session-create']
 ]){
  await page.goto(url);
  const tile=page.locator(tileSelector),card=page.locator('.hub-collection-grid .hub-collection-card:not(.hub-collection-create)').first();
  await expect(tile).toBeVisible();
  await expect(tile).toHaveClass(/campaign-create-tile/);
  await expect(tile.locator('.campaign-create-plus')).toHaveText('+');
  await expect(tile.locator('.campaign-create-tile-label')).toHaveText(/Nova (aventura|sessão)/);
  const visual=await tile.evaluate(el=>{
   const rect=node=>node.getBoundingClientRect(),style=getComputedStyle(el),plus=el.querySelector('.hub-collection-plus'),
     plusBox=rect(plus),labelBox=rect(el.querySelector('.hub-collection-create-label')),card=el.parentElement.querySelector('.hub-collection-card:not(.hub-collection-create)');
   return {
    border:style.borderTopStyle,background:style.backgroundColor,
    direction:style.flexDirection,justify:style.justifyContent,align:style.alignItems,
    tile:rect(el).toJSON(),card:rect(card).toJSON(),plus:plusBox.toJSON(),label:labelBox.toJSON(),
    plusBorder:getComputedStyle(plus).borderTopStyle
   };
  });
  expect(visual.border).toBe('dashed');
  expect(visual.background).toBe('rgba(0, 0, 0, 0)');
  expect(visual.direction).toBe('column');
  expect(visual.justify).toBe('center');
  expect(visual.align).toBe('center');
  expect(visual.plusBorder).toBe('solid');
  expect(visual.plus.width).toBeCloseTo(68,0);
  expect(visual.plus.height).toBeCloseTo(68,0);
  expect(Math.abs(visual.tile.height-visual.card.height)).toBeLessThanOrEqual(2);
  expect(Math.abs(visual.tile.width-visual.card.width)).toBeLessThanOrEqual(2);
  expect(Math.abs((visual.plus.left+visual.plus.right)/2-(visual.tile.left+visual.tile.right)/2)).toBeLessThanOrEqual(2);
  expect(visual.plus.bottom).toBeLessThan(visual.label.top);
 }
});
