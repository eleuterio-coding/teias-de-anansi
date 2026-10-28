import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const directModules=[
  'regras.html','maestrias-de-arma.html','monstros.html',
  'armaduras.html','armas.html','equipamentos-aventura.html',
  'ferramentas.html','montarias-veiculos.html','comercio-e-despesas.html',
  'bugigangas.html','itens-magicos.html','magias.html','idiomas.html'
];
const wrappedModules=[
  'classes.html','subclasses.html','raca.html','antecedentes.html','talentos.html'
];
const nestedPages=['classes-v3.html','referencia.html','biblioteca-legado.html'];
const sourceModules=[
  'dados/_module-source/classes.html',
  'dados/_module-source/subclasses.html',
  'dados/_module-source/especies.html',
  'dados/_module-source/antecedentes.html',
  'dados/_module-source/talentos.html'
];
const expectedModules=[
  'regras.html','classes.html','subclasses.html','raca.html','antecedentes.html',
  'talentos.html','maestrias-de-arma.html','monstros.html','armaduras.html',
  'armas.html','equipamentos-aventura.html','ferramentas.html',
  'montarias-veiculos.html','comercio-e-despesas.html','bugigangas.html',
  'itens-magicos.html','magias.html','idiomas.html'
];
const index=read('bibliotecas.html');
const hrefs=[...index.matchAll(/<li><a href="([^"?]+\.html)(?:\?[^"]*)?"/g)].map(m=>m[1]);
assert.deepEqual(hrefs,expectedModules,'Os 18 cards devem preservar destinos e ordem.');
assert.match(index,/class="hub-library-page"/,'O índice deve usar a estrutura compartilhada.');
assert.match(index,/scripts\/library-catalog-status\.js/,'Busca e contagem do catálogo devem permanecer.');

const stylesheet=/biblioteca-light\.css\?v=20261028-hub-layout1/;
for(const file of ['bibliotecas.html',...directModules,...wrappedModules,...nestedPages]){
  const html=read(file);
  assert.match(html,stylesheet,file+' deve usar o tema compartilhado atualizado.');
  if(!wrappedModules.includes(file)){
    assert.match(html,/scripts\/hub-ux\.js\?v=/,file+' deve integrar o shell do Hub.');
  }else{
    assert.match(html,/scripts\/module-clean-loader\.js\?v=/,file+' deve carregar o módulo sem perder seu conteúdo.');
  }
}
for(const file of sourceModules)assert.match(read(file),/<\/head>/i,file+' deve permitir injeção do estilo.');

const loader=read('scripts/module-clean-loader.js');
for(const token of [
  "const LAYOUT='biblioteca-light.css?v=20261028-hub-layout1'",
  'function applySharedLayout(html)',
  'id="hub-library-layout"',
  'html=applySharedLayout(html);',
  'document.write(html);',
  'scripts/hub-ux.js?v='
])assert.ok(loader.includes(token),'Carregador sem garantia: '+token);
assert.ok(loader.indexOf('html=applySharedLayout(html);')<loader.indexOf('document.write(html);'));

const shell=read('scripts/app-shell.js');
assert.match(shell,/hub-content-library/,'A Biblioteca precisa de um tema próprio separado do leitor claro.');
for(const file of [...directModules,...wrappedModules,...nestedPages]){
  assert.ok(shell.includes('"'+file+'"'),file+' deve estar registrado no shell.');
}
const css=read('biblioteca-light.css');
for(const token of [
  'hub-content-library .hub-app-content',
  '--hub-surface','--hub-accent','--hub-border','--hub-bg',
  '.modulos','.controles','.catalog-controls','.layout',
  '.catalog-results','table',':focus-visible','@media'
])assert.ok(css.includes(token),'Contrato do layout escuro sem: '+token);
assert.ok(!css.includes('color-scheme: only light !important'),'Biblioteca não deve impor modo branco.');
assert.ok(!css.includes('body:not(.hub-shell-enabled) *'),'Não aplicar tema local fora do shell.');
console.log('OK: 18/18 módulos, 3 páginas internas e 5 fontes renderizadas compartilham o visual escuro do Hub.');
