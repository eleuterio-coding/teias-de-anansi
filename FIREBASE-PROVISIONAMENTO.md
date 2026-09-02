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

## O que falta fora do repositório

1. Criar um projeto Firebase no plano Spark e registrar **somente um Web App**.
2. Em Authentication, habilitar apenas o provedor Google necessário ao Hub.
3. Criar um banco Cloud Firestore dentro das cotas gratuitas do Spark.
4. Publicar `firebase/firestore.rules` e `firebase/firestore.indexes.json` (o `firebase.json` raiz aponta somente para Firestore).
5. Adicionar o domínio publicado do GitHub Pages aos domínios autorizados do Firebase Authentication.
6. Copiar **somente a configuração pública Web** para `dados/firebase-config.json` e mudar `enabled` para `true`.

Campos esperados:

- `projectId`
- `apiKey`
- `authDomain`
- `appId`
- opcionalmente `storageBucket` e `messagingSenderId` apenas se algum recurso web gratuito realmente passar a utilizá-los

Nunca commitar chave privada, JSON de Service Account, refresh token, senha ou credencial administrativa.

## Validação

O workflow **Auditar usuários, colaboração e sincronização — Bloco 15** valida a arquitetura web-only e sem billing. O gate `15Z · Provedor real configurado` só deve passar depois do provisionamento Spark real e da homologação de login/sincronização entre dois contextos autenticados.

O Bloco 15 não pode ser marcado como Aceito apenas porque o cliente está implementado.
