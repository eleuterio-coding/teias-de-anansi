import { test, expect } from '@playwright/test';

const master = {uid:'u-visual-master',username:'rafael',isMaster:true,memberships:[]};
const surfaces = [
  ['/index.html','Início',false],
  ['/painel.html','Início',false],
  ['/campanhas.html','Campanhas',false],
  ['/aventuras.html','Aventuras',false],
  ['/sessoes.html','Sessões',false],
  ['/personagens.html','Personagens',false],
  ['/lista-personagens.html','Personagens',false],
  ['/bibliotecas.html','Biblioteca','library'],
  ['/regras.html','Biblioteca','library'],
  ['/armas.html','Biblioteca','library'],
  ['/classes.html','Biblioteca','library'],
  ['/criacao-personagem.html','Personagens',true],
  ['/ficha-personagem.html','Personagens',true]
];

test.beforeEach(async ({page}) => {
  await page.route('**/dados/firebase-config.json*', route => route.fulfill({
    status:200, contentType:'application/json',
    body:JSON.stringify({enabled:false,authMode:'username-password'})
  }));
  await page.addInitScript(session => {
    try { localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(session)); } catch {}
  }, master);
});

test('navegação e identidade comum nas páginas principais e catálogos', async ({page},testInfo) => {
  for (const [path,menu,reader] of surfaces) {
    await test.step(path,async () => {
      await page.goto(path,{waitUntil:'domcontentloaded'});
      // O deploy injeta site-light.css em todas as páginas. Validar também essa composição.
      await page.addStyleTag({url:'/site-light.css?v=deploy-preview'});
      await expect(page.locator('.hub-app-shell')).toBeVisible({timeout:20000});
      await expect(page.locator('script[src*="scripts/hub-ux.js"]')).toHaveCount(1);
      await expect(page.locator('.hub-global-topbar')).toBeVisible();
      await expect(page.locator('[data-hub-master-tools]')).toBeVisible();
      await expect(page.locator('[data-hub-preview-user]')).toHaveCount(1);
      await expect(page.locator('[data-hub-layout-select]')).toHaveCount(0);
      await expect(page.locator('.hub-sidebar')).toHaveCount(1);
      await expect(page.locator('.hub-sidebar [data-hub-command-open]')).toHaveCount(0);
      await expect(page.locator('.hub-sidebar .hub-sidebar-section-title')).toHaveCount(0);
      await expect(page.locator('.hub-sidebar a[href="usuarios.html"]')).toHaveCount(0);
      const sidebarRoutes=await page.locator('.hub-sidebar .hub-nav > a').evaluateAll(links=>links.map(link=>link.getAttribute('href')));
      expect(sidebarRoutes).toEqual(['painel.html','campanhas.html','aventuras.html','sessoes.html','personagens.html','npcs.html','bibliotecas.html']);
      await expect(page.locator('.hub-nav-link[aria-current="page"]').filter({hasText:menu}).first()).toHaveCount(1);
      await expect(page.locator('body')).toHaveClass(/hub-shell-enabled/);
      if (reader === 'library') await expect(page.locator('body')).toHaveClass(/hub-content-library/);
      if (reader === true) await expect(page.locator('body')).toHaveClass(/hub-content-light/);
      const layout = await page.evaluate(() => {
        const body=document.body,main=document.querySelector('.hub-app-content');
        return {
          overflow:Math.max(0,document.documentElement.scrollWidth - document.documentElement.clientWidth),
          mainBg:getComputedStyle(main).backgroundColor,
          sidebarWidth:document.querySelector('.hub-sidebar').getBoundingClientRect().width,
          topbarHeight:document.querySelector('.hub-global-topbar').getBoundingClientRect().height,
          bodyHasLight:body.classList.contains('hub-content-light'),
          bodyHasLibrary:body.classList.contains('hub-content-library')
        };
      });
      expect(layout.overflow, path+' overflow horizontal').toBeLessThanOrEqual(3);
      expect(layout.sidebarWidth).toBeGreaterThan(150);
      expect(layout.topbarHeight).toBeGreaterThanOrEqual(56);
      if (reader === 'library') {
        expect(layout.bodyHasLibrary,path+' deve usar o tema da Biblioteca').toBe(true);
        expect(layout.bodyHasLight,path+' não deve usar o leitor claro legado').toBe(false);
        expect(layout.mainBg,path+' deve ter fundo escuro como o Hub').toBe('rgb(8, 13, 20)');
      } else if (reader === true) {
        expect(layout.mainBg,path+' deve ter superfície de leitura').toBe('rgb(244, 247, 251)');
      }
      if (['/painel.html','/bibliotecas.html','/criacao-personagem.html','/armas.html'].includes(path)) {
        await page.screenshot({path:testInfo.outputPath(path.slice(1)+'.png'),animations:'disabled'});
      }
    });
  }
});

test('atalho de busca e navegação de resultados funcionam', async ({page}) => {
  await page.goto('/painel.html');
  await expect(page.locator('.hub-global-topbar')).toBeVisible();
  await page.keyboard.press('Control+k');
  const dialog=page.getByRole('dialog',{name:'Busca rápida'});
  await expect(dialog).toBeVisible();
  await page.locator('[data-hub-command-input]').fill('Biblioteca');
  await expect(page.locator('.hub-command-item[href="bibliotecas.html"]').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('menu responsivo pode abrir, navegar e fechar',async ({page},testInfo)=>{
  await page.goto('/campanhas.html');
  await expect(page.locator('.hub-app-shell')).toBeVisible();
  if(testInfo.project.name==='mobile-chromium'){
    await page.locator('[data-hub-mobile-menu]').click();
    await expect(page.locator('.hub-sidebar')).toHaveClass(/is-open/);
    await page.locator('.hub-sidebar a[href="bibliotecas.html"]').click();
    await expect(page).toHaveURL(/bibliotecas.html/);
    await expect(page.locator('.hub-app-shell')).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(3);
  }else{
    await expect(page.locator('.hub-nav')).toBeVisible();
    await expect(page.locator('[data-hub-mobile-menu]')).toBeHidden();
  }
});

test('Mestre gerencia acessos no layout padrão, com menus lateral e superior',async({page})=>{
  await page.goto('/usuarios.html');
  await expect(page.getByRole('heading',{name:'Gerenciar acessos'})).toBeVisible();
  await expect(page.locator('.hub-app-shell')).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/hub-shell-enabled/);
  await expect(page.locator('body')).not.toHaveClass(/hub-login-page/);
  await expect(page.locator('.hub-sidebar')).toBeVisible();
  await expect(page.locator('.hub-global-topbar')).toBeVisible();
  await expect(page.locator('#membership-tools')).toHaveCount(1);
});

test('menu de etapas permanece sticky acima do conteúdo da criação', async ({page},testInfo) => {
  await page.goto('/criacao-personagem.html');
  await expect(page.locator('.hub-app-shell')).toBeVisible();
  const nav=page.locator('#wizard-nav');
  await expect(nav).toBeVisible();
  const css=await nav.evaluate(el=>({position:getComputedStyle(el).position,top:getComputedStyle(el).top}));
  expect(css.position).toBe('sticky');
  expect(parseFloat(css.top)).toBeGreaterThanOrEqual(testInfo.project.name==='mobile-chromium'?58:64);
});
