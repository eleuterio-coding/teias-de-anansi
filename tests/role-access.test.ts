import type { Firestore } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const io = vi.hoisted(() => ({
  getDocFromServer: vi.fn(),
  getDocsFromServer: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...segments: string[]) => ({ path: segments.join('/') }),
  collection: (_db: unknown, name: string) => ({ name }),
  where: (field: string, op: string, value: string) => ({ field, op, value }),
  query: (base: unknown, constraint: unknown) => ({ base, constraint }),
  getDocFromServer: io.getDocFromServer,
  getDocsFromServer: io.getDocsFromServer,
}));

import { verifyHubRole } from '../src/services/firebase/role-access';

const db = {} as Firestore;
const master = { uid: 'uid-m', email: 'rafael@teias.invalid' };
const player = { uid: 'uid-p', email: 'gus@teias.invalid' };

let profiles: Record<string, Record<string, unknown>>;
let campaigns: Record<string, Record<string, unknown>>;
let links: Record<string, Record<string, unknown>[]>;

function membership(
  email: string,
  role: string,
  username: string,
  uid: string,
  campaignId: string,
  active = true,
) {
  return { email, role, username, uid, campaignId, active };
}

beforeEach(() => {
  profiles = {
    'uid-m': { uid: 'uid-m', username: 'rafael', role: 'dm', displayName: 'Rafael' },
    'uid-p': { uid: 'uid-p', username: 'gustavo', role: 'player', displayName: 'Gustavo' },
  };
  campaigns = {
    'mesa-1': { ownerId: 'uid-m' },
    'mesa-2': { ownerId: 'uid-m' },
  };
  links = {
    'rafael@teias.invalid': [
      membership('rafael@teias.invalid', 'dm', 'rafael', 'uid-m', 'mesa-1'),
      membership('rafael@teias.invalid', 'dm', 'rafael', 'uid-m', 'mesa-2'),
    ],
    'gus@teias.invalid': [membership('gus@teias.invalid', 'player', 'gustavo', '', 'mesa-1')],
  };

  io.getDocFromServer.mockReset();
  io.getDocsFromServer.mockReset();
  io.getDocFromServer.mockImplementation(async (reference: { path: string }) => {
    const key = reference.path;
    const data = key.startsWith('users/')
      ? profiles[key.slice('users/'.length)]
      : key.startsWith('campaigns/')
        ? campaigns[key.slice('campaigns/'.length)]
        : undefined;
    return {
      exists: () => Boolean(data),
      data: () => data,
    };
  });
  io.getDocsFromServer.mockImplementation(
    async (reference: { constraint: { field: string; op: string; value: string } }) => {
      const { field, op, value } = reference.constraint;
      if (field !== 'email' || op !== '==') throw new Error('Consulta ampla proibida');
      return {
        docs: (links[value] ?? []).map((data) => ({
          data: () => data,
        })),
      };
    },
  );
});

describe('Etapa 3.04 — papel confirmado por Auth e Firestore', () => {
  it('reconhece Mestre somente com perfil, memberships e ownership coincidentes', async () => {
    await expect(verifyHubRole(master, db)).resolves.toEqual({
      status: 'verified',
      role: 'dm',
      displayName: 'Rafael',
      campaignCount: 2,
    });
    expect(io.getDocFromServer).toHaveBeenCalledTimes(3);
    expect(io.getDocsFromServer).toHaveBeenCalledTimes(1);
  });

  it('reconhece Jogador pela conta existente, perfil e membership ativa', async () => {
    await expect(verifyHubRole(player, db)).resolves.toEqual({
      status: 'verified',
      role: 'player',
      displayName: 'Gustavo',
      campaignCount: 1,
    });
    expect(io.getDocFromServer).toHaveBeenCalledTimes(1);
    expect(io.getDocsFromServer).toHaveBeenCalledTimes(1);
  });

  it('aceita username técnico Gus como alias em membership, sem conceder role por nome', async () => {
    links['gus@teias.invalid'][0].username = 'gus';
    await expect(verifyHubRole(player, db)).resolves.toMatchObject({
      status: 'verified',
      role: 'player',
    });
  });

  it('nega visitante e conta que não é uma das cinco sem consultar Firestore', async () => {
    await expect(verifyHubRole(null, db)).resolves.toEqual({
      status: 'denied',
      reason: 'no-session',
    });
    await expect(verifyHubRole({ uid: 'any', email: 'outro@teias.invalid' }, db)).resolves.toEqual({
      status: 'denied',
      reason: 'unknown-account',
    });
    expect(io.getDocFromServer).not.toHaveBeenCalled();
    expect(io.getDocsFromServer).not.toHaveBeenCalled();
  });

  it('nega perfil ausente, UID divergente ou username substituído', async () => {
    delete profiles['uid-p'];
    await expect(verifyHubRole(player, db)).resolves.toMatchObject({
      status: 'denied',
      reason: 'missing-profile',
    });
    profiles['uid-p'] = { uid: 'uid-alheio', role: 'player', username: 'gustavo' };
    await expect(verifyHubRole(player, db)).resolves.toMatchObject({
      status: 'denied',
      reason: 'profile-mismatch',
    });
    profiles['uid-p'].uid = 'uid-p';
    profiles['uid-p'].username = 'rafael';
    await expect(verifyHubRole(player, db)).resolves.toMatchObject({
      status: 'denied',
      reason: 'profile-mismatch',
    });
  });

  it('não promove Jogador a Mestre ao modificar apenas seu role de perfil', async () => {
    profiles['uid-p'].role = 'dm';
    await expect(verifyHubRole(player, db)).resolves.toEqual({
      status: 'denied',
      reason: 'master-not-confirmed',
    });
  });

  it('não promove Jogador com membership dm incompatível', async () => {
    links['gus@teias.invalid'][0].role = 'dm';
    await expect(verifyHubRole(player, db)).resolves.toEqual({
      status: 'denied',
      reason: 'membership-mismatch',
    });
  });

  it('nega Mestre se perfil e membership coincidirem, mas ownerId for de outra pessoa', async () => {
    campaigns['mesa-2'].ownerId = 'uid-p';
    await expect(verifyHubRole(master, db)).resolves.toEqual({
      status: 'denied',
      reason: 'master-not-confirmed',
    });
  });

  it('nega papel quando não há membership ativa ou seu UID é de outra conta', async () => {
    links['gus@teias.invalid'][0].active = false;
    await expect(verifyHubRole(player, db)).resolves.toEqual({
      status: 'denied',
      reason: 'missing-membership',
    });
    links['gus@teias.invalid'][0].active = true;
    links['gus@teias.invalid'][0].uid = 'uid-diferente';
    await expect(verifyHubRole(player, db)).resolves.toEqual({
      status: 'denied',
      reason: 'membership-mismatch',
    });
  });

  it('nega membership ativa misturada com role inconsistente', async () => {
    links['gus@teias.invalid'].push(
      membership('gus@teias.invalid', 'dm', 'gustavo', 'uid-p', 'mesa-2'),
    );
    await expect(verifyHubRole(player, db)).resolves.toEqual({
      status: 'denied',
      reason: 'membership-mismatch',
    });
  });

  it('retira privilégio ao reler servidor após revogação de vínculo', async () => {
    await expect(verifyHubRole(player, db)).resolves.toMatchObject({ status: 'verified' });
    links['gus@teias.invalid'][0].active = false;
    await expect(verifyHubRole(player, db)).resolves.toMatchObject({
      status: 'denied',
      reason: 'missing-membership',
    });
    expect(io.getDocsFromServer).toHaveBeenCalledTimes(2);
  });

  it('não confia em dados do cache: erros de permissão e rede nunca concedem papel', async () => {
    io.getDocFromServer.mockRejectedValue({ code: 'permission-denied', details: 'privado' });
    await expect(verifyHubRole(master, db)).resolves.toEqual({ status: 'unavailable' });
    io.getDocFromServer.mockReset();
    io.getDocsFromServer.mockRejectedValue({ code: 'unavailable' });
    await expect(verifyHubRole(player, db)).resolves.toEqual({ status: 'unavailable' });
  });

  it('não usa displayName como papel, nome inválido recebe fallback', async () => {
    profiles['uid-p'].displayName = '\u0001Nome inválido';
    await expect(verifyHubRole(player, db)).resolves.toMatchObject({
      status: 'verified',
      role: 'player',
      displayName: 'Gustavo',
    });
  });
});
