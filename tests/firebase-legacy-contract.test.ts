import { describe, expect, it } from 'vitest';
import { resolveFirebaseWebConfig } from '../src/services/firebase/config';
import {
  HISTORICAL_FIREBASE_PROJECT_ID,
  HISTORICAL_HUB_IDENTITIES,
  checkHistoricalFirebaseConfig,
  findHistoricalHubIdentity,
} from '../src/services/firebase/legacy-contract';

const example = {
  VITE_FIREBASE_API_KEY: 'chave-publica-ficticia',
  VITE_FIREBASE_AUTH_DOMAIN: 'teais-de-anansi.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'teais-de-anansi',
  VITE_FIREBASE_APP_ID: '1:0:web:apenas-exemplo',
};

describe('Contrato historico, offline, sem acessar usuarios reais', () => {
  it('registra exatamente um Mestre e quatro Jogadores', () => {
    expect(HISTORICAL_HUB_IDENTITIES).toHaveLength(5);
    expect(HISTORICAL_HUB_IDENTITIES.filter((item) => item.expectedRole === 'dm')).toHaveLength(1);
    expect(
      HISTORICAL_HUB_IDENTITIES.filter((item) => item.expectedRole === 'player'),
    ).toHaveLength(4);
  });

  it('preserva o alias historico do login de Gustavo', () => {
    expect(findHistoricalHubIdentity('Gus')?.username).toBe('gustavo');
    expect(findHistoricalHubIdentity('gustavo')?.authUsername).toBe('gus');
    expect(findHistoricalHubIdentity('desconhecido')).toBeNull();
  });

  it('nao tenta verificar projeto sem configuracao', () => {
    expect(checkHistoricalFirebaseConfig(resolveFirebaseWebConfig({}))).toMatchObject({
      status: 'unconfigured',
    });
  });

  it('rejeita configuracao parcialmente preenchida', () => {
    expect(
      checkHistoricalFirebaseConfig(
        resolveFirebaseWebConfig({ VITE_FIREBASE_PROJECT_ID: HISTORICAL_FIREBASE_PROJECT_ID }),
      ),
    ).toMatchObject({ status: 'incomplete' });
  });

  it('recusa substituicao silenciosa por outro projeto', () => {
    expect(
      checkHistoricalFirebaseConfig(
        resolveFirebaseWebConfig({ ...example, VITE_FIREBASE_PROJECT_ID: 'teias-de-anansi' }),
      ),
    ).toEqual({ status: 'different-project', field: 'projectId' });
  });

  it('recusa authDomain divergente mesmo com projeto correto', () => {
    expect(
      checkHistoricalFirebaseConfig(
        resolveFirebaseWebConfig({
          ...example,
          VITE_FIREBASE_AUTH_DOMAIN: 'outro.firebaseapp.com',
        }),
      ),
    ).toEqual({ status: 'different-project', field: 'authDomain' });
  });

  it('distingue coerencia documental de verificacao remota', () => {
    expect(
      checkHistoricalFirebaseConfig(resolveFirebaseWebConfig(example)),
    ).toEqual({ status: 'matches-history', projectId: HISTORICAL_FIREBASE_PROJECT_ID });
  });
});
