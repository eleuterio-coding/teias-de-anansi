import type { FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Adaptador lazy: obter o objeto Firestore nao consulta colecoes.
 * Leitura, escrita e regras de seguranca ficam para a Etapa 3.
 */
export function prepareHubFirestore(app: FirebaseApp): Firestore {
  return getFirestore(app);
}
