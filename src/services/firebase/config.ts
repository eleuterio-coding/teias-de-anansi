import type { FirebaseOptions } from 'firebase/app';

export const REQUIRED_FIREBASE_ENV_FIELDS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

type RequiredKey = (typeof REQUIRED_FIREBASE_ENV_FIELDS)[number];

export type FirebaseWebConfigState =
  | { status: 'unconfigured'; missing: readonly RequiredKey[] }
  | { status: 'incomplete'; missing: readonly RequiredKey[] }
  | { status: 'ready'; options: FirebaseOptions };

function readPublicValue(env: Record<string, unknown>, name: string): string | undefined {
  const value = env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Avalia somente identificadores PUBLICOS do app Web.
 * Nunca conecta, autentica ou consulta o Firebase.
 */
export function resolveFirebaseWebConfig(env: Record<string, unknown>): FirebaseWebConfigState {
  const missing = REQUIRED_FIREBASE_ENV_FIELDS.filter((key) => !readPublicValue(env, key));
  if (missing.length > 0) {
    return {
      status: missing.length === REQUIRED_FIREBASE_ENV_FIELDS.length ? 'unconfigured' : 'incomplete',
      missing,
    };
  }

  // Os campos exigidos foram verificados acima; ! permanece restrito a essa validacao.
  const options: FirebaseOptions = {
    apiKey: readPublicValue(env, 'VITE_FIREBASE_API_KEY')!,
    authDomain: readPublicValue(env, 'VITE_FIREBASE_AUTH_DOMAIN')!,
    projectId: readPublicValue(env, 'VITE_FIREBASE_PROJECT_ID')!,
    appId: readPublicValue(env, 'VITE_FIREBASE_APP_ID')!,
  };

  const messagingSenderId = readPublicValue(env, 'VITE_FIREBASE_MESSAGING_SENDER_ID');
  const storageBucket = readPublicValue(env, 'VITE_FIREBASE_STORAGE_BUCKET');
  if (messagingSenderId) options.messagingSenderId = messagingSenderId;
  if (storageBucket) options.storageBucket = storageBucket;

  return { status: 'ready', options };
}

/** Nao invocar no bootstrap ate a Etapa 3 (autenticacao aprovada). */
export function getConfiguredFirebaseWebOptions(): FirebaseWebConfigState {
  return resolveFirebaseWebConfig(import.meta.env);
}
