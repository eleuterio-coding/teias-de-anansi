import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(p,'utf8');
const catalog=JSON.parse(read('dados/magias-catalogo.json'));
const localized=JSON.parse(read('dados/localizacao-ptbr-magias-completo.json'));
const page=read('magias.html');
const builder=read('scripts/character-builder/spells.js');
const sheet=read('scripts/character-sheet-unified-spells.js');
const rules=read('scripts/politica-regras-biblioteca.js');

const rows=catalog.itens;
assert.equal(rows.length,537,'Catálogo de Magias deve preservar os 537 registros.');
assert.equal(localized.total,rows.length,'Arquivo PT-BR deve abranger todo o catálogo.');
const originals=rows.map(x=>x.nome_original),ids=rows.map(x=>x.id);
assert.equal(new Set(ids).size,rows.length,'IDs originais não podem repetir.');
assert.equal(Object.keys(localized.nomes).length,rows.length,'Cada nome original deve possuir 1 tradução.');
assert.deepEqual(new Set(Object.keys(localized.nomes)),new Set(originals),'Arquivo de nomes deve corresponder exatamente às magias publicadas.');
assert.equal(new Set(Object.values(localized.nomes)).size,rows.length,'Nomes públicos não podem colidir e tornar verbetes ambíguos.');
for(const row of rows)assert.ok(localized.nomes[row.nome_original]?.trim(),`Tradução ausente: ${row.nome_original}`);
for(const original of ['Fireball','Magic Missile','Cure Wounds']){
 assert.notEqual(localized.nomes[original],original,`Nome básico não traduzido: ${original}`);
}
for(const token of ['localizacao-ptbr-magias-completo.json','magias.html?magia=','spell-verbetelink','initialSpellId','originalName']){
 assert.ok([page,builder,sheet].some(text=>text.includes(token)),`Falta integração ${token}`);
}
assert.ok(page.includes('x.nome_original'),'Busca e mapeamento devem reter o nome original.');
for(const token of ['<b>PDF:</b>','<b>Revisão core:</b>','<b>Completude:</b>','<span class="badge">versão mais recente</span>','<span class="badge">${esc(x.ruleset)}</span>']){
 assert.ok(!page.includes(token),`Campo ou selo indevido em Magias: ${token}`);
}
assert.ok(page.includes("params.get('ref')"),'Links legados ?ref= devem abrir o verbete original.');
const generator=read('scripts/gerar_referencias_hub.py');
assert.ok(generator.includes('localizacao-ptbr-magias-completo.json'),'Índice semântico deve consumir nomes PT-BR.');
assert.ok(generator.includes('orig = identity'),'Identidade semântica da magia não pode mudar com a tradução.');
assert.ok(rules.includes("if(page==='magias.html')return"),'Política da Biblioteca não pode inserir aviso em Magias.');
assert.ok(builder.includes('names[x.originalName]'),'Construtor deve preservar ID e localizar nome original.');
assert.ok(sheet.includes('names[spell.originalName]'),'Ficha deve preservar ID e localizar nome original.');
console.log('Magias: 537 títulos PT-BR, links estáveis e campos editoriais removidos — OK');
