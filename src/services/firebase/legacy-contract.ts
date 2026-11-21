import type { FirebaseWebConfigState } from './config';

/**
 * Contrato historico recuperado do Hub anterior, nao um retrato do Firebase ativo.
 * Nunca usar expectedRole ou username para conceder permissoes: a autorizacao
 * de dados depende da identidade autenticada e das regras do Firestore.
 */
export const HISTORICAL_FIREBASE_PROJECT_ID = 'teais-de-anansi';
export const HISTORICAL_FIREBASE_AUTH_DOMAIN = 'teais-de-anansi.firebaseapp.com';
export const HISTORICAL_FIREBASE_USERNAME_DOMAIN = 'teias.invalid';

export const HISTORICAL_HUB_IDENTITIES = [
  { username: 'rafael', authUsername: 'rafael', displayName: 'Rafael', expectedRole: 'dm' },
  { username: 'bruno', authUsername: 'bruno', displayName: 'Bruno', expectedRole: 'player' },
  { username: 'gustavo', authUsername: 'gus', displayName: 'Gustavo', expectedRole: 'player' },
  { username: 'leo', authUsername: 'leo', displayName: 'Léo', expectedRole: 'player' },
  { username: 'fernanda', authUsername: 'fernanda', displayName: 'Fernanda', expectedRole: 'player' },
] as const;

export type HistoricalHubIdentity = (typeof HISTORICAL_HUB_IDENTITIES)[number];

/** Identidade prevista na documentacao, sem provar existencia no Authentication. */
export function findHistoricalHubIdentity(value: string): HistoricalHubIdentity | null {
  const normalized = value.trim().toLowerCase();
  return (
    HISTORICAL_HUB_IDENTITIES.find(
      (item) => item.username === normalized || item.authUsername === normalized,
    ) ?? null
  );
}

export type HistoricalFirebaseCheck =
  | { status: 'unconfigured' | 'incomplete'; missing: readonly string[] }
  | { status: 'different-project'; field: 'projectId' | 'authDomain' }
  | { status: 'matches-history'; projectId: typeof HISTORICAL_FIREBASE_PROJECT_ID };

/**
 * Comparacao puramente local. matches-history NAO indica que o projeto remoto,
 * suas cinco contas ou suas regras implantadas foram verificados.
 */
export function checkHistoricalFirebaseConfig(
  config: FirebaseWebConfigState,
): HistoricalFirebaseCheck {
  if (config.status !== 'ready') {
    return { status: config.status, missing: config.missing };
  }
  if (config.options.projectId !== HISTORICAL_FIREBASE_PROJECT_ID) {
    return { status: 'different-project', field: 'projectId' };
  }
  if (config.options.authDomain !== HISTORICAL_FIREBASE_AUTH_DOMAIN) {
    return { status: 'different-project', field: 'authDomain' };
  }
  return { status: 'matches-history', projectId: HISTORICAL_FIREBASE_PROJECT_ID };
}
