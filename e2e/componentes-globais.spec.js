import { test, expect } from '@playwright/test';

const master = { uid: 'u-ui-master', username: 'rafael', isMaster: true, memberships: [] };

test.beforeEach(async ({ page }) => {
  await page.route('**/dados/firebase-config.json*', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ enabled: false, authMode: 'username-password' })
  }));
  await page.addInitScript(session => {
    localStorage.setItem('hub-rpg:collaboration-session:v1', JSON.stringify(session));
  }, master);
});

test('cards de navegação compartilham superfícies nas áreas Personagens e NPCs', async ({ page }, testInfo) => {
  for (const path of ['/personagens.html', '/npcs.html']) {
    await test.step(path, async () => {
      await page.goto(path);
      await expect(page.locator('.hub-app-shell')).toBeVisible();
      const cards = page.locator('.hub-area-menu a');
      await expect(cards).toHaveCount(4);
      const style = await cards.first().evaluate(el => {
        const css = getComputedStyle(el);
        return {
          background: css.backgroundColor,
          borderColor: css.borderTopColor,
          borderWidth: css.borderTopWidth,
          radius: css.borderTopLeftRadius,
          minHeight: parseFloat(css.minHeight)
        };
      });
      expect(style.background, path).toBe('rgb(16, 25, 35)');
      expect(style.borderColor, path).toBe('rgb(34, 50, 69)');
      expect(style.borderWidth, path).toBe('1px');
      expect(style.radius, path).toBe('14px');
      expect(style.minHeight, path).toBeGreaterThanOrEqual(testInfo.project.name === 'mobile-chromium' ? 145 : 182);

      const columns = await page.locator('.hub-roster-menu').evaluate(el => {
        const values = getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/);
        return values.length;
      });
      expect(columns, path).toBe(testInfo.project.name === 'mobile-chromium' ? 1 : 2);
    });
  }
});

test('estados de hover mantêm cores compartilhadas', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'Hover não é referência em tela sensível ao toque');
  for (const path of ['/personagens.html', '/npcs.html']) {
    await page.goto(path);
    await expect(page.locator('.hub-app-shell')).toBeVisible();
    const link = page.locator('.hub-area-menu a').first();
    await link.hover();
    const style = await link.evaluate(el => {
      const css = getComputedStyle(el);
      return { background: css.backgroundColor, border: css.borderTopColor };
    });
    expect(style.background).toBe('rgb(19, 31, 43)');
    expect(style.border).toBe('rgb(47, 156, 255)');
  }
});
