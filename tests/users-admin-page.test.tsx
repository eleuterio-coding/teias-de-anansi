import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { HubSessionIdentity } from '../src/services/session';

const mock = vi.hoisted(() => ({
  getHubAuthSession: vi.fn(),
  getHubRoleForCurrentSession: vi.fn(),
  getCurrentMasterRoster: vi.fn(),
  checkCurrentUserCampaignAccess: vi.fn(),
}));
vi.mock('../src/services/session', () => ({
  getHubAuthSession: mock.getHubAuthSession,
}));
vi.mock('../src/services/role-access', () => ({
  getHubRoleForCurrentSession: mock.getHubRoleForCurrentSession,
}));
vi.mock('../src/services/users-admin', () => ({
  getCurrentMasterRoster: mock.getCurrentMasterRoster,
}));
vi.mock('../src/services/scoped-access', () => ({
  checkCurrentUserCampaignAccess: mock.checkCurrentUserCampaignAccess,
}));

import { AppContent } from '../src/app/App';

const master: HubSessionIdentity = {
  uid: 'uid-m-ficticio',
  username: 'rafael',
  displayName: 'Rafael',
  knownAccount: true,
};
const player: HubSessionIdentity = {
  uid: 'uid-p-ficticio',
  username: 'gustavo',
  displayName: 'Gustavo',
  knownAccount: true,
};
const masters = { status: 'verified', role: 'dm', displayName: 'Rafael', campaignCount: 2 };
const players = { status: 'verified', role: 'player', displayName: 'Gustavo', campaignCount: 1 };
const entries = [
  {
    key: 'rafael',
    displayName: 'Rafael',
    role: 'dm',
    memberships: [
      { campaign: 'Campanha fictícia A', active: true, hasCharacter: false },
      { campaign: 'Campanha fictícia B', active: true, hasCharacter: false },
    ],
  },
  ...['Bruno', 'Gustavo', 'Léo', 'Fernanda'].map((displayName) => ({
    key: displayName.toLowerCase(),
    displayName,
    role: 'player',
    memberships: [{ campaign: 'Campanha fictícia A', active: true, hasCharacter: true }],
  })),
];
let observer: (value: HubSessionIdentity | null) => void;
let errorObserver: (error: string) => void;
let stop: ReturnType<typeof vi.fn>;

function mount(path = '/usuarios') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppContent />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  stop = vi.fn();
  mock.getHubAuthSession.mockReturnValue({
    observe: (onSession: typeof observer, onError: typeof errorObserver) => {
      observer = onSession;
      errorObserver = onError;
      return stop;
    },
  });
  mock.getHubRoleForCurrentSession.mockResolvedValue(masters);
  mock.getCurrentMasterRoster.mockResolvedValue({
    status: 'ok',
    entries,
    campaignCount: 2,
    activeMembershipCount: 6,
  });
  mock.checkCurrentUserCampaignAccess.mockResolvedValue({ status: 'ok', activeCampaigns: 2 });
});
afterEach(() => {
  cleanup();
});

describe('3.07 — área exclusiva de administração', () => {
  it('URL direta sem sessão não monta painel nem consulta cinco contas', async () => {
    mount();
    act(() => observer(null));
    expect(await screen.findByText(/Esta área exige uma sessão autenticada do Hub/)).toBeDefined();
    expect(screen.queryByText('Administração de usuários e vínculos')).toBeNull();
    expect(mock.getCurrentMasterRoster).not.toHaveBeenCalled();
  });

  it('Jogador nunca vê painel nem consegue consultar perfis pelo frontend', async () => {
    mock.getHubRoleForCurrentSession.mockResolvedValue(players);
    mount();
    act(() => observer(player));
    expect(
      await screen.findByText(/O seu perfil ou vínculo não permite abrir esta área/),
    ).toBeDefined();
    expect(mock.getCurrentMasterRoster).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Simular alteração' })).toBeNull();
  });

  it('Mestre vê cinco perfis existentes e vínculos com fonte de leitura separada', async () => {
    mount();
    act(() => observer(master));
    expect(
      await screen.findByRole('heading', { name: 'Administração de usuários e vínculos' }),
    ).toBeDefined();
    expect(await screen.findByText(/5 perfis conferidos/)).toBeDefined();
    const table = screen.getByRole('table', { name: 'Perfis e vínculos reais — somente leitura' });
    expect(within(table).getAllByRole('row')).toHaveLength(6);
    expect(within(table).getByText('Gustavo')).toBeDefined();
    expect(mock.getCurrentMasterRoster).toHaveBeenCalledTimes(1);
    expect(mock.getHubRoleForCurrentSession).toHaveBeenCalledWith(master.uid);
  });

  it('a simulação exige confirmação e não altera a lista real', async () => {
    mount();
    act(() => observer(master));
    await screen.findByRole('table', { name: 'Perfis e vínculos reais — somente leitura' });
    const sample = screen.getByRole('table', {
      name: 'Vínculos fictícios para testar administração',
    });
    expect(within(sample).getAllByText(/Mesa Aurora \(fictícia\) · ativo/).length).toBeGreaterThan(
      0,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Simular alteração' }));
    const dialog = await screen.findByRole('dialog', { name: 'Confirmar somente a simulação' });
    expect(screen.getByText(/não existe gravação no Firebase/i)).toBeDefined();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar simulação' }));
    expect((await screen.findAllByText(/Suspensão simulada: Bruno/)).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('table', { name: 'Perfis e vínculos reais — somente leitura' }),
    ).toBeDefined();
    expect(mock.getCurrentMasterRoster).toHaveBeenCalledTimes(1);
  });

  it('desfazer e reiniciar restauram o estado fictício local', async () => {
    mount();
    act(() => observer(master));
    await screen.findByRole('button', { name: 'Simular alteração' });
    fireEvent.click(screen.getByRole('button', { name: 'Simular alteração' }));
    const dialog = await screen.findByRole('dialog', { name: 'Confirmar somente a simulação' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar simulação' }));
    expect((await screen.findAllByText(/Suspensão simulada: Bruno/)).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer última simulação' }));
    expect(screen.getAllByText(/Última simulação desfeita/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar laboratório' }));
    expect(screen.getByText('Laboratório fictício reiniciado.')).toBeDefined();
    expect(mock.getCurrentMasterRoster).toHaveBeenCalledTimes(1);
  });

  it('consulta negada ou incompleta não exibe lista parcial e permite atualização', async () => {
    mock.getCurrentMasterRoster
      .mockResolvedValueOnce({ status: 'incomplete' })
      .mockResolvedValueOnce({ status: 'ok', entries, campaignCount: 2, activeMembershipCount: 6 });
    mount();
    act(() => observer(master));
    expect(
      await screen.findByText(/Um perfil, vínculo ou campanha não correspondeu ao inventário/),
    ).toBeDefined();
    expect(
      screen.queryByRole('table', { name: 'Perfis e vínculos reais — somente leitura' }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar leitura' }));
    expect(
      await screen.findByRole('table', { name: 'Perfis e vínculos reais — somente leitura' }),
    ).toBeDefined();
    expect(mock.getCurrentMasterRoster).toHaveBeenCalledTimes(2);
  });

  it('ao sair durante leitura, desmonta painel e descarta a resposta atrasada', async () => {
    let release!: (value: unknown) => void;
    mock.getCurrentMasterRoster.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    mount();
    act(() => observer(master));
    await screen.findByText(/Conferindo os perfis e vínculos existentes/);
    act(() => observer(null));
    expect(
      screen.queryByRole('heading', { name: 'Administração de usuários e vínculos' }),
    ).toBeNull();
    await act(async () =>
      release({ status: 'ok', entries, campaignCount: 2, activeMembershipCount: 6 }),
    );
    expect(
      screen.queryByRole('table', { name: 'Perfis e vínculos reais — somente leitura' }),
    ).toBeNull();
  });

  it('falha de observador não mostra painel nem detalhes internos', async () => {
    mount();
    act(() => errorObserver('detalhes-internos-privados'));
    expect(await screen.findByText(/A conexão ou a consulta ao Firebase falhou/)).toBeDefined();
    expect(screen.queryByText('detalhes-internos-privados')).toBeNull();
    expect(mock.getCurrentMasterRoster).not.toHaveBeenCalled();
  });

  it('página inicial continua pública e não consulta painel administrativo', async () => {
    mount('/');
    expect(await screen.findByRole('heading', { name: 'Início provisório' })).toBeDefined();
    expect(mock.getHubAuthSession).not.toHaveBeenCalled();
    expect(mock.getCurrentMasterRoster).not.toHaveBeenCalled();
  });
  it('inventário vazio usa EmptyState sem fabricar perfis nem vínculos', async () => {
    mock.getCurrentMasterRoster.mockResolvedValueOnce({
      status: 'ok', entries: [], campaignCount: 0, activeMembershipCount: 0,
    });
    mount();
    act(() => observer(master));
    expect(await screen.findByText('Nenhum perfil disponível')).toBeDefined();
    expect(screen.queryByRole('table', { name: 'Perfis e vínculos reais — somente leitura' }))
      .toBeNull();
    expect(mock.getCurrentMasterRoster).toHaveBeenCalledTimes(1);
  });

  it('permissão negada não permite ver a lista, mesmo após uma resposta anterior', async () => {
    mock.getCurrentMasterRoster.mockResolvedValueOnce({ status: 'denied' });
    mount();
    act(() => observer(master));
    expect(await screen.findByText(/Somente o Mestre com sessão e vínculos confirmados/))
      .toBeDefined();
    expect(screen.queryByRole('table', { name: 'Perfis e vínculos reais — somente leitura' }))
      .toBeNull();
  });

  it('erro de rede no inventário só repete leitura após clique explícito', async () => {
    mock.getCurrentMasterRoster
      .mockResolvedValueOnce({ status: 'unavailable' })
      .mockResolvedValueOnce({
        status: 'ok', entries, campaignCount: 2, activeMembershipCount: 6,
      });
    mount();
    act(() => observer(master));
    expect(await screen.findByText(/Não foi possível concluir a consulta do Firestore/))
      .toBeDefined();
    expect(mock.getCurrentMasterRoster).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('table', { name: 'Perfis e vínculos reais — somente leitura' }))
      .toBeDefined();
    expect(mock.getCurrentMasterRoster).toHaveBeenCalledTimes(2);
  });

  it('ação de simulação inválida mostra aviso, não sucesso nem gravação', async () => {
    mount();
    act(() => observer(master));
    await screen.findByRole('button', { name: 'Simular alteração' });
    fireEvent.change(screen.getByLabelText('Ação de teste'), {
      target: { value: 'include' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Simular alteração' }));
    const dialog = await screen.findByRole('dialog', { name: 'Confirmar somente a simulação' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar simulação' }));
    expect(await screen.findByText('O vínculo fictício já existe.')).toBeDefined();
    expect(screen.getByText('Simulação não aplicada')).toBeDefined();
    expect(mock.getCurrentMasterRoster).toHaveBeenCalledTimes(1);
  });

});
