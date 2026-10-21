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

test('Aventuras usa cards de Campanhas agrupados e mantém os vínculos',async({page})=>{
 await page.goto('/aventuras.html');
 await expect(page.locator('.hub-collection-top h1')).toHaveText('Aventuras');
 await expect(page.locator('.campaign-list-heading h2')).toHaveText('Lista de Aventuras');
 const group=page.locator('#adventure-list [data-adventure-campaign-group="collection-c1"]');
 await expect(group.locator('[data-adventure-card]')).toHaveCount(1);
 await expect(group.locator('h3 a')).toContainText('Reinos de Prata');
 await expect(page.locator('#adventure-list #open-adventure-create')).toHaveCount(1);
 await expect(page.locator('.hub-collection-home a')).toHaveCount(0);
 await expect(page.locator('#adventure-status-filter')).toHaveValue('all');
 await expect(page.locator('#adventure-campaign-filter')).toHaveValue('all');
 const item=page.locator('[data-adventure-card="collection-a1"]');
 await expect(item).toHaveClass(/campaign-card/);
 await expect(item.locator('.campaign-card-cover')).toHaveCount(0);
 await expect(item.locator('.campaign-card-status')).toContainText('Planejada');
 await expect(item.locator('.campaign-card-details>p:not(.mini)')).toContainText('intrigas');
 await expect(item.locator('.hub-parent-link')).toContainText('Reinos de Prata');
 await expect(item.getByRole('link',{name:'Abrir',exact:true})).toHaveCount(1);
 await expect(item.getByRole('button',{name:'Excluir'})).toHaveCount(1);
 await expect(page.locator('#adventure-create-card')).toBeHidden();
 await page.getByRole('link',{name:'Nova aventura'}).click();
 await expect(page.locator('#adventure-create-card')).toBeVisible();
 await page.locator('#cancel-adventure-create').click();
 await expect(page.locator('#adventure-create-card')).toBeHidden();
 await item.getByRole('link',{name:'Abrir',exact:true}).click();
 await expect(page.locator('#visao-geral')).toBeVisible();
 await expect(page.locator('.hub-collection-detail-back a')).toHaveAttribute('href','aventuras.html');
 await expect(page.locator('#adventure-list')).toHaveCount(0);
});

test('Sessões usa a mesma estrutura de cards de Campanhas, inclusive status e botões',async({page})=>{
 await page.goto('/sessoes.html');
 await expect(page.locator('.hub-collection-top h1')).toHaveText('Sessões');
 await expect(page.locator('#session-list-section .campaign-list-heading h2')).toHaveText('Lista de Sessões');
 const grid=page.locator('#sessions-list .campaign-list-grid');
 await expect(grid.locator('.campaign-card')).toHaveCount(2);
 const item=page.locator('[data-session-list-id="collection-s1"]');
 await expect(item).toHaveClass(/campaign-card/);
 await expect(item.locator('.campaign-card-status')).toContainText('Atual');
 await expect(item.locator('.campaign-card-details>p:not(.mini)')).toContainText('Os heróis');
 await expect(item.locator('.session-card-context')).toContainText('Reinos de Prata');
 await expect(item.locator('.session-card-context')).toContainText('As Rainhas');
 await expect(item.getByRole('link',{name:'Abrir',exact:true})).toHaveCount(1);
 await expect(item.getByRole('button',{name:'Excluir sessão A convocação'})).toHaveText('Excluir');
 await expect(item.locator('a[href^="referencia.html"],a.hub-ref')).toHaveCount(0);
 await expect(page.locator('#session-create-card')).toBeHidden();
 await page.getByRole('link',{name:'Nova sessão'}).click();
 await expect(page.locator('#session-create-card')).toBeVisible();
 await page.locator('#cancel-session-create').click();
 await expect(page.locator('#session-create-card')).toBeHidden();
 await item.locator('.campaign-status-trigger').click();
 await item.getByRole('button',{name:'Próxima'}).click();
 await expect(item.locator('.campaign-card-status')).toHaveClass(/status-next/);
 await expect(item.locator('.campaign-status-trigger')).toContainText('Próxima');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]'));
 expect(saved[0].sessions.find(x=>x.id==='collection-s1')?.status).toBe('next');
 await item.getByRole('link',{name:'Abrir',exact:true}).click();
 await expect(page.locator('#sessions-list .session-card[data-session-id="collection-s1"]')).toBeVisible();
 await expect(page.locator('#sessions-list')).not.toHaveClass(/hub-collection-grid/);
 await expect(page.locator('#session-list-section .campaign-list-heading')).toBeHidden();
});
test('Campanhas, Aventuras e Sessões preservam geometria e controles dos cards, mas Aventuras tem faixa própria',async({page})=>{
 const result=[];
 for(const [url,selector] of [
  ['/campanhas.html','#campaign-list [data-campaign-card]'],
  ['/aventuras.html','#adventure-list [data-adventure-card]'],
  ['/sessoes.html','#sessions-list [data-session-list-id]']
 ]){
  await page.goto(url);
  const card=page.locator(selector).first();
  await expect(card).toBeVisible();
  const css=await card.evaluate(node=>{
   const sheet=getComputedStyle(node),status=getComputedStyle(node.querySelector('.campaign-card-status')),
    open=getComputedStyle(node.querySelector('.campaign-card-actions .btn')),
    deleteStyle=getComputedStyle(node.querySelector('.campaign-card-actions .danger'));
   return{borderRadius:sheet.borderRadius,padding:sheet.padding,
     cardDisplay:sheet.display,minHeight:sheet.minHeight,statusRadius:status.borderRadius,
     statusPosition:status.position,openHeight:open.minHeight,deleteHeight:deleteStyle.minHeight,
     hasStatusMenu:!!node.querySelector('.campaign-status-disclosure'),
     noGlossaryLinks:!node.querySelector('a.hub-ref,a[data-ref-id],a[href^="referencia.html?id="]')}
  });
  result.push(css);
 }
 expect(result[1]).toEqual(result[0]);
 expect(result[2]).toEqual(result[0]);
 await page.goto('/aventuras.html');
 await expect(page.locator('.adventure-campaign-track')).toHaveCount(1);
 await expect(page.locator('#adventure-list>.campaign-list-grid')).toHaveCount(0);
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
  const selector=url.includes('aventuras')?'#adventure-list .campaign-card':'#sessions-list .campaign-card';
  await expect(page.locator(selector)).toHaveCount(2);
  const layout=await page.evaluate(selector=>({
   viewport:document.documentElement.clientWidth,
   document:document.documentElement.scrollWidth,
   cards:[...document.querySelectorAll(selector)].map(x=>x.getBoundingClientRect().width)
  }),selector);
  expect(layout.document).toBeLessThanOrEqual(layout.viewport+2);
  expect(layout.cards.every(width=>width<=layout.viewport)).toBeTruthy();
 }
});

test('Nova Aventura replica o tile Nova campanha e Nova Sessão preserva seu tile',async({page})=>{
 for(const [url,tileSelector] of [
  ['/aventuras.html','#open-adventure-create'],
  ['/sessoes.html','#open-session-create']
 ]){
  await page.goto(url);
  const tile=page.locator(tileSelector);
  await expect(tile).toBeVisible();
  await expect(tile).toHaveClass(/campaign-create-tile/);
  await expect(tile.locator('.campaign-create-plus')).toHaveText('+');
  await expect(tile.locator('.campaign-create-tile-label')).toHaveText(/Nova (aventura|sessão)/);
  const visual=await tile.evaluate(el=>{
   const rect=node=>node.getBoundingClientRect(),style=getComputedStyle(el),
    plus=el.querySelector('.campaign-create-plus'),label=el.querySelector('.campaign-create-tile-label'),
    card=document.querySelector(el.id==='open-adventure-create'?'#adventure-list [data-adventure-card]':'#sessions-list [data-session-list-id]');
   return{
    border:style.borderTopStyle,direction:style.flexDirection,justify:style.justifyContent,align:style.alignItems,
    tile:rect(el).toJSON(),card:card?rect(card).toJSON():null,plus:rect(plus).toJSON(),label:rect(label).toJSON(),
    plusBorder:getComputedStyle(plus).borderTopStyle
   };
  });
  expect(visual.border).toBe('dashed');
  expect(visual.direction).toBe('column');
  expect(visual.justify).toBe('center');
  expect(visual.align).toBe('center');
  expect(visual.plusBorder).toBe('solid');
  expect(visual.plus.width).toBeCloseTo(68,0);
  expect(visual.plus.height).toBeCloseTo(68,0);
  if(url.includes('sessoes')){
   expect(Math.abs(visual.tile.height-visual.card.height)).toBeLessThanOrEqual(2);
   expect(Math.abs(visual.tile.width-visual.card.width)).toBeLessThanOrEqual(2);
  }else{
   expect(visual.tile.width).toBeGreaterThan(200);
   expect(visual.tile.height).toBeGreaterThanOrEqual(290);
  }
  expect(Math.abs((visual.plus.left+visual.plus.right)/2-(visual.tile.left+visual.tile.right)/2)).toBeLessThanOrEqual(2);
  expect(visual.plus.bottom).toBeLessThan(visual.label.top);
 }
});
