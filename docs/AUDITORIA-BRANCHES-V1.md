# Auditoria de PRs e branches — release v1.0

Data da revisão: 2026-09-05.

## Resultado executivo

A revisão de release encontrou três PRs históricos abertos. Todos foram analisados individualmente e fechados como **superseded**, sem merge cego:

| PR | Branch | Resultado |
| --- | --- | --- |
| #123 · Auditoria normativa total da criação | `audit/normativa-total-criacao` | Fechado sem merge. O PR #137 documentou a estratégia de transplantar seletivamente suas evidências/regras sobre a arquitetura vigente; o Bloco 9 foi depois fechado na `main`. |
| #94 · Progressão de magias de conjuradores | `fix/spell-progression-all-casters-20260825` | Fechado sem merge. A `main` possui o motor vigente de progressão nível a nível e o Bloco 5 consolidou preparação/magias/descansos; mesclar a árvore antiga reintroduziria arquitetura paralela. |
| #30 · Integração antiga de Antecedentes | `fix/antecedentes-integracao-ficha-20260821` | Fechado sem merge. O PR pertence ao carregador modular antigo e foi substituído pelo construtor integrado atual. |

O PR técnico #146, criado apenas para observabilidade dos workflows do Bloco 18, também foi **fechado sem merge** depois que as evidências foram registradas na documentação oficial.

A consulta final ao endpoint de PRs abertos retornou **zero PRs abertos**.

## Branches oficiais dos Blocos 1–16

A consulta ao histórico de PRs comprovou que as branches oficiais abaixo foram efetivamente mescladas na `main`:

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

O Bloco 17 foi aplicado diretamente à `main`; não houve branch oficial `codex/bloco-17-*`.

## Limpeza física executada

A exclusão física das refs classificadas como seguras foi executada em 2026-09-05 por GitHub Actions, com lista fechada de branches. Foram removidas:

- branches oficiais `codex/bloco-*` dos Blocos 1–16, incluindo as duas branches do Bloco 15;
- `audit/normativa-total-criacao` (#123);
- `fix/spell-progression-all-casters-20260825` (#94);
- `fix/antecedentes-integracao-ficha-20260821` (#30);
- `codex/bloco-18-validar-gates`, depois do fechamento sem merge do PR #146.

Buscas posteriores pelas refs removidas não retornaram resultados. Os commits históricos continuam alcançáveis pelos PRs/commits correspondentes.

O workflow temporário usado exclusivamente para excluir a branch técnica do Bloco 18 também foi removido da `main` depois de concluir a tarefa.

## Branches não classificadas

O repositório ainda contém branches históricas `agent/*`, `feature/*`, `fix/*`, `hotfix/*`, `audit/*`, `chore/*` e `codex/*` anteriores ao roadmap final. Elas **não foram classificadas automaticamente como descartáveis** apenas por idade ou prefixo.

Política adotada para o release:

1. branch associada a PR mesclado e bloco aceito: removível;
2. branch associada a PR explicitamente fechado como superseded: removível;
3. branch sem vínculo/evidência suficiente: preservar até revisão própria;
4. nunca mover/forçar uma ref para “simular” exclusão.

## Estado final da limpeza administrativa

A limpeza obrigatória do roadmap v1 está **concluída**:

- zero PRs abertos;
- branches oficiais dos Blocos 1–16 removidas;
- branches dos três PRs superseded removidas;
- branch técnica do PR #146 removida;
- branches sem evidência suficiente preservadas deliberadamente.

Não resta housekeeping de PR/branch bloqueando a v1.0.
