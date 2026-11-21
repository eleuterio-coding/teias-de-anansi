import type { Firestore } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  verifyHubRole: vi.fn(),
  getDocFromServer: vi.fn(),
  getDocsFromServer: vi.fn(),
}));

vi.mock('../src/services/firebase/role-access', () => ({
  verifyHubRole: mock.verifyHubRole,
}));
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => ({ name }),
  where: (field: string, op: string, value: string) => ({ field, op, value }),
  query: (source: unknown, condition: unknown) => ({ source, condition }),
  doc: (_db: unknown, ...parts: string[]) => ({ path: parts.join('/') }),
  getDocFromServer: mock.getDocFromServer,
  getDocsFromServer: mock.getDocsFromServer,
}));

import { loadMasterRosterReadOnly } from '../src/services/firebase/users-admin-readonly';

const db = {} as Firestore;
const master = { uid: 'uid-m-ficticio', email: 'rafael@teias.invalid' };
const player = { uid: 'uid-p-ficticio', email: 'gus@teias.invalid' };

const accounts = [
  ['rafael', 'rafael', 'dm', master.uid],
  ['bruno', 'bruno', 'player', 'uid-b-ficticio'],
  ['gustavo', 'gus', 'player', player.uid],
  ['leo', 'leo', 'player', 'uid-l-ficticio'],
  ['fernanda', 'fernanda', 'player', 'uid-f-ficticio'],
] as const;
const links = accounts.flatMap(([username, login, role, uid], index) => {
  const campaigns = index === 0 ? ['mesa-a', 'mesa-b'] : [index < 3 ? 'mesa-a' : 'mesa-b'];
  return campaigns.map((campaignId) => ({
    username,
    role,
    uid,
    email: login + '@teias.invalid',
    active: true,
    campaignId,
    characterId: role === 'dm' ? null : 'char-ficticio',
  }));
});

let campaigns: Record<string, Record<string, unknown>>;
let profiles: Record<string, Record<string, unknown>>;
let memberships: Array<Record<string, unknown>>;

beforeEach(() => {
  vi.resetAllMocks();
  campaigns = {
    'mesa-a': { ownerId: master.uid, name: 'Aventura A fictícia' },
    'mesa-b': { ownerId: master.uid, name: 'Aventura B fictícia' },
  };
  profiles = Object.fromEntries(accounts.map(([username, , role, uid]) => [
    username, { uid, username, role },
  ]));
  memberships = links.map((link) => ({ ...link }));
  mock.verifyHubRole.mockResolvedValue({
    status: 'verified', role: 'dm', displayName: 'Mestre', campaignCount: 2,
  });
  mock.getDocsFromServer.mockImplementation(async ({ source, condition }: {
    source: { name: string };
    condition: { field: string; op: string; value: string };
  }) => {
    if (condition.op !== '==') throw Error('Consulta não filtrada');
    if (source.name === 'users' && condition.field === 'username') {
      return { docs: profiles[condition.value] ? [{
        id: profiles[condition.value].uid,
        data: () => profiles[condition.value],
      }] : [] };
    }
    if (source.name === 'memberships' && condition.field === 'email') {
      return { docs: memberships.filter((link) => link.email === condition.value)
        .map((item) => ({ data: () => item })) };
    }
    throw Error('Listagem geral não autorizada');
  });
  mock.getDocFromServer.mockImplementation(async ({ path }: { path: string }) => {
    const data = campaigns[path.replace(/^campaigns\//, '')];
    return { exists: () => Boolean(data), data: () => data };
  });
});

describe('3.07 — consulta de administração exclusiva do Mestre', () => {
  it('não consulta coleções sem sessão', async () => {
    expect(await loadMasterRosterReadOnly(null, db)).toEqual({ status: 'denied' });
    expect(mock.verifyHubRole).not.toHaveBeenCalled();
    expect(mock.getDocsFromServer).not.toHaveBeenCalled();
  });

  it('nega Jogador mesmo com perfil e vínculo válidos', async () => {
    mock.verifyHubRole.mockResolvedValue({ status: 'verified', role: 'player', campaignCount: 1 });
    expect(await loadMasterRosterReadOnly(player, db)).toEqual({ status: 'denied' });
    expect(mock.getDocsFromServer).not.toHaveBeenCalled();
  });

  it('nega papel não confirmado e erro no verificador', async () => {
    mock.verifyHubRole.mockResolvedValueOnce({ status: 'denied' });
    expect(await loadMasterRosterReadOnly(master, db)).toEqual({ status: 'denied' });
    mock.verifyHubRole.mockResolvedValueOnce({ status: 'unavailable' });
    expect(await loadMasterRosterReadOnly(master, db)).toEqual({ status: 'unavailable' });
  });

  it('consolida cinco contas e seis vínculos, sem retornar UIDs nem emails técnicos', async () => {
    const result = await loadMasterRosterReadOnly(master, db);
    expect(result).toMatchObject({
      status: 'ok', activeMembershipCount: 6, campaignCount: 2,
    });
    if (result.status !== 'ok') throw Error('Inventário esperado');
    expect(result.entries).toHaveLength(5);
    expect(result.entries.map((entry) => entry.displayName)).toEqual([
      'Rafael', 'Bruno', 'Gustavo', 'Léo', 'Fernanda',
    ]);
    expect(result.entries[0]).toMatchObject({ role: 'dm' });
    expect(result.entries[0].memberships).toHaveLength(2);
    expect(result.entries[1].memberships).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain('uid-');
    expect(JSON.stringify(result)).not.toContain('@teias.invalid');
    expect(JSON.stringify(result)).not.toContain('mesa-a');
  });

  it('executa buscas específicas por username e email, sem listar coleções inteiras', async () => {
    await loadMasterRosterReadOnly(master, db);
    expect(mock.getDocsFromServer).toHaveBeenCalledTimes(10);
    expect(mock.getDocsFromServer).toHaveBeenCalledWith({
      source: { name: 'users' },
      condition: { field: 'username', op: '==', value: 'gustavo' },
    });
    expect(mock.getDocsFromServer).toHaveBeenCalledWith({
      source: { name: 'memberships' },
      condition: { field: 'email', op: '==', value: 'gus@teias.invalid' },
    });
    expect(mock.getDocFromServer).toHaveBeenCalledTimes(2);
  });

  it('não mostra lista parcial se perfil não existir', async () => {
    delete profiles.fernanda;
    expect(await loadMasterRosterReadOnly(master, db)).toEqual({ status: 'incomplete' });
  });

  it('não confia em role alterado ou UID de perfil divergente', async () => {
    profiles.gustavo.role = 'dm';
    expect(await loadMasterRosterReadOnly(master, db)).toEqual({ status: 'incomplete' });
    profiles.gustavo.role = 'player';
    profiles.gustavo.uid = 'uid-alheio';
    expect(await loadMasterRosterReadOnly(master, db)).toEqual({ status: 'incomplete' });
  });

  it('não mostra vínculos contraditórios ou de campanha alheia', async () => {
    memberships[2].uid = 'uid-errado';
    expect(await loadMasterRosterReadOnly(master, db)).toEqual({ status: 'incomplete' });
    memberships = links.map((link) => ({ ...link }));
    campaigns['mesa-b'].ownerId = 'uid-outro';
    expect(await loadMasterRosterReadOnly(master, db)).toEqual({ status: 'incomplete' });
  });

  it('falha fechada para permission-denied e falha de rede', async () => {
    mock.getDocsFromServer.mockRejectedValueOnce({ code: 'permission-denied' });
    expect(await loadMasterRosterReadOnly(master, db)).toEqual({ status: 'denied' });
    mock.getDocsFromServer.mockRejectedValueOnce({ code: 'unavailable' });
    expect(await loadMasterRosterReadOnly(master, db)).toEqual({ status: 'unavailable' });
  });

  it('considera memberships suspensas sem tratá-las como ativas', async () => {
    memberships[1].active = false;
    const result = await loadMasterRosterReadOnly(master, db);
    expect(result).toMatchObject({ status: 'ok', activeMembershipCount: 5 });
  });
});
