import {
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';

export const HUB_FIREBASE_APP_NAME = 'teias-de-anansi-hub';

/**
 * Inicializacao por chamada explicita, sem comportamento no import.
 * Nenhuma conta, regra ou documento e lido ou modificado por esta funcao.
 */
export function prepareHubFirebaseApp(options: FirebaseOptions): FirebaseApp {
  if (!options.apiKey || !options.projectId || !options.appId || !options.authDomain) {
    throw new Error('Configuracao publica do Firebase incompleta.');
  }

  const existing = getApps().find((app) => app.name === HUB_FIREBASE_APP_NAME);
  if (existing) {
    for (const key of ['apiKey', 'authDomain', 'projectId', 'appId'] as const) {
      if (existing.options[key] !== options[key]) {
        throw new Error('Projeto Firebase divergente da instancia existente; nenhuma troca executada.');
      }
    }
    return existing;
  }

  return initializeApp(options, HUB_FIREBASE_APP_NAME);
}
