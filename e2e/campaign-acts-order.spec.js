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
});
