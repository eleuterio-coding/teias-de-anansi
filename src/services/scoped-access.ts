import type { HubReadRequest, HubReadResult, HubOwnAccessResult } from './firebase/scoped-access';
import { readHubScopedDocument, checkOwnCampaignAccess } from './firebase/scoped-access';
import { prepareHubFirebaseApp } from './firebase/app';
import { prepareHubAuth } from './firebase/auth';
import { prepareHubFirestore } from './firebase/firestore';
import { HISTORICAL_FIREBASE_PROJECT_ID } from './firebase/legacy-contract';
import { HUB_EXISTING_FIREBASE_WEB_OPTIONS } from './firebase/public-web-options';

export type { HubReadRequest, HubReadResult, HubOwnAccessResult } from './firebase/scoped-access';

function servicesFor(uid: string) {
  if (HUB_EXISTING_FIREBASE_WEB_OPTIONS.projectId !== HISTORICAL_FIREBASE_PROJECT_ID) return null;
  const app = prepareHubFirebaseApp(HUB_EXISTING_FIREBASE_WEB_OPTIONS);
  const auth = prepareHubAuth(app);
  if (!auth.currentUser || auth.currentUser.uid !== uid) return null;
  return { auth, db: prepareHubFirestore(app), user: auth.currentUser };
}

export async function readCurrentUserDocument(
  expectedUid: string,
  request: HubReadRequest,
): Promise<HubReadResult> {
  const services = servicesFor(expectedUid);
  if (!services) return { status: 'denied' };
  const result = await readHubScopedDocument(services.user, services.db, request);
  // A sessão pode ter terminado durante a leitura. Descartar qualquer payload.
  if (services.auth.currentUser?.uid !== expectedUid) return { status: 'denied' };
  return result;
}

export async function checkCurrentUserCampaignAccess(
  expectedUid: string,
): Promise<HubOwnAccessResult> {
  const services = servicesFor(expectedUid);
  if (!services) return { status: 'denied' };
  const result = await checkOwnCampaignAccess(services.user, services.db);
  if (services.auth.currentUser?.uid !== expectedUid) return { status: 'denied' };
  return result;
}
