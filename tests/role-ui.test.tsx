import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { HubAuthDriver, HubSessionIdentity } from '../src/services/session';

const mock = vi.hoisted(() => ({
  getHubAuthSession: vi.fn(),
  getHubRoleForCurrentSession: vi.fn(),
}));

vi.mock('../src/services/session', () => ({
  getHubAuthSession: mock.getHubAuthSession,
  HubAuthError: class HubAuthError extends Error {},
}));
vi.mock('../src/services/role-access', () => ({
  getHubRoleForCurrentSession: mock.getHubRoleForCurrentSession,
}));

import LoginPage from '../src/app/pages/LoginPage';

let notify: (user: HubSessionIdentity | null) => void;
let driver: HubAuthDriver;

function mount() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}
const master: HubSessionIdentity = {
  uid: 'uid-master-simulado',
  username: 'rafael',
  displayName: 'Rafael',
  knownAccount: true,
};
const player: HubSessionIdentity = {
  uid: 'uid-player-simulado',
  username: 'gustavo',
  displayName: 'Gustavo',
  knownAccount: true,
};
const verifiedMaster = { status: 'verified', role: 'dm', displayName: 'Rafael', campaignCount: 2 };
const verifiedPlayer = {
  status: 'verified',
  role: 'player',
  displayName: 'Gustavo',
  campaignCount: 1,
};

beforeEach(() => {
  driver = {
    observe: vi.fn((onSession) => {
      notify = onSession;
      return vi.fn();
    }),
    signIn: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
  mock.getHubAuthSession.mockReturnValue(driver);
  mock.getHubRoleForCurrentSession.mockResolvedValue({
    status: 'denied',
    reason: 'missing-profile',
  });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('3.04 — UI condicionada a perfil autorizado', () => {
  it('mostra apenas áreas do Mestre após verificação real simulada', async () => {
    mock.getHubRoleForCurrentSession.mockResolvedValue(verifiedMaster);
    mount();
    act(() => notify(master));
    expect(await screen.findByText(/Perfil confirmado:/)).toBeDefined();
    expect(screen.getByText('Mestre')).toBeDefined();
    expect(screen.getByRole('navigation', { name: 'Ações do Mestre' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Abrir Campanhas' }).getAttribute('href')).toBe(
      '/campanhas',
    );
    expect(screen.queryByRole('navigation', { name: 'Ações do Jogador' })).toBeNull();
    expect(mock.getHubRoleForCurrentSession).toHaveBeenCalledWith(master.uid);
  });

  it('mostra apenas áreas de Jogador após perfil e membership verificados', async () => {
    mock.getHubRoleForCurrentSession.mockResolvedValue(verifiedPlayer);
    mount();
    act(() => notify(player));
    expect(await screen.findByText('Jogador')).toBeDefined();
    expect(screen.getByRole('navigation', { name: 'Ações do Jogador' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Abrir Área do jogador' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Abrir Campanhas' })).toBeNull();
  });

  it('nunca permite área específica só pelo username da sessão', async () => {
    mock.getHubRoleForCurrentSession.mockResolvedValue({
      status: 'denied',
      reason: 'profile-mismatch',
    });
    mount();
    act(() => notify(master));
    expect(await screen.findByText(/Nenhuma permissão foi concedida/)).toBeDefined();
    expect(screen.queryByRole('navigation', { name: 'Ações do Mestre' })).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Ações do Jogador' })).toBeNull();
  });

  it('falha de rede suspende acesso mas mantém saída e nova verificação disponíveis', async () => {
    mock.getHubRoleForCurrentSession.mockResolvedValue({ status: 'unavailable' });
    mount();
    act(() => notify(player));
    expect(await screen.findByText(/Acesso às áreas/)).toBeDefined();
    expect(screen.queryByRole('navigation', { name: 'Ações do Jogador' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Sair da conta' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Atualizar permissões' })).toBeDefined();
  });

  it('reconsulta ao clicar Atualizar e remove ações depois de vínculo revogado', async () => {
    mock.getHubRoleForCurrentSession
      .mockResolvedValueOnce(verifiedMaster)
      .mockResolvedValueOnce({ status: 'denied', reason: 'missing-membership' });
    mount();
    act(() => notify(master));
    expect(await screen.findByRole('navigation', { name: 'Ações do Mestre' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar permissões' }));
    expect(await screen.findByText(/Nenhuma permissão foi concedida/)).toBeDefined();
    expect(screen.queryByRole('navigation', { name: 'Ações do Mestre' })).toBeNull();
    expect(mock.getHubRoleForCurrentSession).toHaveBeenCalledTimes(2);
  });

  it('limpa interface autorizada ao encerrar sessão e não reaproveita perfil antigo', async () => {
    mock.getHubRoleForCurrentSession.mockResolvedValue(verifiedMaster);
    mount();
    act(() => notify(master));
    await screen.findByRole('navigation', { name: 'Ações do Mestre' });
    act(() => notify(null));
    expect(screen.queryByRole('navigation', { name: 'Ações do Mestre' })).toBeNull();
    expect(screen.getByRole('form', { name: 'Entrar no Teias de Anansi' })).toBeDefined();
  });

  it('não revela papel quando o serviço rejeita a consulta', async () => {
    mock.getHubRoleForCurrentSession.mockRejectedValue(new Error('caminho/privado/uid'));
    mount();
    act(() => notify(master));
    await waitFor(() => expect(screen.getByText(/Permissões indisponíveis/)).toBeDefined());
    expect(screen.queryByText(/caminho\/privado/)).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Ações do Mestre' })).toBeNull();
  });
});
