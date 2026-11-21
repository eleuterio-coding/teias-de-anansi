import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  prepareHubFirebaseApp: vi.fn(),
  prepareHubAuth: vi.fn(),
  prepareHubFirestore: vi.fn(),
  verifyHubRole: vi.fn(),
}));
vi.mock('../src/services/firebase/app', () => ({
  prepareHubFirebaseApp: mock.prepareHubFirebaseApp,
}));
vi.mock('../src/services/firebase/auth', () => ({
  prepareHubAuth: mock.prepareHubAuth,
}));
vi.mock('../src/services/firebase/firestore', () => ({
  prepareHubFirestore: mock.prepareHubFirestore,
}));
vi.mock('../src/services/firebase/role-access', () => ({
  verifyHubRole: mock.verifyHubRole,
}));
import { getHubRoleForCurrentSession } from '../src/services/role-access';

const fakeUser = { uid: 'uid-real-ficticio', email: 'gus@teias.invalid' };
const auth = { currentUser: fakeUser } as unknown as Auth;
const db = {} as Firestore;

beforeEach(() => {
  vi.resetAllMocks();
  mock.prepareHubFirebaseApp.mockReturnValue({ name: 'existing-app' });
  mock.prepareHubAuth.mockReturnValue(auth);
  mock.prepareHubFirestore.mockReturnValue(db);
  mock.verifyHubRole.mockResolvedValue({
    status: 'verified', role: 'player', campaignCount: 1, displayName: 'Gustavo',
  });
  (auth as { currentUser: typeof fakeUser | null }).currentUser = fakeUser;
});

describe('Fachada 3.04 — apenas o usuário da sessão atual', () => {
  it('nega UID fornecido pela UI que difere do Firebase Authentication', async () => {
    const result = await getHubRoleForCurrentSession('uid-de-outra-conta');
    expect(result).toEqual({ status: 'denied', reason: 'no-session' });
    expect(mock.verifyHubRole).not.toHaveBeenCalled();
    expect(mock.prepareHubFirestore).not.toHaveBeenCalled();
  });

  it('verifica UID atual com Firestore, sem confiar apenas na entrada', async () => {
    const result = await getHubRoleForCurrentSession('uid-real-ficticio');
    expect(result).toMatchObject({ status: 'verified', role: 'player' });
    expect(mock.verifyHubRole).toHaveBeenCalledWith(fakeUser, db);
  });

  it('não devolve papel antigo se logout ocorrer durante a consulta', async () => {
    mock.verifyHubRole.mockImplementation(async () => {
      (auth as { currentUser: typeof fakeUser | null }).currentUser = null;
      return { status: 'verified', role: 'dm', campaignCount: 2, displayName: 'Rafael' };
    });
    const result = await getHubRoleForCurrentSession('uid-real-ficticio');
    expect(result).toEqual({ status: 'denied', reason: 'no-session' });
  });
});
