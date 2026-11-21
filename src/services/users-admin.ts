import { prepareHubFirebaseApp } from './firebase/app';
import { prepareHubAuth } from './firebase/auth';
import { prepareHubFirestore } from './firebase/firestore';
import {
  HISTORICAL_FIREBASE_PROJECT_ID,
} from './firebase/legacy-contract';
import { HUB_EXISTING_FIREBASE_WEB_OPTIONS } from './firebase/public-web-options';
import {
  loadMasterRosterReadOnly,
  type MasterRosterResult,
} from './firebase/users-admin-readonly';

export type { MasterRosterEntry, MasterRosterResult } from './firebase/users-admin-readonly';

/**
 * Fachada pública da administração — GETs do Firestore, nenhum writer.
 * A verificação de Auth é repetida antes e depois das leituras de dados.
 */
export async function getCurrentMasterRoster(): Promise<MasterRosterResult> {
  if (HUB_EXISTING_FIREBASE_WEB_OPTIONS.projectId !== HISTORICAL_FIREBASE_PROJECT_ID)
    return { status: 'unavailable' };
  try {
    const app = prepareHubFirebaseApp(HUB_EXISTING_FIREBASE_WEB_OPTIONS);
    const auth = prepareHubAuth(app);
    const user = auth.currentUser;
    if (!user?.uid || !user.email) return { status: 'denied' };
    const uid = user.uid;
    const result = await loadMasterRosterReadOnly(user, prepareHubFirestore(app));
    if (auth.currentUser?.uid !== uid) return { status: 'denied' };
    return result;
  } catch {
    return { status: 'unavailable' };
  }
}
