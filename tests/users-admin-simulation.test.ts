import { describe, expect, it } from 'vitest';
import {
  INITIAL_SIMULATED_MEMBERSHIPS,
  simulateMembershipChange,
} from '../src/services/users-admin-simulation';

describe('3.07 — simulação de gerenciamento sem escrita remota', () => {
  it('suspende e reativa vínculo exclusivamente no novo estado local', () => {
    const first = simulateMembershipChange(INITIAL_SIMULATED_MEMBERSHIPS, {
      userKey: 'bruno',
      campaignKey: 'laboratorio-aurora',
      action: 'suspend',
    });
    expect(first.status).toBe('ok');
    if (first.status !== 'ok') throw Error('simulação não gerada');
    expect(first.memberships.find((link) => link.userKey === 'bruno')?.active).toBe(false);
    expect(INITIAL_SIMULATED_MEMBERSHIPS.find((link) => link.userKey === 'bruno')?.active).toBe(
      true,
    );
    const second = simulateMembershipChange(first.memberships, {
      userKey: 'bruno',
      campaignKey: 'laboratorio-aurora',
      action: 'reactivate',
    });
    expect(second.status).toBe('ok');
    if (second.status === 'ok') {
      expect(second.memberships.find((link) => link.userKey === 'bruno')?.active).toBe(true);
    }
  });

  it('inclui e remove vínculo inventado sem tocar no Mestre', () => {
    const first = simulateMembershipChange(INITIAL_SIMULATED_MEMBERSHIPS, {
      userKey: 'bruno',
      campaignKey: 'laboratorio-nevoa',
      action: 'include',
    });
    expect(first.status).toBe('ok');
    if (first.status !== 'ok') throw Error('simulação não gerada');
    expect(first.memberships).toHaveLength(INITIAL_SIMULATED_MEMBERSHIPS.length + 1);
    const result = simulateMembershipChange(first.memberships, {
      userKey: 'bruno',
      campaignKey: 'laboratorio-nevoa',
      action: 'remove',
    });
    expect(result.status).toBe('ok');
    if (result.status === 'ok') expect(result.memberships).toHaveLength(6);
  });

  it('nega ações sobre Mestre e IDs/campanhas inventados por entrada externa', () => {
    for (const action of ['include', 'suspend', 'reactivate', 'remove'] as const) {
      expect(
        simulateMembershipChange(INITIAL_SIMULATED_MEMBERSHIPS, {
          userKey: 'rafael',
          campaignKey: 'laboratorio-aurora',
          action,
        }).status,
      ).toBe('denied');
    }
    expect(
      simulateMembershipChange(INITIAL_SIMULATED_MEMBERSHIPS, {
        userKey: 'uid-intruso',
        campaignKey: 'laboratorio-nevoa',
        action: 'include',
      }).status,
    ).toBe('denied');
    expect(
      simulateMembershipChange(INITIAL_SIMULATED_MEMBERSHIPS, {
        userKey: 'bruno',
        campaignKey: 'mesa-real-injetada',
        action: 'include',
      }).status,
    ).toBe('denied');
  });

  it('nega duplicação, suspensão repetida e reativação de vínculo ativo', () => {
    expect(
      simulateMembershipChange(INITIAL_SIMULATED_MEMBERSHIPS, {
        userKey: 'bruno',
        campaignKey: 'laboratorio-aurora',
        action: 'include',
      }).status,
    ).toBe('denied');
    expect(
      simulateMembershipChange(INITIAL_SIMULATED_MEMBERSHIPS, {
        userKey: 'bruno',
        campaignKey: 'laboratorio-nevoa',
        action: 'suspend',
      }).status,
    ).toBe('denied');
    expect(
      simulateMembershipChange(INITIAL_SIMULATED_MEMBERSHIPS, {
        userKey: 'bruno',
        campaignKey: 'laboratorio-aurora',
        action: 'reactivate',
      }).status,
    ).toBe('denied');
  });
});
