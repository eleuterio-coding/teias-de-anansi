import{test,expect}from'@playwright/test';

const pages=[
 ['/', 'Teias de Anansi'],
 ['/personagens.html','Personagens'],
 ['/campanhas.html','Campanhas / Mesas'],
 ['/usuarios.html','Usuários e Colaboração'],
 ['/painel.html','Painel Geral'],
 ['/configuracoes.html','Configurações']
];

async function resetStorage(page){
 await page.goto('/index.html');
 await page.evaluate(()=>localStorage.clear());
}

test.beforeEach(async({page})=>{await resetStorage(page)});

test('superfícies principais carregam sem overflow horizontal',async({page})=>{
 for(const[url,title]of pages){
  const errors=[];
  const onError=error=>errors.push(error.message);
  page.on('pageerror',onError);
  await page.goto(url);
  await expect(page.getByRole('heading',{name:title,exact:false}).first()).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow,`${url} não deve criar rolagem horizontal involuntária`).toBeLessThanOrEqual(2);
  expect(errors,`${url} não deve lançar erro JavaScript`).toEqual([]);
  page.off('pageerror',onError);
 }
});

test('Configurações persistem e preferências visuais são aplicadas',async({page})=>{
 await page.goto('/configuracoes.html');
 await page.selectOption('#workspace','mestre');
 await page.selectOption('#sheet-density','compact');
 await page.selectOption('#font-scale','large');
 await page.selectOption('#contrast','high');
 await page.selectOption('#motion','reduce');
 await page.fill('#default-dm','Mestre E2E');
 await page.fill('#default-setting','Eberron');
 await page.fill('#default-system','D&D 5.5e');
 await page.click('#save-settings');
 await expect(page.locator('#settings-status')).toContainText('Configurações salvas');
 await expect(page.locator('html')).toHaveAttribute('data-hub-font-scale','large');
 await expect(page.locator('html')).toHaveAttribute('data-hub-contrast','high');
 await page.reload();
 await expect(page.locator('#workspace')).toHaveValue('mestre');
 await expect(page.locator('#sheet-density')).toHaveValue('compact');
 await expect(page.locator('#default-dm')).toHaveValue('Mestre E2E');
 await expect(page.locator('html')).toHaveAttribute('data-hub-motion','reduce');
});

test('Nova Mesa consome defaults sem persistir preset fictício',async({page})=>{
 await page.goto('/configuracoes.html');
 await page.fill('#default-dm','Mestre E2E');
 await page.fill('#default-setting','Planescape');
 await page.fill('#default-system','D&D 5.5e');
 await page.selectOption('#house-preset','teias-v1');
 await page.click('#save-settings');
 await page.goto('/campanhas.html');
 await expect(page.locator('#campaign-dm')).toHaveValue('Mestre E2E');
 await expect(page.locator('#campaign-setting')).toHaveValue('Planescape');
 await page.fill('#campaign-name','Mesa de Homologação');
 await Promise.all([
  page.waitForURL(/mesa\.html\?id=/),
  page.click('#create-campaign')
 ]);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]'));
 expect(stored).toHaveLength(1);
 expect(stored[0]).toMatchObject({name:'Mesa de Homologação',dmName:'Mestre E2E',setting:'Planescape',system:'D&D 5.5e'});
 expect(Object.prototype.hasOwnProperty.call(stored[0],'houseRules')).toBe(false);
 expect(Object.prototype.hasOwnProperty.call(stored[0],'housePreset')).toBe(false);
});

test('Usuários usa apenas nome de usuário e senha',async({page})=>{
 await page.goto('/usuarios.html');
 await expect(page.locator('#login-username')).toHaveAttribute('type','text');
 await expect(page.locator('#login-password')).toHaveAttribute('type','password');
 await expect(page.locator('input[type="email"]')).toHaveCount(0);
 await expect(page.locator('#authorize-user-form')).toHaveCount(0);
 await expect(page.locator('#admin-tools')).toHaveCount(0);
});

test('Usuários falha de forma clara quando Firebase está indisponível',async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.goto('/usuarios.html');
 await expect(page.getByRole('heading',{name:/Usuários e Colaboração/i})).toBeVisible();
 await expect(page.locator('#provider-status')).toContainText('Firebase ainda não está conectado');
 await expect(page.locator('#login-form')).toBeHidden();
});
