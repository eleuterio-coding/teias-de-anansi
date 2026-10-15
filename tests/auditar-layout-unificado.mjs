import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const version = '20261015-unified-layout1';
const standardPages = [
  'index.html','painel.html','campanhas.html','mesa.html','sessoes.html',
  'aventuras.html','personagens.html','lista-personagens.html','bibliotecas.html',
  'configuracoes.html','criacao-personagem.html','ficha-personagem.html'
];
const catalogPages = [
  'regras.html','maestrias-de-arma.html','monstros.html','armaduras.html',
  'armas.html','equipamentos-aventura.html','ferramentas.html',
  'montarias-veiculos.html','comercio-e-despesas.html','bugigangas.html',
  'itens-magicos.html','magias.html','idiomas.html','classes-v3.html','referencia.html'
];
const wrappedPages = ['classes.html','subclasses.html','raca.html','talentos.html','antecedentes.html'];
const shell = read('scripts/app-shell.js');
const ux = read('scripts/hub-ux.js');
const layout = read('hub-layout.css');
const library = read('biblioteca-light.css');
const loader = read('scripts/module-clean-loader.js');

assert.match(shell,/const LIBRARY_PAGES=new Set/);
assert.match(shell,/const CHARACTER_PAGES=new Set/);
assert.match(shell,/hub-content-light/);
assert.match(shell,/LIBRARY_PAGES\.has\(page\)\&\&item\.page==="bibliotecas\.html"/);
assert.match(ux,new RegExp('hub-layout\\.css\\?v='+version));
assert.match(ux,/Editar Ficha/);
assert.doesNotMatch(ux,/Editar estrutura/);
assert.match(layout,/--hub-reader-bg/);
assert.match(layout,/--hub-topbar-height/);
assert.match(layout,/@media\(max-width:760px\)/);
assert.match(library,/body:not\(\.hub-shell-enabled\) \*/);
assert.match(library,/body\.hub-shell-enabled \.hub-app-content \*/);
assert.doesNotMatch(library,/^body \* \{/m);

for(const file of standardPages) {
 const html = read(file);
 assert.ok(html.includes('scripts/hub-ux.js?v='+version), file+' não recebeu shell atualizado');
 assert.ok(shell.includes('"'+file+'"'), file+' não está no shell');
}
for(const file of catalogPages) {
 const html = read(file);
 assert.ok(html.includes('scripts/hub-ux.js?v='+version), file+' não recebeu shell');
 assert.ok(!html.includes('id="hub-force-light-theme"'), file+' ainda impõe tema global');
 assert.ok(shell.includes('"'+file+'"'), file+' não consta na navegação');
}
for(const file of wrappedPages) {
 const html = read(file);
 assert.ok(html.includes('scripts/module-clean-loader.js?v='+version),file+' usa loader em cache');
 assert.ok(!html.includes('id="hub-force-light-theme"'),file+' mantém estilo global antigo');
 assert.ok(shell.includes('"'+file+'"'),file+' não consta na navegação');
}
assert.match(loader,/html=applySharedLayout\(html\);/);
assert.match(loader,/hub-ux\.js\?v=20261015-unified-layout1/);
assert.ok(loader.indexOf('html=applySharedLayout(html);') < loader.indexOf('document.write(html);'));

console.log('OK: 12 áreas principais, 15 módulos diretos e 5 módulos renderizados cobertos pelo layout comum.');
