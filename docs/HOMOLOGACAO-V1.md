# Homologação do release v1.0

Este documento é o checklist de aceite do Bloco 18. Um item só pode ser marcado como aprovado quando existir evidência automatizada ou homologação real correspondente. O release `v1.0.0` não deve ser criado enquanto houver gate obrigatório pendente.

## Estado do Bloco 18

- Gate estrutural/documental: **aprovado** em execução observável do workflow `Homologar release v1`.
- E2E Chromium Desktop: **aprovado** por Playwright.
- E2E Chromium Mobile: **aprovado** por Playwright.
- Fluxos locais de Configurações, criação de Mesa e backup/restauração: **aprovados** em navegador real.
- Regressões críticas dos Blocos 1–17: **aprovadas** pela suíte de cobertura total.
- Harness Firebase multiusuário real: **implementado** em `e2e/collaboration-real.spec.js` e `.github/workflows/homologar-firebase-real.yml`.
- Jogador E2E: **efêmero**; criado pelo próprio harness no Firebase Authentication, autorizado pelo Administrador como não administrador e removido no cleanup.
- Evidência de execução Firebase multiusuário real: **aprovada** no run `33970930792`.
- PRs/branches de release: **limpeza concluída**; zero PRs abertos e refs classificadas removidas.
- Tag/release `v1.0.0`: **publicação autorizada** após aprovação de todos os gates obrigatórios.

## Evidências automatizadas observadas

### Gate normal de release

Execução atual de referência: workflow `Homologar release v1`, run `33966178050`.

- `Gate estrutural do release`: **success**;
- `E2E Chromium · desktop e mobile`: **success**;
- o gate normal executa o cenário Firebase real em modo skip quando as credenciais administrativas não estão disponíveis, porque a homologação autenticada possui workflow manual dedicado.

O escopo de gatilho do workflow inclui também alterações no próprio finalizador, no workflow Firebase e no runbook de provisionamento, evitando que a infraestrutura de release seja modificada sem nova auditoria normal.

### Cobertura total

Execução atual de referência: workflow `Auditar cobertura total da criação`, run `33966178057`.

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

### Firebase real — aceite final

Execução final aprovada: `Homologar Firebase real v1`, run `33970930792`. O workflow concluiu com **success** usando o Administrador real e um Jogador E2E efêmero, liberando o encerramento do Bloco 18. Evidência: https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/33970930792

### Firebase real

Execução histórica observada: workflow `Homologar Firebase real v1`, run `33961159721`.

Esse run falhou no preflight antes de qualquer login, leitura ou escrita Firebase porque, naquele momento, o primeiro desenho do gate exigia cinco Secrets e nenhum estava configurado. A falha não demonstrou defeito em Authentication, Firestore, Rules ou sincronização.

Depois dessa execução, o gate foi simplificado sem reduzir a cobertura: o Jogador passou a ser criado e removido automaticamente pelo harness. O contrato atual exige somente:

- `E2E_FIREBASE_ADMIN_USERNAME`
- `E2E_FIREBASE_ADMIN_PASSWORD`

Esses dois valores correspondem à conta Administradora já homologada no Bloco 15. Nenhuma senha de Jogador, username de Jogador ou UID de Jogador precisa ser previamente provisionado ou armazenado em Secrets.

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
| Firebase autenticado | Aprovado | Aprovado | Administrador real + Jogador efêmero, Rules, projeção compartilhada e retomada de rede · run `33970930792` |

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

Este gate técnico obrigatório foi **aprovado na homologação final**. O harness exige no projeto Firebase Spark real:

1. login da conta Administradora já autorizada;
2. criação automática de uma segunda credencial efêmera no Firebase Authentication;
3. autorização dessa identidade pelo Administrador com `active: true` e `isAdmin: false`;
4. publicação de uma Campanha técnica reutilizável pelo proprietário/Mestre;
5. vínculo da identidade efêmera como `player`;
6. dois contextos de navegador independentes;
7. Mestre recebendo estado privado e Jogador apenas a projeção compartilhada;
8. handout/pista ocultos ausentes da projeção do Jogador;
9. escrita direta em `/campaigns/{id}/private/*` bloqueada pelas Firestore Rules;
10. atualização permitida do `characterId` da própria membership;
11. perda de rede e retomada sem corrupção do estado local, seguida de nova leitura remota válida;
12. cleanup da membership, perfil, autorização e credencial efêmera do Jogador.

A criação automática da conta não abre cadastro no produto. O site continua sem UI de cadastro público, e uma credencial criada no Authentication permanece sem acesso aos dados enquanto não existir um `authorizedUsers/{uid}` ativo. O próprio teste usa o Administrador para conceder essa autorização temporária.

O workflow `Homologar Firebase real v1` possui preflight obrigatório para os dois Secrets administrativos. Uma execução verde desse workflow é condição suficiente para encerrar este gate; uma falha por credenciais ausentes não pode ser reinterpretada como aceite.

## Branches, PRs e release

A auditoria final está registrada em `docs/AUDITORIA-BRANCHES-V1.md`.

Estado administrativo final:

- #123, #94 e #30 fechados como superseded;
- PR técnico #146 fechado sem merge;
- **zero PRs abertos**;
- branches oficiais dos Blocos 1–16 removidas;
- branches dos três PRs superseded removidas;
- branch técnica `codex/bloco-18-validar-gates` removida;
- workflow temporário de limpeza removido;
- branches históricas sem evidência de descarte seguro preservadas deliberadamente.

Não resta housekeeping de PR/branch bloqueando a v1.0.

## Fechamento final

Todos os gates obrigatórios da v1.0 foram aprovados. O Bloco 18 está aceito e a publicação `v1.0.0` foi autorizada pelo run Firebase `33970930792`.
