import {test,expect} from '@playwright/test';

const session={uid:'idiomas-smoke-local',username:'auditoria',isMaster:true,memberships:[]};

test.beforeEach(async({page})=>{
  await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})
  }));
  await page.addInitScript(value=>localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(value)),session);
});

test('a página inicial é navegável e abre a Biblioteca',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/index.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.hub-app-shell')).toBeVisible({timeout:20000});
  await expect(page.locator('main a[href^="bibliotecas.html"]')).toBeVisible();
  await page.locator('main a[href^="bibliotecas.html"]').click();
  await expect(page).toHaveURL(/bibliotecas\.html/);
  await expect(page.locator('.modulos li a')).toHaveCount(18);
  expect(errors).toEqual([]);
});

test('os 40 idiomas carregam e seus cards permanecem interativos',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/idiomas.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.hub-app-shell')).toBeVisible({timeout:20000});
  await expect(page.locator('#resultado')).toHaveText('40 de 40 idiomas',{timeout:20000});
  const cards=page.locator('#lista details.idioma');
  await expect(cards).toHaveCount(40);
  await page.locator('#busca').fill('Orc');
  const orc=page.locator('#lista details.idioma').filter({has:page.locator('summary strong:text-is("Orc")')});
  await expect(orc).toHaveCount(1);
  await orc.locator('summary').click();
  await expect(orc).toHaveAttribute('open','');
  const content=await orc.locator('.corpo').innerText();
  for(const field of ['Falantes Típicos:','Alfabeto:','Descrição:','Livro:']){
    expect(content).toContain(field);
  }
  expect(content).not.toContain('Proveniência');
  expect(content).not.toContain('Consultar fonte');
  await page.locator('#busca').fill('Táurico');
  await expect(page.locator('#resultado')).toHaveText('1 de 40 idiomas');
  await expect(page.locator('#lista summary strong')).toHaveText('Táurico');
  await page.locator('#busca').fill('');
  await expect(page.locator('#lista details.idioma')).toHaveCount(40);
  expect(errors).toEqual([]);
});
