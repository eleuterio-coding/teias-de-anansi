import { test, expect } from '@playwright/test';
import { entries, reorderBulletEntries, renderStructuredSection } from '../scripts/campaign-structured-ui.js';

test.describe('Campanha · ordenação de Atos', () => {
 const source = ['Ato 1', 'Ato 2', 'Ato 3'];

 test('arrastar um ato para cima ou para baixo preserva os demais', () => {
  expect(reorderBulletEntries(source, 2, 0, 'before')).toEqual(['Ato 3', 'Ato 1', 'Ato 2']);
  expect(reorderBulletEntries(source, 0, 2, 'after')).toEqual(['Ato 2', 'Ato 3', 'Ato 1']);
  expect(reorderBulletEntries(source, 1, 0, 'before')).toEqual(['Ato 2', 'Ato 1', 'Ato 3']);
  expect(source).toEqual(['Ato 1', 'Ato 2', 'Ato 3']);
 });

 test('movimento sem alteração ou índices inválidos não mudam a lista', () => {
  expect(reorderBulletEntries(source, 0, 1, 'before')).toBeNull();
  expect(reorderBulletEntries(source, 1, 0, 'after')).toBeNull();
  expect(reorderBulletEntries(source, 0, 0, 'before')).toBeNull();
  expect(reorderBulletEntries(source, -1, 2, 'after')).toBeNull();
  expect(reorderBulletEntries(source, 0, 99, 'after')).toBeNull();
 });

 test('ordem convertida para texto continua correta após leitura', () => {
  const updated = reorderBulletEntries(source, 2, 0, 'before');
  expect(entries(updated.join('\n'))).toEqual(['Ato 3', 'Ato 1', 'Ato 2']);
 });

 test('somente Atos recebe alças de arraste; Locais mantém edição existente', () => {
  const campaign = { activeMissions: source.join('\n'), importantLocations: 'Taverna\nFloresta' };
  const acts = renderStructuredSection(campaign, [], 'missoes');
  const locations = renderStructuredSection(campaign, [], 'locais');
  expect(acts.match(/data-act-drag=/g)).toHaveLength(3);
  expect(acts).toContain('draggable="true"');
  expect(acts).toContain('data-edit-line="activeMissions"');
  expect(locations).not.toContain('data-act-drag=');
  expect(locations).toContain('data-edit-line="importantLocations"');
 });

 test('arrastar na interface atualiza a sequência salva sem modificar os nomes', async ({ page }) => {
  await page.goto('/index.html');
  await page.setContent('<link rel="stylesheet" href="/campaigns.css"><main id="table-root"><div class="campaign-sections campaign-editor-grid"></div></main>');
  await page.evaluate(async () => {
   const { renderStructuredSection, bindStructuredDetails } = await import('/scripts/campaign-structured-ui.js');
   const campaign = { activeMissions: 'Ato 1\nAto 2\nAto 3' };
   document.querySelector('.campaign-sections').innerHTML = renderStructuredSection(campaign, [], 'missoes');
   bindStructuredDetails({
    getCampaign: () => campaign, getNpcs: () => [],
    save: patch => Object.assign(campaign, patch), feedback: () => {}
   });
   window.__testCampaign = campaign;
  });
  const rows = page.locator('#missoes .campaign-act-entry');
  expect(await rows.count()).toBe(3);
  const last = await rows.nth(2).boundingBox();
  await page.locator('#missoes [data-act-drag="0"]').dragTo(rows.nth(2), {
   targetPosition: { x: Math.min(30, last.width / 2), y: last.height * .8 }
  });
  await expect.poll(() => page.evaluate(() => window.__testCampaign.activeMissions)).toBe('Ato 2\nAto 3\nAto 1');
  await expect(rows.locator('input[data-edit-line="activeMissions"]')).toHaveValues(['Ato 2', 'Ato 3', 'Ato 1']);
  await page.locator('#missoes [data-act-drag="2"]').focus();
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => page.evaluate(() => window.__testCampaign.activeMissions)).toBe('Ato 2\nAto 1\nAto 3');
  await expect(page.locator('#missoes [data-act-drag="1"]')).toBeFocused();
 });
});
