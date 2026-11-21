import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  prepareHubFirebaseApp: vi.fn(),
  prepareHubAuth: vi.fn(),
  prepareHubFirestore: vi.fn(),
  readHubScopedDocument: vi.fn(),
  checkOwnCampaignAccess: vi.fn(),
}));
vi.mock('../src/services/firebase/app', () => ({
  prepareHubFirebaseApp: mock.prepareHubFirebaseApp,
}));
vi.mock('../src/services/firebase/auth', () => ({ prepareHubAuth: mock.prepareHubAuth }));
vi.mock('../src/services/firebase/firestore', () => ({
  prepareHubFirestore: mock.prepareHubFirestore,
}));
vi.mock('../src/services/firebase/scoped-access', () => ({
  readHubScopedDocument: mock.readHubScopedDocument,
  checkOwnCampaignAccess: mock.checkOwnCampaignAccess,
}));
import {
  readCurrentUserDocument,
  checkCurrentUserCampaignAccess,
} from '../src/services/scoped-access';

const user = { uid: 'uid-gus-ficticio', email: 'gus@teias.invalid' };
const auth: { currentUser: typeof user | null } = { currentUser: user };

beforeEach(() => {
  vi.resetAllMocks();
  auth.currentUser = user;
  mock.prepareHubFirebaseApp.mockReturnValue({});
  mock.prepareHubAuth.mockReturnValue(auth);
  mock.prepareHubFirestore.mockReturnValue({});
  mock.readHubScopedDocument.mockResolvedValue({ status: 'ok', data: { secret: 'ficticio' } });
  mock.checkOwnCampaignAccess.mockResolvedValue({ status: 'ok', activeCampaigns: 1 });
});

describe('3.06 — ações dependem de UID autenticado corrente', () => {
  it('nega UID de outra pessoa ANTES de consultar Firestore', async () => {
    expect(await readCurrentUserDocument('uid-alheio', { kind: 'own-profile' })).toEqual({
      status: 'denied',
    });
    expect(mock.prepareHubFirestore).not.toHaveBeenCalled();
    expect(mock.readHubScopedDocument).not.toHaveBeenCalled();
    expect(await checkCurrentUserCampaignAccess('uid-alheio')).toEqual({ status: 'denied' });
  });

  it('permite ação do usuário corrente sem passar UID de outro usuário', async () => {
    expect(await checkCurrentUserCampaignAccess(user.uid)).toEqual({
      status: 'ok',
      activeCampaigns: 1,
    });
    expect(mock.checkOwnCampaignAccess).toHaveBeenCalledWith(user, {});
  });

  it('descarta payload se sessão termina durante leitura', async () => {
    mock.readHubScopedDocument.mockImplementation(async () => {
      auth.currentUser = null;
      return { status: 'ok', data: { secret: 'ficticio' } };
    });
    expect(await readCurrentUserDocument(user.uid, { kind: 'own-profile' })).toEqual({
      status: 'denied',
    });
  });

  it('descarta ação caso sessão mude antes da resposta', async () => {
    mock.checkOwnCampaignAccess.mockImplementation(async () => {
      auth.currentUser = { uid: 'uid-outro', email: 'bruno@teias.invalid' };
      return { status: 'ok', activeCampaigns: 1 };
    });
    expect(await checkCurrentUserCampaignAccess(user.uid)).toEqual({ status: 'denied' });
  });
});
