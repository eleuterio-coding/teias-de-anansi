# Etapa 2 — Design System e layout único

**Data de início:** 20/11/2026  
**Branch isolada:** `feature/etapa-2-design-system-20261120`  
**Origem:** `feature/etapa-1-fundacao-8-etapas` (Etapa 1 concluída e aprovada)  
**Autorização:** o Mestre iniciou a Etapa 2 em 20/11/2026, aprovou expressamente os itens 2.01 e 2.02 e depois aprovou o item 2.03, ciente de que seus testes automatizados ainda não haviam sido confirmados. Autorizou o item 2.04 em branch isolada, sem alterar `main` nem publicar.

## Objetivo

Consolidar uma identidade visual centralizada e componentes obrigatórios para todos os módulos da reconstrução do Teias de Anansi 2.0, eliminando diferenças visuais entre páginas.

## Itens e situação

| Item | Entrega | Situação |
| --- | --- | --- |
| 2.01 | Direção artística | **Aprovado em 20/11/2026** |
| 2.02 | Tokens de identidade visual | **Aprovado em 20/11/2026**; integrado ao shell em 2.03 |
| 2.03 | Estrutura global do Hub | **Aprovado pelo Mestre em 20/11/2026**, com pendência declarada de testes |
| 2.04 | Responsividade | Implementado para revisão; testes automatizados escritos, execução não confirmada |
| 2.05 | Componentes de interação | Não iniciado |
| 2.06 | Apresentação de dados | Não iniciado |
| 2.07 | Formulários padronizados | Não iniciado |
| 2.08 | Mensagens de sistema | Não iniciado |
| 2.09 | Acessibilidade | Não iniciado |
| 2.10 | Páginas demonstrativas | Não iniciado |
| 2.11 | Padrão obrigatório de desenvolvimento | Não iniciado |
| 2.12 | Testes de consistência | Não iniciado |

## Documentos

- [2.01 — Direção artística](2.01-direcao-artistica.md).
- [2.02 — Tokens de identidade visual](2.02-tokens-identidade-visual.md).
- [Arquivo CSS de tokens](../../../src/styles/tokens.css).
- [2.03 — Estrutura global do Hub](2.03-estrutura-global.md).
- [2.04 — Responsividade](2.04-responsividade.md).
- [CSS responsivo compartilhado](../../../src/styles/responsive.css).

## Limites de trabalho

- Nenhum merge para `main` ou deploy do site publicado.
- Não acessar ou alterar dados, usuários, regras ou configuração remota do Firebase.
- Não ativar módulos de RPG provisórios ou introduzir dados privados no bundle.
- Trabalhar item a item, com aceite expresso antes de iniciar o item seguinte.
- O botão de avançar na conversa deve enviar uma solicitação explícita para o próximo item; não deve executar aprovações ou publicações silenciosamente.
- O arquivo de tokens foi integrado ao shell no item 2.03, mas a propagação integral dependerá das páginas e componentes posteriores e dos testes 2.12.
