# Etapa 2 — Design System e layout único

**Data de início:** 20/11/2026  
**Branch isolada:** `feature/etapa-2-design-system-20261120`  
**Origem:** `feature/etapa-1-fundacao-8-etapas` (Etapa 1 concluída e aprovada)  
**Autorização:** o Mestre aprovou expressamente os itens 2.01–2.09 em 20/11/2026, com ciência das pendências de execução dos testes, build, tecnologias assistivas e validação visual. Autorizou implementar o item 2.10 na mesma branch isolada, com dados fictícios e sem alterar `main` nem publicar.

## Objetivo

Consolidar uma identidade visual centralizada e componentes obrigatórios para todos os módulos da reconstrução do Teias de Anansi 2.0, eliminando diferenças visuais entre páginas.

## Itens e situação

| Item | Entrega | Situação |
| --- | --- | --- |
| 2.01 | Direção artística | **Aprovado em 20/11/2026** |
| 2.02 | Tokens de identidade visual | **Aprovado em 20/11/2026**; integrado ao shell em 2.03 |
| 2.03 | Estrutura global do Hub | **Aprovado pelo Mestre em 20/11/2026**, com pendência declarada de testes |
| 2.04 | Responsividade | **Aprovado em 20/11/2026**, com pendências declaradas de testes e inspeção visual |
| 2.05 | Componentes de interação | **Aprovado pelo Mestre em 20/11/2026**, com pendências de teste e validação visual declaradas |
| 2.06 | Apresentação de dados | **Aprovado em 20/11/2026**, com pendências declaradas de execução, build e revisão visual |
| 2.07 | Formulários padronizados | **Aprovado em 20/11/2026**, com pendências declaradas de testes, build e revisão visual |
| 2.08 | Mensagens de sistema | **Aprovado em 20/11/2026**, com pendências declaradas de testes, build e revisão visual |
| 2.09 | Acessibilidade | **Aprovado em 20/11/2026**, com pendências declaradas de execução, build e testes assistivos |
| 2.10 | Páginas demonstrativas | Cinco páginas implementadas com dados fictícios, aguardando testes e aprovação |
| 2.11 | Padrão obrigatório de desenvolvimento | Não iniciado |
| 2.12 | Testes de consistência | Não iniciado |

## Documentos

- [2.01 — Direção artística](2.01-direcao-artistica.md).
- [2.02 — Tokens de identidade visual](2.02-tokens-identidade-visual.md).
- [Arquivo CSS de tokens](../../../src/styles/tokens.css).
- [2.03 — Estrutura global do Hub](2.03-estrutura-global.md).
- [2.04 — Responsividade](2.04-responsividade.md).
- [CSS responsivo compartilhado](../../../src/styles/responsive.css).
- [2.05 — Componentes de interação](2.05-componentes-interacao.md).
- [Guia de componentes](../../../src/components/README.md).
- [CSS da biblioteca UI](../../../src/styles/components.css).
- [2.06 — Apresentação de dados](2.06-apresentacao-de-dados.md).
- [Guia da biblioteca de dados](../../../src/components/data/README.md).
- [CSS de apresentação de dados](../../../src/styles/data.css).
- [2.07 — Formulários padronizados](2.07-formularios-padronizados.md).
- [Guia da biblioteca de formulários](../../../src/components/form/README.md).
- [CSS de formulários](../../../src/styles/forms.css).
- [2.08 — Mensagens de sistema](2.08-mensagens-de-sistema.md).
- [Guia da biblioteca de feedback](../../../src/components/feedback/README.md).
- [CSS de feedback do sistema](../../../src/styles/feedback.css).
- [2.09 — Acessibilidade transversal](2.09-acessibilidade.md).
- [2.09 — Roteiro manual de auditoria](2.09-mapa-de-auditoria.md).
- [Teste de contraste dos tokens](../../../scripts/verify-accessibility-colors.mjs).
- [2.10 — Páginas demonstrativas](2.10-paginas-demonstrativas.md).
- [Laboratório de interface](../../../src/app/pages/demo/README.md).
- [Rotas das demonstrações](../../../src/app/demo-routes.ts).
- [CSS da galeria](../../../src/styles/demo.css).

## Limites de trabalho

- Nenhum merge para `main` ou deploy do site publicado.
- Não acessar ou alterar dados, usuários, regras ou configuração remota do Firebase.
- Não ativar módulos de RPG provisórios ou introduzir dados privados no bundle.
- Trabalhar item a item, com aceite expresso antes de iniciar o item seguinte.
- O botão de avançar na conversa deve enviar uma solicitação explícita para o próximo item; não deve executar aprovações ou publicações silenciosamente.
- O arquivo de tokens foi integrado ao shell no item 2.03, mas a propagação integral dependerá das páginas e componentes posteriores e dos testes 2.12.
