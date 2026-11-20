# Padrão obrigatório de desenvolvimento — Teias de Anansi 2.0

**Definição:** Etapa 2.11, 20/11/2026.  
**Branch:** feature/etapa-2-design-system-20261120.  
**Escopo:** todos os módulos funcionais futuros do Hub.  
**Estado:** especificação escrita e verificador **executado com êxito** em CI; suíte geral bloqueada por testes de componentes anteriores; aguarda aceite do Mestre.

Este padrão preserva a identidade visual **Fantasia Sombria Editorial — Grimório
ancestral de luxo** aprovada em 2.01, os tokens aprovados em 2.02 e as
bibliotecas e fluxos dos itens 2.03–2.10. Um módulo não ganha permissão
para alterar a navegação, a identidade, o Firebase ou a publicação.

## 1. Arquitetura e registro

O projeto usa **um único HashRouter, AppShell e PageErrorBoundary**.
As oito áreas de RPG atualmente listadas em src/app/routes.ts continuam
com páginas provisórias. O diretório src/modules já contém **nove reservas
da Fundação**: usuarios, biblioteca, personagens, campanhas, aventuras,
npcs, sessoes, area-jogador e preferencias.

Uma reserva não é um módulo. O verificador permite excepcionalmente
que essas nove pastas contenham **somente README.md**, sem manifesto,
entrada, testes ou documentação adicional. Ao adicionar código ou
outros arquivos, a dispensa deixa de existir e o contrato completo
passa a ser exigido. Pastas novas não recebem dispensa.

### Contrato mínimo de um módulo real

~~~text
src/modules/<slug>/README.md
src/modules/<slug>/module.json
src/modules/<slug>/index.tsx
tests/modules/<slug>.test.tsx
docs/modules/<slug>.md
~~~

O manifesto contém id, label, route, stage e status:

~~~json
{
  "id": "biblioteca",
  "label": "Biblioteca",
  "route": "/biblioteca",
  "stage": 4,
  "status": "draft"
}
~~~

O identificador corresponde à pasta; rota, label e etapa devem
coincidir com src/app/routes.ts. status aceita draft ou ready, mas
**não ativa uma rota nem autoriza publicação**. O exemplo é meramente
documental: nenhum módulo foi ativado.

A reserva usuarios está associada à etapa 3, mas **a rota não existe ainda
no catálogo atual**. Sua ativação exige aprovação e atualização do catálogo
na etapa apropriada. O verificador rejeitará tentativa de ativação sem rota.

## 2. Matriz de regras e critérios verificáveis

| ID | Regra obrigatória | Controle |
| --- | --- | --- |
| ARQ-01 | HashRouter, AppShell, PageErrorBoundary e catálogo de rotas central | Estático: src/app/App.tsx |
| ARQ-02 | Importação global e ordenada das folhas de estilo compartilhadas | Estático: src/app/main.tsx |
| MOD-01 | Manifesto, slug e entrada React com export default | Estático: src/modules |
| MOD-02 | Rota, label e etapa coerentes com o catálogo; rota exclusiva por módulo | Estático: módulo e src/app/routes.ts |
| MOD-03 | Documento e arquivo de teste próprios | Estático: existência; revisão humana da qualidade |
| MOD-04 | Importar bibliotecas pelos barrels públicos, sem acessar arquivos internos | Estático: padrões de importação |
| UI-01 | Reutilizar Button, HubLink, Card, Tabs, Dialog, DataExplorer, FormPanel, Alert e demais componentes | Estático para nomes duplicados; revisão humana do layout |
| UI-02 | Não criar arquivos CSS, SCSS, Less ou Sass dentro de src/modules | Estático: extensões de arquivos |
| UI-03 | Não usar cores literais, rgb(), hsl() e utilitários Tailwind de cor independentes | Estático para padrões reconhecidos; revisão humana |
| UI-04 | Responsividade e estados por meio do Design System central, sem outro shell | Revisão humana + testes de interface |
| A11Y-01 | Rótulos, navegação por teclado, foco visível, títulos, semântica e leitura assistiva | Testes e revisão com leitores de tela |
| A11Y-02 | Contraste de texto normal >=4,5:1 e dos elementos essenciais não textuais >=3:1 | Verificação de tokens + auditoria real |
| DATA-01 | Nenhum componente de módulo importa Firebase diretamente | Estático + revisão de segurança |
| DATA-02 | Nenhum componente de módulo faz fetch ou usa storage diretamente | Estático + revisão de arquitetura |
| DATA-03 | Não utilizar dangerouslySetInnerHTML em módulos | Estático |
| DATA-04 | Acesso a dados reais, autorização e regras de negócio devem ficar em serviços aprovados | Manual e testes de autorização |
| PUB-01 | Merge, deploy, publicação ou ativação de Firebase somente mediante aprovação explícita | Processo, revisão da branch e CI sem deploy |

### Detalhes da interface

- **Interações:** componentes comuns vêm de src/components/ui e seu
  index público; ações são Button, navegação é HubLink.
- **Dados:** usar src/components/data com legenda, busca, ordenação,
  paginação, indicadores e estados vazios/carregamento quando aplicáveis.
- **Formulários:** usar src/components/form, erros textuais e
  FormErrorSummary; não anunciar salvamento sem conclusão do serviço.
- **Feedback:** usar src/components/feedback, Alert ou ConfirmDialog;
  erros importantes não devem desaparecer automaticamente.
- **Responsividade:** revisar 320, 375, 768, 1024 e 1440 px e zoom
  até 400%; tabelas podem ter rolagem dentro do próprio contêiner.
- **Acessibilidade:** verificar teclado, foco, labels, ARIA, movimento
  reduzido, contraste e NVDA/VoiceOver/TalkBack quando possível.
- **Tokens:** usar sempre as seis cores identitárias e seus tokens
  semânticos; nunca definir outra paleta por módulo. O par
  marfim (#F1E8D6) sobre ocre (#93633E) **não** é aprovado para texto
  normal (4,21:1).

## 3. Responsabilidade de dados e segurança

Os componentes recebem somente dados que a camada de serviço já
autorizou. O módulo distingue estados local, loading, vazio, erro e
sucesso. Nenhum campo, botão ou notificação deve representar operação
persistida antes de confirmação real.

Quando for autorizada a integração Firebase, concentrar acesso em
src/services, testar autorização por usuário e regras do Firestore, e
manter lógica de jogo reutilizável em src/rules. A verificação de texto
por regex **não** comprova segurança, qualidade de controles de acesso
nem ausência de todos os acessos indiretos.

Fixtures, exemplos, logs e capturas não podem conter contas, fichas,
segredos do Mestre, chaves ou dados privados reais.

## 4. Rotina obrigatória de desenvolvimento

1. Obter autorização do item/etapa e trabalhar na branch isolada aprovada.
2. Preencher manifesto, entrada, documento e teste do módulo.
3. Reutilizar o Design System; propor extensão central quando faltar
   componente reutilizável, sem duplicações locais.
4. Escrever testes para navegação, dados permitidos, vazio, erro,
   loading, sucesso, estado desabilitado e ações destrutivas.
5. Executar npm ci, npm run verify:design-system e npm run check;
   registrar commit, ambiente, log e resultado de cada execução.
6. Inspecionar a interface em larguras reais e com teclado/tecnologias
   assistivas; registrar limitações sem mascará-las.
7. Apresentar o diff e as evidências para aprovação específica.
   **Não fazer merge nem publicar por iniciativa da implementação.**

A pipeline da branch executa npm run check, agora incluindo a verificação
do contrato. Não há autorização de deploy no workflow da Etapa 2.

## 5. Como funciona a verificação

- scripts/design-system-contract.mjs: funções puras de análise estática
  de bootstrap, roteador e novos módulos.
- scripts/design-system-contract.test.mjs: **24 cenários escritos e executados** com
  exemplos positivos e negativos usando o executor nativo node:test.
- scripts/verify-design-system.mjs: examina a estrutura real do workspace,
  preservando exclusivamente as nove reservas README-only.
- npm run verify:design-system: executa os testes do contrato e a análise
  do workspace, falhando com código de erro se houver violações.
- npm run check: integra o comando ao TypeScript, ESLint, Vitest,
  Prettier, limites de Firebase, contraste, build e Pages.

A regra estática reconhece padrões conhecidos, mas **não usa um parser AST**
para provar ausência de todos os estilos, importações ou acessos a rede.
Ela também não garante que o conteúdo dos testes seja significativo.

## 6. Exceções e governança

Mudanças justificadas (ex.: visualização especializada, novas rotas,
componentes inéditos ou extensão de serviços) exigem proposta
documentada e **aprovação expressa do Mestre**. Se for preciso mudar
o verificador, alterar os respectivos testes de regressão e explicar
a razão; não remover controles apenas para silenciar erros.

O checklist de revisão fica em .github/pull_request_template.md e o
modelo de documento por módulo em docs/modules/README.md.

**Não há exceção automática para novos módulos, nem ativação de backend.**

## 7. Estado e aceitação

| Evidência | Situação |
| --- | --- |
| Regras, arquitetura e modelo dos novos módulos | Documentados |
| Verificador de importações, rotas, pastas, CSS e I/O | Código escrito |
| Testes positivos/negativos do contrato | **24/24 aprovados no CI** |
| Integração de verificação a npm run check | Configurada |
| Execução integral de npm run check com resultado verificável | **Falhou: 9 testes de itens anteriores; build não executado** |
| Inspeção visual, acessibilidade, segurança de dados | **Pendente** |
| Merge para main, publicação ou ativação de Firebase | **Não autorizado** |

**Registro de CI:** [run 44804504906](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44804504906), SHA `0321be8c5de6046a63dee3570cf4874748024029`: 24 testes de contrato passaram; a suíte geral chegou a 139 testes aprovados e 9 falhas. Os problemas de acessibilidade, demos, responsividade e feedback devem ser tratados separadamente, sem mascarar o resultado.

O item **2.12 — Testes de consistência** permanece separado e só será
iniciado após aprovação específica do 2.11.
