import fs from 'node:fs';

const modules = [
  'bibliotecas.html',
  'regras.html', 'classes.html', 'subclasses.html', 'raca.html',
  'antecedentes.html', 'talentos.html', 'maestrias-de-arma.html',
  'monstros.html', 'armaduras.html', 'armas.html',
  'equipamentos-aventura.html', 'ferramentas.html',
  'montarias-veiculos.html', 'comercio-e-despesas.html',
  'bugigangas.html', 'itens-magicos.html', 'magias.html', 'idiomas.html'
];

const marker = 'biblioteca-light.css?v=20260827-library-layout1';
const missing = [];
for (const file of modules) {
  if (!fs.existsSync(file)) throw new Error(`Módulo ausente: ${file}`);
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes(marker)) missing.push(file);
}
if (missing.length) throw new Error(`Módulos sem layout compartilhado: ${missing.join(', ')}`);

const css = fs.readFileSync('biblioteca-light.css', 'utf8');
const contract = [
  'color-scheme: only light !important',
  'background: #ffffff !important',
  'color: #000000 !important',
  'max-width: 1120px !important',
  '.controles',
  'details',
  'table',
  ':focus-visible'
];
const absent = contract.filter(token => !css.includes(token));
if (absent.length) throw new Error(`Contrato visual incompleto: ${absent.join(', ')}`);

console.log(`Layout unificado validado: ${modules.length} páginas usando o mesmo stylesheet claro.`);
