# Arquitetura — Teias de Anansi v1.0

## Visão geral

Teias de Anansi é um site web estático e responsivo hospedado no GitHub Pages. A aplicação não depende de backend próprio para os fluxos locais: HTML, CSS, módulos JavaScript e catálogos JSON são servidos diretamente pelo repositório. Persistência local e colaboração online são camadas separadas.

## Superfícies principais

- `index.html`: entrada do Hub.
- `personagens.html`, `criacao-personagem.html`, `lista-personagens.html` e Ficha Digital: ciclo de vida do personagem.
- `campanhas.html`, `mesa.html` e `sessoes.html`: Campanhas/Mesas e Sessões.
- `aventuras.html`: planejamento narrativo.
- `bibliotecas.html`: consulta aos catálogos normativos.
- `dados.html`: exportação/importação e recuperação.
- `usuarios.html`: identidade, Firebase e colaboração.
- `painel.html`: agregação operacional.
- `configuracoes.html`: preferências locais.

## Módulos de domínio

O código JavaScript é organizado por estado, regras e UI. Os módulos `*-state.js` concentram normalização, schema e persistência de um domínio. Os módulos de regra calculam comportamento mecânico e os módulos `*-ui.js` conectam esses estados ao DOM.

A criação de personagem possui uma subdivisão própria em `scripts/character-builder/`, com catálogos, estado e mecânicas por classe/subclasse. O Modo de Jogo usa módulos específicos para progressão, combate, economia, magias e demais estados persistentes da ficha.

## Persistência local

A camada local usa `localStorage` com chaves versionadas. Entre as principais:

- `hub-rpg:characters:v4`
- `hub-rpg:campaigns:v1`
- `hub-rpg:adventures:v1`
- `hub-rpg:settings:v1`

O `scripts/storage-registry.js` classifica chaves duráveis, portáteis, transitórias e caches. Personagens, Campanhas e Aventuras compõem o estado portátil da v1. Configurações são estado durável local, mas permanecem fora do pacote de backup v1 para não alterar o schema e checksum já congelados no Bloco 14.

## Schemas e normalização

Os registros persistentes usam schema explícito e funções de sanitização/migração. Exemplos:

- personagem: `hub-rpg/personagem/v4`
- campanha: `hub-rpg/campaign/v1`
- aventura: `hub-rpg/adventure/v1`
- configurações: `hub-rpg/settings/v1`
- backup: `hub-rpg/backup/v1`

A regra arquitetural é normalizar na leitura e na escrita. Dados legados são migrados para a forma corrente quando suportados, e relações entre entidades são verificadas no fluxo de backup/restauração.

## Backup e recuperação

`scripts/backup-engine.js` lê somente os registros classificados como portáteis, normaliza os dados, cria manifesto e checksum FNV-1a e valida relações. A restauração opera em modo `merge` ou `replace`.

Antes de gravar uma restauração, um snapshot local de recuperação é criado. Se a escrita ou a verificação posterior falhar, o armazenamento anterior é restaurado. A restauração só termina quando o estado relido corresponde ao alvo normalizado.

## Configurações

`scripts/settings-state.js` é a autoridade do schema de preferências. A camada global `hub-ux.js` lê preferências de acessibilidade e apresentação. A criação de uma nova Campanha consome apenas defaults compatíveis com o schema da campanha.

O preset de Regras da Casa não é persistido como propriedade da Mesa enquanto `hub-rpg/campaign/v1` não possuir campo próprio. Essa separação impede uma configuração nominal sem efeito mecânico real.

## Firebase e colaboração

A colaboração usa Firebase Authentication e Cloud Firestore no plano Spark / No-cost. O site continua hospedado no GitHub Pages; não há Firebase Hosting nem Cloud Functions.

O login visível é usuário + senha. O nome de usuário é normalizado e convertido internamente para um identificador técnico `@teias.invalid` usado pelo Firebase Authentication. A autorização efetiva exige também documento ativo em `authorizedUsers/{uid}`.

`scripts/firebase-collaboration-provider.js` encapsula Authentication e Firestore. `scripts/collaboration-sync.js` orquestra sincronização, e `scripts/collaboration-model.js` define projeções e permissões de domínio.

### Separação privado/compartilhado

Campanhas possuem projeções distintas. Estado privado do Mestre inclui informações que jogadores não podem receber. A projeção compartilhada remove notas privadas, encontros privados, pistas ocultas e handouts ainda não revelados.

Papéis suportados: `dm`, `player` e `observer`. Firestore Rules reforçam as permissões no servidor; a UI não é tratada como fronteira de segurança.

## Rede e falhas

Fluxos locais devem continuar funcionais sem Firebase. A tela de Usuários informa indisponibilidade/configuração incompleta sem liberar cadastro público. Importações de catálogos possuem tratamento de erro e timeout onde necessário.

A sincronização online é uma camada adicional: falha de rede não deve corromper o estado local. Caches remotos são regeneráveis e não entram no backup portátil.

## Hospedagem e custo

A aplicação v1 é exclusivamente web. GitHub Pages hospeda os arquivos estáticos. Firebase permanece no plano Spark. São proibidos recursos que exijam faturamento, cartão ou conta de billing. Também são proibidos Firebase Hosting, Cloud Functions e Supabase para a v1.

## Testes e homologação

As auditorias em `tests/*.mjs` verificam contratos normativos, mecânicos, persistência e integrações. O Bloco 18 acrescenta Playwright para E2E em Chromium real, com projetos Desktop e Mobile executados sobre um servidor HTTP local no GitHub Actions.

`tests/auditar-release-v1.mjs` é o gate estrutural: exige documentação, suíte E2E e regressões críticas dos blocos anteriores. O workflow `.github/workflows/homologar-release-v1.yml` executa esse gate e a automação de navegador antes do release final.
