import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { HubSessionIdentity } from '../src/services/session';

const mocks = vi.hoisted(() => ({
  getHubAuthSession: vi.fn(),
  getHubRoleForCurrentSession: vi.fn(),
  checkCurrentUserCampaignAccess: vi.fn(),
}));

vi.mock('../src/services/session', () => ({
  getHubAuthSession: mocks.getHubAuthSession,
}));
vi.mock('../src/services/role-access', () => ({
  getHubRoleForCurrentSession: mocks.getHubRoleForCurrentSession,
}));
vi.mock('../src/services/scoped-access', () => ({
  checkCurrentUserCampaignAccess: mocks.checkCurrentUserCampaignAccess,
}));

import { AppContent } from '../src/app/App';

const player: HubSessionIdentity = {
  uid: 'uid-gus-simulado',
  username: 'gustavo',
  displayName: 'Gustavo',
  knownAccount: true,
};
const master: HubSessionIdentity = {
  uid: 'uid-master-simulado',
  username: 'rafael',
  displayName: 'Rafael',
  knownAccount: true,
};
const playerAccess = { status: 'verified', role: 'player', displayName: 'Gustavo', campaignCount: 1 };
const masterAccess = { status: 'verified', role: 'dm', displayName: 'Rafael', campaignCount: 2 };

let observer: (identity: HubSessionIdentity | null) => void;
let errorObserver: (message: string) => void;
let stop: ReturnType<typeof vi.fn>;

function mount(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppContent />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  stop = vi.fn();
  mocks.getHubAuthSession.mockReturnValue({
    observe: (next: typeof observer, onError: typeof errorObserver) => {
      observer = next;
      errorObserver = onError;
      return stop;
    },
  });
  mocks.getHubRoleForCurrentSession.mockResolvedValue(playerAccess);
  mocks.checkCurrentUserCampaignAccess.mockResolvedValue({ status: 'ok', activeCampaigns: 1 });
});

afterEach(() => {
  cleanup();
});

describe('3.06 — proteção de rotas e ações por Auth e papel', () => {
  it('nega URL direta sem autenticação e preserva tela pública', async () => {
    mount('/campanhas');
    expect(await screen.findByText(/Verificando sessão e permissões/)).toBeDefined();
    act(() => observer(null));
    expect(screen.getByText(/Esta área exige uma sessão autenticada do Hub/)).toBeDefined();
    expect(screen.getByRole('link', { name: 'Entrar no Hub' })).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'Módulo em preparação' })).toBeNull();
    expect(mocks.getHubRoleForCurrentSession).not.toHaveBeenCalled();
  });

  it('Jogador não entra na rota de Mestre pela URL', async () => {
    mount('/campanhas');
    act(() => observer(player));
    expect(await screen.findByText(/O seu perfil ou vínculo não permite abrir esta área/)).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'Módulo em preparação' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Conferir meus vínculos' })).toBeNull();
  });

  it('Mestre tem acesso à prévia de Campanhas após verificar papel', async () => {
    mocks.getHubRoleForCurrentSession.mockResolvedValue(masterAccess);
    mount('/campanhas');
    act(() => observer(master));
    expect(await screen.findByRole('heading', { name: 'Módulo em preparação' })).toBeDefined();
    expect(screen.getByText('Acesso confirmado: Mestre')).toBeDefined();
    expect(mocks.getHubRoleForCurrentSession).toHaveBeenCalledWith(master.uid);
  });

  it('Jogador entra na Área do jogador e não entra em Aventuras privadas', async () => {
    const first = mount('/area-jogador');
    act(() => observer(player));
    expect(await screen.findByRole('heading', { name: 'Módulo em preparação' })).toBeDefined();
    first.unmount();
    mount('/aventuras');
    act(() => observer(player));
    expect(await screen.findByText(/O seu perfil ou vínculo não permite/)).toBeDefined();
  });

  it('Mestre não abre área exclusiva do Jogador', async () => {
    mocks.getHubRoleForCurrentSession.mockResolvedValue(masterAccess);
    mount('/area-jogador');
    act(() => observer(master));
    expect(await screen.findByText(/O seu perfil ou vínculo não permite/)).toBeDefined();
  });

  it('em refresh da URL protegida aguarda sessão restaurada', async () => {
    const first = mount('/personagens');
    act(() => observer(player));
    await screen.findByRole('heading', { name: 'Módulo em preparação' });
    first.unmount();
    expect(stop).toHaveBeenCalled();
    mount('/personagens');
    expect(screen.getByText(/Verificando sessão e permissões/)).toBeDefined();
    act(() => observer(player));
    expect(await screen.findByRole('heading', { name: 'Módulo em preparação' })).toBeDefined();
    expect(mocks.getHubRoleForCurrentSession).toHaveBeenCalledTimes(2);
  });

  it('logout retira imediatamente ações protegidas e descarta papel anterior', async () => {
    mocks.getHubRoleForCurrentSession.mockResolvedValue(masterAccess);
    mount('/campanhas');
    act(() => observer(master));
    await screen.findByRole('heading', { name: 'Módulo em preparação' });
    act(() => observer(null));
    expect(screen.getByText(/Esta área exige uma sessão autenticada do Hub/)).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Conferir meus vínculos' })).toBeNull();
  });

  it('resposta atrasada não reautoriza após logout', async () => {
    let release!: (value: typeof masterAccess) => void;
    mocks.getHubRoleForCurrentSession.mockImplementationOnce(
      () => new Promise<typeof masterAccess>((resolve) => { release = resolve; }),
    );
    mount('/campanhas');
    act(() => observer(master));
    act(() => observer(null));
    await act(async () => { release(masterAccess); });
    expect(screen.queryByRole('heading', { name: 'Módulo em preparação' })).toBeNull();
    expect(screen.getByText(/Esta área exige uma sessão autenticada do Hub/)).toBeDefined();
  });

  it('rejeição do servidor e erro de rede ocultam módulo e permitem retry', async () => {
    mocks.getHubRoleForCurrentSession.mockResolvedValueOnce({ status: 'unavailable' })
      .mockResolvedValueOnce(masterAccess);
    mount('/campanhas');
    act(() => observer(master));
    expect(await screen.findByText(/A conexão ou a consulta ao Firebase falhou/)).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'Módulo em preparação' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    act(() => observer(master));
    expect(await screen.findByRole('heading', { name: 'Módulo em preparação' })).toBeDefined();
  });

  it('erro no observador não libera conteúdo privado', () => {
    mount('/campanhas');
    act(() => errorObserver('detalhes de caminho privado'));
    expect(screen.getByText(/A conexão ou a consulta ao Firebase falhou/)).toBeDefined();
    expect(screen.queryByText(/detalhes de caminho privado/)).toBeNull();
  });

  it('ação permite verificar somente vínculos próprios e não revela nomes/IDs', async () => {
    mount('/area-jogador');
    act(() => observer(player));
    await screen.findByRole('heading', { name: 'Módulo em preparação' });
    fireEvent.click(screen.getByRole('button', { name: 'Conferir meus vínculos' }));
    expect(await screen.findByText('Vínculos ativos confirmados: 1.')).toBeDefined();
    expect(mocks.checkCurrentUserCampaignAccess).toHaveBeenCalledWith(player.uid);
  });

  it('ação negada ou sem rede mostra estado seguro', async () => {
    mocks.checkCurrentUserCampaignAccess.mockResolvedValueOnce({ status: 'denied' })
      .mockResolvedValueOnce({ status: 'unavailable' });
    mount('/area-jogador');
    act(() => observer(player));
    await screen.findByRole('heading', { name: 'Módulo em preparação' });
    fireEvent.click(screen.getByRole('button', { name: 'Conferir meus vínculos' }));
    expect(await screen.findByText(/Seu perfil ou vínculo não autoriza esta consulta/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Conferir meus vínculos' }));
    expect(await screen.findByText(/Não foi possível consultar o Firebase/)).toBeDefined();
  });

  it('laboratório e página inicial permanecem públicos sem inicializar Auth', async () => {
    const first = mount('/laboratorio');
    expect(await screen.findByRole('heading', { name: 'Laboratório de interface', level: 1 }))
      .toBeDefined();
    first.unmount();
    mount('/');
    expect(await screen.findByRole('heading', { name: 'Início provisório' })).toBeDefined();
    expect(mocks.getHubAuthSession).not.toHaveBeenCalled();
  });
});
