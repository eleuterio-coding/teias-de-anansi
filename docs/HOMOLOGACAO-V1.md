# Homologação do release v1.0

Este documento é o checklist de aceite do Bloco 18. Um item só pode ser marcado como aprovado quando existir evidência automatizada ou homologação real correspondente. O release `v1.0.0` não deve ser criado enquanto houver gate obrigatório pendente.

## Estado do Bloco 18

- Gate estrutural/documental: automatizado por `tests/auditar-release-v1.mjs`.
- E2E Chromium Desktop: automatizado por Playwright.
- E2E Chromium Mobile: automatizado por Playwright.
- Fluxos locais de Configurações, criação de Mesa e backup/restauração: automatizados em navegador real.
- Regressões críticas dos Blocos 1–17: executadas pelo gate estrutural.
- Harness Firebase multiusuário real: **implementado** em `e2e/collaboration-real.spec.js` e `.github/workflows/homologar-firebase-real.yml`.
- Evidência de execução Firebase multiusuário real: **pendente** e continua bloqueando o release final.
- PRs abertos históricos: **resolvidos**; #123, #94 e #30 foram fechados como superseded após análise individual.
- Auditoria de branches: **concluída logicamente** em `docs/AUDITORIA-BRANCHES-V1.md`; branches oficiais dos Blocos 1–16 foram ligadas a PRs mesclados e classificadas como candidatas à limpeza. Exclusão física não foi executada porque o conector disponível não expõe `delete ref`.
- Tag/release `v1.0.0`: **não publicar enquanto os gates de execução ainda estiverem pendentes**.

## Matriz de homologação

| Área | Desktop | Mobile | Evidência / critério |
| --- | --- | --- | --- |
| Home e navegação principal | Automático | Automático | Carregamento, heading principal e ausência de overflow horizontal |
| Personagens | Automático | Automático | Superfície carrega sem erro JavaScript |
| Campanhas / Mesas | Automático | Automático | Defaults, criação real e persistência do schema |
| Dados / Backup | Automático | Automático | Exportação, remoção do estado e recuperação pelo arquivo baixado |
| Painel Geral | Automático | Automático | Superfície carrega sem erro JavaScript |
| Configurações | Automático | Automático | Persistência, reload e aplicação de preferências visuais |
| Usuários sem provedor disponível | Automático | Automático | Falha fechada e nenhuma liberação de acesso |
| Firebase autenticado | Harness pronto; execução pendente | Cobertura por dois contextos Chromium | Duas identidades reais e papéis distintos na mesma Mesa |

## Progressão Level 1 → Level 20

A progressão possui auditoria mecânica em `tests/auditar-progressao-level.mjs`. O fechamento do release combina duas evidências:

1. **Level 1 / criação:** criação e estado inicial seguem o schema atual, sem histórico artificial de progressão.
2. **Level 20 / limite:** a progressão é sequencial, não permite saltos e encerra no Level 20.

O gate crítico executa a auditoria de progressão em cada homologação. A automação de navegador complementa, mas não substitui, os testes de regra.

## Campanhas, Sessões, Encontros e Aventuras

Critérios obrigatórios:

- criação de Mesa usa defaults configurados sem modificar Mesas anteriores;
- somente uma Sessão fica ativa por Mesa;
- Sessão não termina com encontro ativo;
- encontros preservam iniciativa, criaturas, PV, condições, turnos e recompensas;
- Aventuras mantêm relações válidas com a campanha;
- projeção compartilhada não contém material privado/oculto do Mestre.

As auditorias de Campanhas, Aventuras e Colaboração são chamadas pelo gate estrutural do release.

## Recuperação e corrupção de dados

O cenário E2E automatizado:

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

A homologação exige comportamento seguro quando a rede ou o provedor online falham:

- recursos estritamente locais continuam utilizáveis;
- tela de Usuários não transforma falha de Firebase em cadastro ou sessão aberta;
- estado local não é apagado por falha remota;
- caches online continuam classificados como regeneráveis;
- após uma sessão autenticada real, perda e retomada de rede preservam o estado local e recuperam leitura remota.

O E2E local intercepta a configuração Firebase em cenário controlado para verificar fail-closed. O E2E Firebase real usa `BrowserContext.setOffline(true/false)`, mantém um marcador em `localStorage` e exige nova leitura compartilhada válida após a retomada.

## Acessibilidade e responsividade

Critérios mínimos do release:

- viewport Mobile sem overflow horizontal nas superfícies principais;
- navegação e controles utilizáveis por teclado onde aplicável;
- headings e regiões principais presentes;
- mensagens dinâmicas importantes usam regiões de status/`aria-live` já previstas nas superfícies;
- preferências de tamanho de texto, contraste e redução de movimento persistem e são aplicadas globalmente.

## Desempenho

A v1.0 é um site estático e evita dependência de bundler/runtime pesado para uso normal. O E2E trata erros JavaScript das superfícies principais como falha. Recursos externos não essenciais não podem impedir o carregamento dos fluxos locais.

Uma regressão de desempenho relevante é qualquer alteração que torne criação, Ficha, Campanhas ou Painel impraticáveis em navegador móvel contemporâneo. Medidas quantitativas adicionais podem ser acrescentadas em versões futuras sem reabrir a v1.0.

## Gate Firebase multiusuário real

Este é o item que não pode ser simulado como aprovado. O harness implementado exige no projeto Firebase Spark real:

1. uma conta administradora autorizada;
2. uma segunda conta autorizada e não administradora;
3. uma Campanha técnica reutilizável publicada pelo proprietário/Mestre;
4. vínculo da segunda conta como `player`;
5. dois contextos de navegador independentes;
6. confirmação de que o Mestre recebe estado privado e o Jogador recebe apenas projeção compartilhada;
7. confirmação de que handout/pista ocultos não aparecem na projeção do Jogador;
8. tentativa direta de escrita em `/campaigns/{id}/private/*` bloqueada pelas Firestore Rules;
9. atualização permitida do `characterId` da própria membership;
10. perda de rede e retomada sem corrupção do estado local, seguida de nova leitura remota válida.

O workflow manual `Homologar Firebase real v1` lê exclusivamente GitHub Actions Secrets:

- `E2E_FIREBASE_ADMIN_USERNAME`
- `E2E_FIREBASE_ADMIN_PASSWORD`
- `E2E_FIREBASE_PLAYER_USERNAME`
- `E2E_FIREBASE_PLAYER_PASSWORD`
- `E2E_FIREBASE_PLAYER_UID`

O workflow possui preflight obrigatório: se qualquer secret estiver ausente, o job falha antes de instalar/executar o teste. As senhas não ficam no repositório, nos fixtures nem neste documento.

A existência do harness **não é evidência de execução**. Até existir uma execução real verde, este gate permanece pendente e `v1.0.0` continua bloqueado.

## Branches, PRs e release

A auditoria está registrada em `docs/AUDITORIA-BRANCHES-V1.md`.

- os três PRs abertos encontrados foram resolvidos explicitamente, sem merge cego;
- as branches oficiais `codex/bloco-*` dos Blocos 1–16 correspondem a PRs mesclados (#129–#145; Bloco 15 usa #143 e #144);
- branches dos PRs #123, #94 e #30 são superseded e candidatas à remoção;
- branches sem evidência suficiente foram preservadas;
- nenhuma ref foi forçada ou movida para fingir limpeza física;
- a ferramenta GitHub disponível nesta sessão não expõe exclusão de refs, portanto a remoção física das branches candidatas não foi executada.

## Sequência final para a tag

1. confirmar execução verde do gate estrutural + E2E Desktop/Mobile no `main`;
2. confirmar execução verde de `Homologar Firebase real v1` com as duas contas de teste;
3. registrar as evidências finais neste documento;
4. decidir/executar a exclusão física das branches candidatas por uma ferramenta com `delete ref`, se ela continuar sendo exigida como limpeza administrativa;
5. marcar o Bloco 18 como aceito no `ROADMAP-V1.md`;
6. somente então criar a tag/release `v1.0.0`.
