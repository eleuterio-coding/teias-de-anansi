import type { FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

/**
 * Adaptador lazy, sem login/logout/cadastro e sem execucao automatica.
 * Fluxos de conta e autorizacao dependem da aprovacao da Etapa 3.
 */
export function prepareHubAuth(app: FirebaseApp): Auth {
  return getAuth(app);
}
