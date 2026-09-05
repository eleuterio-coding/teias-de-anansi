# Firebase — Teias de Anansi

O Hub é **somente um site web**, hospedado no **GitHub Pages**. O Firebase é usado apenas para **Authentication + Cloud Firestore** no plano **Spark / No-cost**.

## Política de plataforma e custo

- Plano Firebase **Spark / No-cost**.
- Sem Firebase Hosting; o site continua no GitHub Pages.
- Sem Cloud Functions.
- Sem aplicativo Android/iOS.
- Sem Supabase.
- Sem requisito de cartão ou faturamento.

## Modelo atual — v1.0.1

O Hub é um projeto pessoal, particular, para poucas pessoas de confiança. Por isso o modelo foi simplificado deliberadamente.

### Login

O proprietário cria cada conta manualmente em **Firebase Authentication → E-mail/senha**.

O jogador não precisa possuir ou informar um e-mail real. O Hub trabalha com:

- **usuário**: por exemplo `rafael`;
- **senha**: definida ao criar a conta.

Internamente, `rafael` vira `rafael@teias.invalid` apenas para satisfazer o formato exigido pelo Firebase Authentication. O domínio `teias.invalid` é técnico e não precisa receber mensagens.

Não existe no produto:

- cadastro público;
- convite por e-mail;
- confirmação de e-mail;
- recuperação por e-mail como requisito do Hub;
- coleção `authorizedUsers` como segunda autorização;
- bloqueio/reativação de contas dentro do Hub;
- papel administrativo global para liberar acesso.

**Se a conta existe no Firebase Authentication e a senha está correta, ela pode entrar.**

### Mestre e Jogador

A distinção Mestre/Jogador permanece porque é necessária para a experiência da Mesa.

Depois do primeiro login, a conta aparece na área **Usuários e Colaboração** e pode ser vinculada a uma Mesa como:

- `dm` — Mestre;
- `player` — Jogador;
- `observer` — Observador.

A aplicação mantém duas representações da Mesa:

- **privada** — usada por proprietário/Mestre;
- **compartilhada** — usada por Jogador/Observador.

A projeção compartilhada omite conteúdo exclusivo do Mestre, como notas privadas, handouts não revelados e pistas ainda ocultas.

Essa separação é **comportamento funcional da aplicação**, não uma fronteira de segurança contra participantes maliciosos.

## Firestore Rules atuais

O arquivo versionado em `firebase/firestore.rules` implementa o modelo simples:

```text
allow read, write: if request.auth != null;
```

Portanto, o Firebase Authentication é a única barreira de entrada do banco. Isso é intencional para este projeto pessoal e para o grupo de confiança definido pelo proprietário.

As Rules não substituem a lógica Mestre/Jogador do Hub; essa lógica fica no provider e nas projeções privada/compartilhada.

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

O próprio teste cria um Jogador efêmero, faz o primeiro login, vincula esse usuário à Mesa como `player`, compara a visão do Mestre com a visão do Jogador e remove a identidade técnica ao terminar.

Uma execução verde comprova o comportamento que interessa ao produto atual:

1. login por usuário e senha;
2. criação automática do perfil após o primeiro login;
3. vínculo do participante à Mesa;
4. Mestre recebe o bundle privado;
5. Jogador recebe o bundle compartilhado;
6. conteúdo exclusivo do Mestre não aparece na projeção do Jogador;
7. perda e retomada de rede não apagam o estado local.

O teste **não** exige mais bloqueio de escrita maliciosa no Firestore, `isAdmin`, `authorizedUsers` ou qualquer hardening equivalente.

## Histórico

A `v1.0.0` foi publicada em 2026-09-05 usando o modelo anterior, que possuía `authorizedUsers`, regras mais restritivas e uma homologação de segurança multiusuário. Esse estado permanece registrado na tag/release `v1.0.0` apenas como histórico.

A `v1.0.1` simplifica esse desenho conforme a decisão atual do projeto: **login simples + colaboração entre pessoas de confiança + separação funcional Mestre/Jogador**.
