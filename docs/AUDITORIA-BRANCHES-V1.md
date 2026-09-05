# Auditoria de PRs e branches — release v1.0

Data da revisão: 2026-09-05.

## Resultado executivo

A revisão de release encontrou três PRs históricos ainda abertos. Todos foram analisados individualmente e fechados como **superseded**, sem merge cego:

| PR | Branch | Resultado |
| --- | --- | --- |
| #123 · Auditoria normativa total da criação | `audit/normativa-total-criacao` | Fechado sem merge. O PR #137 documentou a estratégia de transplantar seletivamente suas evidências/regras sobre a arquitetura vigente; o Bloco 9 foi depois fechado na `main`. |
| #94 · Progressão de magias de conjuradores | `fix/spell-progression-all-casters-20260825` | Fechado sem merge. A `main` possui o motor vigente de progressão nível a nível e o Bloco 5 consolidou preparação/magias/descansos; mesclar a árvore antiga reintroduziria arquitetura paralela. |
| #30 · Integração antiga de Antecedentes | `fix/antecedentes-integracao-ficha-20260821` | Fechado sem merge. O PR pertence ao carregador modular antigo e foi substituído pelo construtor integrado atual. |

Depois dessas decisões, não há PR de release conhecido aguardando merge.

## Branches oficiais dos Blocos 1–16

A consulta ao histórico de PRs comprova que as branches oficiais dos blocos abaixo foram efetivamente mescladas na `main`:

| Bloco | Branch | PR mesclado |
| ---: | --- | ---: |
| 1 | `codex/bloco-1-ficha-modo-jogo` | #129 |
| 2 | `codex/bloco-2-progressao-level` | #130 |
| 3 | `codex/bloco-3-inventario-economia` | #131 |
| 4 | `codex/bloco-4-combate-recursos` | #132 |
| 5 | `codex/bloco-5-magias-descansos` | #133 |
| 6 | `codex/bloco-6-campanhas-mesas` | #134 |
| 7 | `codex/bloco-7-biblioteca-dados` | #135 |
| 8 | `codex/bloco-8-ux-mobile-auditoria` | #136 |
| 9 | `codex/bloco-9-auditoria-normativa-total` | #137 |
| 10 | `codex/bloco-10-fechamento-mecanico-ficha` | #138 |
| 11 | `codex/bloco-11-rolagens-resolucao` | #139 |
| 12 | `codex/bloco-12-encontros-mestre` | #140 |
| 13 | `codex/bloco-13-aventuras` | #141 |
| 14 | `codex/bloco-14-persistencia-portabilidade` | #142 |
| 15 | `codex/bloco-15-usuarios-colaboracao` | #143 |
| 15 · fechamento | `codex/bloco-15-fechamento` | #144 |
| 16 | `codex/bloco-16-painel-geral` | #145 |

Essas branches são **candidatas seguras à limpeza do ponto de vista de release**, pois seus PRs foram mesclados e os respectivos blocos foram aceitos. Uma comparação Git pode ainda reportar `diverged` quando o merge foi squash/rebase; isso não transforma a branch em trabalho pendente. Exemplo observado no Bloco 1: a branch conserva commits próprios enquanto a `main` já contém mais de uma centena de commits posteriores.

O Bloco 17 foi aplicado diretamente à `main` durante sua implementação e aceite; não há uma branch `codex/bloco-17-*` na lista encontrada.

## Branches dos PRs superseded

Também são candidatas a remoção, depois do fechamento explícito dos PRs:

- `audit/normativa-total-criacao` (#123);
- `fix/spell-progression-all-casters-20260825` (#94);
- `fix/antecedentes-integracao-ficha-20260821` (#30).

Os commits permanecem alcançáveis pelo histórico dos PRs fechados mesmo depois de uma eventual exclusão das refs de branch, conforme o comportamento normal do GitHub para PRs existentes.

## Branches não classificadas

O repositório contém numerosas branches históricas `agent/*`, `feature/*`, `fix/*`, `hotfix/*`, `audit/*`, `chore/*` e `codex/*` anteriores ao roadmap final. Elas **não foram classificadas automaticamente como descartáveis** apenas por idade ou prefixo.

Política adotada para o release:

1. branch associada a PR mesclado: candidata à remoção;
2. branch associada a PR explicitamente fechado como superseded: candidata à remoção;
3. branch sem vínculo/evidência suficiente: preservar até revisão própria;
4. nunca mover/forçar uma ref para “simular” exclusão.

## Limitação operacional desta sessão

O conector GitHub disponível permite pesquisar branches, comparar commits, criar branches e mover refs, mas **não expõe uma operação de exclusão de Git ref/branch**. Por isso nenhuma branch foi artificialmente movida, sobrescrita ou apagada nesta homologação.

A limpeza lógica de release está concluída: PRs abertos foram resolvidos e as branches oficiais/superseded foram classificadas. A exclusão física das refs candidatas continua sendo uma ação administrativa do GitHub que deve ser executada apenas por uma ferramenta com suporte explícito a `delete ref`.

Essa limitação não será mascarada como sucesso: o `ROADMAP-V1.md` só deve registrar o Bloco 18 como aceito quando os demais gates técnicos também tiverem evidência final.
