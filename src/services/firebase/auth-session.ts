import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  findHistoricalHubIdentity,
  HISTORICAL_FIREBASE_USERNAME_DOMAIN,
} from './legacy-contract';

/** Identidade autenticada; papel e permissoes serao validados no item 3.04. */
export type HubSessionIdentity = {
  uid: string;
  username: string | null;
  displayName: string;
  knownAccount: boolean;
};

export type HubAuthDriver = {
  observe(
    onSession: (user: HubSessionIdentity | null) => void,
    onFailure: (message: string) => void,
  ): () => void;
  signIn(username: string, password: string): Promise<void>;
  signOut(): Promise<void>;
};

export class HubAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HubAuthError';
  }
}

/** O formulario nunca pede e-mail; nao aceita domínios arbitrarios nem cadastra contas. */
export function technicalEmailForUsername(input: string): string | null {
  const account = findHistoricalHubIdentity(input);
  return account ? account.authUsername + '@' + HISTORICAL_FIREBASE_USERNAME_DOMAIN : null;
}

/** O nome de exibicao e apenas informativo; nunca concede papel de Mestre. */
export function identityFromAuthenticatedUser(user: Pick<User, 'uid' | 'email'>): HubSessionIdentity {
  const suffix = '@' + HISTORICAL_FIREBASE_USERNAME_DOMAIN;
  const email = (user.email ?? '').trim().toLowerCase();
  const account = email.endsWith(suffix)
    ? findHistoricalHubIdentity(email.slice(0, -suffix.length))
    : null;
  return {
    uid: user.uid,
    username: account?.username ?? null,
    displayName: account?.displayName ?? 'Conta autenticada',
    knownAccount: Boolean(account),
  };
}

/** Mensagens seguras: nao vazar email tecnico, UID, configuracao ou stack do SDK. */
export function readableHubAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Usuário ou senha incorretos.';
    case 'auth/user-disabled':
      return 'Este acesso está desativado. Fale com o Mestre.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas de entrada. Tente novamente mais tarde.';
    case 'auth/network-request-failed':
      return 'Não foi possível conectar. Confira sua internet e tente novamente.';
    case 'auth/unauthorized-domain':
    case 'auth/operation-not-allowed':
      return 'O acesso online está indisponível nesta instalação do Hub.';
    default:
      return 'Não foi possível concluir o acesso agora. Tente novamente.';
  }
}

export function createHubAuthDriver(auth: Auth): HubAuthDriver {
  return {
    observe(onSession, onFailure) {
      // O próprio Firebase restaura a sessao local ao carregar a pagina.
      return onAuthStateChanged(
        auth,
        (user) => onSession(user ? identityFromAuthenticatedUser(user) : null),
        (error) => onFailure(readableHubAuthError(error)),
      );
    },
    async signIn(username, password) {
      if (!username.trim() || !password) {
        throw new HubAuthError('Informe seu usuário e sua senha.');
      }
      const email = technicalEmailForUsername(username);
      if (!email) throw new HubAuthError('Usuário ou senha incorretos.');
      try {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        throw new HubAuthError(readableHubAuthError(error));
      }
    },
    async signOut() {
      try {
        await signOut(auth);
      } catch (error) {
        throw new HubAuthError(readableHubAuthError(error));
      }
    },
  };
}
