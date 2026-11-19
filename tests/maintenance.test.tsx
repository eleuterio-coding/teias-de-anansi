import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PageErrorBoundary } from '../src/app/PageErrorBoundary';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Recuperacao de falhas de interface', () => {
  it('restaura a pagina apos clicar em Tentar novamente quando a falha cessa', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let shouldFail = true;

    function UnstableContent() {
      if (shouldFail) throw new Error('Falha simulada');
      return <p>Conteúdo recuperado</p>;
    }

    render(
      <MemoryRouter>
        <PageErrorBoundary>
          <UnstableContent />
        </PageErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toBeDefined();
    shouldFail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByText('Conteúdo recuperado')).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
