/**
 * Laboratório isolado do 3.07. IDs, campanhas e vínculos abaixo são INVENTADOS.
 * Não importa nem chama Firebase, HTTP, localStorage ou escrita em disco.
 * Esta simulação nunca recebe os vínculos reais carregados do Firestore.
 */
export const SIMULATED_CAMPAIGNS = [
  { key: 'laboratorio-aurora', name: 'Mesa Aurora (fictícia)' },
  { key: 'laboratorio-nevoa', name: 'Mesa Névoa (fictícia)' },
] as const;

export const SIMULATED_USERS = [
  { key: 'rafael', label: 'Rafael', role: 'dm' },
  { key: 'bruno', label: 'Bruno', role: 'player' },
  { key: 'gustavo', label: 'Gustavo', role: 'player' },
  { key: 'leo', label: 'Léo', role: 'player' },
  { key: 'fernanda', label: 'Fernanda', role: 'player' },
] as const;

export type SimulatedMembership = {
  userKey: string;
  campaignKey: string;
  active: boolean;
};

export type SimulatedAction = 'include' | 'suspend' | 'reactivate' | 'remove';
export type SimulatedCommand = {
  userKey: string;
  campaignKey: string;
  action: SimulatedAction;
};
export type SimulatedChange =
  | { status: 'ok'; memberships: readonly SimulatedMembership[]; description: string }
  | { status: 'denied'; reason: string };

export const INITIAL_SIMULATED_MEMBERSHIPS: readonly SimulatedMembership[] = [
  { userKey: 'rafael', campaignKey: 'laboratorio-aurora', active: true },
  { userKey: 'rafael', campaignKey: 'laboratorio-nevoa', active: true },
  { userKey: 'bruno', campaignKey: 'laboratorio-aurora', active: true },
  { userKey: 'gustavo', campaignKey: 'laboratorio-aurora', active: true },
  { userKey: 'leo', campaignKey: 'laboratorio-nevoa', active: true },
  { userKey: 'fernanda', campaignKey: 'laboratorio-nevoa', active: true },
];

/** Purely local, deterministic. Never a Firestore write or mutation. */
export function simulateMembershipChange(
  current: readonly SimulatedMembership[],
  command: SimulatedCommand,
): SimulatedChange {
  const user = SIMULATED_USERS.find((item) => item.key === command.userKey);
  const campaign = SIMULATED_CAMPAIGNS.find((item) => item.key === command.campaignKey);
  if (!user || !campaign || user.role !== 'player') {
    return { status: 'denied', reason: 'A simulação só permite alterar jogadores fictícios.' };
  }
  const index = current.findIndex(
    (item) => item.userKey === command.userKey && item.campaignKey === command.campaignKey,
  );
  const existing = index < 0 ? null : current[index];
  const next = current.map((item) => ({ ...item }));
  let operation: string;
  if (command.action === 'include') {
    if (existing) return { status: 'denied', reason: 'O vínculo fictício já existe.' };
    next.push({ userKey: user.key, campaignKey: campaign.key, active: true });
    operation = 'Inclusão';
  } else if (command.action === 'suspend') {
    if (!existing?.active) return { status: 'denied', reason: 'Não há vínculo ativo para suspender.' };
    next[index] = { ...existing, active: false };
    operation = 'Suspensão';
  } else if (command.action === 'reactivate') {
    if (!existing || existing.active) return { status: 'denied', reason: 'Não há vínculo suspenso para reativar.' };
    next[index] = { ...existing, active: true };
    operation = 'Reativação';
  } else if (command.action === 'remove') {
    if (!existing) return { status: 'denied', reason: 'Não há vínculo fictício para remover.' };
    next.splice(index, 1);
    operation = 'Remoção';
  } else {
    return { status: 'denied', reason: 'Ação de teste inválida.' };
  }

  return {
    status: 'ok',
    memberships: next,
    description: operation + ' simulada: ' + user.label + ' · ' + campaign.name,
  };
}
