import { describe, expect, it } from 'vitest';
import { resolveFirebaseWebConfig } from '../src/services/firebase/config';

const example = {
  VITE_FIREBASE_API_KEY: 'exemplo-publico-nao-real',
  VITE_FIREBASE_AUTH_DOMAIN: 'projeto-de-teste.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'projeto-de-teste',
  VITE_FIREBASE_APP_ID: '1:123:web:teste-ficticio',
};

describe('Configuracao publica do Firebase', () => {
  it('nao ativa integracao quando nao ha variaveis', () => {
    const result = resolveFirebaseWebConfig({});
    expect(result.status).toBe('unconfigured');
    if (result.status !== 'unconfigured') throw new Error('Estado inesperado');
    expect(result.missing).toHaveLength(4);
  });

  it('nao ativa integracao com configuracao incompleta', () => {
    const result = resolveFirebaseWebConfig({
      VITE_FIREBASE_PROJECT_ID: 'teais-de-anansi',
      VITE_FIREBASE_API_KEY: 'nao-real',
    });
    expect(result.status).toBe('incomplete');
    if (result.status !== 'incomplete') throw new Error('Estado inesperado');
    expect(result.missing).toContain('VITE_FIREBASE_AUTH_DOMAIN');
    expect(result.missing).toContain('VITE_FIREBASE_APP_ID');
    expect(JSON.stringify(result)).not.toContain('nao-real');
  });

  it('aceita os quatro campos publicos obrigatorios sem acesso ao Firebase', () => {
    const result = resolveFirebaseWebConfig(example);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('Estado inesperado');
    expect(result.options.projectId).toBe('projeto-de-teste');
    expect(result.options.apiKey).toBe('exemplo-publico-nao-real');
    expect(result.options.storageBucket).toBeUndefined();
  });

  it('nao inclui dados administrativos, de contas ou senhas do ambiente', () => {
    const result = resolveFirebaseWebConfig({
      ...example,
      FIREBASE_ADMIN_PRIVATE_KEY: 'SEGREDO',
      FIREBASE_AUTH_PASSWORD: 'SENHA',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
      VITE_FIREBASE_STORAGE_BUCKET: 'bucket-publico',
    });
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('Estado inesperado');
    expect(result.options.messagingSenderId).toBe('123');
    expect(result.options.storageBucket).toBe('bucket-publico');
    expect(JSON.stringify(result)).not.toContain('SEGREDO');
    expect(JSON.stringify(result)).not.toContain('SENHA');
  });

  it('ignora valores nao textuais e apenas espacos', () => {
    const result = resolveFirebaseWebConfig({
      ...example,
      VITE_FIREBASE_APP_ID: '  ',
      VITE_FIREBASE_API_KEY: 1234,
    });
    expect(result.status).toBe('incomplete');
    if (result.status !== 'incomplete') throw new Error('Estado inesperado');
    expect(result.missing).toContain('VITE_FIREBASE_API_KEY');
    expect(result.missing).toContain('VITE_FIREBASE_APP_ID');
  });
});
