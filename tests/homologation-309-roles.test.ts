import type { Firestore } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const io = vi.hoisted(() => ({
  getDocFromServer: vi.fn(),
  getDocsFromServer: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...parts: string[]) => ({ path: parts.join('/') }),
  collection: (_db: unknown, name: string) => ({ name }),
  where: (field: string, operator: string, value: string) => ({ field, operator, value }),
  query: (source: unknown, condition: unknown) => ({ source, condition }),
  getDocFromServer: io.getDocFromServer,
  getDocsFromServer: io.getDocsFromServer,
}));

import { verifyHubRole } from '../src/services/firebase/role-access';
import {
  technicalEmailForUsername,
  readableHubAuthError,
} from '../src/services/firebase/auth-session';

const db = {} as Firestore;
const fixtures = [
  { uid: 'uid-mestre-demo', username: 'rafael', email: 'rafael@teias.invalid', role: 'dm' },
  { uid: 'uid-bruno-demo', username: 'bruno', email: 'bruno@teias.invalid', role: 'player' },
  { uid: 'uid-gustavo-demo', username: 'gustavo', email: 'gus@teias.invalid', role: 'player' },
  { uid: 'uid-leo-demo', username: 'leo', email: 'leo@teias.invalid', role: 'player' },
  {
    uid: 'uid-fernanda-demo',
    username: 'fernanda',
    email: 'fernanda@teias.invalid',
    role: 'player',
  },
] as const;

let profileData: Record<string, Record<string, unknown>>;
let links: Record<string, Record<string, unknown>[]>;
let campaigns: Record<string, Record<string, unknown>>;

beforeEach(() => {
  vi.resetAllMocks();
  profileData = Object.fromEntries(
    fixtures.map((item) => [item.uid, { uid: item.uid, username: item.username, role: item.role }]),
  );
  campaigns = { 'mesa-ficticia': { ownerId: fixtures[0].uid } };
  links = Object.fromEntries(
    fixtures.map((item) => [
      item.email,
      [
        {
          uid: item.uid,
          email: item.email,
          username: item.username,
          role: item.role,
          campaignId: 'mesa-ficticia',
          active: true,
        },
      ],
    ]),
  );
  io.getDocFromServer.mockImplementation(async ({ path }: { path: string }) => {
    const record = path.startsWith('users/')
      ? profileData[path.slice('users/'.length)]
      : campaigns[path.slice('campaigns/'.length)];
    return { exists: () => Boolean(record), data: () => record };
  });
  io.getDocsFromServer.mockImplementation(
    async ({
      source,
      condition,
    }: {
      source: { name: string };
      condition: { field: string; operator: string; value: string };
    }) => {
      if (
        source.name !== 'memberships' ||
        !['email', 'uid'].includes(condition.field) ||
        condition.operator !== '=='
      ) {
        throw new Error('Consulta de colecao sem filtro autorizado');
      }
      const matched =
        condition.field === 'email'
          ? links[condition.value] ?? []
          : Object.values(links)
              .flat()
              .filter((link) => link.uid === condition.value);
      return { docs: matched.map((data) => ({ data: () => data })) };
    },
  );
});

describe('3.09 — matriz sintetica de cinco identidades, sem senhas', () => {
  it.each(fixtures)(
    '$username mapeia Auth, perfil e vinculo ao papel esperado',
    async ({ uid, email, role, username }) => {
      const result = await verifyHubRole({ uid, email }, db);
      expect(result).toMatchObject({
        status: 'verified',
        role,
        campaignCount: 1,
      });
      expect(technicalEmailForUsername(username)).toBe(email);
    },
  );

  it('o apelido Gustavo/Gus usa a mesma identidade técnica sem criar outra conta', () => {
    expect(technicalEmailForUsername('gustavo')).toBe('gus@teias.invalid');
    expect(technicalEmailForUsername('gus')).toBe('gus@teias.invalid');
  });

  it('nome historico nao concede papel quando o perfil diverge', async () => {
    profileData[fixtures[1].uid].role = 'dm';
    const result = await verifyHubRole({ uid: fixtures[1].uid, email: fixtures[1].email }, db);
    expect(result.status).toBe('denied');
  });

  it('Mestre precisa manter propriedade da campanha verificada', async () => {
    campaigns['mesa-ficticia'].ownerId = fixtures[1].uid;
    expect(
      await verifyHubRole({ uid: fixtures[0].uid, email: fixtures[0].email }, db),
    ).toMatchObject({ status: 'denied', reason: 'master-not-confirmed' });
  });

  it('vinculo inativo bloqueia papel ate nova confirmacao', async () => {
    links[fixtures[2].email][0].active = false;
    expect(
      await verifyHubRole({ uid: fixtures[2].uid, email: fixtures[2].email }, db),
    ).toMatchObject({ status: 'denied', reason: 'missing-membership' });
  });

  it('falha de rede nao concede papel nem mostra caminhos internos', async () => {
    io.getDocFromServer.mockRejectedValue(new Error('users/uid-secreto'));
    expect(await verifyHubRole({ uid: fixtures[0].uid, email: fixtures[0].email }, db)).toEqual({
      status: 'unavailable',
    });
  });

  it('erro de senha ou rede tem mensagem generica segura', () => {
    expect(readableHubAuthError({ code: 'auth/invalid-credential' })).toBe(
      'Usuário ou senha incorretos.',
    );
    expect(readableHubAuthError({ code: 'auth/network-request-failed' })).toBe(
      'Não foi possível conectar. Confira sua internet e tente novamente.',
    );
    expect(readableHubAuthError({ code: 'auth/unknown-secret' })).toBe(
      'Não foi possível concluir o acesso agora. Tente novamente.',
    );
  });
});
