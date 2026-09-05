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

O acesso do produto é **fechado e administrado manualmente**.

- O administrador cria cada credencial normal em **Firebase Authentication → E-mail/senha**.
- O usuário do Hub não informa e-mail real. Um nome como `rafael` é convertido internamente para `rafael@teias.invalid` apenas para satisfazer o formato exigido pelo Firebase Authentication.
- `teias.invalid` é um identificador técnico; não precisa existir como serviço de e-mail.
- Não existe UI de cadastro público, convite por e-mail ou confirmação de e-mail.
- Senhas não são armazenadas no Firestore, no GitHub ou em `authorizedUsers`.
- Depois de criar uma credencial normal, o administrador autoriza o UID em `authorizedUsers/{uid}` com `username`, `active` e `isAdmin`.
- O Firestore só libera os dados do Hub quando o usuário autenticado também existe em `authorizedUsers` e está com `active: true`.

## Estado do provisionamento real

Concluído no projeto Firebase Spark do Hub:

1. Projeto Firebase Spark criado e somente o site Web registrado.
2. Authentication com **E-mail/senha** habilitado.
3. Cloud Firestore Standard criado em modo de produção.
4. `firebase/firestore.rules` publicadas com autorização fechada por `authorizedUsers`.
5. Índice composto de `memberships` (`uid` crescente + `active` crescente, escopo `COLLECTION`) criado e ativado.
6. Primeiro administrador criado manualmente e autorizado no Firestore.
7. Configuração pública Web registrada em `dados/firebase-config.json` com `enabled: true`.
8. Gate `15Z · Provedor real configurado` concluído com sucesso.
9. Login administrativo real homologado no GitHub Pages, com leitura correta de `authorizedUsers` e reconhecimento do perfil Administrador.

A criação futura de usuários normais continua manual. Depois disso, o administrador pode usar a página **Usuários e Colaboração** para autorizar o UID e vinculá-lo às Mesas.

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

O Bloco 15 foi aceito após a homologação do login administrativo real. A homologação E2E multiusuário completa permanece no escopo do **Bloco 18 — Homologação, documentação e release final**, sem reabrir o Bloco 15.

---

# Homologação Firebase real — Bloco 18

A etapa final usa `.github/workflows/homologar-firebase-real.yml` e `e2e/collaboration-real.spec.js`.

Uma execução histórica em 2026-09-05 falhou corretamente no preflight antes de qualquer acesso ao Firebase porque o desenho inicial exigia cinco Secrets ainda ausentes. O gate foi posteriormente simplificado sem reduzir a cobertura.

## 1. Única identidade que precisa existir previamente

Usar a conta Administradora já homologada no Bloco 15. Ela precisa continuar com:

- credencial ativa no Firebase Authentication;
- documento `authorizedUsers/{uid}` existente;
- `active: true`;
- `isAdmin: true`.

O username usado pelo Secret é apenas o nome do Hub, **sem `@teias.invalid`**. O provider acrescenta o domínio técnico automaticamente.

## 2. Jogador E2E é automático

Não é mais necessário criar manualmente uma segunda conta, senha ou UID para o teste.

A cada execução, o harness:

1. gera username e senha aleatórios em memória;
2. cria uma credencial efêmera no Firebase Authentication;
3. obtém o UID criado;
4. usa a sessão real do Administrador para registrar `authorizedUsers/{uid}` com `active: true` e `isAdmin: false`;
5. cria a membership `player` da Mesa técnica;
6. executa todas as verificações multiusuário;
7. no cleanup, remove perfil, membership, autorização e a própria credencial efêmera.

Essa criação técnica **não abre cadastro no produto**. O Hub continua sem UI de cadastro público. Além disso, uma credencial criada no Authentication não recebe acesso aos dados enquanto não possuir um `authorizedUsers/{uid}` ativo, preservando o modelo fail-closed.

## 3. Configurar somente dois GitHub Actions Secrets

No repositório GitHub:

**Settings → Secrets and variables → Actions → Repository secrets**

Criar somente:

| Secret | Valor |
| --- | --- |
| `E2E_FIREBASE_ADMIN_USERNAME` | nome do usuário Administrador, sem `@teias.invalid` |
| `E2E_FIREBASE_ADMIN_PASSWORD` | senha atual da conta Administradora |

Não existem mais Secrets `E2E_FIREBASE_PLAYER_*` no contrato de release.

Nunca colocar esses valores em commits, issues, PRs, fixtures, Markdown ou arquivos `.env` versionados.

## 4. Executar o gate

No GitHub:

**Actions → Homologar Firebase real v1 → Run workflow → main → Run workflow**

O workflow verifica os dois Secrets administrativos antes de instalar/executar o Playwright. Se qualquer um estiver ausente, falha no preflight e não pode ser interpretado como aceite.

## 5. O que o teste comprova

Uma execução verde precisa provar, no Firebase Spark real:

1. login do Administrador e confirmação de `isAdmin: true`;
2. criação real do Jogador efêmero;
3. autorização temporária do Jogador como não administrador;
4. publicação da Mesa técnica `__e2e_release_v1__`;
5. membership do Jogador como `player`;
6. leitura privada pelo Mestre;
7. leitura apenas da projeção compartilhada pelo Jogador;
8. handout oculto e pista oculta ausentes da projeção;
9. escrita do Jogador em `/campaigns/{id}/private/*` bloqueada com `permission-denied`;
10. alteração pelo Jogador apenas do `characterId` permitido da própria membership;
11. perda e retomada de rede preservando estado local e recuperando leitura compartilhada válida;
12. remoção dos registros e da identidade efêmera usados no teste.

## 6. Critério de aceite e fechamento automático

O Bloco 18 só pode ser marcado como **✅ Aceito** quando `Homologar Firebase real v1` terminar com **success**.

Depois de um `success` manual na `main`, `.github/workflows/finalizar-release-v1.yml` é disparado automaticamente. Ele só publica se:

1. o workflow Firebase terminou com `success`;
2. a execução foi iniciada por `workflow_dispatch`;
3. a execução ocorreu na `main` do próprio repositório;
4. a `main` continua no mesmo commit homologado;
5. tag/release `v1.0.0` ainda não existe;
6. gate estrutural e E2E local são reexecutados e permanecem verdes.

Só então o finalizador:

- promove `package.json` de `1.0.0-rc.1` para `1.0.0`;
- registra o run Firebase aprovado em `docs/HOMOLOGACAO-V1.md`;
- marca o Bloco 18 como **✅ Aceito** em `ROADMAP-V1.md`;
- grava o commit final de aceite na `main`;
- publica a tag `v1.0.0` e o GitHub Release **Teias de Anansi v1.0.0** usando `docs/RELEASE-NOTES-V1.0.0.md`.

Tag e GitHub Release são criados pela mesma operação de publicação. Se a `main` mudar entre homologação e finalização, o processo falha fechado e exige nova execução do gate Firebase.

Até existir esse `success` real, os **dois Secrets administrativos** são o único bloqueador técnico obrigatório conhecido do release.
