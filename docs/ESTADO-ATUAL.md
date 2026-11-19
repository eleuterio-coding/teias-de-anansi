# Teias de Anansi 2.0 — Estado atual

**Data de referência:** 19/11/2026  
**Versão de fundação:** 0.1.0  
**Branch:** `feature/etapa-1-fundacao-8-etapas`  
**Estado geral:** Etapa 1 em desenvolvimento, item 1.08 aguardando validação/aceite.

## Controle do escopo autorizado

| Item | Entrega | Estado |
| --- | --- | --- |
| 1.01 | Inventário do repositório e histórico | Aprovado |
| 1.02 | Escopo em oito etapas | Aprovado |
| 1.03 | Estrutura de pastas | Aprovado |
| 1.04 | Dependências e configuração técnica | Aprovado |
| 1.05 | Navegação, rotas e estados básicos | Aprovado |
| 1.06 | Base e build GitHub Pages sem deploy | Aprovado |
| 1.07 | Adaptadores Firebase sem acesso ao serviço | Aprovado |
| **1.08** | **Qualidade, manutenção, scripts e documentação** | **Aguardando aprovação** |
| 1.09 | Prova de execução e apresentação da base | **Não iniciado / não autorizado** |

## Componentes existentes

- Entrada React com `HashRouter`, oito rotas de módulos provisórias, início, 404, loading e tratamento de erro.
- `src/services/firebase/` com configuração pública e adaptadores sem chamadas no bootstrap.
- `package.json` / `package-lock.json` com versões fixas.
- `tests/` com casos de navegação, Firebase simulado, recuperação e ambiente.
- Workflow GitHub Actions de verificação e arquivo temporário de `dist/` sem deploy.
- `scripts/verify-pages-build.mjs` para recursos compilados e `scripts/verify-boundaries.mjs` para limitações atuais.

## Limitações e pendências

1. O Firebase ativo e as cinco contas **não foram acessados nem verificados ao vivo**; não foram alterados.
2. Apenas simulações `jsdom` de navegação foram testadas; não houve revisão visual em diferentes navegadores ou hospedagem pública.
3. Biblioteca, fichas, campanhas, permissões e demais regras do jogo **não estão implementadas**.
4. A identidade visual definitiva e os componentes compartilhados são da Etapa 2.
5. Conteúdos privados no bundle do GitHub Pages seriam públicos; arquivos não autorizados não podem ser adicionados.
6. O script de limites é um conjunto **restrito de verificações preventivas** sobre arquivos selecionados e nomes de arquivos versionados. Não garante ausência de segredos ou segurança do Firestore.
7. A migração, a recuperação de dados e a publicação não foram iniciadas; são atividades posteriores previstas no planejamento.

## Proteção do que já existe

`main` permanece preservada (commit de referência anterior ao item 1.08: `23ea59b0341261e97aeab9d5bc0ecfac8500132b`). Nenhuma mudança nas regras, índices, contas, dados ou serviço remoto Firebase; nenhuma publicação do novo Hub.

## Prova de qualidade

O resultado do workflow do item 1.08 será registrado em `docs/etapas/etapa-1/1.08-qualidade-manutencao.md`. Compilar e testar durante a manutenção **não constitui início do item 1.09**, que depende de autorização própria.
