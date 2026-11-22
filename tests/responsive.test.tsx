import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppContent } from '../src/app/App';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.style.overflow = '';
});

function mockCompactViewport(initial = true) {
  let compact = initial;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    get matches() {
      return compact;
    },
    onchange: null,
    addEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => {
      if (type === 'change') listeners.add(listener);
    },
    removeEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => {
      if (type === 'change') listeners.delete(listener);
    },
  }));

  return {
    resize(next: boolean) {
      compact = next;
      act(() => {
        listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent));
      });
    },
  };
}

function mount(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppContent />
    </MemoryRouter>,
  );
}

function openMenu() {
  const trigger = screen.getByRole('button', {
    name: 'Abrir menu de navegação',
  });
  fireEvent.click(trigger);
  return trigger;
}

describe('Responsividade do AppShell — item 2.04', () => {
  it('deixa o menu principal recolhido no tablet/celular', () => {
    mockCompactViewport();
    mount();

    const trigger = screen.getByRole('button', {
      name: 'Abrir menu de navegação',
    });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe('hub-sidebar');
    expect(document.getElementById('hub-sidebar')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('abre a gaveta como diálogo e bloqueia rolagem de fundo', () => {
    mockCompactViewport();
    mount();

    const trigger = openMenu();
    const dialog = screen.getByRole('dialog', { name: 'Menu de navegação' });

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.body.style.overflow).toBe('hidden');
    expect(within(dialog).getByRole('navigation', { name: 'Navegação principal' })).toBeDefined();
    expect(document.activeElement).toBe(
      within(dialog).getByRole('button', { name: 'Fechar navegação' }),
    );
  });

  it('fecha com Escape, devolve o foco e libera a rolagem', () => {
    mockCompactViewport();
    mount();

    const trigger = openMenu();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe('');
  });

  it('fecha pelo botão e pelo fundo escurecido', () => {
    mockCompactViewport();
    mount();

    openMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar navegação' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    openMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar menu de navegação' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('mantém a navegação por teclado dentro da gaveta', () => {
    mockCompactViewport();
    mount();

    openMenu();
    const dialog = screen.getByRole('dialog', { name: 'Menu de navegação' });
    const first = within(dialog).getByRole('button', { name: 'Fechar navegação' });
    const last = within(dialog).getByRole('link', { name: 'Laboratório de interface' });

    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('fecha a gaveta e preserva a rota quando um módulo é escolhido', async () => {
    mockCompactViewport();
    mount();

    openMenu();
    const dialog = screen.getByRole('dialog', { name: 'Menu de navegação' });
    fireEvent.click(within(dialog).getByRole('link', { name: 'Minha conta' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await screen.findByRole('heading', { name: 'Acesso ao Hub', level: 1 })).toBeDefined();
    expect(document.activeElement?.id).toBe('main-content');
  });

  it('restaura o menu persistente quando a largura volta ao desktop', () => {
    const viewport = mockCompactViewport();
    mount();

    openMenu();
    viewport.resize(false);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.getElementById('hub-sidebar')?.hasAttribute('aria-hidden')).toBe(false);
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Abrir menu de navegação' }).getAttribute('aria-expanded'),
    ).toBe('false');

    viewport.resize(true);
    expect(document.getElementById('hub-sidebar')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('não transforma menu persistente em diálogo no desktop', () => {
    mockCompactViewport(false);
    mount();

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeDefined();
    expect(document.body.style.overflow).toBe('');
  });
});
