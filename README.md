# Teias de Anansi — Hub de RPG

**Local onde histórias ganham vida.**

Teias de Anansi é um Hub de RPG web responsivo, pessoal e particular, voltado para um pequeno grupo de pessoas de confiança. O núcleo atual usa D&D 5.5e / 2024, com criação e uso de personagens, Campanhas/Mesas, Sessões, encontros, Aventuras, bibliotecas de regras e colaboração online.

O produto é **somente um site web**, hospedado no GitHub Pages. Não há aplicativo Android/iOS/desktop, Firebase Hosting, Cloud Functions, Supabase ou requisito de faturamento. O Firebase é usado apenas para login e sincronização no plano Spark / No-cost.

## Usuários do Hub

O Hub possui somente dois tipos de usuário:

- **Rafael — Mestre único**;
- **Jogadores** — atualmente `gus`, `leo` e `bruno`, além de futuras contas criadas manualmente.

Não existe papel de Observador. Rafael não é um papel configurável: ele é sempre o Mestre.

## Personagens

A área de Personagens reúne a Criação de Personagem e a Ficha Digital. Quando a conta conectada é de Jogador, somente a **ficha atribuída por Rafael** aparece como ficha de jogo editável. Jogadores não podem alterar fichas de outras pessoas.

## Campanhas / Mesas

Rafael cria e administra as Campanhas/Mesas. Um Jogador só vê uma Campanha quando Rafael o adiciona explicitamente a ela. O Jogador não cria, altera ou exclui Campanhas e não modifica o próprio acesso.

## Sessões

Rafael escolhe explicitamente quais Sessões cada Jogador poderá ver. Estar em uma Campanha não libera automaticamente todas as Sessões dessa Campanha.

O Jogador não altera Sessões nem suas próprias atribuições.

## Aventuras

Rafael escolhe explicitamente quais Aventuras cada Jogador poderá ver. Estar em uma Campanha ou em uma Sessão não libera automaticamente outras Aventuras.

A visão compartilhada da Aventura continua omitindo notas exclusivas do Mestre, pistas ocultas e handouts ainda não revelados. Jogadores não alteram Aventuras.

## Bibliotecas

As Bibliotecas permanecem disponíveis aos Jogadores. Todas as fontes suportadas e todas as Regras da Casa consolidadas permanecem sempre habilitadas.

## Jogadores e login

O acesso é simples: **nome de usuário + senha**. As contas são criadas manualmente por Rafael no Firebase Authentication.

O Firebase exige internamente um identificador no formato de e-mail. Por isso, `gus`, por exemplo, é autenticado tecnicamente como `gus@teias.invalid`. Nenhum e-mail real é solicitado ou exibido pelo Hub.

Rafael pode configurar o acesso de um Jogador antes mesmo do primeiro login dele. Na área **Jogadores**, Rafael informa o nome de usuário e escolhe:

- a Campanha;
- a ficha atribuída;
- as Sessões visíveis;
- as Aventuras visíveis.

O Jogador não pode alterar essas escolhas.

## Permissões funcionais

- Rafael administra Campanhas, Sessões, Aventuras, jogadores e atribuições;
- Jogador vê apenas Campanhas, Sessões e Aventuras explicitamente atribuídas a ele;
- Jogador altera somente a própria ficha atribuída;
- Bibliotecas permanecem acessíveis;
- conteúdo privado do Mestre não é entregue ao Jogador.

O projeto é pessoal e não tem objetivo de hardening para ambiente hostil.

## Configurações e persistência

Configurações expõe apenas preferências de perfil de uso, Ficha Digital e acessibilidade. Não existem controles de Fontes habilitadas, Regras da Casa, Persistência ou Defaults de campanha.

O estado local usa `localStorage` com schemas e chaves versionadas. **Backup/exportação/restauração não fazem parte do produto atual.**

## Desenvolvimento e testes

A aplicação não exige processo de build para uso normal: basta servir os arquivos estáticos por HTTP. As auditorias de domínio estão em `tests/*.mjs`.

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

A colaboração Firebase real pode ser validada com:

```bash
npm run test:e2e:firebase
```

## Documentação

- `ROADMAP-V1.md` — fechamento do escopo da linha v1.
- `docs/MANUAL.md` — fluxos de uso.
- `docs/ARQUITETURA.md` — arquitetura web, persistência e Firebase.
- `docs/HOMOLOGACAO-V1.md` — evidências de homologação e releases.
- `FIREBASE-PROVISIONAMENTO.md` — configuração Firebase utilizada pelo Hub.

## Versões publicadas

- **v1.0.0** — release inicial.
- **v1.0.1** — remoção da área de Backup e da autorização administrativa global.
- **v1.0.2** — primeira release com acesso Mestre/Jogador por participação.

A `main` evolui o acesso para **atribuição explícita por Jogador de Campanha, Sessões e Aventuras**, com Rafael como Mestre único e sem Observador.
