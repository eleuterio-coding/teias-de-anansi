import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppContent } from '../src/app/App';
import { LoadingState } from '../src/app/LoadingState';
import { PageErrorBoundary } from '../src/app/PageErrorBoundary';

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
    expect(within(nav).getByRole('link', { name: 'Biblioteca' }).getAttribute('aria-current')).toBe(
      'page',
    );
    fireEvent.click(screen.getByRole('link', { name: 'Voltar ao início' }));
    expect(await screen.findByRole('heading', { name: 'Início provisório' })).toBeDefined();
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
