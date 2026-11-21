import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  app: vi.fn(),
  auth: vi.fn(),
  firestore: vi.fn(),
  roster: vi.fn(),
}));
vi.mock('../src/services/firebase/app', () => ({
  prepareHubFirebaseApp: mocks.app,
}));
vi.mock('../src/services/firebase/auth', () => ({
  prepareHubAuth: mocks.auth,
}));
vi.mock('../src/services/firebase/firestore', () => ({
  prepareHubFirestore: mocks.firestore,
}));
vi.mock('../src/services/firebase/users-admin-readonly', () => ({
  loadMasterRosterReadOnly: mocks.roster,
}));
import { getCurrentMasterRoster } from '../src/services/users-admin';

const user = { uid: 'uid-master-ficticio', email: 'rafael@teias.invalid' };
const auth: { currentUser: typeof user | null } = { currentUser: user };

beforeEach(() => {
  vi.resetAllMocks();
  auth.currentUser = user;
  mocks.app.mockReturnValue({});
  mocks.auth.mockReturnValue(auth);
  mocks.firestore.mockReturnValue({ label: 'db' });
  mocks.roster.mockResolvedValue({
    status: 'ok',
    entries: [],
    activeMembershipCount: 0,
    campaignCount: 0,
  });
});

describe('3.07 — serviço com sessão corrente', () => {
  it('nega sem login antes de acessar Firestore', async () => {
    auth.currentUser = null;
    expect(await getCurrentMasterRoster()).toEqual({ status: 'denied' });
    expect(mocks.firestore).not.toHaveBeenCalled();
    expect(mocks.roster).not.toHaveBeenCalled();
  });

  it('consulta com usuário autenticado sem expor UID no componente', async () => {
    const result = await getCurrentMasterRoster();
    expect(result.status).toBe('ok');
    expect(mocks.roster).toHaveBeenCalledWith(user, { label: 'db' });
  });

  it('descarta os dados da lista quando ocorre logout no meio da consulta', async () => {
    mocks.roster.mockImplementation(async () => {
      auth.currentUser = null;
      return { status: 'ok', entries: [{ key: 'ficticia' }] };
    });
    expect(await getCurrentMasterRoster()).toEqual({ status: 'denied' });
  });

  it('descarta resposta se outra conta assume a sessão', async () => {
    mocks.roster.mockImplementation(async () => {
      auth.currentUser = { uid: 'uid-diferente', email: 'bruno@teias.invalid' };
      return { status: 'ok', entries: [{ key: 'ficticia' }] };
    });
    expect(await getCurrentMasterRoster()).toEqual({ status: 'denied' });
  });
});
