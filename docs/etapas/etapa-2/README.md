# Etapa 2 — Design System e layout único

**Data de início:** 20/11/2026  
**Branch isolada:** `feature/etapa-2-design-system-20261120`  
**Origem:** `feature/etapa-1-fundacao-8-etapas` (Etapa 1 concluída e aprovada)  
**Autorização:** o Mestre determinou iniciar a Etapa 2 em 20/11/2026. Em seguida, aprovou expressamente os itens 2.01 e 2.02 e autorizou implementar o item 2.03 na branch isolada, sem alterações em `main` ou publicação.

## Objetivo

Consolidar uma identidade visual centralizada e componentes obrigatórios para todos os módulos da reconstrução do Teias de Anansi 2.0, eliminando diferenças visuais entre páginas.

## Itens e situação

| Item | Entrega | Situação |
| --- | --- | --- |
| 2.01 | Direção artística | **Aprovado em 20/11/2026** |
| 2.02 | Tokens de identidade visual | **Aprovado em 20/11/2026**; integrado ao shell em 2.03 |
| 2.03 | Estrutura global do Hub | Implementado na branch para revisão; aguardando testes e aceite |
| 2.04 | Responsividade | Não iniciado |
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

## Limites de trabalho

- Nenhum merge para `main` ou deploy do site publicado.
- Não acessar ou alterar dados, usuários, regras ou configuração remota do Firebase.
- Não ativar módulos de RPG provisórios ou introduzir dados privados no bundle.
- Trabalhar item a item, com aceite expresso antes de iniciar o item seguinte.
- O botão de avançar na conversa deve enviar uma solicitação explícita para o próximo item; não deve executar aprovações ou publicações silenciosamente.
- O arquivo de tokens foi integrado ao shell no item 2.03, mas a propagação integral dependerá das páginas e componentes posteriores e dos testes 2.12.
