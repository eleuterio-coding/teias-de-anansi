# Laboratório de interface — Etapa 2.10

Esta pasta contém **somente exemplos de apresentação**. Não há dados reais,
regras de RPG, backend, autenticação ou persistência.

## Rotas

O catálogo está em [demo-routes.ts](../../demo-routes.ts). A navegação usa o
`HashRouter` já adotado no projeto.

- `/laboratorio`: entrada e componentes visuais.
- `/laboratorio/componentes`: ações, menus, abas, alertas e diálogos.
- `/laboratorio/dados`: DataExplorer alimentado por 12 registros inventados.
- `/laboratorio/formularios`: formulário de validação local sem envio.
- `/laboratorio/estados`: notificações e estados de operação simulados.

O componente `DemoScaffold` centraliza aviso de dados fictícios, orientação
e navegação interna. Mantenha essa identificação em todas as páginas.

## Regras

1. Reutilize os componentes públicos existentes em `components/ui`,
   `components/data`, `components/form` e `components/feedback`.
2. CSS de apresentação fica somente em `styles/demo.css` e usa tokens 2.02.
3. Cada interação pode mudar apenas valores de `useState` local ou mensagens
   do `ToastProvider`, sem carregar dados reais.
4. Não inserir nomes, IDs, tokens, campanhas ou histórias pessoais reais no
   código/fixtures da galeria.
5. Não substituir os oito placeholders oficiais pela galeria.
6. Não publicar as rotas sem autorização expressa do Mestre.
7. Não confundir demonstração com validação visual/assistiva já executada.

Testes: `tests/demo-pages.test.tsx`. Registro e pendências:
[2.10 — Páginas demonstrativas](../../../../docs/etapas/etapa-2/2.10-paginas-demonstrativas.md).
