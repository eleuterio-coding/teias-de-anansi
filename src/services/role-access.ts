import { prepareHubFirebaseApp } from './firebase/app';
import { prepareHubAuth } from './firebase/auth';
import { prepareHubFirestore } from './firebase/firestore';
import { HUB_EXISTING_FIREBASE_WEB_OPTIONS } from './firebase/public-web-options';
import { HISTORICAL_FIREBASE_PROJECT_ID } from './firebase/legacy-contract';
import { verifyHubRole, type HubRoleAccess } from './firebase/role-access';

export type { HubRole, HubRoleAccess } from './firebase/role-access';

/**
 * Verifica a mesma sessao observada no login. O UID da UI nunca e usado
 * diretamente para ler perfis de outra conta.
 */
export async function getHubRoleForCurrentSession(expectedUid: string): Promise<HubRoleAccess> {
  if (HUB_EXISTING_FIREBASE_WEB_OPTIONS.projectId !== HISTORICAL_FIREBASE_PROJECT_ID) {
    return { status: 'unavailable' };
  }
  const app = prepareHubFirebaseApp(HUB_EXISTING_FIREBASE_WEB_OPTIONS);
  const auth = prepareHubAuth(app);
  const current = auth.currentUser;
  if (!current || current.uid !== expectedUid) {
    return { status: 'denied', reason: 'no-session' };
  }
  const db = prepareHubFirestore(app);
  const result = await verifyHubRole(current, db);
  // A sessao pode ter sido encerrada/trocada durante as leituras remotas.
  if (auth.currentUser?.uid !== expectedUid) {
    return { status: 'denied', reason: 'no-session' };
  }
  return result;
}
