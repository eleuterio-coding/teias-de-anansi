import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppContent } from '../src/app/App';
import { moduleRoutes } from '../src/app/routes';
import { LoadingState } from '../src/app/LoadingState';
import { PageErrorBoundary } from '../src/app/PageErrorBoundary';


// Sem entrar no Firebase real: essas suítes validam o shell público e o bloqueio padrão.
vi.mock('../src/services/session', () => ({
  getHubAuthSession: () => ({
    observe: (onSession: (user: null) => void) => {
      onSession(null);
      return () => undefined;
    },
  }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function mount(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppContent />
    </MemoryRouter>,
  );
}

describe('Navegação inicial', () => {
  it('exibe a página inicial provisória', async () => {
    mount();
    expect(await screen.findByRole('heading', { name: 'Início provisório' })).toBeDefined();
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeDefined();
  });

  it('permite navegar até um módulo reservado e voltar', async () => {
    mount();
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' });
    fireEvent.click(within(nav).getByRole('link', { name: 'Biblioteca' }));

    expect(await screen.findByRole('heading', { name: 'Biblioteca' })).toBeDefined();
    // O shell é público, mas a área do módulo só libera conteúdo após autenticar.
    expect(await screen.findByText(/Esta área exige uma sessão autenticada do Hub/)).toBeDefined();
    expect(within(nav).getByRole('link', { name: 'Biblioteca' }).getAttribute('aria-current')).toBe(
      'page',
    );
    fireEvent.click(screen.getByRole('link', { name: 'Visão geral' }));
    expect(await screen.findByRole('heading', { name: 'Início provisório' })).toBeDefined();
  });

  it('pula a navegação para o conteúdo sem alterar a rota hash', () => {
    mount('/caminho-que-nao-existe');
    fireEvent.click(screen.getByRole('button', { name: 'Pular para o conteúdo' }));
    expect(document.activeElement?.id).toBe('main-content');
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeDefined();
  });

  it.each(moduleRoutes)('abre diretamente a rota provisória $label', async ({ path, label }) => {
    mount(path);
    expect(await screen.findByRole('heading', { name: label })).toBeDefined();
    expect(
      await screen.findByText(/Esta área exige uma sessão autenticada do Hub/),
    ).toBeDefined();
  });

  it('exibe página não encontrada para caminho inválido', () => {
    mount('/caminho-que-nao-existe');
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeDefined();
    expect(screen.getByText('404')).toBeDefined();
  });

  it('apresenta o estado acessível de carregamento', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status').textContent).toContain('Carregando página');
  });

  it('apresenta fallback seguro quando uma página falha', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    function FaultyPage(): never {
      throw new Error('Falha simulada no teste');
    }

    render(
      <MemoryRouter>
        <PageErrorBoundary>
          <FaultyPage />
        </PageErrorBoundary>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('alert').textContent?.includes('Não foi possível exibir esta página'),
    ).toBe(true);
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toBeDefined();
  });
});
