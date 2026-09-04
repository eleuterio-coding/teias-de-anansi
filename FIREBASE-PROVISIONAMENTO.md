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

## Validação

O workflow **Auditar usuários, colaboração e sincronização — Bloco 15** valida a arquitetura web-only, Spark/zero billing, autenticação `username-password`, ausência do fluxo de convite e configuração pública do provedor real.

O gate `15Z · Provedor real configurado` confirma o provisionamento no repositório, mas o **Bloco 15 só pode ser aceito após homologação real do login e da sincronização em navegador**, incluindo permissões entre contextos autenticados.
