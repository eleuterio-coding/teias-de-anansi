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
