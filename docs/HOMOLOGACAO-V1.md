# Homologação — Teias de Anansi v1

Este documento registra o fechamento da v1.0.0 e a re-homologação da simplificação publicada como v1.0.1.

## Estado atual

- Blocos 1–18: **aceitos**.
- v1.0.0: **publicada** em 2026-09-05.
- v1.0.1: **publicada** em 2026-09-05 como correção de escopo.
- Gate estrutural da versão atual: **aprovado**.
- E2E Chromium Desktop: **aprovado**.
- E2E Chromium Mobile: **aprovado**.
- Firebase real Mestre/Jogador: **aprovado** após publicação das Rules simplificadas.
- Backup/restauração: **fora do produto atual** por decisão de escopo da v1.0.1.
- Hardening contra usuários maliciosos: **fora do produto atual** por decisão de escopo da v1.0.1.

## Escopo homologado na v1.0.1

O Hub é pessoal, particular e usado por poucas pessoas de confiança. O contrato atual é:

1. contas criadas manualmente pelo proprietário no Firebase Authentication;
2. login visível por **usuário + senha**;
3. nenhum e-mail real necessário para o jogador;
4. nenhuma segunda lista `authorizedUsers`;
5. nenhum `isAdmin` ou papel administrativo global necessário para entrar;
6. Firestore acessível a qualquer usuário autenticado;
7. papéis `dm`, `player` e `observer` mantidos como comportamento funcional da Mesa;
8. Mestre recebe bundle privado;
9. Jogador/Observador recebem projeção compartilhada;
10. notas privadas, pistas ocultas e handouts ainda não revelados não aparecem na projeção compartilhada.

Essa diferença de visão não é tratada como fronteira de segurança. O projeto pressupõe participantes autenticados de confiança.

## Evidência Firebase real — v1.0.1

Workflow: `Homologar colaboração Firebase`.

Run homologado: **`33972932056`**, attempt 2, conclusão **success**.

O teste real executou com a conta principal configurada nos Secrets e um Jogador efêmero criado pelo próprio harness. A execução aprovou:

- login da conta principal por usuário/senha;
- criação e login do Jogador efêmero;
- criação automática do perfil do usuário após o primeiro login;
- vínculo do Jogador à Mesa como `player`;
- leitura da visão privada pelo Mestre;
- leitura apenas da projeção compartilhada pelo Jogador;
- omissão do conteúdo exclusivo do Mestre na projeção do Jogador;
- perda e retomada de rede sem apagar o estado local;
- cleanup da identidade técnica efêmera ao final.

A execução só ficou verde depois que as Firestore Rules publicadas foram alinhadas ao contrato atual:

```text
allow read, write: if request.auth != null;
```

## Gate final da v1.0.1

Após o sucesso do Firebase real, o workflow `Publicar v1.0.1` foi disparado automaticamente.

Run: **`33979568611`**.

Etapas aprovadas:

1. confirmar que a homologação Firebase correspondia à `main` esperada;
2. confirmar `package.json` na versão `1.0.1`;
3. gate estrutural final;
4. instalação das dependências;
5. E2E final Chromium Desktop/Mobile;
6. publicação da release `v1.0.1`.

Resultado: **success**.

Release publicada: **Hub de RPG v1.0.1**.

## Matriz de homologação atual

| Área | Desktop | Mobile | Estado |
| --- | --- | --- | --- |
| Home e navegação principal | Aprovado | Aprovado | superfícies principais sem erro JavaScript crítico |
| Personagens / Criação / Ficha | Aprovado | Aprovado | fluxos principais e regressões cobertos |
| Campanhas / Mesas | Aprovado | Aprovado | criação, estado e relações cobertos |
| Aventuras | Aprovado | Aprovado | relações e projeção compartilhada cobertas |
| Painel Geral | Aprovado | Aprovado | superfície e agregação operacional cobertas |
| Configurações | Aprovado | Aprovado | persistência e preferências visuais cobertas |
| Usuários e Colaboração | Aprovado | Aprovado | login simples e integração Firebase |
| Firebase autenticado | Aprovado | Aprovado | Mestre privado + Jogador compartilhado · run `33972932056` |
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
- a projeção compartilhada não contém material privado/oculto do Mestre no contrato funcional da aplicação.

## Persistência e sincronização

A persistência local continua usando chaves e schemas versionados. A sincronização Firebase cobre os estados previstos pela Colaboração.

A v1.0.1 **não possui Backup/exportação/restauração**. Os testes e gates específicos dessa funcionalidade foram removidos. Isso é uma decisão de produto, não uma pendência.

Estados exclusivamente locais podem ser perdidos se o armazenamento do navegador for apagado antes de serem sincronizados. Esse risco é aceito para o escopo pessoal do Hub.

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
- erros JavaScript críticos das superfícies principais tornam o E2E vermelho.

## Histórico da v1.0.0

A v1.0.0 foi homologada com um desenho mais complexo que incluía:

- Backup/exportação/restauração;
- `authorizedUsers`;
- `isAdmin`;
- Firestore Rules restritivas;
- teste de bloqueio de acesso/escrita entre identidades.

Esse estado permanece preservado na tag/release `v1.0.0` como histórico. Ele **não descreve o produto atual**.

A v1.0.1 substituiu deliberadamente esse desenho por:

**login simples + sincronização + separação funcional Mestre/Jogador para um grupo de confiança.**

## Fechamento

A linha v1 está encerrada. A v1.0.1 é a referência funcional atual do escopo simplificado e foi publicada após Firebase real, gate estrutural e E2E Desktop/Mobile verdes.
