import { test, expect } from '@playwright/test';
import { renderStructuredDetails } from '../scripts/campaign-structured-ui.js';

test('Atos não é empurrado por Locais importantes no desktop', async ({ page }) => {
  const campaign = {
    importantNpcIds: [],
    importantLocations: Array.from({ length: 18 }, (_, i) => 'Local ' + (i + 1)).join('\n'),
    activeMissions: 'Ato 1\nAto 2\nAto 3'
  };
  await page.goto('/index.html');
  await page.setContent(`
    <link rel="stylesheet" href="/campaigns.css">
    <main id="table-root"><div class="campaign-sections campaign-editor-grid">
      ${renderStructuredDetails(campaign, [])}
    </div></main>
  `);
  await page.locator('#missoes [data-edit-line="activeMissions"]').first().waitFor();
  const sizes = await page.evaluate(() => {
    const position = selector => {
      const { x, y, width, bottom } = document.querySelector(selector).getBoundingClientRect();
      return { x, y, width, bottom };
    };
    return { npcs: position('#npcs'), acts: position('#missoes'), places: position('#locais') };
  });
  if (await page.evaluate(() => window.innerWidth > 900)) {
    expect(sizes.acts.x).toBeCloseTo(sizes.npcs.x, 0);
    expect(sizes.places.x).toBeGreaterThan(sizes.acts.x + sizes.acts.width);
    expect(sizes.places.y).toBeCloseTo(sizes.npcs.y, 0);
    expect(sizes.acts.y - sizes.npcs.bottom).toBeCloseTo(16, 0);
    expect(sizes.acts.y).toBeLessThan(sizes.places.bottom);
    const before = sizes.acts.y;
    await page.locator('#locais .campaign-bullet-list').evaluate(list => {
      for (let i = 0; i < 6; i++) {
        const item = document.createElement('li');
        item.textContent = 'Novo local de teste';
        list.appendChild(item);
      }
    });
    const after = await page.locator('#missoes').evaluate(el => el.getBoundingClientRect().top);
    expect(after).toBeCloseTo(before, 0);
  } else {
    expect(sizes.acts.y).toBeGreaterThanOrEqual(sizes.npcs.bottom);
    expect(sizes.places.y).toBeGreaterThanOrEqual(sizes.acts.bottom);
  }
  await expect(page.locator('#missoes [data-edit-line="activeMissions"]')).toHaveCount(3);
  await expect(page.locator('#locais [data-edit-line="importantLocations"]')).toHaveCount(18);
});

test('Abaixo de 900px, as seções se empilham sem colunas comprimidas', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 900 });
  await page.goto('/index.html');
  await page.setContent(`
    <link rel="stylesheet" href="/campaigns.css">
    <main id="table-root"><div class="campaign-sections campaign-editor-grid">
      ${renderStructuredDetails({importantLocations:'Taverna\nFloresta',activeMissions:'Ato 1\nAto 2'}, [])}
    </div></main>
  `);
  const geometry = await page.evaluate(() => {
    const r = id => document.getElementById(id).getBoundingClientRect();
    return {npcs:r('npcs').toJSON(),acts:r('missoes').toJSON(),locais:r('locais').toJSON()};
  });
  expect(geometry.acts.y).toBeGreaterThanOrEqual(geometry.npcs.bottom);
  expect(geometry.locais.y).toBeGreaterThanOrEqual(geometry.acts.bottom);
  expect(geometry.npcs.width).toBeCloseTo(geometry.locais.width, 0);
});
