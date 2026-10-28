import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const standardPages=[
  'index.html','painel.html','campanhas.html','mesa.html','sessoes.html',
  'aventuras.html','personagens.html','lista-personagens.html','bibliotecas.html',
  'configuracoes.html','criacao-personagem.html','ficha-personagem.html'
];
const libraryPages=[
  'bibliotecas.html','regras.html','maestrias-de-arma.html','monstros.html',
  'armaduras.html','armas.html','equipamentos-aventura.html','ferramentas.html',
  'montarias-veiculos.html','comercio-e-despesas.html','bugigangas.html',
  'itens-magicos.html','magias.html','idiomas.html','classes-v3.html',
  'referencia.html','biblioteca-legado.html'
];
const wrappedPages=['classes.html','subclasses.html','raca.html','talentos.html','antecedentes.html'];
const shell=read('scripts/app-shell.js');
const ux=read('scripts/hub-ux.js');
const layout=read('hub-layout.css');
const library=read('biblioteca-light.css');
const loader=read('scripts/module-clean-loader.js');

assert.match(shell,/const LIBRARY_PAGES=new Set/);
assert.match(shell,/const CHARACTER_PAGES=new Set/);
const navDeclaration=shell.split('const NAV_ITEMS=[')[1]?.split('];')[0]||'';
const navOrder=[...navDeclaration.matchAll(/\{page:"([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(navOrder,[
  'painel.html','campanhas.html','aventuras.html','sessoes.html',
  'personagens.html','npcs.html','bibliotecas.html'
],'A ordem do menu lateral não deve mudar.');
assert.match(shell,/hub-content-library/,'Biblioteca deve receber um tema distinto do leitor legado.');
assert.match(shell,/LIBRARY_PAGES\.has\(currentPage\(\)\)/);
assert.match(shell,/data-hub-preview-user/);
assert.match(ux,/hub-layout\.css\?v=/);
assert.match(ux,/app-shell\.js\?v=/);
assert.match(ux,/Editar Ficha/);
assert.doesNotMatch(ux,/Editar estrutura/);
assert.match(layout,/--hub-reader-bg/,'O modo claro de outras áreas deve ser preservado.');
assert.match(layout,/@media\(max-width:760px\)/);
assert.match(read('site-light.css'),/body:not\(\.hub-shell-enabled\):not\(\.hub-login-page\)/);
assert.match(read('hub-ux.css'),/\.hub-master-tools/);
assert.match(library,/hub-content-library \.hub-app-content/);
assert.match(library,/--hub-bg/);
assert.match(library,/--hub-text/);
assert.match(library,/--hub-surface/);
assert.doesNotMatch(library,/^body \* \{/m,'Biblioteca não deve forçar estilos globais.');
for(const file of standardPages) {
  const html=read(file);
  assert.match(html,/scripts\/hub-ux\.js\?v=/,file+' deve carregar o shell compartilhado.');
  assert.ok(shell.includes('"'+file+'"'),file+' precisa constar no shell.');
}
for(const file of libraryPages) {
  const html=read(file);
  assert.match(html,/scripts\/hub-ux\.js\?v=/,file+' deve carregar o shell.');
  assert.match(html,/biblioteca-light\.css\?v=20261028-hub-layout1/,file+' deve carregar o tema escuro.');
  assert.ok(shell.includes('"'+file+'"'),file+' precisa constar no shell.');
  assert.ok(!html.includes('id="hub-force-light-theme"'),file+' não deve forçar o tema antigo.');
}
for(const file of wrappedPages) {
  const html=read(file);
  assert.match(html,/scripts\/module-clean-loader\.js\?v=/,file+' deve carregar o catálogo original.');
  assert.ok(shell.includes('"'+file+'"'),file+' precisa constar no shell.');
  assert.ok(!html.includes('id="hub-force-light-theme"'),file+' não deve impor tema claro.');
}
assert.match(loader,/html=applySharedLayout\(html\);/);
assert.match(loader,/hub-ux\.js\?v=/);
assert.ok(loader.indexOf('html=applySharedLayout(html);')<loader.indexOf('document.write(html);'));
const normalizer=read('scripts/normalizar_tema_modulos.py');
assert.ok(!normalizer.includes('STYLE ='));
assert.ok(normalizer.includes('normalized != html'));
console.log('OK: shell preservado nas áreas principais, Biblioteca escura em 18 módulos e páginas internas.');
