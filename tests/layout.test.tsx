import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppContent } from '../src/app/App';
import { moduleRoutes } from '../src/app/routes';

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
});

function mount(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppContent />
    </MemoryRouter>,
  );
}

describe('Estrutura global do Hub — item 2.03', () => {
  it('contém cabeçalho, menus, breadcrumb, ações e rodapé', async () => {
    mount();

    const sidebar = screen.getByRole('navigation', {
      name: 'Navegação principal',
    });
    const breadcrumb = screen.getByRole('navigation', {
      name: 'Localização da página',
    });

    expect(screen.getByRole('banner')).toBeDefined();
    expect(sidebar).toBeDefined();
    expect(breadcrumb).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Início', level: 1 })).toBeDefined();
    expect(screen.getByRole('main', { name: 'Início' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Explorar Biblioteca' })).toBeDefined();
    expect(screen.getByRole('contentinfo')).toBeDefined();
    expect(await screen.findByRole('heading', { name: 'Início provisório' })).toBeDefined();
  });

  it.each(moduleRoutes)('mostra estrutura em $label', async ({ path, label }) => {
    mount(path);

    const sidebar = screen.getByRole('navigation', {
      name: 'Navegação principal',
    });
    const breadcrumb = screen.getByRole('navigation', {
      name: 'Localização da página',
    });
    const active = within(sidebar).getByRole('link', { name: label });

    expect(active.getAttribute('aria-current')).toBe('page');
    expect(within(breadcrumb).getByRole('link', { name: 'Início' })).toBeDefined();
    expect(within(breadcrumb).getByText(label).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('heading', { name: label, level: 1 })).toBeDefined();
    expect(screen.getByRole('main', { name: label })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Visão geral' })).toBeDefined();
    expect(await screen.findByText(/Esta área exige uma sessão autenticada do Hub/)).toBeDefined();
  });

  it('navega pelas ações da página sem criar registros', async () => {
    mount();

    fireEvent.click(screen.getByRole('link', { name: 'Explorar Biblioteca' }));
    expect(await screen.findByRole('heading', { name: 'Biblioteca', level: 1 })).toBeDefined();

    fireEvent.click(screen.getByRole('link', { name: 'Visão geral' }));
    expect(await screen.findByRole('heading', { name: 'Início', level: 1 })).toBeDefined();
  });

  it('preserva o salto para o conteúdo principal', () => {
    mount('/biblioteca');
    fireEvent.click(screen.getByRole('button', { name: 'Pular para o conteúdo' }));

    expect(document.activeElement?.id).toBe('main-content');
  });

  it('mantém o shell em uma rota inválida', () => {
    mount('/endereco-inexistente');

    expect(screen.getByRole('heading', { name: 'Endereço indisponível', level: 1 })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Página não encontrada', level: 2 })).toBeDefined();
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeDefined();
  });
});
