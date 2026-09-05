# Provisionamento Firebase — Bloco 15

O Hub de RPG é **somente um site web responsivo**, hospedado no **GitHub Pages**. Não existe aplicativo Android, iOS, desktop ou PWA obrigatória. No Firebase, "Web App" significa apenas registrar o site para usar os serviços web.

## Política obrigatória de custo e plataforma

- Usar exclusivamente o plano **Spark / No-cost**.
- **Não cadastrar cartão**, método de pagamento ou conta de faturamento.
- **Não migrar para Blaze**.
- Firebase é usado somente para **Authentication + Cloud Firestore**.
- **Não usar Firebase Hosting**; a hospedagem continua no GitHub Pages.
- **Não usar Cloud Functions**, extensões pagas, backups/PITR gerenciados ou qualquer recurso que exija billing.
- **Não usar SDK Android/iOS**, `google-services.json`, `GoogleService-Info.plist`, APK, Play Store ou App Store.
- Não usar Supabase.
- Se futuramente um recurso necessário deixar de funcionar sem cartão/faturamento, o Hub deve substituir o provedor em vez de ativar cobrança.

## Modelo de identidade adotado

O acesso é **fechado e administrado manualmente**.

- O administrador cria cada credencial em **Firebase Authentication → E-mail/senha**.
- O usuário do Hub não informa e-mail real. Um nome como `rafael` é convertido internamente para `rafael@teias.invalid` apenas para satisfazer o formato exigido pelo Firebase Authentication.
- `teias.invalid` é um identificador técnico; não precisa existir como serviço de e-mail.
- Não existe cadastro público, convite por e-mail ou confirmação de e-mail.
- Senhas não são armazenadas no Firestore, no GitHub ou em `authorizedUsers`.
- Depois de criar a credencial, o administrador autoriza o UID em `authorizedUsers/{uid}` com `username`, `active` e `isAdmin`.
- O Firestore só libera os dados do Hub quando o usuário autenticado também existe em `authorizedUsers` e está com `active: true`.

## Estado do provisionamento real

Concluído no projeto Firebase Spark do Hub:

1. Projeto Firebase Spark criado e somente o site Web registrado.
2. Authentication com **E-mail/senha** habilitado; login por link, Google e SMS/MFA não são requisitos.
3. Cloud Firestore Standard criado em modo de produção.
4. `firebase/firestore.rules` publicadas com autorização fechada por `authorizedUsers`.
5. Índice composto de `memberships` (`uid` crescente + `active` crescente, escopo `COLLECTION`) criado e ativado.
6. Primeiro administrador criado manualmente e autorizado no Firestore.
7. Configuração pública Web registrada em `dados/firebase-config.json` com `enabled: true`.
8. Gate `15Z · Provedor real configurado` concluído com sucesso.
9. Login administrativo real homologado no GitHub Pages, com leitura correta de `authorizedUsers` e reconhecimento do perfil Administrador.

A criação futura de novas credenciais continua manual no Firebase Authentication. Depois disso, o administrador pode usar a página **Usuários e Colaboração** para autorizar o UID e vinculá-lo às Mesas.

## Configuração pública

Campos usados pelo site:

- `projectId`
- `apiKey`
- `authDomain`
- `appId`
- `usernameDomain`
- `storageBucket` e `messagingSenderId`, quando fornecidos pela configuração Web

Esses campos são configuração pública do cliente Firebase. Nunca commitar chave privada, JSON de Service Account, refresh token, senha ou credencial administrativa.

## Validação do Bloco 15

O workflow **Auditar usuários, colaboração e sincronização — Bloco 15** valida a arquitetura web-only, Spark/zero billing, autenticação `username-password`, ausência do fluxo de convite e configuração pública do provedor real.

O Bloco 15 foi aceito após a homologação do login administrativo real. O responsável pelo projeto dispensou o teste manual adicional com uma conta não autorizada. A homologação E2E multiusuário completa permanece no escopo do **Bloco 18 — Homologação, documentação e release final**, sem reabrir o Bloco 15.

---

# Homologação Firebase real — Bloco 18

Esta é a etapa final de release. O workflow é `.github/workflows/homologar-firebase-real.yml` e o cenário real está em `e2e/collaboration-real.spec.js`.

Uma execução observada em 2026-09-05 falhou corretamente no preflight porque os cinco GitHub Actions Secrets abaixo ainda não estavam configurados. Nenhum login ou acesso ao Firestore foi tentado nessa execução.

## 1. Preparar as duas identidades

### Conta administradora

Usar a conta administrativa já homologada no Bloco 15. Ela precisa continuar com:

- credencial ativa em Firebase Authentication;
- documento `authorizedUsers/{uid}` existente;
- `active: true`;
- `isAdmin: true`.

O Secret usa **somente o nome de usuário do Hub**, sem `@teias.invalid`. O provider acrescenta o domínio técnico automaticamente.

### Conta de Jogador E2E

Criar uma segunda credencial em **Firebase Authentication → Authentication → Users → Add user**.

Exemplo de formato técnico:

- usuário do Hub: `e2e-player`;
- e-mail técnico no Authentication: `e2e-player@teias.invalid`;
- senha: definida manualmente e guardada apenas como Secret.

O nome de usuário deve obedecer ao contrato do Hub: letras minúsculas, números, ponto, hífen ou sublinhado, com até 64 caracteres.

Depois de criar a credencial:

1. copiar o **UID** exato mostrado no Firebase Authentication;
2. autorizar esse UID pela página **Usuários e Colaboração** do Hub ou diretamente no Firestore;
3. garantir que `authorizedUsers/{uid}` contenha:
   - `username`: o mesmo nome usado antes de `@teias.invalid`;
   - `active: true`;
   - `isAdmin: false`.

Não é necessário criar membership manualmente. O próprio teste administrativo vincula essa conta como `player` à Mesa técnica `__e2e_release_v1__`.

## 2. Configurar GitHub Actions Secrets

No repositório GitHub:

**Settings → Secrets and variables → Actions → Repository secrets**

Criar exatamente estes cinco Secrets:

| Secret | Valor |
| --- | --- |
| `E2E_FIREBASE_ADMIN_USERNAME` | nome do usuário administrador, sem `@teias.invalid` |
| `E2E_FIREBASE_ADMIN_PASSWORD` | senha atual da conta administradora |
| `E2E_FIREBASE_PLAYER_USERNAME` | nome do segundo usuário, sem `@teias.invalid` |
| `E2E_FIREBASE_PLAYER_PASSWORD` | senha da segunda conta |
| `E2E_FIREBASE_PLAYER_UID` | UID exato da segunda conta no Firebase Authentication |

Nunca colocar esses valores em commits, issues, PRs, fixtures, Markdown ou arquivos `.env` versionados.

## 3. Executar o gate

No GitHub:

**Actions → Homologar Firebase real v1 → Run workflow → main → Run workflow**

O workflow primeiro verifica se os cinco Secrets existem. Somente depois instala o Playwright e executa o cenário autenticado.

## 4. O que o teste comprova

Uma execução verde precisa provar, no Firebase Spark real:

1. login do administrador e confirmação de `isAdmin: true`;
2. publicação da Mesa técnica `__e2e_release_v1__`;
3. criação da membership do segundo UID como `player`;
4. leitura privada pelo Mestre;
5. login do Jogador e confirmação de `isAdmin: false`;
6. leitura apenas da projeção compartilhada pelo Jogador;
7. handout oculto e pista oculta ausentes da projeção;
8. tentativa do Jogador de gravar `/campaigns/{id}/private/*` bloqueada com `permission-denied`;
9. alteração pelo Jogador apenas do `characterId` permitido da própria membership;
10. perda e retomada de rede preservando o estado local e recuperando uma leitura compartilhada válida.

## 5. Critério de aceite

O Bloco 18 só pode ser marcado como **✅ Aceito** quando `Homologar Firebase real v1` terminar com **success** usando as duas identidades reais.

Depois desse success:

1. registrar o run em `docs/HOMOLOGACAO-V1.md`;
2. marcar o Bloco 18 como aceito em `ROADMAP-V1.md`;
3. criar a tag/release `v1.0.0`.

Até lá, a ausência dos Secrets é o único bloqueador técnico obrigatório conhecido do release.
