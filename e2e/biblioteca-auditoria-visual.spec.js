import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SHOTS='artifacts/biblioteca-visual';
const ready=async(page,selector,timeout=30000)=>{await expect(page.locator(selector)).toBeVisible({timeout});};
const capture=async(page,name)=>{
  fs.mkdirSync(SHOTS,{recursive:true});
  await page.screenshot({path:path.join(SHOTS,name),fullPage:true,animations:'disabled'});
};
const overflow=async(page)=>page.evaluate(()=>({
  scroll:document.documentElement.scrollWidth,
  view:document.documentElement.clientWidth,
  elements:[...document.querySelectorAll('main *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+4||r.left < -4)}).slice(0,12).map(el=>el.outerHTML.slice(0,130))
}));
test.describe('Auditoria da Biblioteca — desktop e celular',()=>{
  test('Biblioteca: 18 cards em ordem alfabética e sem cortes',async({page},info)=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/bibliotecas.html');await ready(page,'.modulos li a');
    const labels=await page.locator('.modulos .nome').allTextContents();
    expect(labels).toHaveLength(18);
    expect(labels).toEqual([...labels].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'})));
    await capture(page,`biblioteca-${info.project.name}.png`);
    const geom=await overflow(page);
    expect.soft(geom.scroll,`Estouro de largura: ${JSON.stringify(geom)}`).toBeLessThanOrEqual(geom.view+4);
    expect.soft(errors).toEqual([]);
  });
  test('Classes: 13 cards fechados e detalhe de Artífice',async({page},info)=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/classes.html');
    await ready(page,'#grid .card');
    await expect(page.locator('#grid .card')).toHaveCount(13);
    await expect(page.locator('#artifice')).toHaveCount(0);
    const names=await page.locator('#grid .card strong').allTextContents();
    expect(names).toEqual([...names].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'})));
    await capture(page,`classes-${info.project.name}.png`);
    await page.getByRole('link',{name:/Artífice/}).first().click();
    await expect(page).toHaveURL(/classes-v3.html/);
    await expect(page.locator('#lista details.classe')).toHaveCount(13,{timeout:35000});
    await expect(page.locator('#lista details.classe[open]')).toHaveCount(1);
    const art=page.locator('#lista details[data-id="artificer"]');
    await expect(art).toHaveAttribute('open','');
    await expect(art.locator('.tabela-wrap tbody tr')).toHaveCount(20);
    await capture(page,`artifice-detalhe-${info.project.name}.png`);
    const geom=await overflow(page);
    expect.soft(geom.scroll,`Estouro de largura: ${JSON.stringify(geom)}`).toBeLessThanOrEqual(geom.view+4);
    expect.soft(errors).toEqual([]);
  });
  test('Subclasses: 119 cartões PT-BR, selos de livro, ficha limpa e filtro',async({page},info)=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/subclasses.html');await ready(page,'#lista details.subclasse');
    await expect.poll(()=>page.locator('html').getAttribute('data-subclasses-ptbr'),{timeout:40000}).toBe('119/119');
    await expect(page.locator('#lista details.subclasse')).toHaveCount(119);
    const names=await page.locator('#lista details.subclasse').evaluateAll(items=>items.map(x=>x.dataset.nomePtbr));
    expect(names).toEqual([...names].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'})));
    await expect(page.locator('.selo-livro')).toHaveCount(119);
    await expect(page.locator('#lista details.subclasse[open]')).toHaveCount(0);
    const fichas=await page.locator('#lista .ficha').evaluateAll(elements=>elements.map(el=>el.textContent));
    expect(fichas).toHaveLength(119);
    expect(fichas.every(x=>/Livro:/.test(x)&&!/Edição:|Status:|Livro\/Fonte:|Rastreabilidade|Fonte aberta:/.test(x))).toBeTruthy();
    await capture(page,`subclasses-${info.project.name}.png`);
    const selected=page.locator('#lista details.subclasse').first();await selected.locator('summary').click();
    await expect(selected).toHaveAttribute('open','');
    await capture(page,`subclasse-detalhe-${info.project.name}.png`);
    const options=await page.locator('#filtro option').allTextContents();
    expect(options.slice(1)).toEqual(options.slice(1).sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'})));
    await page.locator('#busca').fill('Alquimista');
    await expect(page.locator('#lista details.subclasse:visible')).toHaveCount(1);
    await page.locator('#busca').fill('');
    expect.soft(errors).toEqual([]);
    const geom=await overflow(page);
    expect.soft(geom.scroll,`Estouro de largura: ${JSON.stringify(geom)}`).toBeLessThanOrEqual(geom.view+4);
  });
});