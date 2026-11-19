# Teias de Anansi 2.0

Reconstrução do **Hub privado de RPG** em **oito etapas**, com aprovação explícita a cada item. Esta é a base técnica em desenvolvimento, **não a versão publicada do Hub**.

- Repositório: https://github.com/eleuterio-coding/teias-de-anansi
- Site reservado para publicação futura: https://eleuterio-coding.github.io/teias-de-anansi/
- Branch de desenvolvimento: `feature/etapa-1-fundacao-8-etapas`
- `main`: preservada durante a fundação; **não fazer merge/deploy sem autorização**.

## Estado do projeto

Os itens **1.01–1.07 foram aprovados** pelo Mestre. O item **1.08 — Qualidade e manutenção** foi implementado e testado, mas ainda exige aprovação do Mestre. O item **1.09 — Prova de execução** ainda não está autorizado.

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

Os procedimentos para desenvolver, revisar, registrar testes, tratar falhas e respeitar os limites gratuitos estão em [docs/MANUTENCAO.md](docs/MANUTENCAO.md). O próximo trabalho só pode começar após aprovação expressa do Mestre.
