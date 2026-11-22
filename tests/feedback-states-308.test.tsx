import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HubStateFeedback, OperationFeedback } from '../src/components/feedback';
import { GENERIC_AUTH_FAILURE, safeAuthFeedback } from '../src/services/feedback-messages';

afterEach(() => {
  cleanup();
});

describe('3.08 — estados padronizados, acessíveis e sem detalhes privados', () => {
  it('exibe sessão pendente em status, sem botão e sem conceder permissão', () => {
    render(<HubStateFeedback kind="checking-session" />);
    expect(screen.getByRole('status').textContent).toContain('Verificando sua sessão existente');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('exibe conferência de papel sem conteúdo autenticado', () => {
    render(<HubStateFeedback kind="checking-permissions" />);
    expect(screen.getByRole('status').textContent).toContain('Nenhum conteúdo protegido');
  });

  it('informa ausência de sessão sem retry remoto', () => {
    render(<HubStateFeedback kind="signed-out" />);
    expect(screen.getByRole('alert').textContent).toContain('Esta área exige uma sessão autenticada');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('nega autorização sem exibir documento, UID nem exception', () => {
    render(<HubStateFeedback kind="access-denied" />);
    expect(screen.getByRole('alert').textContent).toContain('O seu perfil ou vínculo não permite');
    expect(screen.queryByText(/uid-secret|caminho\/privado/)).toBeNull();
  });

  it('retry de falha de rede é explícito e executado uma vez por clique', () => {
    const retry = vi.fn();
    render(<HubStateFeedback kind="network-unavailable" onRetry={retry} />);
    expect(retry).not.toHaveBeenCalled();
    const message = screen.getByRole('alert').textContent ?? '';
    expect(message).toContain('Nenhum conteúdo protegido foi carregado');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('sem callback a falha nunca cria retry inerte', () => {
    render(<HubStateFeedback kind="network-unavailable" />);
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).toBeNull();
  });

  it('inventário negado não mostra itens nem ação automática', () => {
    render(<HubStateFeedback kind="roster-denied" />);
    expect(screen.getByRole('alert').textContent).toContain('Somente o Mestre');
  });

  it('inventário inconsistente orienta conferência sem alterar dados', () => {
    render(<HubStateFeedback kind="roster-incomplete" />);
    expect(screen.getByRole('alert').textContent).toContain('não será exibida parcialmente');
  });

  it('inventário em leitura usa status e não mostra tabela fictícia', () => {
    render(<HubStateFeedback kind="roster-loading" />);
    expect(screen.getByRole('status').textContent).toContain('Conferindo os perfis');
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('inventário indisponível permite apenas novo GET deliberado', () => {
    const retry = vi.fn();
    render(<HubStateFeedback kind="roster-unavailable" onRetry={retry} />);
    expect(screen.getByRole('alert').textContent).toContain('Nenhum dado foi alterado');
    expect(retry).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('ausência de registros usa EmptyState e fornece recuperação segura', () => {
    const retry = vi.fn();
    render(<HubStateFeedback kind="roster-empty" onRetry={retry} />);
    expect(screen.getByText('Nenhum perfil disponível')).toBeDefined();
    expect(screen.getByText('Nenhum registro autorizado foi encontrado nesta consulta.')).toBeDefined();
    expect(retry).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('estado de erro genérico não tenta operação por conta própria', () => {
    const retry = vi.fn();
    render(<OperationFeedback state="error" message="Operação bloqueada." onRetry={retry} />);
    expect(retry).not.toHaveBeenCalled();
  });
});

describe('3.08 — sanitização de mensagens vindas do SDK', () => {
  it('mantém apenas erros conhecidos de login e rede', () => {
    expect(safeAuthFeedback('Usuário ou senha incorretos.')).toBe('Usuário ou senha incorretos.');
    expect(safeAuthFeedback('Não foi possível conectar. Confira sua internet e tente novamente.'))
      .toBe('Não foi possível conectar. Confira sua internet e tente novamente.');
  });

  it('bloqueia exceções arbitrárias, UIDs, caminhos e emails técnicos', () => {
    for (const message of [
      'Error: users/uid-real-privado',
      'firebase/auth @teias.invalid',
      'permission-denied: campaigns/campanha-interna',
      null, undefined, {}, 123,
    ]) {
      expect(safeAuthFeedback(message)).toBe(GENERIC_AUTH_FAILURE);
    }
  });
});
