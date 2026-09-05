# Teias de Anansi — Hub de RPG

**Local onde histórias ganham vida.**

Teias de Anansi é um Hub de RPG web responsivo, focado em criação e uso de personagens, Campanhas/Mesas, Sessões, encontros, Aventuras, bibliotecas de regras, persistência, backup e colaboração. A v1.0 usa D&D 5.5e / 2024 como núcleo normativo, com fontes compatíveis congeladas e Regras da Casa próprias do projeto.

O produto é **somente um site web**. A hospedagem é feita no GitHub Pages. Não há aplicativo Android/iOS/desktop, Firebase Hosting, Cloud Functions, Supabase ou requisito de faturamento. A colaboração usa Firebase Authentication + Cloud Firestore exclusivamente no plano Spark / No-cost.

## Áreas do Hub

### Personagens

A área de Personagens reúne a Criação de Personagem e a Ficha Digital. O construtor organiza a criação em sete etapas e aplica as fontes e regras consolidadas da v1. Depois da criação, a Ficha é a autoridade de jogo: progressão, recursos, ataques, inventário, economia, magias, descansos, condições e demais estados representáveis ficam nela.

A progressão pós-criação é sequencial até o Level 20. Subir de Level não reaplica pacotes iniciais, não recria orçamento de criação e não concede riqueza automática por Level.

### Campanhas / Mesas

Campanhas armazenam Mestre, cenário, contexto compartilhado, participantes e Sessões. Configurações pode fornecer defaults para novas Mesas, mas esses valores continuam editáveis e não alteram Campanhas já existentes.

Sessões podem conter encontros com iniciativa, criaturas, PV, condições, turnos, recompensas e registro de resultado.

### Aventuras

Aventuras organizam capítulos/arcos, cenas, locais, NPCs, encontros, pistas, handouts e tesouros vinculados à Mesa. A camada de colaboração produz uma projeção compartilhada que exclui material privado do Mestre e conteúdo ainda oculto.

### Bibliotecas

As Bibliotecas expõem os catálogos normativos congelados da v1.0. A precedência entre fontes, compatibilidade e overrides de Regras da Casa são auditados por testes dedicados.

### Dados / Backup

A área Dados / Backup exporta Personagens, Campanhas/Sessões e Aventuras para um pacote JSON versionado com manifesto e checksum de integridade. A importação permite mesclar registros ou substituir o estado portátil inteiro. Antes da restauração, o Hub cria um snapshot local de recuperação e reverte a operação se a validação pós-gravação falhar.

### Usuários

A área Usuários implementa acesso fechado por usuário e senha. O Firebase Authentication usa internamente um identificador técnico `@teias.invalid`; o Firestore exige também um documento ativo em `authorizedUsers/{uid}`. Não existe cadastro público, convite por e-mail ou confirmação de e-mail.

Papéis por Mesa: Mestre, Jogador e Observador. As Firestore Rules são a fronteira de segurança; esconder controles na interface não substitui autorização no servidor.

### Painel Geral

O Painel Geral agrega personagens, Mesas, próxima sessão, personagem em jogo, pendências e atividade recente para dar uma visão operacional do Hub.

### Configurações

Configurações guarda preferências locais de perfil, fontes habilitadas, preset de Regras da Casa, densidade da Ficha, referências de fonte, acessibilidade e defaults de campanha. O preset não é artificialmente gravado no schema da Mesa enquanto esse campo não existir no modelo de campanha.

## Persistência

O estado local usa `localStorage` com schemas e chaves versionadas. As principais coleções são:

- `hub-rpg:characters:v4`
- `hub-rpg:campaigns:v1`
- `hub-rpg:adventures:v1`
- `hub-rpg:settings:v1`

Personagens, Campanhas e Aventuras compõem o backup portátil v1. Configurações são duráveis no navegador, mas permanecem fora do pacote de backup congelado no Bloco 14.

## Colaboração e Firebase

A colaboração é uma camada adicional ao funcionamento local. O projeto Firebase real usa Authentication e Cloud Firestore no plano Spark / No-cost. Campanhas possuem projeções privada e compartilhada; jogadores não devem receber notas privadas do Mestre, encontros privados, pistas ocultas ou handouts não revelados.

O Bloco 18 mantém a homologação multiusuário real como gate obrigatório do release. Testes estáticos e mocks não podem substituir essa evidência.

## Desenvolvimento e testes

A aplicação não exige processo de build para uso normal: basta servir os arquivos estáticos por HTTP. As auditorias de domínio estão em `tests/*.mjs`.

O fechamento da v1 acrescenta Playwright para testes E2E reais em Chromium desktop e mobile.

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

O gate estrutural de release pode ser executado com:

```bash
node tests/auditar-release-v1.mjs
```

No GitHub Actions, `.github/workflows/homologar-release-v1.yml` executa regressões críticas e a suíte Playwright.

## Documentação

- `ROADMAP-V1.md` — autoridade do escopo e aceite dos blocos.
- `docs/MANUAL.md` — fluxos de uso da v1.
- `docs/ARQUITETURA.md` — persistência, schemas, Firebase, separação privado/compartilhado e testes.
- `docs/HOMOLOGACAO-V1.md` — checklist e evidências necessárias para publicar `v1.0.0`.

## Status do release

Os Blocos 1–17 estão aceitos. O Bloco 18 cobre homologação, documentação e release final. A tag `v1.0.0` só deve ser criada depois de todos os gates estarem verdes, incluindo a homologação Firebase multiusuário real e a revisão de PRs/branches históricos.
