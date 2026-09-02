import assert from'node:assert/strict';
import fs from'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const pages=['index.html','personagens.html','lista-personagens.html','criacao-personagem.html','ficha-personagem.html','campanhas.html','mesa.html','sessoes.html','aventuras.html','bibliotecas.html'];
for(const page of pages){
 const html=read(page);
 assert.match(html,/<meta\s+name=["']viewport["']/i,`${page}: viewport responsivo ausente.`);
 assert.ok(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i.test(html),`${page}: zoom do usuário não pode ser bloqueado.`)
}

const css=read('hub-ux.css'),ux=read('scripts/hub-ux.js'),wizard=read('scripts/character-builder/wizard-ui.js'),sheet=read('ficha-personagem.html'),list=read('lista-personagens.html'),home=read('index.html');
assert.match(css,/--hub-touch:44px/,'Alvo mínimo de toque precisa ser 44 px.');
assert.match(css,/:focus-visible/,'Foco visível compartilhado ausente.');
assert.match(css,/\.section-nav\{[^}]*position:sticky!important[^}]*overflow-x:auto!important/s,'Navegação de seções precisa permanecer sticky e rolável no mobile.');
assert.match(css,/@media\(max-width:760px\)[\s\S]*font-size:16px/,'Controles de formulário mobile precisam evitar zoom involuntário.');
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/,'Preferência de redução de movimento não está respeitada.');
assert.match(css,/scroll-margin-top/,'Âncoras precisam compensar a navegação sticky.');

for(const token of['Pular para o conteúdo principal','aria-live','aria-current','IntersectionObserver','data-structure-edit'])assert.ok(ux.includes(token),`Camada UX sem requisito: ${token}`);
const forbiddenBackend=new RegExp('supa'+'base','i');
assert.ok(!forbiddenBackend.test(css+ux),'Camada UX não pode introduzir backend incompatível.');

assert.ok(wizard.includes("import'../hub-ux.js"),'Construtor precisa carregar a camada UX compartilhada.');
assert.match(wizard,/\.wizard-nav\{[^}]*position:sticky!important/s,'Menu de Etapas precisa continuar sticky.');
assert.match(wizard,/@media\(max-width:1120px\)[\s\S]*overflow-x:auto!important/,'Etapas precisam ser roláveis horizontalmente em telas menores.');
assert.ok(!wizard.includes('@media(max-width:420px){.wizard-nav{grid-template-columns:1fr!important}}'),'Etapas não podem ocupar sete linhas no celular.');
assert.ok(wizard.includes("button.scrollIntoView({block:'nearest',inline:'center'})"),'Etapa ativa deve permanecer visível na faixa de navegação.');

assert.ok(sheet.includes('hub-ux.css?v=20260901-ux-final1'),'Ficha precisa carregar o CSS final de UX diretamente.');
assert.ok(sheet.includes('scripts/hub-ux.js?v=20260901-ux-final1'),'Ficha precisa carregar o comportamento final de UX diretamente.');
assert.ok(sheet.includes('>Editar estrutura</a>'),'Ficha deve nomear explicitamente a edição estrutural.');
assert.ok(!sheet.includes('>Editar no construtor</a>'),'Ficha não deve sugerir o construtor como editor operacional.');
assert.match(sheet,/id="save-status"[^>]*role="status"[^>]*aria-live="polite"/,'Feedback de salvamento deve ser uma live region.');
assert.match(sheet,/id="load-warnings"[^>]*role="alert"[^>]*aria-live="assertive"/,'Falhas de carregamento precisam ser anunciadas.');

assert.ok(list.includes('data-structure-edit'),'Lista deve distinguir a ação de edição estrutural.');
assert.ok(list.includes('Editar estrutura'),'Lista deve explicitar que o construtor altera estrutura.');
assert.ok(!/>Editar<\/a>/.test(list),'Ação ambígua “Editar” não pode permanecer na lista pós-criação.');
assert.ok(list.includes('Abra a Ficha Digital para jogar e administrar o personagem'),'Lista deve orientar o fluxo pós-criação.');

for(const href of['personagens.html','campanhas.html','sessoes.html','aventuras.html','bibliotecas.html'])assert.ok(home.includes(`href="${href}`),`Início sem acesso principal: ${href}`);
assert.equal((home.match(/aria-disabled="true"/g)||[]).length,3,'Somente áreas ainda não implementadas devem permanecer indisponíveis, sem links falsos.');
assert.ok(home.includes('use a Criação de Personagem para montar a estrutura inicial'),'Início precisa explicar a separação Criação → Ficha.');

for(const page of['campanhas.html','mesa.html','sessoes.html','aventuras.html','bibliotecas.html','personagens.html','lista-personagens.html']){
 const html=read(page);assert.ok(html.includes('hub-ux.css?v=20260901-ux-final1'),`${page}: CSS compartilhado de UX ausente.`);assert.ok(html.includes('scripts/hub-ux.js?v=20260901-ux-final1'),`${page}: comportamento compartilhado de UX ausente.`)
}
assert.match(read('mesa.html'),/role="status"\s+aria-live="polite"/,'Mesa deve anunciar seu estado de carregamento.');
assert.match(read('aventuras.html'),/role="status"\s+aria-live="polite"/,'Aventuras deve anunciar seu estado de carregamento.');

console.log('UX final validada: 10 superfícies responsivas, Etapas e navegação sticky mobile, acessibilidade, touch targets, hierarquia pós-criação e estados anunciáveis.');