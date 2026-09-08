# Firebase — Teias de Anansi

O Hub é **somente um site web**, hospedado no **GitHub Pages**. O Firebase é usado apenas para **Authentication + Cloud Firestore** no plano **Spark / No-cost**.

## Política de plataforma e custo

- Plano Firebase **Spark / No-cost**.
- Sem Firebase Hosting; o site continua no GitHub Pages.
- Sem Cloud Functions.
- Sem aplicativo Android/iOS.
- Sem Supabase.
- Sem requisito de cartão ou faturamento.

## Modelo atual — v1.0.2

O Hub é um projeto pessoal, particular, para poucas pessoas de confiança.

A v1.0.1 removeu Backup e a autorização administrativa global. A v1.0.2 manteve o login simples e consolidou o **acesso por atribuição** necessário para que cada Jogador veja somente o conteúdo da própria participação.

## Login

O proprietário cria cada conta manualmente em **Firebase Authentication → E-mail/senha**.

O jogador não precisa possuir ou informar um e-mail real. O Hub trabalha com:

- **usuário**: por exemplo `gus`;
- **senha**: definida ao criar a conta.

Internamente, `gus` vira `gus@teias.invalid` apenas para satisfazer o formato exigido pelo Firebase Authentication. O domínio `teias.invalid` é técnico e não precisa receber mensagens.

Não existe no produto:

- cadastro público;
- convite por e-mail;
- confirmação de e-mail;
- recuperação por e-mail como requisito do Hub;
- coleção `authorizedUsers` como segunda autorização;
- bloqueio/reativação de contas dentro do Hub;
- papel administrativo global para liberar entrada.

**Se a conta existe no Firebase Authentication e a senha está correta, ela pode entrar.**

## Mestre, Jogador e Observador

Os papéis suportados são:

- `dm` — Mestre;
- `player` — Jogador;
- `observer` — Observador.

O Mestre administra a Mesa e suas atribuições. Para Jogadores, a membership da Mesa associa a conta ao `characterId` correspondente.

A aplicação mantém representação privada do Mestre e projeções compartilhadas para participantes. A projeção compartilhada omite conteúdo exclusivo do Mestre, como notas privadas, handouts não revelados e pistas ocultas.

## Acesso por atribuição — v1.0.2

O contrato atual é:

- Jogador só vê Campanhas/Mesas às quais está vinculado;
- Jogador só vê Sessões em que seu personagem atribuído participa;
- Jogador só vê Aventuras relacionadas a essas Sessões;
- Jogador não lê conteúdo privado do Mestre;
- Jogador não altera Mesa, membership, Sessão ou Aventura;
- Jogador só lê/escreve a própria ficha atribuída;
- Bibliotecas permanecem disponíveis pela aplicação.

Essas permissões são parte do funcionamento do Hub. O projeto continua sem objetivo de hardening para ambiente hostil.

## Firestore Rules atuais

O arquivo versionado em `firebase/firestore.rules` implementa o acesso por atribuição.

Em resumo:

- perfis em `users/{uid}` são mantidos pela própria conta;
- `campaigns/{campaignId}` é administrada por proprietário/Mestre;
- `memberships` determinam o vínculo da conta com a Mesa;
- `sessions` compartilhadas validam `participantCharacterIds` contra a ficha atribuída ao usuário;
- `adventureViews` usam a mesma lógica de participação para leitura do Jogador;
- `private` permanece exclusivo do Mestre;
- `campaigns/{campaignId}/characters/{characterId}` só é acessível ao Jogador quando o `characterId` é o da própria membership.

As Rules não reintroduzem `authorizedUsers` nem `isAdmin`.

## Configuração pública do cliente

`dados/firebase-config.json` contém somente a configuração pública necessária ao SDK web:

- `projectId`
- `apiKey`
- `authDomain`
- `appId`
- `usernameDomain`
- `storageBucket`
- `messagingSenderId`

Senhas e credenciais privadas não são versionadas.

## Homologação automática

`.github/workflows/homologar-firebase-real.yml` roda automaticamente na `main` quando a camada de colaboração muda.

O teste real usa os Secrets já configurados:

- `E2E_FIREBASE_ADMIN_USERNAME`
- `E2E_FIREBASE_ADMIN_PASSWORD`

O próprio teste cria um Jogador efêmero e valida o contrato completo da v1.0.2.

Uma execução verde comprova:

1. login por usuário e senha;
2. criação do Jogador técnico efêmero;
3. publicação da Mesa pelo Mestre;
4. vínculo como `player` com ficha atribuída;
5. Mestre recebe a visão privada;
6. Jogador recebe apenas a visão compartilhada atribuída;
7. Sessões não atribuídas não aparecem;
8. Aventuras não atribuídas não aparecem;
9. conteúdo privado do Mestre é bloqueado;
10. alteração de Campanha/vínculo pelo Jogador é bloqueada;
11. ficha alheia é bloqueada;
12. própria ficha atribuída pode ser salva;
13. perda e retomada de rede preservam o fluxo;
14. cleanup da identidade técnica efêmera ao final.

Homologação final da v1.0.2:

- workflow: `Homologar colaboração Firebase`;
- run: `34247492736`;
- commit: `c9bf6befd4a4214c475ceedb9bf8f4a851dedc10`;
- resultado: **success**.

## Histórico

### v1.0.0

Usava `authorizedUsers`, `isAdmin`, regras mais complexas e Backup. Mantido apenas como histórico na tag/release `v1.0.0`.

### v1.0.1

Removeu Backup e a autorização administrativa global, adotando login simples.

### v1.0.2

Manteve o login simples e adicionou o recorte funcional por participação necessário para o uso real de Mestre/Jogador.

**Versão de referência: v1.0.2.**
