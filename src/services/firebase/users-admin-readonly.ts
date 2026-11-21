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
import {
  HISTORICAL_FIREBASE_USERNAME_DOMAIN,
  HISTORICAL_HUB_IDENTITIES,
} from './legacy-contract';
import { verifyHubRole } from './role-access';

type AuthIdentity = Pick<User, 'uid' | 'email'>;

export type MasterRosterEntry = {
  key: string;
  displayName: string;
  role: 'dm' | 'player';
  memberships: readonly {
    campaign: string;
    active: boolean;
    hasCharacter: boolean;
  }[];
};

export type MasterRosterResult =
  | {
      status: 'ok';
      entries: readonly MasterRosterEntry[];
      activeMembershipCount: number;
      campaignCount: number;
    }
  | { status: 'denied' | 'incomplete' | 'unavailable' };

const safeId = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length < 1024 &&
  value.trim() === value &&
  value !== '.' &&
  value !== '..' &&
  !value.includes('/') &&
  !value.includes('\\');

const normalized = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

/**
 * 3.07 — leitura administrativa estritamente pelo Mestre autenticado.
 * A lista de identidades do contrato serve apenas como filtro de busca;
 * NÃO atribui papel ou autoridade a ninguém. O papel efetivo é confirmado
 * por Auth + perfil + memberships + ownerId no serviço 3.04.
 *
 * Não importa funções de escrita nem lê Firebase Authentication Admin API.
 * Não devolve UID, emails técnicos ou IDs reais ao componente da UI.
 */
export async function loadMasterRosterReadOnly(
  user: AuthIdentity | null,
  db: Firestore,
): Promise<MasterRosterResult> {
  if (!user?.uid || !user.email) return { status: 'denied' };
  try {
    const access = await verifyHubRole(user, db);
    if (access.status === 'unavailable') return { status: 'unavailable' };
    if (access.status !== 'verified' || access.role !== 'dm') return { status: 'denied' };

    // Limite de escopo: uma consulta por identidade conhecida, nunca
    // listagem de toda a coleção de usuários.
    const details = [];
    for (const identity of HISTORICAL_HUB_IDENTITIES) {
      const profiles = await getDocsFromServer(
        query(collection(db, 'users'), where('username', '==', identity.username)),
      );
      if (profiles.docs.length !== 1) return { status: 'incomplete' };
      const profileDoc = profiles.docs[0];
      const profile = profileDoc.data();
      if (
        !safeId(profileDoc.id) ||
        profile.uid !== profileDoc.id ||
        normalized(profile.username) !== identity.username ||
        profile.role !== identity.expectedRole
      ) {
        return { status: 'incomplete' };
      }

      const email = identity.authUsername + '@' + HISTORICAL_FIREBASE_USERNAME_DOMAIN;
      const memberships = await getDocsFromServer(
        query(collection(db, 'memberships'), where('email', '==', email)),
      );
      const relations = [];
      for (const link of memberships.docs) {
        const data = link.data();
        if (
          normalized(data.email) !== email ||
          !safeId(data.campaignId) ||
          data.role !== identity.expectedRole ||
          (data.uid && data.uid !== profileDoc.id) ||
          ![identity.username, identity.authUsername].includes(normalized(data.username) as typeof identity.username)
        ) {
          return { status: 'incomplete' };
        }
        relations.push({
          campaignId: data.campaignId as string,
          active: data.active === true,
          hasCharacter: safeId(data.characterId),
        });
      }
      details.push({ identity, relations });
    }

    // Nome de campanha é obtido apenas de documentos que pertencem ao
    // Mestre atual. Nunca exponha IDs privados, mesmo quando falta nome.
    const campaignIds = [...new Set(details.flatMap((item) =>
      item.relations.map((relation) => relation.campaignId),
    ))];
    const campaigns = new Map<string, string>();
    for (const [index, id] of campaignIds.entries()) {
      const campaign = await getDocFromServer(doc(db, 'campaigns', id));
      if (!campaign.exists() || campaign.data().ownerId !== user.uid)
        return { status: 'incomplete' };
      const name = campaign.data().name;
      campaigns.set(id,
        typeof name === 'string' && name.trim() && name.trim().length <= 90
          ? name.trim()
          : 'Campanha ' + (index + 1),
      );
    }

    const entries: MasterRosterEntry[] = details.map(({ identity, relations }) => ({
      key: identity.username,
      displayName: identity.displayName,
      role: identity.expectedRole,
      memberships: relations.map((relation) => ({
        campaign: campaigns.get(relation.campaignId) ?? 'Campanha sem identificação',
        active: relation.active,
        hasCharacter: relation.hasCharacter,
      })),
    }));

    const activeMembershipCount = entries.reduce(
      (count, entry) => count + entry.memberships.filter((member) => member.active).length,
      0,
    );
    return { status: 'ok', entries, activeMembershipCount, campaignCount: campaignIds.length };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'permission-denied'
    ) return { status: 'denied' };
    return { status: 'unavailable' };
  }
}
