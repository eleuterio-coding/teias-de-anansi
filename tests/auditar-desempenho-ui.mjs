import assert from'node:assert/strict';
import fs from'node:fs';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');

const cachedPages=['index.html','personagens.html','lista-personagens.html','campanhas.html','mesa.html','sessoes.html','aventuras.html','bibliotecas.html','usuarios.html','painel.html','configuracoes.html'];
for(const page of cachedPages){const html=read(page);assert.equal(/no-cache|no-store|must-revalidate/i.test(html),false,`${page} não deve desabilitar o cache normal do navegador.`)}

const ux=read('scripts/hub-ux.js');
assert.ok(ux.includes('requestAnimationFrame'), 'Atualizações globais de UX devem ser agrupadas por frame.');
assert.ok(ux.includes('scheduleEnhancements'), 'MutationObserver deve usar o agendador coalescido.');
assert.equal(ux.includes('new MutationObserver(()=>queueMicrotask'),false,'MutationObserver não pode revarrer o DOM em cada mutação.');
assert.ok(ux.includes("preconnect('https://raw.githubusercontent.com')"),'Ficha/Criação devem antecipar conexão com os catálogos remotos.');

const css=read('hub-ux.css');
assert.ok(css.includes('content-visibility:auto'),'Seções longas fora da viewport devem poder adiar renderização.');

const library=read('scripts/library-catalog-status.js');
assert.ok(library.includes('ensureSemanticIndex'),'Índice semântico deve ser carregado sob demanda.');
assert.equal(library.includes("fetch('dados/referencias-hub-index.json',{cache:'no-store'})"),false,'Índice semântico não deve forçar novo download.');
assert.ok(/injectStyle\(\);injectControls\(\);decorateCards\(\);applyFilters\(\);\s*$/.test(library),'Biblioteca não deve baixar o índice semântico na inicialização.');

const tableRouter=read('scripts/campaign-table-router.js'),adventureRouter=read('scripts/adventure-router.js');
assert.ok(tableRouter.includes('Promise.all([import('),'Módulos da Mesa devem carregar em paralelo.');
assert.ok(adventureRouter.includes('Promise.all([import('),'Módulos de Aventuras devem carregar em paralelo.');

const users=read('usuarios.html');
for(const origin of['https://www.gstatic.com','https://identitytoolkit.googleapis.com','https://firestore.googleapis.com'])assert.ok(users.includes(`rel="preconnect" href="${origin}"`),`Jogadores sem preconnect para ${origin}.`);

console.log('OK — desempenho UI: cache normal, DOM coalescido, renderização diferida, Biblioteca lazy e imports paralelos.');
