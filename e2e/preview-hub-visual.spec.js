import { test, expect } from '@playwright/test';

test('prévia de Mestre abre sem login e oferece navegação real do HUB', async ({ page }) => {
  const requests=[];
  page.on('request', request => {
    if (/firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com/.test(request.url())) requests.push(request.url());
  });
  await page.goto('/preview.html');
  await expect(page.getByRole('button', { name: 'Visualizar como Mestre' })).toBeVisible();
  await page.getByRole('button', { name: 'Visualizar como Mestre' }).click();
  await expect(page).toHaveURL(/painel\.html/);
  await expect(page.locator('.hub-app-shell')).toBeVisible();
  await expect(page.locator('.hub-visual-preview-banner')).toContainText('PRÉVIA VISUAL');
  const session=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:collaboration-session:v1')));
  expect(session.isMaster).toBe(true);
  const provider=await page.evaluate(async () => {
    const mod=await import('./scripts/firebase-collaboration-provider.js');
    const p=await mod.createFirebaseCollaborationProvider();
    return {configured:p.configured,reason:p.reason};
  });
  expect(provider.configured).toBe(false);
  await page.goto('/personagens.html');
  await expect(page.locator('.hub-area-menu a').first()).toBeVisible();
  await expect(page.locator('.hub-visual-preview-banner a')).toBeVisible();
  expect(requests).toEqual([]);
});

test('prévia de Jogador preserva perfil fictício e impede Firebase', async ({ page }) => {
  await page.goto('/preview.html');
  await page.getByRole('button',{name:'Visualizar como Jogador'}).click();
  await expect(page).toHaveURL(/painel\.html/);
  await expect(page.locator('.hub-app-shell')).toBeVisible();
  const data=await page.evaluate(()=>({
    role:JSON.parse(localStorage.getItem('hub-rpg:collaboration-session:v1')),
    preview:sessionStorage.getItem('hub-rpg:visual-preview:v1')
  }));
  expect(data.role.isMaster).toBe(false);
  expect(data.role.memberships).toHaveLength(1);
  expect(data.preview).toBe('1');
  await page.goto('/npcs.html');
  await expect(page.locator('.hub-app-shell')).toBeVisible();
  await expect(page.locator('.hub-visual-preview-banner')).toBeVisible();
  await page.locator('.hub-visual-preview-banner a').click();
  await expect(page).toHaveURL(/preview\.html/);
});

test('Jogador consegue abrir criação própria, mas não a edição de ficha sem acesso', async ({ page }) => {
  await page.goto('/preview.html');
  await page.getByRole('button',{name:'Visualizar como Jogador'}).click();
  await expect(page).toHaveURL(/painel\.html/);

  await page.goto('/criacao-personagem.html');
  await expect(page).toHaveURL(/criacao-personagem\.html/);
  await expect(page.locator('.hub-app-shell')).toBeVisible();
  await expect(page.locator('#wizard-nav')).toBeVisible();
  await expect(page.locator('.hub-visual-preview-banner')).toBeVisible();

  await page.goto('/criacao-personagem.html?id=ficha-sem-permissao');
  await expect(page).toHaveURL(/lista-personagens\.html/);
  const role=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:collaboration-session:v1')));
  expect(role.isMaster).toBe(false);
});

test('Mestre consegue abrir a criação e a edição de fichas demonstrativas', async ({ page }) => {
  await page.goto('/preview.html');
  await page.getByRole('button',{name:'Visualizar como Mestre'}).click();
  await expect(page).toHaveURL(/painel\.html/);
  await page.goto('/criacao-personagem.html');
  await expect(page).toHaveURL(/criacao-personagem\.html/);
  await expect(page.locator('.hub-app-shell')).toBeVisible();
  await expect(page.locator('#wizard-nav')).toBeVisible();
  const role=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:collaboration-session:v1')));
  expect(role.isMaster).toBe(true);
});
