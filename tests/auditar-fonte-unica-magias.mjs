import assert from 'node:assert/strict';
import fs from 'node:fs';
import{SPELL_CANONICAL_FILE,localSourcePaths,catalogModule}from'../scripts/catalog-registry.js';
const read=p=>fs.readFileSync(p,'utf8');
assert.equal(SPELL_CANONICAL_FILE,'dados/catalogo-magias-20261104.json');
assert.equal(localSourcePaths('spells','builder')[0],SPELL_CANONICAL_FILE,'A fonte ativa deve ter prioridade no registro.');
const catalog=JSON.parse(read(SPELL_CANONICAL_FILE));
assert.equal(catalog.schema,'hub-rpg/catalogo-magias-20261104/v1');
assert.equal(catalog.total,581);
assert.ok(Array.isArray(catalog.itens));
assert.equal(catalog.itens.length,581);
const ids=new Set(),names=new Set();
for(const spell of catalog.itens){
 for(const k of ['id','nome','escola','descricao','classes','livro','componentes'])
  assert.ok(typeof spell[k]==='string'&&spell[k].trim(),'Campo de magia ausente: '+k+' em '+(spell.id||'?'));
 assert.ok(Number.isInteger(spell.nivel)&&spell.nivel>=0&&spell.nivel<=9,'Circulo invalido: '+spell.id);
 assert.ok(!ids.has(spell.id),'ID repetido: '+spell.id);
 const name=spell.nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 assert.ok(!names.has(name),'Nome repetido: '+spell.nome);
 ids.add(spell.id);names.add(name);
}
const runtime=read('scripts/character-builder/spells.js');
assert.ok(runtime.includes("json(SPELL_CANONICAL_FILE+'?v=20261104')"),'Construtor deve ler a fonte canônica registrada.');
assert.ok(read('scripts/character-sheet.js').includes('loadSpells()'),'A ficha precisa usar o carregador comum.');
assert.ok(read('magias.html').includes(SPELL_CANONICAL_FILE),'A Biblioteca deve abrir o mesmo catalogo.');
assert.ok(catalogModule('spells').sources.some(x=>x.path==='dados/magias-catalogo.json'),'Fontes historicas nao podem ser descartadas.');
assert.equal(JSON.parse(read('dados/biblioteca-contagens.json')).modulos.Magias,581,'Contagem exibida deve corresponder ao catalogo.');
console.log('OK — 581 Magias: fontes ativas alinhadas, IDs completos e únicos, proveniência histórica preservada.');
