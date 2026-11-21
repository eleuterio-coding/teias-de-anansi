import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import { verifyHubRole } from './role-access';

export type HubReadRequest =
  | { kind: 'own-profile' }
  | { kind: 'own-membership' | 'campaign' | 'own-character'; campaignId: string }
  | { kind: 'character'; campaignId: string; documentId: string }
  | {
      kind: 'shared' | 'session' | 'adventureView' | 'private' | 'adventure';
      campaignId: string;
      documentId: string;
    };

export type HubReadResult =
  | { status: 'ok'; data: Record<string, unknown> }
  | { status: 'denied' | 'missing' | 'unavailable' };

export type HubOwnAccessResult =
  | { status: 'ok'; activeCampaigns: number }
  | { status: 'denied' | 'unavailable' };

type AuthIdentity = Pick<User, 'uid' | 'email'>;
type Membership = Record<string, unknown>;

const safeSegment = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= 1400 &&
  value.trim() === value &&
  value !== '.' &&
  value !== '..' &&
  !value.includes('/') &&
  !value.includes('\\');

const identityEmail = (user: AuthIdentity) => (user.email ?? '').trim().toLowerCase();
const matchesUid = (member: Membership, uid: string) =>
  member.uid === undefined || member.uid === '' || member.uid === uid;

/**
 * Apenas consulta filtrada pelo email autenticado, nunca listagem geral de
 * perfis, vínculos ou personagens. Requer Firestore servidor, sem cache offline.
 */
async function ownMemberships(user: AuthIdentity, db: Firestore) {
  const results = await getDocsFromServer(
    query(collection(db, 'memberships'), where('email', '==', identityEmail(user))),
  );
  return results.docs
    .map((snapshot) => snapshot.data() as Membership)
    .filter(
      (member) =>
        member.email === identityEmail(user) &&
        member.active === true &&
        matchesUid(member, user.uid),
    );
}

async function verifiedRole(user: AuthIdentity, db: Firestore) {
  const access = await verifyHubRole(user, db);
  return access.status === 'verified' ? access : null;
}

const statusForError = (error: unknown): { status: 'denied' | 'unavailable' } => {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  return code === 'permission-denied' ? { status: 'denied' } : { status: 'unavailable' };
};

/**
 * Serviço de leitura com escopo: o caller nunca fornece outro UID ou
 * nome de usuário. IDs de sessão/aventura do jogador são conferidos contra
 * seu vínculo ativo ANTES de consultar o documento solicitado.
 *
 * A defesa final deve continuar nas Rules do servidor. Até sua publicação,
 * esta camada evita que a UI explore permissões excessivas do legado.
 */
export async function readHubScopedDocument(
  user: AuthIdentity | null,
  db: Firestore,
  request: HubReadRequest,
): Promise<HubReadResult> {
  if (!user?.uid || !user.email) return { status: 'denied' };
  if ('campaignId' in request && !safeSegment(request.campaignId)) return { status: 'denied' };
  if ('documentId' in request && !safeSegment(request.documentId)) return { status: 'denied' };

  try {
    const role = await verifiedRole(user, db);
    if (!role) return { status: 'denied' };

    if (request.kind === 'own-profile') {
      const snapshot = await getDocFromServer(doc(db, 'users', user.uid));
      return snapshot.exists() ? { status: 'ok', data: snapshot.data() } : { status: 'missing' };
    }

    const memberships = await ownMemberships(user, db);
    const membership = memberships.find(
      (candidate) => candidate.campaignId === request.campaignId && candidate.role === role.role,
    );
    if (!membership) return { status: 'denied' };

    if (request.kind === 'own-membership') {
      // Retorna apenas o vínculo do próprio usuário; jamais o de terceiros.
      return { status: 'ok', data: membership };
    }

    const campaign = await getDocFromServer(doc(db, 'campaigns', request.campaignId));
    if (!campaign.exists()) return { status: 'missing' };
    if (role.role === 'dm' && campaign.data().ownerId !== user.uid) return { status: 'denied' };
    if (request.kind === 'campaign') return { status: 'ok', data: campaign.data() };

    let path: string[];
    if (request.kind === 'own-character') {
      const id = membership.characterId;
      if (role.role !== 'player' || !safeSegment(id)) return { status: 'denied' };
      path = ['campaigns', request.campaignId, 'characters', id];
    } else {
      if (role.role === 'player') {
        if (
          request.kind === 'private' ||
          request.kind === 'adventure' ||
          request.kind === 'character'
        )
          return { status: 'denied' };
        if (
          request.kind === 'session' &&
          !(
            Array.isArray(membership.sessionIds) &&
            membership.sessionIds.includes(request.documentId)
          )
        ) {
          return { status: 'denied' };
        }
        if (
          request.kind === 'adventureView' &&
          !(
            Array.isArray(membership.adventureIds) &&
            membership.adventureIds.includes(request.documentId)
          )
        ) {
          return { status: 'denied' };
        }
      }
      const group =
        request.kind === 'adventure'
          ? 'adventures'
          : request.kind === 'session'
            ? 'sessions'
            : request.kind === 'adventureView'
              ? 'adventureViews'
              : request.kind === 'character'
                ? 'characters'
                : request.kind;
      if (!('documentId' in request)) return { status: 'denied' };
      path = ['campaigns', request.campaignId, group, request.documentId];
    }

    const snapshot = await getDocFromServer(doc(db, path.join('/')));
    if (!snapshot.exists()) return { status: 'missing' };
    const data = snapshot.data() as Record<string, unknown>;

    if (request.kind === 'own-character') {
      if (data.ownerUid !== user.uid || data.characterId !== membership.characterId)
        return { status: 'denied' };
    }

    return { status: 'ok', data };
  } catch (error) {
    return statusForError(error);
  }
}

/** Ação de UI sem ID arbitrário e sem retorno de conteúdo privado. */
export async function checkOwnCampaignAccess(
  user: AuthIdentity | null,
  db: Firestore,
): Promise<HubOwnAccessResult> {
  if (!user?.uid || !user.email) return { status: 'denied' };
  try {
    const role = await verifiedRole(user, db);
    if (!role) return { status: 'denied' };
    const memberships = await ownMemberships(user, db);
    const active = memberships.filter(
      (member) => member.role === role.role && safeSegment(member.campaignId),
    );
    if (active.length !== role.campaignCount) return { status: 'denied' };

    // Não devolver IDs, nomes de campanhas, fichas ou payload.
    for (const membership of active) {
      const campaign = await getDocFromServer(
        doc(db, 'campaigns', membership.campaignId as string),
      );
      if (!campaign.exists()) return { status: 'denied' };
      if (role.role === 'dm' && campaign.data().ownerId !== user.uid) return { status: 'denied' };
    }
    return { status: 'ok', activeCampaigns: active.length };
  } catch (error) {
    return statusForError(error);
  }
}
