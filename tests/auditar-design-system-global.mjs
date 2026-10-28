/**
 * Auditoria estática do Design System global — Teias de Anansi.
 * Executar: node tests/auditar-design-system-global.mjs
 * Não requer navegador nem altera arquivos.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = filename => fs.readFileSync(filename,'utf8');
const css=read('hub-design-system.css');
const ux=read('scripts/hub-ux.js');
const loader=read('scripts/module-clean-loader.js');
const aliases=new Set(['biblioteca.html','classes-v2.html','especies.html']);
const routes=fs.readdirSync('.', {withFileTypes:true})
  .filter(item=>item.isFile()&&item.name.endsWith('.html'))
  .map(item=>item.name).sort();

assert.ok(routes.length>=35,'Inventário HTML inesperadamente pequeno');
assert.match(ux,/function ensureStyles\(\)/);
assert.match(ux,/id='hub-design-system-styles'/);
assert.match(ux,/hub-design-system\.css\?v=/);
assert.match(ux,/document\.head\.appendChild\(design\)/);
assert.ok(ux.indexOf("id='hub-layout-styles'")<ux.indexOf("id='hub-design-system-styles'"),
  'Design System deve ser carregado depois da composição pré-existente');
assert.match(loader,/hub-ux\.js/,'Os módulos embrulhados precisam injetar o shell comum');

let direct=0,wrapped=0,redirects=0;
const uncovered=[];
for (const route of routes) {
  const html=read(route);
  if(aliases.has(route)){
    assert.ok(/location\.replace|http-equiv=["']refresh|location\.href/.test(html),
      route+' não é mais um redirecionamento');
    redirects++;
    continue;
  }
  if(html.includes('scripts/hub-ux.js'))direct++;
  else if(html.includes('scripts/module-clean-loader.js'))wrapped++;
  else uncovered.push(route);
}
assert.deepEqual(uncovered,[],'Rotas de interface sem Design System compartilhado');

const tokens=[
  '--hub-ds-space-1','--hub-ds-space-2','--hub-ds-space-3',
  '--hub-ds-space-4','--hub-ds-space-5','--hub-ds-space-6',
  '--hub-ds-card-gap','--hub-ds-section-nav-space',
  '--hub-ds-control-radius','--hub-ds-card-radius',
  '--hub-ds-motion-standard','--hub-ds-motion-emphasis',
  '--hub-ds-ease','--hub-ds-focus-color',
  '--hub-ds-status-current','--hub-ds-status-next',
  '--hub-ds-status-planned','--hub-ds-status-finished'
];
for(const token of tokens) assert.ok(css.includes(token),'Token obrigatório ausente: '+token);
for(const selector of [
  '.section-nav','.wizard-nav','.section-nav-indicator','.hub-area-menu',
  '.campaign-list-grid','.hub-detail-grid','.form-grid','.focus-card',
  '.campaign-card','.card','.btn','.badge'
]) assert.ok(css.includes(selector),'Família de componentes ausente: '+selector);
assert.match(css,/@media\s*\(max-width:760px\)/);
assert.match(css,/@media\s*\(prefers-reduced-motion:reduce\)/);
assert.match(css,/html\[data-hub-motion="reduce"\]/);
assert.match(css,/body\.hub-login-page/);

const noComments=css.replace(/\/\*[\s\S]*?\*\//g,'');
let depth=0;
for(const ch of noComments){
  if(ch==='{')depth++;
  if(ch==='}')depth--;
  assert.ok(depth>=0,'CSS com chave de fechamento excedente');
}
assert.equal(depth,0,'CSS com bloco não fechado');

console.log(
  'OK: Design System global; '+routes.length+' rotas HTML inventariadas; '+
  direct+' com shell direto; '+wrapped+' via loader; '+redirects+
  ' aliases de redirecionamento; 0 rotas sem cobertura.'
);
