import { prepareHubFirebaseApp } from './firebase/app';
import { prepareHubAuth } from './firebase/auth';
import { createHubAuthDriver, type HubAuthDriver } from './firebase/auth-session';
import { HUB_EXISTING_FIREBASE_WEB_OPTIONS } from './firebase/public-web-options';
import { HISTORICAL_FIREBASE_PROJECT_ID } from './firebase/legacy-contract';

export type { HubAuthDriver, HubSessionIdentity } from './firebase/auth-session';
export { HubAuthError } from './firebase/auth-session';

/**
 * Inicializacao somente ao abrir /entrar. Usa o app Web publico existente.
 * Nao escreve perfis no Firestore, nao cria contas nem atribui permissoes.
 */
export function getHubAuthSession(): HubAuthDriver {
  if (HUB_EXISTING_FIREBASE_WEB_OPTIONS.projectId !== HISTORICAL_FIREBASE_PROJECT_ID) {
    throw new Error('Configuracao publica do Firebase divergente do projeto existente.');
  }
  const app = prepareHubFirebaseApp(HUB_EXISTING_FIREBASE_WEB_OPTIONS);
  const auth = prepareHubAuth(app);
  return createHubAuthDriver(auth);
}
