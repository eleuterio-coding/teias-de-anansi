import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/app/App';
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
  window.history.replaceState(null, '', '/');
});

describe('Navegação no subcaminho do GitHub Pages', () => {
  it('mantém o caminho do repositório enquanto navega pelo hash', async () => {
    window.history.replaceState(null, '', '/teias-de-anansi/#/');

    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Início provisório' })).toBeDefined();

    const navigation = screen.getByRole('navigation', { name: 'Navegação principal' });
    fireEvent.click(within(navigation).getByRole('link', { name: 'Biblioteca' }));

    expect(await screen.findByRole('heading', { name: 'Biblioteca' })).toBeDefined();
    expect(window.location.pathname).toBe('/teias-de-anansi/');
    expect(window.location.hash).toBe('#/biblioteca');
  });

  it.each(moduleRoutes)('conserva a rota $label após remontar a aplicação', async (module) => {
    window.history.replaceState(null, '', `/teias-de-anansi/#${module.path}`);

    const firstRender = render(<App />);
    expect(await screen.findByRole('heading', { name: module.label })).toBeDefined();
    firstRender.unmount();

    render(<App />);
    expect(await screen.findByRole('heading', { name: module.label })).toBeDefined();
    expect(window.location.pathname).toBe('/teias-de-anansi/');
    expect(window.location.hash).toBe(`#${module.path}`);
  });

  it('apresenta 404 para uma rota hash desconhecida depois de remontar', () => {
    window.history.replaceState(null, '', '/teias-de-anansi/#/rota-inexistente');

    const firstRender = render(<App />);
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeDefined();
    firstRender.unmount();

    render(<App />);
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeDefined();
    expect(window.location.pathname).toBe('/teias-de-anansi/');
  });
});
