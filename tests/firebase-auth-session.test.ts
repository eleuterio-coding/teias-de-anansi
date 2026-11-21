import type { Auth } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  setPersistence: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  browserLocalPersistence: { type: 'LOCAL' },
  onAuthStateChanged: mocked.onAuthStateChanged,
  setPersistence: mocked.setPersistence,
  signInWithEmailAndPassword: mocked.signInWithEmailAndPassword,
  signOut: mocked.signOut,
}));

import {
  createHubAuthDriver,
  HubAuthError,
  identityFromAuthenticatedUser,
  readableHubAuthError,
  technicalEmailForUsername,
} from '../src/services/firebase/auth-session';
import { HUB_EXISTING_FIREBASE_WEB_OPTIONS } from '../src/services/firebase/public-web-options';

const auth = { name: 'auth-simulado' } as unknown as Auth;

beforeEach(() => {
  vi.resetAllMocks();
  mocked.setPersistence.mockResolvedValue(undefined);
  mocked.signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'uid-ficticio' } });
  mocked.signOut.mockResolvedValue(undefined);
  mocked.onAuthStateChanged.mockReturnValue(vi.fn());
});

describe('Etapa 3.03 — autenticação existente sem cadastro', () => {
  it('reutiliza a identidade real do projeto e do aplicativo Web, sem segredos administrativos', () => {
    expect(HUB_EXISTING_FIREBASE_WEB_OPTIONS.projectId).toBe('teais-de-anansi');
    expect(HUB_EXISTING_FIREBASE_WEB_OPTIONS.authDomain).toBe('teais-de-anansi.firebaseapp.com');
    expect(HUB_EXISTING_FIREBASE_WEB_OPTIONS.appId).toBe(
      '1:900723445313:web:274b847b3f3145a76c40c0',
    );
    expect(JSON.stringify(HUB_EXISTING_FIREBASE_WEB_OPTIONS)).not.toContain('private_key');
  });

  it.each([
    ['rafael', 'rafael'],
    ['bruno', 'bruno'],
    ['Gustavo', 'gus'],
    ['GUS', 'gus'],
    ['leo', 'leo'],
    ['fernanda', 'fernanda'],
  ])('usa login antigo %s como %s sem exigir email real', (username, technical) => {
    expect(technicalEmailForUsername(username)).toBe(technical + '@teias.invalid');
  });

  it('não encaminha email arbitrário ou nome desconhecido ao SDK', async () => {
    expect(technicalEmailForUsername('outro')).toBeNull();
    expect(technicalEmailForUsername('usuario@dominio.com')).toBeNull();
    const driver = createHubAuthDriver(auth);
    await expect(driver.signIn('inexistente', 'senha-ficticia')).rejects.toThrow(
      'Usuário ou senha incorretos',
    );
    expect(mocked.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('exige usuario e senha sem tentar conexao', async () => {
    const driver = createHubAuthDriver(auth);
    await expect(driver.signIn('  ', 'senha')).rejects.toThrow('Informe seu usuário');
    await expect(driver.signIn('rafael', '')).rejects.toThrow('Informe seu usuário');
    expect(mocked.setPersistence).not.toHaveBeenCalled();
  });

  it('configura persistencia local antes de autenticar com a senha recebida', async () => {
    const driver = createHubAuthDriver(auth);
    await driver.signIn(' Gustavo ', 'senha-exemplo');
    expect(mocked.setPersistence).toHaveBeenCalledWith(auth, { type: 'LOCAL' });
    expect(mocked.signInWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      'gus@teias.invalid',
      'senha-exemplo',
    );
    expect(mocked.setPersistence.mock.invocationCallOrder[0]).toBeLessThan(
      mocked.signInWithEmailAndPassword.mock.invocationCallOrder[0],
    );
  });

  it('não executa signIn antes da persistencia ter sido confirmada', async () => {
    mocked.setPersistence.mockRejectedValue({ code: 'auth/network-request-failed' });
    const driver = createHubAuthDriver(auth);
    await expect(driver.signIn('bruno', 'exemplo')).rejects.toThrow('Confira sua internet');
    expect(mocked.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('converte erros de credencial sem revelar existencia de contas', async () => {
    mocked.signInWithEmailAndPassword.mockRejectedValue({
      code: 'auth/invalid-credential',
      email: 'privado@teias.invalid',
      message: 'mensagem interna sensivel',
    });
    await expect(createHubAuthDriver(auth).signIn('gus', 'errada')).rejects.toThrow(
      'Usuário ou senha incorretos.',
    );
  });

  it('trata bloqueio, tentativas excessivas e rede com mensagens apropriadas', () => {
    expect(readableHubAuthError({ code: 'auth/user-disabled' })).toContain('desativado');
    expect(readableHubAuthError({ code: 'auth/too-many-requests' })).toContain('Muitas');
    expect(readableHubAuthError({ code: 'auth/network-request-failed' })).toContain('internet');
    expect(readableHubAuthError({ code: 'auth/unauthorized-domain' })).toContain('indisponível');
    expect(readableHubAuthError(new Error('detalhe interno privado'))).not.toContain('privado');
  });

  it('restaura sessão via observador Firebase e permite cancelar a assinatura', () => {
    const stop = vi.fn();
    mocked.onAuthStateChanged.mockReturnValue(stop);
    const onSession = vi.fn();
    const onError = vi.fn();
    const driver = createHubAuthDriver(auth);
    const unsubscribe = driver.observe(onSession, onError);
    expect(mocked.onAuthStateChanged).toHaveBeenCalledWith(
      auth,
      expect.any(Function),
      expect.any(Function),
    );
    const [, changed, failed] = mocked.onAuthStateChanged.mock.calls[0];
    changed({ uid: 'uid-simulado', email: 'gus@teias.invalid' });
    expect(onSession).toHaveBeenCalledWith({
      uid: 'uid-simulado',
      username: 'gustavo',
      displayName: 'Gustavo',
      knownAccount: true,
    });
    changed(null);
    expect(onSession).toHaveBeenLastCalledWith(null);
    failed({ code: 'auth/network-request-failed' });
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('internet'));
    unsubscribe();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('não concede papel nem reconhece e-mails de fora da lista histórica', () => {
    expect(identityFromAuthenticatedUser({ uid: 'fic', email: 'outro@exemplo.com' })).toEqual({
      uid: 'fic',
      username: null,
      displayName: 'Conta autenticada',
      knownAccount: false,
    });
  });

  it('encerra sessao usando o Auth original, sem gravar Firestore', async () => {
    await createHubAuthDriver(auth).signOut();
    expect(mocked.signOut).toHaveBeenCalledWith(auth);
  });

  it('trata falha no logout sem dizer que a sessao terminou', async () => {
    mocked.signOut.mockRejectedValue({ code: 'auth/network-request-failed' });
    await expect(createHubAuthDriver(auth).signOut()).rejects.toBeInstanceOf(HubAuthError);
    expect(mocked.signOut).toHaveBeenCalledTimes(1);
  });
});
