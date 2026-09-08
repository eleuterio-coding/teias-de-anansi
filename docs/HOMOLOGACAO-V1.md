# Homologação — Teias de Anansi v1

Este documento registra o fechamento da linha v1. A **v1.0.2 é a referência funcional atual**.

## Estado atual

- Blocos 1–18: **aceitos**.
- v1.0.0: publicada em 2026-09-05.
- v1.0.1: publicada em 2026-09-05 como simplificação de escopo.
- v1.0.2: **publicada em 2026-09-08** como consolidação do acesso por atribuição.
- Gate estrutural da versão atual: **aprovado**.
- E2E Chromium Desktop: **aprovado**.
- E2E Chromium Mobile: **aprovado**.
- Cobertura total da criação/domínio: **aprovada**.
- Firebase real Mestre/Jogador: **aprovado**.
- GitHub Pages no commit homologado: **aprovado**.
- Backup/restauração: **fora do produto atual**.

## Escopo homologado na v1.0.2

O Hub é pessoal, particular e usado por poucas pessoas de confiança. O contrato atual é:

1. contas criadas manualmente pelo proprietário no Firebase Authentication;
2. login visível por **usuário + senha**;
3. nenhum e-mail real necessário para o jogador;
4. nenhuma segunda lista `authorizedUsers`;
5. nenhum `isAdmin` ou papel administrativo global necessário para entrar;
6. papéis `dm`, `player` e `observer` mantidos;
7. Mestre administra Mesa, vínculos, Sessões e Aventuras;
8. Jogador vê somente Campanhas/Mesas às quais está vinculado;
9. Jogador vê somente Sessões em que seu personagem atribuído participa;
10. Jogador vê somente Aventuras relacionadas a essas Sessões;
11. notas privadas, pistas ocultas e handouts ainda não revelados não aparecem para Jogador;
12. Jogador só pode alterar a própria ficha atribuída;
13. Jogador não pode alterar Mesa, vínculo, Sessão ou Aventura;
14. Bibliotecas permanecem acessíveis;
15. o cache local é filtrado por UID para impedir mistura visual entre contas no mesmo navegador.

Essas permissões implementam o comportamento funcional Mestre/Jogador necessário ao Hub. O projeto continua sem objetivo de hardening para ambiente hostil.

## Evidência Firebase real — v1.0.2

Workflow: `Homologar colaboração Firebase`.

Run homologado: **`34247492736`** — conclusão **success**.

Commit homologado: **`c9bf6befd4a4214c475ceedb9bf8f4a851dedc10`**.

O teste real executou com a conta principal configurada nos Secrets e um Jogador efêmero criado pelo harness. A execução aprovou:

- login da conta principal por usuário/senha;
- criação e login do Jogador efêmero;
- publicação da Mesa pelo Mestre;
- vínculo do Jogador como `player` com personagem atribuído;
- leitura da visão privada pelo Mestre;
- leitura somente da visão compartilhada pelo Jogador;
- recorte de Sessões por `participantCharacterIds`;
- recorte de Aventuras conforme Sessões atribuídas;
- omissão de conteúdo privado/oculto do Mestre;
- bloqueio de alteração de Campanha pelo Jogador;
- bloqueio de alteração de vínculo pelo Jogador;
- bloqueio de leitura de ficha alheia;
- gravação permitida da própria ficha atribuída;
- perda e retomada de rede sem apagar o estado local;
- cleanup da identidade técnica efêmera ao final.

## Gate local final — v1.0.2

Workflow: `Homologar versão atual`.

Run homologado: **`34247492757`** — conclusão **success**.

A execução aprovou gate estrutural e E2E Chromium Desktop/Mobile no mesmo commit `c9bf6befd4a4214c475ceedb9bf8f4a851dedc10`.

A auditoria ampla `Auditar cobertura total da criação` também concluiu com **success** no run **`34247492728`**.

## Publicação da v1.0.2

Após o sucesso do Firebase real, o workflow `Publicar v1.0.2` foi disparado automaticamente.

Run: **`34247632130`** — conclusão **success**.

Etapas aprovadas:

1. confirmar que a homologação correspondia à `main` atual;
2. confirmar `package.json` na versão `1.0.2`;
3. gate estrutural final;
4. instalação das dependências;
5. E2E final Chromium Desktop/Mobile;
6. publicação da release `v1.0.2`.

Resultado: **success**.

Release publicada: **Hub de RPG v1.0.2**.

Tag: **`v1.0.2`**.

Release e tag apontam para o commit **`c9bf6befd4a4214c475ceedb9bf8f4a851dedc10`**.

O deploy do GitHub Pages desse mesmo commit também concluiu com **success** no run **`34247492772`**.

## Matriz de homologação atual

| Área | Desktop | Mobile | Estado |
| --- | --- | --- | --- |
| Home e navegação principal | Aprovado | Aprovado | superfícies principais sem erro JavaScript crítico |
| Personagens / Criação / Ficha | Aprovado | Aprovado | fluxo e regressões cobertos |
| Campanhas / Mesas | Aprovado | Aprovado | somente Mesas atribuídas ao Jogador |
| Sessões | Aprovado | Aprovado | recorte por personagem participante |
| Aventuras | Aprovado | Aprovado | somente Aventuras derivadas das Sessões atribuídas |
| Mesa do Jogador | Aprovado | Aprovado | leitura restrita; ferramentas do Mestre não carregam |
| Bibliotecas | Aprovado | Aprovado | disponíveis ao Jogador |
| Ficha do Jogador | Aprovado | Aprovado | apenas ficha atribuída visível/editável |
| Painel Geral | Aprovado | Aprovado | superfície operacional coberta |
| Configurações | Aprovado | Aprovado | persistência e preferências visuais cobertas |
| Firebase autenticado | Aprovado | Aprovado | Mestre privado + acesso Jogador por atribuição |
| Dados / Backup | Não se aplica | Não se aplica | recurso removido na v1.0.1 |

## Progressão Level 1 → Level 20

A progressão possui auditoria mecânica em `tests/auditar-progressao-level.mjs`.

O contrato permanece:

- criação e estado inicial seguem o schema atual;
- progressão pós-criação é sequencial;
- não permite saltos pelo fluxo normal;
- encerra no Level 20;
- não reaplica equipamento inicial nem recria orçamento de criação.

## Campanhas, Sessões, Encontros e Aventuras

Critérios consolidados:

- criação de Mesa usa defaults configurados sem modificar Mesas anteriores;
- somente uma Sessão fica ativa por Mesa;
- Sessão não termina com encontro ativo;
- encontros preservam iniciativa, criaturas, PV, condições, turnos e recompensas;
- Aventuras mantêm relações válidas com a campanha;
- conteúdo exclusivo do Mestre permanece fora da visão do Jogador;
- Jogador recebe somente conteúdo associado à participação da própria ficha.

## Persistência e sincronização

A persistência local continua usando chaves e schemas versionados. A sincronização Firebase cobre os estados previstos pela Colaboração.

A linha atual **não possui Backup/exportação/restauração**. Isso é uma decisão de produto, não uma pendência.

O cache local da colaboração é associado ao UID da sessão para evitar mistura de conteúdo entre jogadores que usem o mesmo navegador.

## Rede

A homologação confirma que:

- recursos estritamente locais continuam utilizáveis durante indisponibilidade remota;
- falha do Firebase não deve apagar o estado local existente;
- o harness Firebase real perde e retoma a rede, depois recupera leitura remota válida.

## Acessibilidade e responsividade

Critérios automatizados mantidos:

- viewport Mobile sem overflow horizontal nas superfícies principais;
- headings e regiões principais presentes;
- preferências de tamanho de texto, contraste e redução de movimento persistem e são aplicadas globalmente;
- elementos com `[hidden]` permanecem efetivamente ocultos em Desktop e Mobile;
- erros JavaScript críticos tornam o E2E vermelho.

## Histórico

### v1.0.0

Incluía um desenho mais complexo com Backup/exportação/restauração, `authorizedUsers`, `isAdmin` e autorização adicional. Esse estado permanece preservado na tag/release `v1.0.0` apenas como histórico.

### v1.0.1

Removeu Backup e a autorização administrativa global, consolidando login simples e colaboração para um grupo de confiança.

### v1.0.2

Manteve a simplicidade do login, mas consolidou as permissões funcionais por atribuição: cada Jogador recebe apenas o que pertence à sua participação e só altera a própria ficha.

## Fechamento

A linha v1 está encerrada. **A v1.0.2 é a referência funcional atual** e foi publicada após Firebase real, gate estrutural, cobertura ampla, E2E Desktop/Mobile e GitHub Pages verdes no mesmo commit homologado.
