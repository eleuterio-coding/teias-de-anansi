import { test, expect } from '@playwright/test';
import { renderStructuredDetails } from '../scripts/campaign-structured-ui.js';

const example={
 importantNpcIds: [],
 importantLocations: Array.from({ length: 18 }, (_, i) => 'Local ' + (i + 1)).join('\n'),
 activeMissions: 'Ato 1\nAto 2\nAto 3'
};
async function mount(page) {
 await page.goto('/index.html');
 await page.setContent(`
  <link rel="stylesheet" href="/campaigns.css">
  <main id="table-root"><div class="campaign-sections campaign-editor-grid">
  ${renderStructuredDetails(example, [])}
  </div></main>
 `);
}
test('NPCs e Locais ocupam colunas independentes sem seção Atos',async({page})=>{
 await mount(page);
 await expect(page.locator('#missoes')).toHaveCount(0);
 await expect(page.locator('#npcs')).toHaveCount(1);
 await expect(page.locator('#locais [data-edit-line="importantLocations"]')).toHaveCount(18);
 const boxes=await page.evaluate(()=>{
  const pos=selector=>{const {x,y,width}=document.querySelector(selector).getBoundingClientRect();return{x,y,width}};
  return{npcs:pos('#npcs'),locais:pos('#locais')}
 });
 if(await page.evaluate(()=>innerWidth>900)){
  expect(boxes.locais.x).toBeGreaterThan(boxes.npcs.x+boxes.npcs.width);
  expect(boxes.locais.y).toBeCloseTo(boxes.npcs.y,0);
 }else{
  expect(boxes.locais.y).toBeGreaterThan(boxes.npcs.y)
 }
});
test('em tela estreita NPCs e Locais são empilhados sem aperto',async({page})=>{
 await page.setViewportSize({width:820,height:900});
 await mount(page);
 const geo=await page.evaluate(()=>{
  const p=id=>document.getElementById(id).getBoundingClientRect().toJSON();
  return {npcs:p('npcs'),locais:p('locais')}
 });
 expect(geo.locais.y).toBeGreaterThanOrEqual(geo.npcs.bottom);
 expect(geo.locais.width).toBeCloseTo(geo.npcs.width,0);
 await expect(page.locator('#missoes')).toHaveCount(0);
});