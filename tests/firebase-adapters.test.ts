import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  getApps: vi.fn(),
  initializeApp: vi.fn(),
  getAuth: vi.fn(),
  getFirestore: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  getApps: mocked.getApps,
  initializeApp: mocked.initializeApp,
}));

vi.mock('firebase/auth', () => ({
  getAuth: mocked.getAuth,
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: mocked.getFirestore,
}));

import { HUB_FIREBASE_APP_NAME, prepareHubFirebaseApp } from '../src/services/firebase/app';
import { prepareHubAuth } from '../src/services/firebase/auth';
import { prepareHubFirestore } from '../src/services/firebase/firestore';

const options: FirebaseOptions = {
  projectId: 'projeto-ficticio',
  apiKey: 'publico-ficticio',
  authDomain: 'projeto-ficticio.firebaseapp.com',
  appId: '1:0:web:fake',
};

const app = { name: HUB_FIREBASE_APP_NAME, options } as FirebaseApp;

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getApps.mockReturnValue([]);
  mocked.initializeApp.mockReturnValue(app);
});

describe('Adaptadores Firebase sem acesso real', () => {
  it('nao inicializa nada apenas ao importar os adaptadores', () => {
    expect(mocked.initializeApp).not.toHaveBeenCalled();
    expect(mocked.getAuth).not.toHaveBeenCalled();
    expect(mocked.getFirestore).not.toHaveBeenCalled();
  });

  it('cria um aplicativo nomeado somente por chamada explicita', () => {
    const result = prepareHubFirebaseApp(options);
    expect(result).toBe(app);
    expect(mocked.initializeApp).toHaveBeenCalledWith(options, HUB_FIREBASE_APP_NAME);
    expect(mocked.getAuth).not.toHaveBeenCalled();
    expect(mocked.getFirestore).not.toHaveBeenCalled();
  });

  it('reutiliza o mesmo aplicativo sem recriar instancias', () => {
    mocked.getApps.mockReturnValue([app]);
    expect(prepareHubFirebaseApp(options)).toBe(app);
    expect(mocked.initializeApp).not.toHaveBeenCalled();
  });

  it('impede silenciosa troca de projeto ou credenciais publicas', () => {
    mocked.getApps.mockReturnValue([app]);
    expect(() => prepareHubFirebaseApp({ ...options, projectId: 'outro-projeto' })).toThrow(
      'Projeto Firebase divergente',
    );
    expect(mocked.initializeApp).not.toHaveBeenCalled();
  });

  it('rejeita parametros incompletos sem inicializar', () => {
    expect(() => prepareHubFirebaseApp({ ...options, apiKey: '' })).toThrow('incompleta');
    expect(mocked.initializeApp).not.toHaveBeenCalled();
  });

  it('exige chamada explicita para obter Auth e Firestore', () => {
    prepareHubAuth(app);
    prepareHubFirestore(app);
    expect(mocked.getAuth).toHaveBeenCalledWith(app);
    expect(mocked.getFirestore).toHaveBeenCalledWith(app);
    expect(mocked.initializeApp).not.toHaveBeenCalled();
  });
});
