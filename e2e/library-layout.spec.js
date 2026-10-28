import {test,expect} from '@playwright/test';

const master={uid:'u-library-layout',username:'rafael',isMaster:true,memberships:[]};
const modules=[
  'regras.html','classes.html','subclasses.html','raca.html',
  'antecedentes.html','talentos.html','maestrias-de-arma.html','monstros.html',
  'armaduras.html','armas.html','equipamentos-aventura.html','ferramentas.html',
  'montarias-veiculos.html','comercio-e-despesas.html','bugigangas.html',
  'itens-magicos.html','magias.html','idiomas.html'
];

test.beforeEach(async({page})=>{
  await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({enabled:false,authMode:'username-password'})
  }));
  await page.addInitScript(session=>{
    localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(session));
  },master);
});

async function checkHubLayout(page,path) {
  await page.goto(path,{waitUntil:'domcontentloaded'});
  // Alguns módulos reconstruem o documento após o DOMContentLoaded.
  // Aguardar o shell definitivo antes de injetar CSS de simulação do deploy.
  await expect(page.locator('.hub-app-shell')).toBeVisible({timeout:20000});
  await page.addStyleTag({url:'/site-light.css?v=library-layout-test'});
  await expect(page.locator('body')).toHaveClass(/hub-content-library/);
  await expect(page.locator('body')).not.toHaveClass(/hub-content-light/);
  await expect(page.locator('.hub-global-topbar')).toBeVisible();
  await expect(page.locator('.hub-sidebar')).toHaveCount(1);
  const ui=await page.evaluate(()=>{
    const content=document.querySelector('.hub-app-content');
    return {
      background:getComputedStyle(content).backgroundColor,
      color:getComputedStyle(content).color,
      horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
    };
  });
  expect(ui.background,path+' deve usar a superfície escura do Hub').toBe('rgb(8, 13, 20)');
  expect(ui.color,path+' deve usar o texto claro do Hub').toBe('rgb(244, 247, 251)');
  expect(ui.horizontalOverflow,path+' não deve estourar horizontalmente').toBeLessThanOrEqual(3);
}

test('os 18 links da Biblioteca abrem módulos no layout compartilhado',async({page})=>{
  test.setTimeout(180_000);
  await page.goto('/bibliotecas.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.modulos > li > a')).toHaveCount(modules.length);
  const hrefs=await page.locator('.modulos > li > a').evaluateAll(anchors=>
    anchors.map(a=>new URL(a.href).pathname.split('/').pop())
  );
  expect(hrefs).toEqual(modules);
  expect(new Set(hrefs).size).toBe(modules.length);
  for(const filename of modules){
    await test.step(filename,async()=>checkHubLayout(page,'/'+filename));
  }
});

test('páginas internas Classes, Referências e catálogo legado usam o Hub',async({page})=>{
  test.setTimeout(60_000);
  for(const path of ['/classes-v3.html','/referencia.html','/biblioteca-legado.html?modulo=Sem%20registro']){
    await test.step(path,async()=>checkHubLayout(page,path));
  }
});

test('a página inicial preserva busca, filtros e cards responsivos',async({page},testInfo)=>{
  await checkHubLayout(page,'/bibliotecas.html');
  await expect(page.locator('#catalog-search')).toBeVisible();
  await expect(page.locator('#catalog-scope')).toBeVisible();
  const columns=await page.locator('.modulos').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  if(testInfo.project.name==='mobile-chromium')expect(columns).toBe(1);
  else expect(columns).toBeGreaterThanOrEqual(2);
  await page.locator('#catalog-search').fill('magias');
  await expect(page.locator('.modulos > li:visible')).toHaveCount(1);
  await expect(page.locator('.modulos > li:visible a')).toContainText('Magias');
});

test('os 537 verbetes de Magias preservam links individuais e nomes PT-BR',async({page})=>{
  test.setTimeout(90_000);
  await checkHubLayout(page,'/magias.html?magia=fireball');
  await expect(page.locator('#lista a.item')).toHaveCount(537,{timeout:30000});
  await expect(page.locator('#detalhe h2')).toHaveText('Bola de Fogo');
  await expect(page.locator('#detalhe .spell-detail-top .badge')).toHaveCount(3); // Círculo, escola e CE
  await expect(page.locator('#detalhe .spell-detail-top')).not.toContainText('5.5e');
  await expect(page.locator('#detalhe .spell-detail-top')).not.toContainText('versão mais recente');
  for(const field of ['PDF:','Revisão core:','Completude:','Versões anteriores removidas']){
    await expect(page.locator('#detalhe')).not.toContainText(field)
  }
  await expect(page.locator('[data-hub-rules-policy]')).toHaveCount(0);
  const links=await page.locator('#lista a.item').evaluateAll(rows=>rows.map(row=>({
    name:row.querySelector('strong')?.textContent,
    id:row.dataset.id,
    linked:new URL(row.href).searchParams.get('magia')
  })));
  expect(new Set(links.map(row=>row.id)).size).toBe(537);
  expect(links.every(row=>row.name?.trim()&&row.id===row.linked)).toBe(true);
  const href=page.locator('#detalhe a.spell-verbetelink');
  await expect(href).toHaveAttribute('href','magias.html?magia=fireball');
  await page.locator('#q').fill('mísseis mágicos');
  await expect(page.locator('#lista a.item:visible')).toHaveCount(1);
  await page.locator('#q').fill('magic missile'); // Original continua pesquisável
  await expect(page.locator('#lista a.item:visible')).toHaveCount(1);
  await page.locator('#spell-clear').click();
  await expect(page.locator('#lista a.item')).toHaveCount(537);
  await page.locator('#lista a.item[data-id="magic-missile"]').click();
  await expect(page.locator('#detalhe h2')).toHaveText('Mísseis Mágicos');
  await expect(page).toHaveURL(/magia=magic-missile/);
  await page.goBack();
  await expect(page.locator('#detalhe h2')).toHaveText('Bola de Fogo');
});

test('links semânticos antigos continuam abrindo o verbete de magia traduzido',async({page})=>{
  for(const path of ['/magias.html?ref=fireball#ref-fireball','/magias.html#ref-fireball']){
    await page.goto(path,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#detalhe h2')).toHaveText('Bola de Fogo',{timeout:30000});
    await expect(page.locator('#detalhe .spell-verbetelink')).toHaveAttribute('href','magias.html?magia=fireball');
  }
});


test('cards compactos sem selos exibem contagens de itens em todos os 18 módulos',async({page},testInfo)=>{
  const modulesWithCounts=['Regras','Classes','Subclasses','Espécies','Antecedentes','Talentos','Maestrias de Arma','Monstros','Armaduras','Armas','Equipamentos de Aventura','Ferramentas','Montarias e Veículos','Comércio e Despesas','Bugigangas','Itens Mágicos','Magias','Idiomas'];
  // Fixture de interface; em produção os dados são gerados do índice semântico.
  const modulos=Object.fromEntries(modulesWithCounts.map((name,i)=>[name,i===0?1:i+1]));
  modulos.Magias=537;
  await page.route('**/dados/biblioteca-contagens.json*',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({schema:'hub-rpg.biblioteca-contagens.v1',modulos})
  }));
  await checkHubLayout(page,'/bibliotecas.html');
  await expect(page.locator('.modulos > li')).toHaveCount(18);
  await expect(page.locator('.modulos > li:first-child .contagem')).toHaveText('1 item');
  await expect(page.locator('.modulos > li[data-catalog-id="spells"] .contagem')).toHaveText('537 itens');
  await expect(page.locator('.modulos')).not.toContainText('Publicado');
  await expect(page.locator('.modulos')).not.toContainText('Criação');
  await expect(page.locator('.modulos')).not.toContainText('Ficha');
  await expect(page.locator('.modulos .catalog-badges,.modulos .catalog-badge')).toHaveCount(0);
  const heights=await page.locator('.modulos > li > a').evaluateAll(nodes=>nodes.map(n=>Math.round(n.getBoundingClientRect().height)));
  expect(Math.max(...heights)).toBeLessThanOrEqual(112);
  const columns=await page.locator('.modulos').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  if(testInfo.project.name==='mobile-chromium')expect(columns).toBe(1);
  else expect(columns).toBeGreaterThanOrEqual(2);
  await page.locator('#catalog-search').fill('magias');
  await expect(page.locator('.modulos > li:visible')).toHaveCount(1);
  await expect(page.locator('.modulos > li:visible .contagem')).toHaveText('537 itens');
});
