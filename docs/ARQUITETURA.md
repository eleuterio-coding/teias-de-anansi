# Arquitetura — Teias de Anansi v1

## Visão geral

Teias de Anansi é um site web estático e responsivo hospedado no GitHub Pages. A aplicação não depende de backend próprio para os fluxos locais: HTML, CSS, módulos JavaScript e catálogos JSON são servidos diretamente pelo repositório. Persistência local e colaboração online são camadas separadas.

A linha v1 foi encerrada na v1.0.0 e teve o escopo simplificado na v1.0.1: a área de Backup e a autorização/hardening adicional foram removidas. O modelo atual é **login simples + sincronização + visibilidade funcional Mestre/Jogador**.

## Superfícies principais

- `index.html`: entrada do Hub.
- `personagens.html`, `criacao-personagem.html`, `lista-personagens.html` e Ficha Digital: ciclo de vida do personagem.
- `campanhas.html`, `mesa.html` e `sessoes.html`: Campanhas/Mesas e Sessões.
- `aventuras.html`: planejamento narrativo.
- `bibliotecas.html`: consulta aos catálogos normativos.
- `usuarios.html`: identidade, Firebase e colaboração.
- `painel.html`: agregação operacional.
- `configuracoes.html`: preferências locais.

A superfície `dados.html` e o motor específico de Backup/restauração não fazem parte do produto atual.

## Módulos de domínio

O código JavaScript é organizado por estado, regras e UI. Os módulos `*-state.js` concentram normalização, schema e persistência de um domínio. Os módulos de regra calculam comportamento mecânico e os módulos `*-ui.js` conectam esses estados ao DOM.

A criação de personagem possui uma subdivisão própria em `scripts/character-builder/`, com catálogos, estado e mecânicas por classe/subclasse. O Modo de Jogo usa módulos específicos para progressão, combate, economia, magias e demais estados persistentes da ficha.

## Persistência local

A camada local usa `localStorage` com chaves versionadas. Entre as principais:

- `hub-rpg:characters:v4`
- `hub-rpg:campaigns:v1`
- `hub-rpg:adventures:v1`
- `hub-rpg:settings:v1`

O `scripts/storage-registry.js` classifica os estados locais usados pelo produto. A persistência local continua sendo a base dos fluxos do navegador; a sincronização Firebase é uma camada adicional para os estados cobertos pela colaboração.

**Não existe Backup/exportação/restauração como função do produto atual.** Limpar manualmente o armazenamento local pode remover estados que ainda não estejam sincronizados online.

## Schemas e normalização

Os registros persistentes usam schema explícito e funções de sanitização/migração. Exemplos:

- personagem: `hub-rpg/personagem/v4`
- campanha: `hub-rpg/campaign/v1`
- aventura: `hub-rpg/adventure/v1`
- configurações: `hub-rpg/settings/v1`

A regra arquitetural é normalizar na leitura e na escrita. Dados legados são migrados para a forma corrente quando suportados.

O antigo schema `hub-rpg/backup/v1` pertence somente ao histórico da v1.0.0 e não integra o contrato atual.

## Configurações

`scripts/settings-state.js` é a autoridade do schema de preferências. A camada global `hub-ux.js` lê preferências de acessibilidade e apresentação. A criação de uma nova Campanha consome apenas defaults compatíveis com o schema da campanha.

O preset de Regras da Casa não é persistido como propriedade da Mesa enquanto `hub-rpg/campaign/v1` não possuir campo próprio. Essa separação impede uma configuração nominal sem efeito mecânico real.

## Firebase e colaboração

A colaboração usa Firebase Authentication e Cloud Firestore no plano Spark / No-cost. O site continua hospedado no GitHub Pages; não há Firebase Hosting nem Cloud Functions.

O login visível é **usuário + senha**. O nome de usuário é normalizado e convertido internamente para um identificador técnico `@teias.invalid` usado pelo Firebase Authentication. Nenhum e-mail real é solicitado pelo Hub.

No modelo atual, **não existe `authorizedUsers`, `isAdmin` nem segunda camada de autorização**. Se a conta existe no Firebase Authentication e a senha está correta, ela pode iniciar sessão.

`scripts/firebase-collaboration-provider.js` encapsula Authentication e Firestore. `scripts/collaboration-sync.js` orquestra sincronização, e `scripts/collaboration-model.js` define projeções e comportamento de domínio.

### Separação privado/compartilhado

Campanhas possuem projeções distintas. Estado privado do Mestre inclui informações que Jogadores/Observadores não devem receber pela interface. A projeção compartilhada remove notas privadas, pistas ocultas, handouts ainda não revelados e demais conteúdos exclusivos do Mestre.

Papéis suportados: `dm`, `player` e `observer`.

Essa separação é **funcional**, não uma fronteira de segurança. O projeto pressupõe participantes de confiança. As Firestore Rules atuais aceitam leitura e escrita para qualquer usuário autenticado:

```text
allow read, write: if request.auth != null;
```

A aplicação, e não as Rules, escolhe entre bundle privado e projeção compartilhada conforme o papel do participante na Mesa.

## Rede e falhas

Fluxos estritamente locais continuam utilizáveis quando o Firebase está indisponível. A sincronização online é uma camada adicional; falha remota não deve apagar o estado local existente.

A homologação Firebase real cobre perda e retomada de rede no fluxo de colaboração.

## Hospedagem e custo

A aplicação é exclusivamente web. GitHub Pages hospeda os arquivos estáticos. Firebase permanece no plano Spark. São proibidos recursos que exijam faturamento, cartão ou conta de billing. Também são proibidos Firebase Hosting, Cloud Functions e Supabase na linha v1.

## Testes e homologação

As auditorias em `tests/*.mjs` verificam contratos normativos, mecânicos, persistência e integrações. Playwright executa E2E em Chromium Desktop e Mobile sobre servidor HTTP local no GitHub Actions.

`tests/auditar-release-v1.mjs` é o gate estrutural da linha v1. O workflow `.github/workflows/homologar-release-v1.yml` valida a versão atual em navegador. O workflow `.github/workflows/homologar-firebase-real.yml` executa a homologação Firebase real automaticamente quando a camada de colaboração muda.

A v1.0.1 foi publicada somente após:

- gate estrutural verde;
- E2E Desktop/Mobile verde;
- Firebase real verde com Mestre e Jogador efêmero;
- confirmação de visão privada para Mestre e projeção compartilhada para Jogador.
