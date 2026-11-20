# Teias de Anansi 2.0

Reconstrução do **Hub privado de RPG** em **oito etapas**, com aprovação explícita a cada item. Esta é a base técnica em desenvolvimento, **não a versão publicada do Hub**.

- Repositório: https://github.com/eleuterio-coding/teias-de-anansi
- Site reservado para publicação futura: https://eleuterio-coding.github.io/teias-de-anansi/
- Branch de desenvolvimento: `feature/etapa-1-fundacao-8-etapas`
- `main`: preservada durante a fundação; **não fazer merge/deploy sem autorização**.

## Estado do projeto

**Etapa 1 — Fundação da aplicação encerrada e aprovada em 20/11/2026.** Os itens **1.01 a 1.09** receberam aceite expresso do Mestre. A próxima Etapa 2 — Design System **não foi iniciada nem autorizada**. Nenhuma publicação foi realizada.

A aplicação atual possui apenas navegação e módulos provisórios. **Não há login em funcionamento, ficha, campanha ou biblioteca real**. O SDK Firebase foi preparado em `src/services/firebase/`, mas não é chamado na inicialização; nenhuma leitura/escrita ou alteração remota foi executada.

Leia [Estado atual](docs/ESTADO-ATUAL.md), [Guia de manutenção](docs/MANUTENCAO.md) e [Estrutura de pastas](docs/ESTRUTURA-DE-PASTAS.md).

## Requisitos e instalação

Node.js **22** recomendado (mínimo declarado no `package.json`: 20.19.0), npm e Git.

```bash
git checkout feature/etapa-1-fundacao-8-etapas
npm ci
npm run dev
```

O Vite informa a URL local. A rota inicial usa o fragmento `/#/`, e páginas de módulos seguem `/#/biblioteca`, `/#/personagens` etc. O caminho-base para GitHub Pages está configurado como `/teias-de-anansi/`.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Inicia servidor local do Vite, **sem deploy**. |
| `npm run typecheck` | Verifica tipos TypeScript sem emitir arquivos. |
| `npm run lint` | Verifica padrões de código via ESLint. |
| `npm run test:run` | Executa testes Vitest uma vez. |
| `npm run format:check` | Confere formatação com Prettier, sem alterar arquivos. |
| `npm run format` | Formata código localmente; conferir diff antes do commit. |
| `npm run verify:boundaries` | Confere regras preventivas da fundação (não é auditoria completa). |
| `npm run build` | Compila localmente para `dist/`. |
| `npm run pages:check` | Confere links JS/CSS gerados para o GitHub Pages; requer build. |
| `npm run check` | Executa, em ordem, todas as verificações acima (exceto `dev`). |
| `npm run preview` | Prévia local do build; não publica no GitHub Pages. |
| `npm run proof:preview` | Inicia a prévia em localhost:4173, verifica assets e três rotas com Chrome/Chromium headless; gera capturas em `proof/` (requer build e navegador instalado). |

O GitHub Actions executa as verificações na branch isolada e disponibiliza `dist/` por sete dias como **artefato de CI**, não como site publicado. O workflow tem permissões somente de leitura.

## Arquitetura e limites

- **Interface:** React 18, TypeScript, Vite, React Router e Tailwind CSS.
- **Testes e manutenção:** Vitest, React Testing Library, ESLint, Prettier e validação CI.
- **Firebase:** adaptadores de SDK para Authentication/Firestore, sem ativação ou conexão automática. Configuração pública descrita em `.env.example` (todos os valores vazios).
- **Dados privados:** nunca colocar personagens, anotações do Mestre, senhas, credenciais administrativas ou obras protegidas em `src/data`, `public` ou no bundle estático.
- **Custo:** operação prevista com GitHub Pages e Firebase Spark, sem assinatura, Blaze, Cloud Storage ou serviços pagos.
- **Controle de mudanças:** cada item aguarda aceite. A publicação definitiva está reservada para a Etapa 8.

O projeto Firebase **historicamente** tinha o ID `teais-de-anansi` (grafia do registro antigo); seu estado real ainda não foi conferido. Não ajustar nomes, regras ou contas por suposição.

## Continuidade

Os procedimentos para desenvolver, revisar, registrar testes, tratar falhas e respeitar os limites gratuitos estão em [docs/MANUTENCAO.md](docs/MANUTENCAO.md). A prova de execução está documentada em [1.09 — Prova de execução](docs/etapas/etapa-1/1.09-prova-de-execucao.md). O próximo trabalho só pode começar após aprovação expressa do Mestre.

## Prova de execução sem deploy (item 1.09)

A execução [44635275870](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44635275870) do GitHub Actions foi concluída com sucesso: **37 testes automatizados** em seis arquivos, TypeScript, ESLint, Prettier, limites preventivos, build Vite e verificação dos caminhos de GitHub Pages.

Um servidor temporário `127.0.0.1:4173` serviu a aplicação compilada. O **Google Chrome headless** carregou a página inicial, a Biblioteca provisória e a página 404; capturas PNG (1280×900) e relatório JSON foram arquivados, sem acesso ao Firebase.

- [Capturas e relatório da prova](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44635275870/artifacts/14583058977)
- [Build compilado para inspeção](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44635275870/artifacts/14584125674)

Artefatos temporários de sete dias, **não são publicação de site**. O item 1.09 e o encerramento da Etapa 1 foram aprovados em 20/11/2026. A Etapa 2 exige **nova autorização expressa**; nenhum merge, deploy ou contato com o Firebase foi autorizado.
