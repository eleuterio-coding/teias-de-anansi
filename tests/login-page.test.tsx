import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { HubAuthDriver, HubSessionIdentity } from '../src/services/session';

const mocked = vi.hoisted(() => ({ getHubAuthSession: vi.fn() }));
vi.mock('../src/services/session', () => ({
  getHubAuthSession: mocked.getHubAuthSession,
  HubAuthError: class HubAuthError extends Error {},
}));

import LoginPage from '../src/app/pages/LoginPage';
import { HubAuthError } from '../src/services/session';

let notify: (user: HubSessionIdentity | null) => void;
let notifyError: (message: string) => void;
let driver: HubAuthDriver;
let stop: ReturnType<typeof vi.fn>;

function mount() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  stop = vi.fn();
  driver = {
    observe: vi.fn((onSession, onError) => {
      notify = onSession;
      notifyError = onError;
      return stop;
    }),
    signIn: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
  mocked.getHubAuthSession.mockReturnValue(driver);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Tela de login e logout — Etapa 3.03', () => {
  it('verifica estado salvo antes de exibir o formulario', () => {
    mount();
    expect(screen.getByRole('status').textContent).toContain('Verificando');
    act(() => notify(null));
    expect(screen.getByRole('form', { name: 'Entrar no Teias de Anansi' })).toBeDefined();
  });

  it('valida os campos com componentes compartilhados e não chama Auth vazio', () => {
    mount();
    act(() => notify(null));
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByText('Informe seu usuário.')).toBeDefined();
    expect(screen.getByText('Informe sua senha.')).toBeDefined();
    expect(driver.signIn).not.toHaveBeenCalled();
  });

  it('envia usuario e senha antigos ao servico, sem pedir email pessoal', async () => {
    mount();
    act(() => notify(null));
    fireEvent.change(screen.getByRole('textbox', { name: /Usuário/ }), {
      target: { value: 'gus' },
    });
    fireEvent.change(screen.getByLabelText(/Senha/), {
      target: { value: 'senha-de-teste' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(driver.signIn).toHaveBeenCalledWith('gus', 'senha-de-teste'));
    expect(screen.queryByLabelText('E-mail')).toBeNull();
  });

  it('mostra erro genérico de senha inválida sem dados técnicos', async () => {
    vi.mocked(driver.signIn).mockRejectedValue(
      new HubAuthError('Usuário ou senha incorretos.'),
    );
    mount();
    act(() => notify(null));
    fireEvent.change(screen.getByRole('textbox', { name: /Usuário/ }), {
      target: { value: 'leo' },
    });
    fireEvent.change(screen.getByLabelText(/Senha/), {
      target: { value: 'incorreta' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Usuário ou senha incorretos.')).toBeDefined();
    expect(screen.getByRole('form', { name: 'Entrar no Teias de Anansi' })).toBeDefined();
  });

  it('restaura sessao reconhecida e permite sair, somente apos o observador', async () => {
    vi.mocked(driver.signOut).mockImplementation(async () => {
      act(() => notify(null));
    });
    mount();
    act(() => notify({
      uid: 'uid-ficticio',
      username: 'rafael',
      displayName: 'Rafael',
      knownAccount: true,
    }));
    expect(screen.getByText(/Conta conectada: Rafael/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Sair da conta' }));
    await waitFor(() => expect(driver.signOut).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('form', { name: 'Entrar no Teias de Anansi' })).toBeDefined();
  });

  it('mantem sessao quando logout falha e mostra mensagem', async () => {
    vi.mocked(driver.signOut).mockRejectedValue(
      new HubAuthError('Não foi possível concluir o acesso agora. Tente novamente.'),
    );
    mount();
    act(() => notify({
      uid: 'id',
      username: 'bruno',
      displayName: 'Bruno',
      knownAccount: true,
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Sair da conta' }));
    expect(await screen.findByText('Não foi possível concluir o acesso agora. Tente novamente.')).toBeDefined();
    expect(screen.getByText('Conta conectada: Bruno.')).toBeDefined();
  });

  it('identidade desconhecida nunca recebe papel Mestre por inferência', () => {
    mount();
    act(() => notify({
      uid: 'id',
      username: null,
      displayName: 'Conta autenticada',
      knownAccount: false,
    }));
    expect(screen.getByText('A conta existe no Firebase, mas seu perfil ainda precisa de validação no Hub.')).toBeDefined();
    expect(screen.queryByText(/Você é o Mestre/)).toBeNull();
  });

  it('mostra falha segura se assinatura de sessao falhar e cancela observador', () => {
    const result = mount();
    act(() => notifyError('Não foi possível conectar. Confira sua internet e tente novamente.'));
    expect(screen.getByRole('alert').textContent).toContain('Confira sua internet');
    result.unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('mostra indisponibilidade sem vazar configuração quando inicializar falha', () => {
    mocked.getHubAuthSession.mockImplementation(() => { throw new Error('secret-data'); });
    mount();
    expect(screen.getByRole('alert').textContent).toContain('não está disponível');
    expect(screen.getByRole('alert').textContent).not.toContain('secret-data');
  });
});
