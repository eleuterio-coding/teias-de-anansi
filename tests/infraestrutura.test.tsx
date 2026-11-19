import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Configuração de testes', () => {
  it('renderiza um componente React em ambiente DOM simulado', () => {
    render(createElement('p', null, 'Ambiente React disponível'));
    expect(screen.getByText('Ambiente React disponível')).toBeDefined();
  });
});
