import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppContent } from '../src/app/App';
import { Dialog, Tabs } from '../src/components/ui';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.style.overflow = '';
});

function enableCompactMode() {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    media: '(max-width: 1023px)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function renderHub(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppContent />
    </MemoryRouter>,
  );
}

const tabs = [
  { id: 'intro', label: 'Introdução', content: <p>Conteúdo introdutório</p> },
  { id: 'locked', label: 'Bloqueada', disabled: true, content: <p>Não visível</p> },
  { id: 'notes', label: 'Notas', content: <p>Texto das notas</p> },
];

describe('Auditoria transversal de acessibilidade — 2.09', () => {
  it('garante que todas as abas apontam a painéis existentes no DOM', () => {
    const { container } = render(<Tabs label="Capítulos" items={tabs} />);
    const tablist = screen.getByRole('tablist', { name: 'Capítulos' });

    for (const tab of within(tablist).getAllByRole('tab', { hidden: true })) {
      const target = tab.getAttribute('aria-controls');
      expect(target).toBeTruthy();
      const panel = container.querySelector('[id="' + target + '"]');
      expect(panel).not.toBeNull();
      expect(panel?.getAttribute('aria-labelledby')).toBe(tab.id);
      expect(panel?.getAttribute('role')).toBe('tabpanel');
    }

    expect(screen.getByRole('tabpanel').textContent).toContain('Conteúdo introdutório');
    expect(screen.queryByText('Não visível')).toBeNull();
  });

  it('troca abas por teclado, ignorando opções desabilitadas', () => {
    render(<Tabs label="Capítulos" items={tabs} />);
    const first = screen.getByRole('tab', { name: 'Introdução' });
    const notes = screen.getByRole('tab', { name: 'Notas' });

    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(notes);
    expect(notes.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toContain('Texto das notas');
    fireEvent.keyDown(notes, { key: 'Home' });
    expect(document.activeElement).toBe(first);
  });

  it('torna inerte o conteúdo fora de um modal aberto', () => {
    const { container, rerender } = render(
      <>
        <button type="button">Conteúdo ao fundo</button>
        <Dialog open title="Detalhes" onClose={vi.fn()}>
          <p>Texto da janela</p>
        </Dialog>
      </>,
    );

    expect(container.inert).toBe(true);
    const modal = screen.getByRole('dialog', { name: 'Detalhes' });
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(
      within(modal).getByRole('button', { name: 'Fechar janela' }),
    );

    rerender(
      <>
        <button type="button">Conteúdo ao fundo</button>
        <Dialog open={false} title="Detalhes" onClose={vi.fn()}>
          <p>Texto da janela</p>
        </Dialog>
      </>,
    );
    expect(container.inert).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('recupera o foco caso uma tentativa programática escape do modal', () => {
    render(
      <>
        <button type="button">Controle externo</button>
        <Dialog open title="Edição" onClose={vi.fn()}>
          Conteúdo
        </Dialog>
      </>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Edição' });
    const outside = screen.getByRole('button', { name: 'Controle externo', hidden: true });
    outside.focus();
    expect(document.activeElement).toBe(
      within(dialog).getByRole('button', { name: 'Fechar janela' }),
    );
  });

  it('não fecha um modal bloqueado durante operação em andamento', () => {
    const onClose = vi.fn();
    render(
      <Dialog open disableClose title="Em andamento" onClose={onClose}>
        Concluindo
      </Dialog>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Em andamento' })).toBeDefined();
  });

  it('restaura foco e rolagem quando o modal deixa de existir', () => {
    const component = (open: boolean) => (
      <>
        <button type="button">Abrir janela</button>
        <Dialog open={open} title="Janela" onClose={vi.fn()}>
          Conteúdo
        </Dialog>
      </>
    );
    const { rerender } = render(component(false));
    const trigger = screen.getByRole('button', { name: 'Abrir janela' });
    trigger.focus();
    rerender(component(true));

    expect(document.body.style.overflow).toBe('hidden');
    rerender(component(false));

    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(trigger);
  });

  it('deixa a navegação compacta inerte quando está recolhida', () => {
    enableCompactMode();
    renderHub();

    const sidebar = document.getElementById('hub-sidebar');
    expect(sidebar?.inert).toBe(true);
    expect(sidebar?.getAttribute('aria-hidden')).toBe('true');
  });

  it('isola o fundo quando o menu compacto está aberto', () => {
    enableCompactMode();
    renderHub();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu de navegação' }));

    const dialog = screen.getByRole('dialog', { name: 'Menu de navegação' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.querySelector<HTMLElement>('.hub-page')?.inert).toBe(true);
    expect(document.querySelector<HTMLElement>('.hub-topbar')?.inert).toBe(true);
    expect(document.querySelector<HTMLElement>('.hub-footer')?.inert).toBe(true);
    expect(document.getElementById('hub-sidebar')?.inert).toBe(false);
  });

  it('fecha menu compacto com Escape e devolve foco ao botão', () => {
    enableCompactMode();
    renderHub();
    const trigger = screen.getByRole('button', { name: 'Abrir menu de navegação' });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Menu de navegação' })).toBeNull();
    expect(document.querySelector<HTMLElement>('.hub-page')?.inert).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('move o foco para o conteúdo quando uma rota é escolhida na gaveta', async () => {
    enableCompactMode();
    renderHub();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu de navegação' }));
    const dialog = screen.getByRole('dialog', { name: 'Menu de navegação' });
    fireEvent.click(within(dialog).getByRole('link', { name: 'Minha conta' }));

    expect(await screen.findByRole('heading', { name: 'Acesso ao Hub', level: 1 })).toBeDefined();
    expect(screen.queryByRole('dialog', { name: 'Menu de navegação' })).toBeNull();
    expect(document.activeElement?.id).toBe('main-content');
  });

  it('atualiza o título do documento segundo a rota', () => {
    renderHub('/biblioteca');
    expect(document.title).toBe('Biblioteca | Teias de Anansi');
  });

  it('preserva o salto para o conteúdo principal por teclado', () => {
    renderHub('/');
    const skip = screen.getByRole('button', { name: 'Pular para o conteúdo' });
    skip.focus();
    fireEvent.click(skip);
    expect(document.activeElement?.id).toBe('main-content');
  });
});
