# Provisionamento Firebase — Bloco 15

O Hub continua hospedado no GitHub Pages. Firebase é usado apenas para **Authentication + Cloud Firestore**; não usar Firebase Hosting e não usar Supabase.

## O que falta fora do repositório

1. Criar um projeto Firebase e registrar um Web App.
2. Em Authentication, habilitar o provedor Google.
3. Criar o banco Cloud Firestore.
4. Publicar `firebase/firestore.rules` e `firebase/firestore.indexes.json` (o `firebase.json` raiz já aponta para ambos).
5. Adicionar o domínio publicado do Hub aos domínios autorizados do Firebase Authentication.
6. Copiar **somente a configuração pública Web** para `dados/firebase-config.json` e mudar `enabled` para `true`.

Campos esperados:

- `projectId`
- `apiKey`
- `authDomain`
- `appId`
- opcionalmente `storageBucket` e `messagingSenderId`

Nunca commitar chave privada, JSON de Service Account, refresh token, senha ou credencial administrativa.

## Validação

Depois do provisionamento, o workflow **Auditar usuários, colaboração e sincronização — Bloco 15** precisa ficar integralmente verde, inclusive o gate `15Z · Provedor real configurado`.

O Bloco 15 não pode ser marcado como Aceito apenas porque o cliente está implementado: login e sincronização entre dois contextos reais precisam ser homologados no Firebase provisionado.
