import type { Firestore } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getDocFromServer: vi.fn(),
  getDocsFromServer: vi.fn(),
  verifyHubRole: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...segments: string[]) => ({ path: segments.join('/') }),
  collection: (_db: unknown, name: string) => ({ name }),
  where: (field: string, operator: string, value: string) => ({ field, operator, value }),
  query: (source: unknown, condition: unknown) => ({ source, condition }),
  getDocFromServer: mocks.getDocFromServer,
  getDocsFromServer: mocks.getDocsFromServer,
}));
vi.mock('../src/services/firebase/role-access', () => ({
  verifyHubRole: mocks.verifyHubRole,
}));

import {
  readHubScopedDocument,
  checkOwnCampaignAccess,
} from '../src/services/firebase/scoped-access';

const db = {} as Firestore;
const gus = { uid: 'uid-gus-fixture', email: 'gus@teias.invalid' };
const master = { uid: 'uid-master-fixture', email: 'rafael@teias.invalid' };
const member = {
  uid: '', email: gus.email, active: true, role: 'player',
  campaignId: 'mesa-ficticia', characterId: 'char-gus',
  sessionIds: ['sess-gus'], adventureIds: ['adv-gus'],
};
let documents: Record<string, Record<string, unknown>>;
let memberships: Array<Record<string, unknown>>;

beforeEach(() => {
  vi.resetAllMocks();
  documents = {
    'users/uid-gus-fixture': { uid: gus.uid, username: 'gustavo', role: 'player' },
    'campaigns/mesa-ficticia': { ownerId: master.uid },
    'campaigns/mesa-ficticia/characters/char-gus': {
      characterId: 'char-gus', ownerUid: gus.uid, displayName: 'Ficha fictícia',
    },
    'campaigns/mesa-ficticia/characters/char-bruno': {
      characterId: 'char-bruno', ownerUid: 'uid-bruno',
    },
    'campaigns/mesa-ficticia/sessions/sess-gus': { ficticia: true },
    'campaigns/mesa-ficticia/sessions/sess-bruno': { ficticia: true },
    'campaigns/mesa-ficticia/adventureViews/adv-gus': { ficticia: true },
    'campaigns/mesa-ficticia/private/secret': { segredo: 'ficticio' },
  };
  memberships = [{ ...member, sessionIds: [...member.sessionIds], adventureIds: [...member.adventureIds] }];
  mocks.verifyHubRole.mockResolvedValue({
    status: 'verified', role: 'player', displayName: 'Gustavo', campaignCount: 1,
  });
  mocks.getDocFromServer.mockImplementation(async ({ path }: { path: string }) => ({
    exists: () => Boolean(documents[path]),
    data: () => documents[path],
  }));
  mocks.getDocsFromServer.mockImplementation(
    async ({ source, condition }: { source: { name: string }, condition: { field: string, value: string } }) => {
      if (source.name !== 'memberships' || condition.field !== 'email')
        throw new Error('Listagem geral indevida');
      return { docs: memberships.filter((x) => x.email === condition.value).map((data) => ({ data: () => data })) };
    },
  );
});

describe('3.06 — consultas restritas à sessão e vínculo ativo', () => {
  it('nega sessão ausente sem consultar Firestore', async () => {
    expect(await readHubScopedDocument(null, db, { kind: 'own-profile' })).toEqual({ status: 'denied' });
    expect(mocks.getDocsFromServer).not.toHaveBeenCalled();
    expect(mocks.getDocFromServer).not.toHaveBeenCalled();
  });

  it('consulta somente perfil do UID corrente, nunca um UID fornecido na URL', async () => {
    const result = await readHubScopedDocument(gus, db, { kind: 'own-profile' });
    expect(result).toMatchObject({ status: 'ok', data: { uid: gus.uid } });
    expect(mocks.getDocFromServer).toHaveBeenCalledWith({ path: 'users/' + gus.uid });
    expect(mocks.getDocsFromServer).not.toHaveBeenCalled();
  });

  it('consulta memberships com filtro obrigatório pelo email autenticado', async () => {
    await readHubScopedDocument(gus, db, { kind: 'own-membership', campaignId: 'mesa-ficticia' });
    expect(mocks.getDocsFromServer).toHaveBeenCalledWith({
      source: { name: 'memberships' },
      condition: { field: 'email', operator: '==', value: gus.email },
    });
  });

  it('não permite leitura de outra campanha sem vínculo', async () => {
    const result = await readHubScopedDocument(gus, db, { kind: 'campaign', campaignId: 'outra-mesa' });
    expect(result).toEqual({ status: 'denied' });
    expect(mocks.getDocFromServer).not.toHaveBeenCalled();
  });

  it('resolve a própria ficha pelo vínculo, sem receber ID arbitrário', async () => {
    const result = await readHubScopedDocument(gus, db, { kind: 'own-character', campaignId: 'mesa-ficticia' });
    expect(result).toMatchObject({ status: 'ok', data: { characterId: 'char-gus' } });
    expect(mocks.getDocFromServer).toHaveBeenCalledWith({
      path: 'campaigns/mesa-ficticia/characters/char-gus',
    });
    expect(mocks.getDocFromServer).not.toHaveBeenCalledWith({
      path: 'campaigns/mesa-ficticia/characters/char-bruno',
    });
  });

  it('nega ficha com ownerUid de outro jogador mesmo se o path for atribuído', async () => {
    documents['campaigns/mesa-ficticia/characters/char-gus'].ownerUid = 'uid-bruno';
    expect(await readHubScopedDocument(gus, db, { kind: 'own-character', campaignId: 'mesa-ficticia' }))
      .toEqual({ status: 'denied' });
  });

  it('nega sessões e aventuras não atribuídas ANTES de consultar documentos', async () => {
    expect(await readHubScopedDocument(gus, db, {
      kind: 'session', campaignId: 'mesa-ficticia', documentId: 'sess-bruno',
    })).toEqual({ status: 'denied' });
    expect(await readHubScopedDocument(gus, db, {
      kind: 'adventureView', campaignId: 'mesa-ficticia', documentId: 'adv-bruno',
    })).toEqual({ status: 'denied' });
    expect(mocks.getDocFromServer).not.toHaveBeenCalledWith({
      path: 'campaigns/mesa-ficticia/sessions/sess-bruno',
    });
  });

  it('permite sessão e projeção de aventura atribuídas sem listar coleções', async () => {
    expect(await readHubScopedDocument(gus, db, {
      kind: 'session', campaignId: 'mesa-ficticia', documentId: 'sess-gus',
    })).toMatchObject({ status: 'ok' });
    expect(await readHubScopedDocument(gus, db, {
      kind: 'adventureView', campaignId: 'mesa-ficticia', documentId: 'adv-gus',
    })).toMatchObject({ status: 'ok' });
    expect(mocks.getDocFromServer).toHaveBeenCalledWith({
      path: 'campaigns/mesa-ficticia/sessions/sess-gus',
    });
    expect(mocks.getDocFromServer).toHaveBeenCalledWith({
      path: 'campaigns/mesa-ficticia/adventureViews/adv-gus',
    });
  });

  it('bloqueia privados e aventuras completas antes da leitura para jogador', async () => {
    expect(await readHubScopedDocument(gus, db, {
      kind: 'private', campaignId: 'mesa-ficticia', documentId: 'secret',
    })).toEqual({ status: 'denied' });
    expect(await readHubScopedDocument(gus, db, {
      kind: 'adventure', campaignId: 'mesa-ficticia', documentId: 'segredo',
    })).toEqual({ status: 'denied' });
    expect(mocks.getDocFromServer).not.toHaveBeenCalledWith({
      path: 'campaigns/mesa-ficticia/private/secret',
    });
  });

  it('Mestre só lê privado com papel validado e ownerId correspondente', async () => {
    mocks.verifyHubRole.mockResolvedValue({ status: 'verified', role: 'dm', displayName: 'Mestre', campaignCount: 1 });
    memberships = [{ email: master.email, uid: master.uid, active: true, role: 'dm', campaignId: 'mesa-ficticia' }];
    const result = await readHubScopedDocument(master, db, {
      kind: 'private', campaignId: 'mesa-ficticia', documentId: 'secret',
    });
    expect(result).toMatchObject({ status: 'ok', data: { segredo: 'ficticio' } });
    documents['campaigns/mesa-ficticia'].ownerId = 'uid-outro';
    expect(await readHubScopedDocument(master, db, {
      kind: 'private', campaignId: 'mesa-ficticia', documentId: 'secret',
    })).toEqual({ status: 'denied' });
  });

  it('revogação do vínculo impede nova leitura e nova ação', async () => {
    memberships[0].active = false;
    expect(await readHubScopedDocument(gus, db, {
      kind: 'campaign', campaignId: 'mesa-ficticia',
    })).toEqual({ status: 'denied' });
    expect(await checkOwnCampaignAccess(gus, db)).toEqual({ status: 'denied' });
  });

  it('a ação da interface devolve contagem, nunca conteúdo das campanhas', async () => {
    expect(await checkOwnCampaignAccess(gus, db)).toEqual({
      status: 'ok', activeCampaigns: 1,
    });
    expect(mocks.getDocsFromServer).toHaveBeenCalledWith({
      source: { name: 'memberships' },
      condition: { field: 'email', operator: '==', value: gus.email },
    });
  });

  it('não consulta paths inválidos ou IDs com separadores', async () => {
    expect(await readHubScopedDocument(gus, db, {
      kind: 'session', campaignId: '../mesa', documentId: 'sess-gus',
    })).toEqual({ status: 'denied' });
    expect(await readHubScopedDocument(gus, db, {
      kind: 'session', campaignId: 'mesa-ficticia', documentId: 'sub/outro',
    })).toEqual({ status: 'denied' });
    expect(mocks.getDocFromServer).not.toHaveBeenCalled();
  });

  it('falha de permissão ou rede nunca devolve payload', async () => {
    mocks.getDocsFromServer.mockRejectedValueOnce({ code: 'permission-denied' });
    expect(await readHubScopedDocument(gus, db, {
      kind: 'own-membership', campaignId: 'mesa-ficticia',
    })).toEqual({ status: 'denied' });
    mocks.getDocsFromServer.mockRejectedValueOnce({ code: 'unavailable' });
    expect(await checkOwnCampaignAccess(gus, db)).toEqual({ status: 'unavailable' });
  });

  it('não concede escopo se papel do perfil não foi validado', async () => {
    mocks.verifyHubRole.mockResolvedValue({ status: 'denied', reason: 'profile-mismatch' });
    expect(await readHubScopedDocument(gus, db, { kind: 'own-profile' })).toEqual({ status: 'denied' });
    expect(mocks.getDocFromServer).not.toHaveBeenCalled();
  });
});
