# Homologação do release v1.0

Este documento é o checklist de aceite do Bloco 18. Um item só pode ser marcado como aprovado quando existir evidência automatizada ou homologação real correspondente. O release `v1.0.0` não deve ser criado enquanto houver gate obrigatório pendente.

## Estado do Bloco 18

- Gate estrutural/documental: **aprovado** em execução observável do workflow `Homologar release v1`.
- E2E Chromium Desktop: **aprovado** por Playwright.
- E2E Chromium Mobile: **aprovado** por Playwright.
- Fluxos locais de Configurações, criação de Mesa e backup/restauração: **aprovados** em navegador real.
- Regressões críticas dos Blocos 1–17: **aprovadas** pela suíte de cobertura total.
- Harness Firebase multiusuário real: **implementado** em `e2e/collaboration-real.spec.js` e `.github/workflows/homologar-firebase-real.yml`.
- Evidência de execução Firebase multiusuário real: **bloqueada exclusivamente por ausência dos cinco GitHub Actions Secrets de teste**.
- PRs históricos: **resolvidos**; #123, #94 e #30 foram fechados como superseded após análise individual.
- Limpeza física das branches oficiais/superseded: **executada e verificada**; detalhes em `docs/AUDITORIA-BRANCHES-V1.md`.
- PR técnico #146: **pronto para encerramento sem merge**; seu único arquivo é um artefato temporário de observabilidade e não deve entrar na `main`.
- Tag/release `v1.0.0`: **bloqueada somente até existir uma execução verde do gate Firebase real**.

## Evidências automatizadas observadas

### Gate normal de release

Execução observada: workflow `Homologar release v1`, run `33961080122`.

- `Gate estrutural do release`: **success**;
- `E2E Chromium · desktop e mobile`: **success**;
- Playwright: **10 passed, 2 skipped**;
- os dois testes pulados são exclusivamente os dois projetos (Desktop/Mobile) do cenário Firebase real, que exige credenciais externas e possui workflow dedicado.

### Cobertura total

Execução observada: workflow `Auditar cobertura total da criação`, run `33961080076`.

Resultado: **success** em todas as etapas:

1. inventário e integridade sintática;
2. integridade completa dos dados;
3. escopo fail-closed e rastreabilidade de runtime;
4. aplicação mecânica, interações, cenários e regressão;
5. políticas globais e consistência editorial;
6. evidência verificável de cobertura.

Durante a homologação foram encontrados e corrigidos dois defeitos reais antes do aceite automático:

- chave `}` excedente em `scripts/character-sheet-rest-ui.js`, que causava erro sintático;
- auditoria histórica do Bloco 16 ainda esperava Configurações indisponível depois do Bloco 17; o teste foi atualizado para exigir Painel e Configurações disponíveis no estado atual.

### Firebase real

Execução observada: workflow `Homologar Firebase real v1`, run `33961159721`.

Resultado: **failure no preflight**, antes de qualquer login, leitura ou escrita Firebase. O job confirmou ausência de todos os cinco Secrets obrigatórios:

- `E2E_FIREBASE_ADMIN_USERNAME`
- `E2E_FIREBASE_ADMIN_PASSWORD`
- `E2E_FIREBASE_PLAYER_USERNAME`
- `E2E_FIREBASE_PLAYER_PASSWORD`
- `E2E_FIREBASE_PLAYER_UID`

Essa falha não demonstra defeito em Authentication, Firestore, Rules ou sincronização; demonstra apenas que a execução autenticada não pode ocorrer sem as duas identidades de teste. O release permanece bloqueado até esse mesmo workflow executar verde com os Secrets configurados.

## Matriz de homologação

| Área | Desktop | Mobile | Estado |
| --- | --- | --- | --- |
| Home e navegação principal | Aprovado | Aprovado | sem overflow horizontal nas superfícies principais |
| Personagens | Aprovado | Aprovado | superfície carrega sem erro JavaScript |
| Campanhas / Mesas | Aprovado | Aprovado | defaults, criação real e persistência do schema |
| Dados / Backup | Aprovado | Aprovado | exportação, remoção do estado e restauração do arquivo |
| Painel Geral | Aprovado | Aprovado | superfície carrega e integra estado local |
| Configurações | Aprovado | Aprovado | persistência, reload e preferências visuais |
| Usuários sem provedor disponível | Aprovado | Aprovado | fail-closed e nenhuma liberação de acesso |
| Firebase autenticado | Pendente por Secrets | Mesmo harness em contexto independente | duas identidades reais e papéis distintos na mesma Mesa |

## Progressão Level 1 → Level 20

A progressão possui auditoria mecânica em `tests/auditar-progressao-level.mjs`. O fechamento combina duas evidências:

1. **Level 1 / criação:** criação e estado inicial seguem o schema atual, sem histórico artificial de progressão;
2. **Level 20 / limite:** a progressão é sequencial, não permite saltos e encerra no Level 20.

O gate crítico executa a auditoria de progressão em cada homologação. A automação de navegador complementa, mas não substitui, os testes de regra.

## Campanhas, Sessões, Encontros e Aventuras

Critérios obrigatórios aprovados pelas auditorias mecânicas:

- criação de Mesa usa defaults configurados sem modificar Mesas anteriores;
- somente uma Sessão fica ativa por Mesa;
- Sessão não termina com encontro ativo;
- encontros preservam iniciativa, criaturas, PV, condições, turnos e recompensas;
- Aventuras mantêm relações válidas com a campanha;
- projeção compartilhada não contém material privado/oculto do Mestre no contrato estático.

A confirmação contra Firestore real para dois usuários permanece no gate autenticado final.

## Recuperação e corrupção de dados

O cenário E2E aprovado:

1. grava Personagem, Campanha e Aventura relacionados no armazenamento;
2. exporta Backup pela interface;
3. remove os dados portáteis do navegador;
4. recarrega e confirma estado vazio;
5. seleciona o arquivo exportado;
6. valida checksum/manifesto;
7. restaura em modo `replace` com confirmação explícita;
8. relê `localStorage` e confirma os três domínios restaurados.

A auditoria Node também cobre checksum, relações, snapshot de recuperação e rollback transacional.

## Erros de rede

A homologação local aprovada confirma que:

- recursos estritamente locais continuam utilizáveis;
- tela de Usuários não transforma falha de Firebase em cadastro ou sessão aberta;
- estado local não é apagado por falha remota;
- caches online continuam classificados como regeneráveis.

O harness Firebase real adiciona o requisito ainda pendente de perder e retomar rede depois de sessão autenticada, preservando estado local e recuperando leitura remota válida.

## Acessibilidade e responsividade

Critérios mínimos automatizados:

- viewport Mobile sem overflow horizontal nas superfícies principais;
- headings e regiões principais presentes;
- preferências de tamanho de texto, contraste e redução de movimento persistem e são aplicadas globalmente;
- erros JavaScript das superfícies principais tornam o E2E vermelho.

## Gate Firebase multiusuário real

Este é o único gate técnico obrigatório ainda não aprovado. O harness exige no projeto Firebase Spark real:

1. uma conta administradora autorizada;
2. uma segunda conta autorizada e não administradora;
3. uma Campanha técnica reutilizável publicada pelo proprietário/Mestre;
4. vínculo da segunda conta como `player`;
5. dois contextos de navegador independentes;
6. Mestre recebendo estado privado e Jogador apenas a projeção compartilhada;
7. handout/pista ocultos ausentes da projeção do Jogador;
8. escrita direta em `/campaigns/{id}/private/*` bloqueada pelas Firestore Rules;
9. atualização permitida do `characterId` da própria membership;
10. perda de rede e retomada sem corrupção do estado local, seguida de nova leitura remota válida.

O workflow `Homologar Firebase real v1` possui preflight obrigatório. Senhas e usuários não ficam no repositório. Uma execução verde desse workflow é condição suficiente para encerrar este gate; uma falha por credenciais ausentes não pode ser reinterpretada como aceite.

## Branches, PRs e release

A auditoria está registrada em `docs/AUDITORIA-BRANCHES-V1.md`.

- #123, #94 e #30 foram fechados como superseded;
- branches oficiais dos Blocos 1–16 foram associadas aos PRs mesclados #129–#145;
- branches oficiais e as três branches superseded foram fisicamente removidas;
- branches históricas sem evidência de descarte seguro foram preservadas deliberadamente;
- o PR técnico #146 existe apenas para observabilidade dos workflows e será fechado sem merge; sua branch técnica será removida em seguida.

## Sequência final para a tag

1. manter o gate normal de release verde;
2. configurar os cinco Secrets de teste no GitHub Actions;
3. executar `Homologar Firebase real v1` até obter **success** real;
4. registrar a evidência final neste documento;
5. marcar o Bloco 18 como aceito no `ROADMAP-V1.md`;
6. criar somente então a tag/release `v1.0.0`.
