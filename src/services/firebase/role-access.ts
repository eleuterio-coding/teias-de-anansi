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
  findHistoricalHubIdentity,
} from './legacy-contract';

export type HubRole = 'dm' | 'player';

export type HubRoleAccess =
  | {
      status: 'verified';
      role: HubRole;
      displayName: string;
      campaignCount: number;
    }
  | {
      status: 'denied';
      reason:
        | 'no-session'
        | 'unknown-account'
        | 'missing-profile'
        | 'profile-mismatch'
        | 'missing-membership'
        | 'membership-mismatch'
        | 'master-not-confirmed';
    }
  | { status: 'unavailable' };

type AuthenticatedIdentity = Pick<User, 'uid' | 'email'>;

const trim = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const lower = (value: unknown): string => trim(value).toLowerCase();
const denied = (reason: Extract<HubRoleAccess, { status: 'denied' }>['reason']): HubRoleAccess => ({
  status: 'denied',
  reason,
});

/**
 * Esta e apenas a identidade da conta Mestre existente, tambem usada nas
 * Security Rules publicadas. So restringe a elegibilidade; NUNCA concede
 * privilegio so por username, email, displayName ou role no perfil.
 */
const MASTER_LOGIN = 'rafael@teias.invalid';

/**
 * Verifica a sessao contra dados remotos. Nao escreve perfis, roles ou vinculos.
 * Leituras de servidor evitam que uma autorizacao antiga seja inferida do cache.
 *
 * A verificacao de autorizacao DEFINITIVA e feita pelas Firestore Rules (3.05).
 * Retornar `verified` controla somente a interface, nao concede capacidades.
 */
export async function verifyHubRole(
  user: AuthenticatedIdentity | null,
  db: Firestore,
): Promise<HubRoleAccess> {
  if (!user?.uid || !user.email) return denied('no-session');
  const email = lower(user.email);
  const suffix = '@' + HISTORICAL_FIREBASE_USERNAME_DOMAIN;
  const account = email.endsWith(suffix)
    ? findHistoricalHubIdentity(email.slice(0, -suffix.length))
    : null;
  if (!account || email !== account.authUsername + suffix) return denied('unknown-account');
  const acceptedUsernames: readonly string[] = [account.username, account.authUsername];

  try {
    const profileSnapshot = await getDocFromServer(doc(db, 'users', user.uid));
    if (!profileSnapshot.exists()) return denied('missing-profile');
    const profile = profileSnapshot.data();
    const role = profile.role;
    if (
      trim(profile.uid) !== user.uid ||
      !acceptedUsernames.includes(lower(profile.username)) ||
      (role !== 'dm' && role !== 'player')
    ) {
      return denied('profile-mismatch');
    }

    // O campo role em /users/{uid} e editavel pelo proprio usuario nas
    // regras legadas. A verificacao cruza dados de memberships e propriedade,
    // e nao permite a um Jogador tornar-se Mestre alterando so o perfil.
    if (role === 'dm' && email !== MASTER_LOGIN) return denied('master-not-confirmed');

    const membershipSnapshot = await getDocsFromServer(
      query(collection(db, 'memberships'), where('email', '==', email)),
    );
    const memberships = membershipSnapshot.docs.map((entry) => entry.data());
    const active = memberships.filter((member) => member.active === true);
    if (active.length === 0) return denied('missing-membership');

    for (const member of active) {
      if (
        lower(member.email) !== email ||
        trim(member.campaignId).length === 0 ||
        trim(member.role) !== role ||
        (trim(member.uid).length > 0 && trim(member.uid) !== user.uid) ||
        !acceptedUsernames.includes(lower(member.username))
      ) {
        return denied('membership-mismatch');
      }
    }

    if (role === 'dm') {
      // Nao basta role:'dm' no perfil, nem uma membership dm criada em
      // campanha de terceiro: confirmar que o UID possui as campanhas.
      for (const member of active) {
        const campaignSnapshot = await getDocFromServer(
          doc(db, 'campaigns', trim(member.campaignId)),
        );
        if (!campaignSnapshot.exists() || campaignSnapshot.data().ownerId !== user.uid) {
          return denied('master-not-confirmed');
        }
      }
    }

    const savedName = trim(profile.displayName);
    const displayName =
      savedName.length > 0 && savedName.length <= 80 && !/[\u0000-\u001f\u007f]/.test(savedName)
        ? savedName
        : account.displayName;

    return {
      status: 'verified',
      role,
      displayName,
      campaignCount: active.length,
    };
  } catch {
    // Falta de rede, permission-denied, conflito de cache etc.: fail closed.
    // Nao mostrar caminhos de documentos ou dados da campanha ao usuario.
    return { status: 'unavailable' };
  }
}
