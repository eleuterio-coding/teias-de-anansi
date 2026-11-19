# HUB-CONTINUIDADE.md — Registro permanente da reconstrução V2

> Atualizado em 2026-11-19. Este documento controla continuidade; **não** comprova conclusão de implementação. Confrontar sempre com a árvore e o histórico atuais do GitHub.

## Estado atual confirmado
- Repositório: https://github.com/eleuterio-coding/teias-de-anansi
- Branch principal: `main`.
- Endereço planejado: https://eleuterio-coding.github.io/teias-de-anansi/
- **Passo atual: 01 — Estrutura e layout (em andamento; fundação da aplicação ainda não implementada).**
- **Passos concluídos: 0 de 11.**
- Passo autorizado nesta interação: estabelecer o mecanismo de continuidade do Passo 01. Isso **não** constitui aprovação ou conclusão de todo o Passo 01.
- Estado inicial observado em 2026-11-19: a branch `main` havia sido zerada no commit `bcdfd225d2a41fcb53f4fe020ba8b86be6523b67` e continha apenas um README. Não há V2 funcional demonstrada.
- Referência histórica: commit anterior à limpeza `a582dd114a9344d9ab4ab97341238e9abdda4303`, que contém a arquitetura, documentação, catálogos, estilos e código legado. Consultar seus arquivos antes de reconstruir funcionalidades. A existência desse histórico **não** significa que ele já tenha sido migrado.

## Checklist mestre — 11 passos fixos

| Nº | Passo | Status | Evidência / observação |
|---:|---|---|---|
| 01 | Estrutura e layout | **Em andamento** | Apenas instruções e registro de continuidade criados; aplicação e design system ainda pendentes |
| 02 | Usuários e permissões | Não iniciado | Preservar autenticação e permissões existentes |
| 03 | Livros | Não iniciado | Recuperar e catalogar fontes existentes |
| 04 | Biblioteca | Não iniciado | Regras, referências e Regras da Casa |
| 05 | Motor de regras | Não iniciado | Mecânicas, cálculos e conflitos entre fontes |
| 06 | Personagens | Não iniciado | Criação, evolução e fichas |
| 07 | Campanhas | Não iniciado | Gestão, participantes e vínculos |
| 08 | Aventuras e sessões | Não iniciado | Planejamento, cenas e registros |
| 09 | NPCs e encontros | Não iniciado | Criaturas, NPCs e encontros |
| 10 | Combate e ferramentas | Não iniciado | Iniciativa, condições, recursos e rolagens |
| 11 | Painel e configurações | Não iniciado | Mestre, Jogadores e preferências |

**Não acrescentar passos**. Testes, correções, documentação e publicação pertencem aos próprios passos.

## Diretrizes técnicas acordadas
- Stack prevista: React, TypeScript, Vite e CSS Modules/variáveis globais, com Design System e layout único compartilhado.
- Hospedagem: GitHub Pages. Dados e login: Firebase Authentication + Cloud Firestore já existentes, mantendo o plano Spark/sem faturamento.
- Sem novo processo de segurança para entrar: nome de usuário e senha definidos somente pelo Mestre; sem autocadastro, recuperação obrigatória por e-mail, 2FA ou exigências extras.
- Continuar respeitando o isolamento funcional de dados: conteúdo privado do Mestre, fichas atribuídas e visibilidade de campanhas/sessões/aventuras.
- Preservar contas, credenciais, regras de acesso, funcionalidades e dados legados. Nunca presumir que dado local foi sincronizado sem verificá-lo.
- A interface deve reutilizar shell, componentes e tokens; preservar diferenças funcionais entre Mestre/Jogadores.
- Fontes de RPG diferentes podem coexistir. Precedência de regras conflitantes precisa de decisão específica dentro do escopo existente.
- A versão anterior documentou no histórico `docs/v2/DECISOES.md` os mesmos 11 blocos, a matriz de visibilidade, critérios de aprovação e decisões de compatibilidade. Consultar antes de mudar o escopo.

## Entregas verificadas nesta sessão
- Criado `AGENTS.md`: contrato obrigatório para leitura, implementação, preservação de decisões, validação e registro.
- Criado `HUB-CONTINUIDADE.md`: checklist fixo e ponto oficial de retomada.
- Arquivos de aplicação V2 implementados: **nenhum nesta sessão**.
- Contas ou configuração Firebase modificadas: **nenhuma**.
- Testes de aplicação, login, Firestore e interface executados: **nenhum**. A revisão documental e as gravações no GitHub não substituem esses testes.
- Aprovação final do Passo 01: **pendente**.

## Ponto exato de retomada
1. Ler `AGENTS.md` e este registro antes de qualquer código.
2. Inspecionar a `main`, o histórico anterior e os recursos já existentes; preservar decisões e funcionalidades.
3. Continuar **o mesmo Passo 01 — Estrutura e layout**: montar a fundação Vite/React/TypeScript, tokens e componentes visuais compartilhados, navegação e responsividade.
4. Implementar e testar antes de apresentar o Passo 01 para aprovação final. Não oferecer ainda o avanço ao Passo 02.
5. Atualizar esta seção com arquivos, commits, resultados e pendências sempre que houver alterações relevantes.

## Convenção para atualizações futuras
Em cada sessão, alterar este documento **na mesma entrega** do código modificado e registrar: data, passo e status; arquivos e commits; verificação desktop/mobile e de dados/permissões, quando aplicável; o que foi preservado; o que falhou ou não foi testado; e ponto preciso para continuar. Não copiar senhas, IDs pessoais ou segredos para este arquivo.
