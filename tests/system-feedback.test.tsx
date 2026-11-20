import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import {
  OperationFeedback,
  ToastProvider,
  useToast,
  type ToastInput,
} from '../src/components/feedback';

function NotifyButton({ notice, label }: { notice: ToastInput; label: string }) {
  const { notify } = useToast();
  return (
    <button type="button" onClick={() => notify(notice)}>
      {label}
    </button>
  );
}

function ClearButton() {
  const { clear } = useToast();
  return (
    <button type="button" onClick={clear}>
      Limpar todas
    </button>
  );
}

function renderNotices(children: ReactNode) {
  return render(<ToastProvider>{children}</ToastProvider>);
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Mensagens de sistema — item 2.08', () => {
  it('não simula mensagens antes de uma ação real', () => {
    renderNotices(
      <NotifyButton
        label="Salvar localmente"
        notice={{ tone: 'success', title: 'Concluído', message: 'Registro salvo.' }}
      />,
    );

    expect(screen.queryByText('Registro salvo.')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('apresenta sucesso com texto e região de atualização não intrusiva', () => {
    renderNotices(
      <NotifyButton
        label="Concluir"
        notice={{ tone: 'success', title: 'Concluído', message: 'Operação finalizada.' }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));
    const notice = screen.getByRole('status');

    expect(within(notice).getByText('Concluído')).toBeDefined();
    expect(within(notice).getByText('Operação finalizada.')).toBeDefined();
    expect(document.activeElement).not.toBe(
      within(notice).getByRole('button', { name: /Dispensar notificação/ }),
    );
  });

  it('mantém erros visíveis até serem dispensados', () => {
    vi.useFakeTimers();
    renderNotices(
      <NotifyButton
        label="Falhar"
        notice={{ tone: 'danger', title: 'Erro', message: 'Não foi possível salvar.' }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Falhar' }));
    const notice = screen.getByRole('alert');
    expect(notice.textContent).toContain('Não foi possível salvar.');

    act(() => vi.advanceTimersByTime(120000));
    expect(screen.getByRole('alert')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Dispensar notificação: Erro' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('mantém avisos de atenção até a dispensa', () => {
    vi.useFakeTimers();
    renderNotices(
      <NotifyButton
        label="Alertar"
        notice={{ tone: 'warning', title: 'Atenção', message: 'Revise a operação.' }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Alertar' }));
    act(() => vi.advanceTimersByTime(120000));
    expect(screen.getByRole('alert').textContent).toContain('Revise a operação.');
  });

  it('encerra automaticamente informações de baixa criticidade', () => {
    vi.useFakeTimers();
    renderNotices(
      <NotifyButton
        label="Informar"
        notice={{ title: 'Informação', message: 'Atualização recebida.' }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Informar' }));

    expect(screen.getByRole('status')).toBeDefined();
    act(() => vi.advanceTimersByTime(6500));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('aceita duração explícita e zero para mensagem persistente', () => {
    vi.useFakeTimers();
    renderNotices(
      <>
        <NotifyButton
          label="Curta"
          notice={{
            tone: 'info',
            title: 'Rápida',
            message: 'Duração ajustada.',
            durationMs: 1200,
          }}
        />
        <NotifyButton
          label="Persistente"
          notice={{
            tone: 'success',
            title: 'Mantida',
            message: 'Até fechar manualmente.',
            durationMs: 0,
          }}
        />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Curta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Persistente' }));
    expect(screen.getAllByRole('status')).toHaveLength(2);

    act(() => vi.advanceTimersByTime(1200));
    expect(screen.queryByText('Duração ajustada.')).toBeNull();
    expect(screen.getByText('Até fechar manualmente.')).toBeDefined();
  });

  it('pausa o prazo enquanto o ponteiro está sobre o aviso', () => {
    vi.useFakeTimers();
    renderNotices(
      <NotifyButton
        label="Mensagem curta"
        notice={{
          tone: 'info',
          title: 'Leitura',
          message: 'Passe o ponteiro.',
          durationMs: 1000,
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Mensagem curta' }));
    const notice = screen.getByRole('status');

    act(() => vi.advanceTimersByTime(350));
    fireEvent.mouseEnter(notice);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText('Passe o ponteiro.')).toBeDefined();

    fireEvent.mouseLeave(notice);
    act(() => vi.advanceTimersByTime(650));
    expect(screen.queryByText('Passe o ponteiro.')).toBeNull();
  });

  it('pausa o prazo enquanto um controle da notificação possui foco', () => {
    vi.useFakeTimers();
    renderNotices(
      <NotifyButton
        label="Mensagem de foco"
        notice={{
          tone: 'info',
          title: 'Foco',
          message: 'Leitura por teclado.',
          durationMs: 1000,
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mensagem de foco' }));
    const close = screen.getByRole('button', { name: 'Dispensar notificação: Foco' });
    act(() => close.focus());
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByText('Leitura por teclado.')).toBeDefined();

    act(() => close.blur());
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText('Leitura por teclado.')).toBeNull();
  });

  it('exibe até três notificações e mantém as demais em fila', () => {
    renderNotices(
      <NotifyButton
        label="Adicionar aviso"
        notice={{
          tone: 'warning',
          title: 'Aviso',
          message: 'Permanece na fila.',
        }}
      />,
    );

    const add = screen.getByRole('button', { name: 'Adicionar aviso' });
    for (let i = 0; i < 4; i += 1) fireEvent.click(add);
    expect(screen.getAllByRole('alert')).toHaveLength(3);

    fireEvent.click(screen.getAllByRole('button', { name: 'Dispensar notificação: Aviso' })[0]);
    expect(screen.getAllByRole('alert')).toHaveLength(3);
  });

  it('limpa toda a fila mediante ação explícita', () => {
    renderNotices(
      <>
        <NotifyButton
          label="Adicionar"
          notice={{ tone: 'danger', title: 'Erro', message: 'Ação não concluída.' }}
        />
        <ClearButton />
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(screen.getAllByRole('alert')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Limpar todas' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('exige provedor para uso do hook', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() =>
      render(
        <NotifyButton label="Sem contexto" notice={{ title: 'Aviso', message: 'Não exibido.' }} />,
      ),
    ).toThrow('useToast deve ser usado dentro de ToastProvider.');
  });

  it('não apresenta mensagens durante estado ocioso', () => {
    const { container } = render(<OperationFeedback state="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('expõe carregamento como status sem inventar percentuais', () => {
    render(
      <OperationFeedback
        state="loading"
        title="Preparando resultado"
        message="Consultando registros autorizados."
      />,
    );
    expect(screen.getByRole('status').textContent).toContain('Preparando resultado');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('apresenta sucesso e atenção com mensagens identificáveis', () => {
    const { rerender } = render(
      <OperationFeedback
        state="success"
        title="Alteração concluída"
        message="Dados fictícios atualizados."
      />,
    );
    expect(screen.getByRole('status').textContent).toContain('Alteração concluída');

    rerender(<OperationFeedback state="warning" message="Verifique as informações." />);
    expect(screen.getByRole('alert').textContent).toContain('Atenção necessária');
  });

  it('oferece tentar novamente sem realizar ação automática', () => {
    const retry = vi.fn();
    render(
      <OperationFeedback
        state="error"
        title="Falha ao obter dados"
        message="Não houve conexão."
        onRetry={retry}
      />,
    );
    expect(retry).not.toHaveBeenCalled();
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Falha ao obter dados');
    fireEvent.click(within(alert).getByRole('button', { name: 'Tentar novamente' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('não oferece botão fictício de repetição sem callback', () => {
    render(<OperationFeedback state="error" message="Não foi possível concluir." />);
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).toBeNull();
  });
});
