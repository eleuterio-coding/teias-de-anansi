# Arquitetura — Teias de Anansi v1

## Visão geral

Teias de Anansi é um site web estático e responsivo hospedado no GitHub Pages. A aplicação não depende de backend próprio para os fluxos locais: HTML, CSS, módulos JavaScript e catálogos JSON são servidos diretamente pelo repositório. Persistência local e colaboração online são camadas separadas.

A linha v1 foi encerrada na v1.0.0, simplificada na v1.0.1 e consolidada na **v1.0.2**, que é a referência funcional publicada. O modelo atual é **login simples + sincronização + acesso por atribuição Mestre/Jogador**.

## Superfícies principais

- `index.html`: entrada do Hub.
- `personagens.html`, `criacao-personagem.html`, `lista-personagens.html` e Ficha Digital: ciclo de vida do personagem.
- `campanhas.html`, `mesa.html` e `sessoes.html`: Campanhas/Mesas e Sessões.
- `aventuras.html`: planejamento narrativo.
- `bibliotecas.html`: consulta aos catálogos normativos.
- `usuarios.html`: identidade, Firebase e colaboração.
- `painel.html`: agregação operacional.
- `configuracoes.html`: preferências de uso, Ficha Digital e acessibilidade.

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

Na colaboração, o cache local é associado à identidade da sessão para evitar que conteúdo de um Jogador apareça para outro quando o mesmo navegador é reutilizado.

## Schemas e normalização

Os registros persistentes usam schema explícito e funções de sanitização/migração. Exemplos:

- personagem: `hub-rpg/personagem/v4`
- campanha: `hub-rpg/campaign/v1`
- aventura: `hub-rpg/adventure/v1`
- configurações: `hub-rpg/settings/v1`

A regra arquitetural é normalizar na leitura e na escrita. Dados legados são migrados para a forma corrente quando suportados.

O antigo schema `hub-rpg/backup/v1` pertence somente ao histórico da v1.0.0 e não integra o contrato atual.

## Configurações

`scripts/settings-state.js` mantém o schema local de preferências e `hub-ux.js` aplica as preferências visuais.

A interface de Configurações expõe somente:

- perfil de uso;
- densidade e apresentação da Ficha Digital;
- preferências de acessibilidade.

As seguintes decisões são invariantes do produto e **não são configuráveis**:

- todas as fontes normativas suportadas ficam habilitadas;
- todas as Regras da Casa consolidadas ficam habilitadas;
- não há bloco de Persistência na UI;
- não existem Defaults de campanha configuráveis;
- **Rafael é sempre o Mestre** das Campanhas/Mesas.

O schema mantém compatibilidade com estados antigos, mas `normalizeSettings()` força fontes completas, pacote `teias-v1` e `campaignDefaults.dmName = 'Rafael'`, impedindo que preferências antigas reintroduzam opções removidas.

## Campanhas e Mestre fixo

A criação de Campanha solicita nome, cenário e resumo. O Mestre não é solicitado: `campaign-list-ui.js` grava `dmName: 'Rafael'` e normaliza campanhas locais existentes ao abrir a lista. `campaign-table-router.js` repete essa normalização antes de carregar as ferramentas do Mestre.

O campo técnico legado de Mestre não é exposto para edição na Mesa. Dessa forma, a UI e o estado operacional convergem para Rafael como Mestre único.

## Firebase e colaboração

A colaboração usa Firebase Authentication e Cloud Firestore no plano Spark / No-cost. O site continua hospedado no GitHub Pages; não há Firebase Hosting nem Cloud Functions.

O login visível é **usuário + senha**. O nome de usuário é normalizado e convertido internamente para um identificador técnico `@teias.invalid` usado pelo Firebase Authentication. Nenhum e-mail real é solicitado pelo Hub.

Não existe `authorizedUsers`, `isAdmin` nem uma segunda autorização administrativa global. Se a conta existe no Firebase Authentication e a senha está correta, ela pode iniciar sessão.

`scripts/firebase-collaboration-provider.js` encapsula Authentication e Firestore. `scripts/collaboration-sync.js` orquestra sincronização, e `scripts/collaboration-model.js` define projeções e comportamento de domínio.

### Papéis e atribuição

Papéis suportados: `dm`, `player` e `observer`.

O Mestre administra a Mesa, os vínculos, Sessões e Aventuras. Para Jogadores, o acesso é derivado da participação:

- a membership associa o usuário a uma Campanha/Mesa;
- a membership de Jogador pode conter o `characterId` atribuído;
- Sessões compartilhadas usam `participantCharacterIds` para indicar quais personagens participam;
- Aventuras visíveis ao Jogador são derivadas das Sessões associadas às cenas da Aventura;
- a ficha atribuída é a única ficha da Mesa que o Jogador pode alterar.

### Separação privado/compartilhado

Campanhas possuem projeções distintas. Estado privado do Mestre inclui informações que Jogadores/Observadores não devem receber. A projeção compartilhada remove notas privadas, pistas ocultas, handouts ainda não revelados e demais conteúdos exclusivos do Mestre.

A v1.0.2 também grava/consulta visões compartilhadas de Sessões e Aventuras de forma compatível com o recorte por personagem.

### Firestore Rules

As Rules atuais implementam as permissões funcionais do modelo de atribuição:

- usuário autenticado pode manter o próprio perfil;
- Mestre/proprietário pode administrar a Mesa;
- Jogador só lê a Mesa à qual está vinculado;
- Jogador só lê Sessões/Aventuras atribuídas à participação da própria ficha;
- Jogador não altera Mesa, membership, Sessão ou Aventura;
- Jogador só lê/escreve a ficha atribuída a ele;
- conteúdo privado da Mesa permanece restrito ao Mestre.

O objetivo dessas Rules é garantir o funcionamento correto da experiência Mestre/Jogador. O projeto continua pessoal e não persegue hardening para ambiente hostil.

## Navegação do Jogador

As superfícies normais também respeitam o modo da conta conectada:

- `campanhas.html`: mostra somente Mesas atribuídas;
- `sessoes.html`: mostra somente Sessões da participação do personagem;
- `aventuras.html`: mostra somente Aventuras derivadas dessas Sessões;
- `mesa.html`: carrega a visão de leitura do Jogador, sem ferramentas de Mestre;
- `lista-personagens.html`: mostra somente a ficha atribuída;
- `bibliotecas.html`: permanece disponível.

O roteamento por papel evita carregar módulos de administração do Mestre na experiência do Jogador quando eles não são necessários.

## Rede e falhas

Fluxos estritamente locais continuam utilizáveis quando o Firebase está indisponível. A sincronização online é uma camada adicional; falha remota não deve apagar o estado local existente.

A homologação Firebase real cobre perda e retomada de rede no fluxo de colaboração.

## Hospedagem e custo

A aplicação é exclusivamente web. GitHub Pages hospeda os arquivos estáticos. Firebase permanece no plano Spark. São proibidos recursos que exijam faturamento, cartão ou conta de billing. Também são proibidos Firebase Hosting, Cloud Functions e Supabase na linha v1.

## Testes e homologação

As auditorias em `tests/*.mjs` verificam contratos normativos, mecânicos, persistência e integrações. Playwright executa E2E em Chromium Desktop e Mobile sobre servidor HTTP local no GitHub Actions.

`tests/auditar-release-v1.mjs` é o gate estrutural da linha v1. O workflow `.github/workflows/homologar-release-v1.yml` valida a versão atual em navegador. O workflow `.github/workflows/homologar-firebase-real.yml` executa a homologação Firebase real automaticamente quando a camada de colaboração muda.

A **v1.0.2** foi publicada somente após:

- gate estrutural verde;
- cobertura total verde;
- E2E Desktop/Mobile verde;
- Firebase real verde com Mestre e Jogador efêmero;
- confirmação de conteúdo privado exclusivo do Mestre;
- confirmação de Sessões/Aventuras por atribuição;
- confirmação de bloqueio de alteração de Mesa/vínculo pelo Jogador;
- confirmação de edição da própria ficha;
- deploy GitHub Pages verde no commit homologado.
