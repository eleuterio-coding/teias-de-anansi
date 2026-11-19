# Teias de Anansi 2.0 — Estado atual

**Data de referência:** 19/11/2026  
**Versão de fundação:** 0.1.0  
**Branch:** `feature/etapa-1-fundacao-8-etapas`  
**Estado geral:** Etapa 1, item 1.09 executado e testado com sucesso; aguarda aceite do Mestre.

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
| 1.08 | Qualidade, manutenção, scripts e documentação | Aprovado |
| **1.09** | **Prova de execução e apresentação da base** | **Testado / aguardando aprovação** |

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

O item 1.08 foi aprovado. A prova específica do item 1.09 é registrada em `docs/etapas/etapa-1/1.09-prova-de-execucao.md`; esse teste usa apenas servidor e navegador locais do runner, sem deploy.


## Resultado da verificação do item 1.08

- GitHub Actions: [execução 44632922174](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44632922174) — **sucesso**.
- **37 testes aprovados em seis arquivos**, com testes Firebase simulados e recuperação de interface.
- `npm ci`, TypeScript, ESLint, Prettier, `npm run verify:boundaries`, build Vite e `npm run pages:check`: **aprovados**.
- Um artefato temporário `dist/` foi produzido para inspeção, **não publicado**.
- O workflow final mantém `permissions: contents: read` e não usa comandos de deploy.
- Verificação do GitHub após os testes: `main` permaneceu em `23ea59b0341261e97aeab9d5bc0ecfac8500132b`.

**Nota de rastreabilidade:** documentos de itens anteriores podem conter o estado "aguardando aprovação" registrado na data da respectiva entrega. Para o estado **atual** dos aceites 1.01–1.08, prevalece a tabela deste documento. O item 1.09 está autorizado, mas ainda depende de aceite; a Etapa 2 não foi iniciada.

## Resultado verificável do item 1.09

- [GitHub Actions 44635275870](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44635275870): **success**.
- **37 testes aprovados em seis arquivos**; TypeScript, ESLint, Prettier, limites preventivos, build e caminhos Pages aprovados.
- Servidor `vite preview` iniciado localmente no runner em `127.0.0.1:4173`.
- HTTP 200 para `index.html` e duas referências estáticas a JavaScript e CSS.
- `/usr/bin/google-chrome` em modo headless renderizou `#/`, `#/biblioteca` e `#/rota-inexistente`.
- Três [capturas PNG e relatório](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44635275870/artifacts/14583058977) gerados. As imagens foram abertas e inspecionadas após a execução: layout provisório legível e títulos corretos.
- [Artefato compilado](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44635275870/artifacts/14584125674), sem publicação.
- `main` conferida no commit `23ea59b0341261e97aeab9d5bc0ecfac8500132b`. Firebase real e contas não foram acessados/alterados.
- Limitação: não houve teste manual de usuários nem acesso pelo domínio público; a identidade visual continua reservada à Etapa 2.

**Decisão pendente:** aceite formal do item 1.09, encerramento da Etapa 1 e eventual autorização separada da Etapa 2. Não há avanço automático.
