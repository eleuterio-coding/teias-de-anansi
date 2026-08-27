import fs from 'node:fs';

const directModules = [
  'bibliotecas.html', 'regras.html', 'maestrias-de-arma.html', 'monstros.html',
  'armaduras.html', 'armas.html', 'equipamentos-aventura.html', 'ferramentas.html',
  'montarias-veiculos.html', 'comercio-e-despesas.html', 'bugigangas.html',
  'itens-magicos.html', 'magias.html', 'idiomas.html'
];
const wrappedModules = ['classes.html', 'subclasses.html', 'raca.html', 'antecedentes.html', 'talentos.html'];
const sourceModules = [
  'dados/_module-source/classes.html',
  'dados/_module-source/subclasses.html',
  'dados/_module-source/especies.html',
  'dados/_module-source/antecedentes.html',
  'dados/_module-source/talentos.html'
];
const layoutRx = /biblioteca-light\.css\?v=20260827-library-layout\d+/;

for (const file of directModules) {
  if (!fs.existsSync(file)) throw new Error(`Módulo direto ausente: ${file}`);
  const html = fs.readFileSync(file, 'utf8');
  if (!layoutRx.test(html)) throw new Error(`Módulo direto sem stylesheet compartilhado: ${file}`);
}

for (const file of wrappedModules) {
  if (!fs.existsSync(file)) throw new Error(`Wrapper ausente: ${file}`);
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('module-clean-loader.js?v=20260827-library-rendered-layout2')) {
    throw new Error(`Wrapper usando carregador visual antigo: ${file}`);
  }
}

for (const file of sourceModules) {
  if (!fs.existsSync(file)) throw new Error(`Fonte de módulo ausente: ${file}`);
  const html = fs.readFileSync(file, 'utf8');
  if (!/<\/head>/i.test(html)) throw new Error(`Fonte sem ponto de injeção do layout: ${file}`);
}

const loader = fs.readFileSync('scripts/module-clean-loader.js', 'utf8');
const loaderContract = [
  "const LAYOUT='biblioteca-light.css?v=20260827-library-layout2'",
  'function applySharedLayout(html)',
  'id="hub-library-layout"',
  'html=applySharedLayout(html);',
  'document.write(html);'
];
const loaderMissing = loaderContract.filter(token => !loader.includes(token));
if (loaderMissing.length) throw new Error(`Carregador não garante layout no HTML final: ${loaderMissing.join(', ')}`);
if (loader.indexOf('html=applySharedLayout(html);') > loader.indexOf('document.write(html);')) {
  throw new Error('O layout compartilhado está sendo aplicado depois do document.write().');
}

const css = fs.readFileSync('biblioteca-light.css', 'utf8');
const visualContract = [
  'color-scheme: only light !important',
  'background: #ffffff !important',
  'color: #000000 !important',
  'max-width: 1120px !important',
  '.controles',
  'details',
  'table',
  ':focus-visible'
];
const absent = visualContract.filter(token => !css.includes(token));
if (absent.length) throw new Error(`Contrato visual incompleto: ${absent.join(', ')}`);

console.log(`Layout efetivo validado: ${directModules.length} módulos diretos + ${wrappedModules.length} módulos renderizados usando o mesmo stylesheet claro.`);
