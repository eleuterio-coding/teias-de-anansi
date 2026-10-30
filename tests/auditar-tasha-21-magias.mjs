import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const data=JSON.parse(read('dados/magias-tasha-usuario.json'));
const catalog=JSON.parse(read('dados/magias-catalogo.json'));
const phb=JSON.parse(read('dados/magias-phb-2024-indice.json'));
const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,' ').trim().toLowerCase();

assert.equal(data.schema,'hub-rpg/tasha-2020-transcricao-fornecida-v1');
assert.equal(data.total_magias,21);
assert.equal(data.total_blocos_invocacao,9);
assert.equal(data.itens.length,21);
assert.equal(new Set(data.itens.map(x=>fold(x.name))).size,21,'Não duplicar magias de Tasha.');
assert.equal(data.itens.filter(x=>x.statblock).length,9,'Manter nove fichas dos espíritos.');
for(const x of data.itens){
 assert.ok(x.name&&Number.isInteger(x.level)&&x.level>=0&&x.level<=9,'Nome/círculo ausente');
 for(const field of ['school','casting_time','range','components','duration','description']){
  assert.ok(typeof x[field]==='string'&&x[field].trim().length>0,field+' em '+x.name);
 }
 assert.ok(Array.isArray(x.classes)&&x.classes.length>0,'Classes incompletas: '+x.name);
 assert.ok(Array.isArray(x.source_pdf_pages)&&x.source_pdf_pages.every(p=>Number.isInteger(p)&&p>=2&&p<=12),'Páginas de fonte inválidas: '+x.name);
 assert.ok(Number.isInteger(x.source_printed_page_start)&&x.source_printed_page_start>=106&&x.source_printed_page_start<=116,'Página impressa inválida: '+x.name);
 if(x.statblock){
  assert.ok(/^Summon /.test(x.name),'Ficha de invocação associada à magia errada: '+x.name);
  for(const field of ['title','creature_type','text'])assert.ok(x.statblock[field]?.length>0,'Ficha de espírito incompleta: '+x.name+' / '+field);
  assert.match(x.statblock.text,/\|\s*STR\s*\|\s*DEX\s*\|/,'A ficha precisa dos seis atributos: '+x.name);
  assert.match(x.statblock.text,/Hit Points/,'A ficha precisa dos PV: '+x.name);
  assert.match(x.statblock.text,/Multiattack/,'A ficha precisa das ações: '+x.name);
 }
}
const canonical=new Map(catalog.itens.map(x=>[fold(x.nome_original),x]));
const indexed=new Set(phb.itens.map(x=>fold(x.nome_original)));
const inCanonical=data.itens.filter(x=>canonical.has(fold(x.name)));
const inPhb=data.itens.filter(x=>!canonical.has(fold(x.name))&&indexed.has(fold(x.name)));
assert.equal(inCanonical.length,21,'Todas as magias de Tasha devem ter verbete canônico.');
assert.equal(inCanonical.filter(x=>canonical.get(fold(x.name)).fonte==='tasha-2020').length,20,'20 magias canônicas de Tasha são esperadas.');
assert.equal(inCanonical.filter(x=>canonical.get(fold(x.name)).fonte==='fr-heroes-2025').length,1,'Preservar Blade of Disaster em 2025.');
assert.equal(inPhb.length,0,'Nenhuma magia de Tasha deve depender somente do índice PHB.');
assert.ok(data.itens.every(x=>canonical.has(fold(x.name))||indexed.has(fold(x.name))),'Há magia de Tasha sem associação no Hub.');

const current=Array.from(canonical.values()).filter(x=>x.fonte==='tasha-2020');
assert.equal(current.length,20);
assert.ok(current.every(x=>x.descricao_tipo==='texto_fornecido_usuario'&&x.descricao.length>0));
assert.equal(current.filter(x=>x.bloco_invocacao).length,9);
const html=read('magias.html');
const tashaSource=catalog.fontes['tasha-2020'];
assert.equal(tashaSource.titulo,"Tasha's Cauldron of Everything");
assert.equal(tashaSource.url,'https://www.dndbeyond.com/sources/dnd/tcoe');
assert.ok(!html.includes('tasha-pdf-2020'),'Filtro antigo não pode reaparecer');
assert.ok(html.includes('importedPdfNames'),'Magias repetidas no PHB devem ser excluídas');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Script da biblioteca não identificado.');
new vm.Script(script,{filename:'magias.html'});
assert.match(script,/loadTashaProvidedTexts\(\)/);
assert.match(script,/tasha-2020/);
assert.match(script,/renderTashaStatblock/);
assert.match(script,/renderTashaEdition/);
assert.match(script,/loadXanatharProvidedTexts\(\)/,'Xanathar deve permanecer disponível.');
for(const f of ['scripts/catalog-registry.js','scripts/character-builder/spells.js','scripts/character-sheet-unified-spells.js']){
 assert.match(read(f),/dados\/magias-tasha-usuario\.json|tashaUserText/,'Integração ausente: '+f);
}
console.log('OK: 21 magias e 9 fichas de Tasha: 20 entradas canônicas e 1 reimpressão preservada de 2025, sem resumos antigos.');
