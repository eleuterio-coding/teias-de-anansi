import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SHOTS='artifacts/biblioteca-visual';
const ready=async(page,selector,timeout=30000)=>{await expect(page.locator(selector).first()).toBeVisible({timeout});};
const capture=async(page,name)=>{
  fs.mkdirSync(SHOTS,{recursive:true});
  await page.screenshot({path:path.join(SHOTS,name),fullPage:true,animations:'disabled'});
  await page.screenshot({path:path.join(SHOTS,name.replace(/\.png$/,'.jpg')),type:'jpeg',quality:55,fullPage:false,animations:'disabled'});
};
const overflow=async(page)=>page.evaluate(()=>({
  scroll:document.documentElement.scrollWidth,
  view:document.documentElement.clientWidth,
  elements:[...document.querySelectorAll('main *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+4||r.left < -4)}).slice(0,12).map(el=>el.outerHTML.slice(0,130))
}));
test.describe('Auditoria da Biblioteca — desktop e celular',()=>{
  test.beforeEach(async({page})=>{
    // Sessão local de teste: nenhuma credencial real, nem mudanças no controle de acesso.
    await page.addInitScript(()=>{
      localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({
        uid:'auditoria-visual-local',username:'auditoria',isMaster:true,memberships:[]
      }));
    });
    await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
      status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})
    }));
  });
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
  test('Regras: ordem alfabética e cartões recolhidos',async({page},info)=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/regras.html');
    await ready(page,'#lista details.item',35000);
    const items=page.locator('#lista details.item');
    expect(await items.count()).toBeGreaterThan(130);
    const titles=await page.locator('#lista details.item summary strong').allTextContents();
    expect(titles).toEqual([...titles].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'})));
    await expect(page.locator('#lista details.item[open]')).toHaveCount(0);
    await capture(page,`regras-${info.project.name}.png`);
    const geom=await overflow(page);
    expect.soft(geom.scroll,`Estouro de Regras: ${JSON.stringify(geom)}`).toBeLessThanOrEqual(geom.view+4);
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
    // A montagem da lista nunca deve alterar o filtro inicial.
    await expect(page.locator('#filtro')).toHaveValue('');
    await expect(page.locator('#lista details.subclasse:visible')).toHaveCount(119);
    const names=await page.locator('#lista details.subclasse').evaluateAll(items=>items.map(x=>x.dataset.nomePtbr));
    expect(names).toEqual([...names].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'})));
    await expect(page.locator('.selo-livro')).toHaveCount(119);
    await expect(page.locator('#lista details.subclasse[open]')).toHaveCount(0);
    const problemas=await page.locator('#lista details.subclasse').evaluateAll(cards=>{
      const errors=[];
      for(const card of cards){
        card.open=true;
        const title=card.querySelector('summary strong');
        const detalhe=card.querySelector('.corpo');
        const artigo=card.querySelectorAll('.mecanicas .mecanica-nivel');
        if(!title?.textContent||!detalhe||!artigo.length)
          errors.push((card.dataset.originalName||'sem nome')+': detalhe incompleto');
        const rect=card.getBoundingClientRect();
        if(rect.right>innerWidth+5||rect.left < -5)
          errors.push((card.dataset.originalName||'sem nome')+': card cortado');
        card.open=false;
      }
      return errors;
    });
    expect(problemas).toEqual([]);

    const fichas=await page.locator('#lista .ficha').evaluateAll(elements=>elements.map(el=>el.textContent));
    expect(fichas).toHaveLength(119);
    expect(fichas.every(x=>/Livro:/.test(x)&&!/Edição:|Status:|Livro\/Fonte:|Rastreabilidade|Fonte aberta:/.test(x))).toBeTruthy();
    await capture(page,`subclasses-${info.project.name}.png`);
    const selected=page.locator('#lista details.subclasse:visible').first();
    await expect(selected.locator('summary')).toBeVisible();
    await selected.locator('summary').click();
    await expect(selected).toHaveAttribute('open','');
    await capture(page,`subclasse-detalhe-${info.project.name}.png`);
    const options=await page.locator('#filtro option').allTextContents();
    expect(options.slice(1)).toEqual(options.slice(1).sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'})));
    await page.locator('#busca').fill('Alquimista');
    await expect.poll(()=>page.locator('#lista details.subclasse:visible').count()).toBeGreaterThan(0);
    expect(await page.locator('#lista details.subclasse:visible').count()).toBeLessThan(119);
    await page.locator('#busca').fill('');
    // O filtro por classe continua funcional e pode ser desfeito.
    await page.locator('#filtro').selectOption('Ranger');
    await expect.poll(()=>page.locator('#lista details.subclasse:visible').count()).toBeLessThan(119);
    await page.locator('#filtro').selectOption('');
    await expect(page.locator('#lista details.subclasse:visible')).toHaveCount(119);
    expect.soft(errors).toEqual([]);
    const geom=await overflow(page);
    expect.soft(geom.scroll,`Estouro de largura: ${JSON.stringify(geom)}`).toBeLessThanOrEqual(geom.view+4);
  });
  test('Armaduras e escudo: catálogo exclusivamente oficial e cards limpos',async({page},info)=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/armaduras.html');
    await expect(page.locator('#lista .item')).toHaveCount(13,{timeout:30000});
    await expect(page.locator('#origem')).toHaveCount(0);
    await expect(page.locator('#count')).toHaveText('13 de 13 equipamentos');
    await expect(page.locator('.armor-heading h2')).toHaveText('Armadura Acolchoada');
    await expect(page.locator('#detalhe .stat').filter({hasText:'Peso'})).toContainText('3,6 kg');
    await expect(page.locator('.armor-heading .armor-type')).toHaveText('Leve');
    await expect(page.locator('.armor-source')).toContainText('Fonte: Livro do Jogador');
    await expect(page.locator('#detalhe .armor-stat')).toHaveCount(3);
    await expect(page.locator('#detalhe .armor-conditions .armor-condition')).toHaveCount(1);
    await expect(page.locator('#detalhe')).not.toContainText('Força mínima');
    await expect(page.locator('#detalhe .armor-stat')).not.toContainText('—');
    const alturaMinima=await page.locator('#detalhe').evaluate(el=>getComputedStyle(el).minHeight);
    expect(alturaMinima).toBe('0px');
    await page.locator('#lista .item[data-id="phb-2024-leather-armor"]').click();
    await expect(page.locator('#detalhe .armor-conditions')).toHaveCount(0);
    await expect(page.locator('#detalhe .armor-stat')).toHaveCount(3);
    await page.locator('#lista .item[data-id="phb-2024-chain-mail"]').click();
    await expect(page.locator('#detalhe .armor-condition')).toHaveCount(2);
    await expect(page.locator('#detalhe')).toContainText('Força mínima: For 13');
    await expect(page.locator('#detalhe')).not.toContainText(/Ocorrência|Demonstrativo|pdf24_merged|catálogo-base/);
    await page.locator('#categoria').selectOption('Média');
    await expect(page.locator('#lista .item')).toHaveCount(5);
    await page.locator('#lista .item').first().click();
    await expect(page.locator('#detalhe .stat').first()).toContainText('(máx. +2)');
    await page.locator('#categoria').selectOption('Escudo');
    await expect(page.locator('#lista .item')).toHaveCount(1);
    await page.locator('#lista .item').first().click();
    await expect(page.locator('.armor-heading h2')).toHaveText('Escudo');
    await expect(page.locator('#detalhe .stat').filter({hasText:'Peso'})).toContainText('2,7 kg');
    await expect(page.locator('.armor-heading .armor-type')).toHaveText('Escudo');
    await expect(page.locator('#detalhe .armor-conditions')).toHaveCount(0);
    await expect(page.locator('#detalhe .armor-stat')).toHaveCount(3);
    await expect(page.locator('#detalhe')).toContainText('Fabricação');
    await capture(page,`armaduras-${info.project.name}.png`);
    const geom=await overflow(page);
    expect.soft(geom.scroll).toBeLessThanOrEqual(geom.view+4);
    expect.soft(errors).toEqual([]);
  });

});