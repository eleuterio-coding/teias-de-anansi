import{test,expect}from'@playwright/test';

const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64');
test.beforeEach(async({page})=>{
  await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({enabled:false,authMode:'username-password',playerAccounts:[]})
  }));
  await page.addInitScript(()=>{
    localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master',username:'rafael',isMaster:true,memberships:[]}));
  });
});
test('criação: Raça precede Origem, cards e tema seguem o Hub',async({page})=>{
  await page.goto('/criacao-personagem.html');
  await expect(page.locator('#builder')).toBeVisible({timeout:35000});
  const nav=await page.locator('[data-wizard-step]').evaluateAll(items=>items.map(el=>el.dataset.wizardStep));
  expect(nav).toEqual(['classe','raca','origem','atributos','progressao','equipamento','revisao']);
  await page.locator('[data-wizard-step="origem"]').click();
  const titles=await page.locator('[data-wizard-panel="origem"] .step-grid > .card > h3').allTextContents();
  expect(titles.slice(0,3)).toEqual(['Características Físicas','Características Pessoais','Imagem do Personagem']);
  await expect(page.locator('#creation-portrait-preview')).toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/hub-content-light/);
  await expect(page.locator('body')).toHaveClass(/hub-character-page/);
});
test('retrato escolhido na Origem permanece na ficha após salvar',async({page})=>{
  await page.goto('/criacao-personagem.html');
  await expect(page.locator('#builder')).toBeVisible({timeout:35000});
  await page.locator('[data-wizard-step="origem"]').click();
  await page.locator('#nome').fill('Personagem com retrato');
  await page.locator('#creation-portrait-file').setInputFiles({name:'retrato.png',mimeType:'image/png',buffer:pixel});
  await expect(page.locator('#creation-portrait-preview img')).toBeVisible();
  await page.locator('#save').click();
  const char=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:characters:v4')||'[]').find(c=>c.name==='Personagem com retrato'));
  expect(char?.portraitDataUrl).toMatch(/^data:image\/(webp|png);base64,/);
  await page.goto('/ficha-personagem.html?id='+encodeURIComponent(char.id));
  await expect(page.locator('#sheet')).toBeVisible({timeout:35000});
  await expect(page.locator('#character-portrait-preview img')).toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/hub-content-light/);
});
test('em Usuário, remover é o rótulo e o retrato está acessível pelo teclado',async({page})=>{
  await page.goto('/usuario.html');
  await expect(page.locator('#user-avatar-remove')).toHaveText('Remover');
  await expect(page.locator('#user-avatar-preview')).toHaveAttribute('role','button');
  await expect(page.locator('#user-avatar-preview')).toHaveAttribute('tabindex','0');
});
