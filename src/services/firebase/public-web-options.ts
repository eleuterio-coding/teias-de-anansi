import type { FirebaseOptions } from 'firebase/app';

/**
 * Identificadores PUBLICOS do aplicativo Web do Hub anterior, confirmado em 3.01.
 * A apiKey do SDK Web NAO e segredo administrativo nem permite ignorar as Rules.
 * Nenhuma senha, token ou credencial de service account e distribuida no bundle.
 */
export const HUB_EXISTING_FIREBASE_WEB_OPTIONS: FirebaseOptions = {
  apiKey: 'AIzaSyDZoe_XntJna_aE_uMDrwxFI5EykwdVM5M',
  authDomain: 'teais-de-anansi.firebaseapp.com',
  projectId: 'teais-de-anansi',
  appId: '1:900723445313:web:274b847b3f3145a76c40c0',
  messagingSenderId: '900723445313',
  storageBucket: 'teais-de-anansi.firebasestorage.app',
};
