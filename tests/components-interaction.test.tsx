import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import {
  Accordion,
  ActionMenu,
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  HubLink,
  Tabs,
} from '../src/components/ui';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.style.overflow = '';
});

describe('Biblioteca de componentes — item 2.05', () => {
  it('usa botão sem submissão implícita e executa clique', () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" onClick={onClick}>
        Criar
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Criar' });
    expect(button.getAttribute('type')).toBe('button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('bloqueia repetição quando botão está carregando', () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Salvar
      </Button>,
    );

    const button = screen.getByRole('button', { name: /Salvar/ });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('cria links internos e externos de maneira segura', () => {
    render(
      <MemoryRouter>
        <HubLink to="/biblioteca" variant="primary">
          Biblioteca
        </HubLink>
        <HubLink href="https://example.com" target="_blank">
          Referência
        </HubLink>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Biblioteca' }).getAttribute('href')).toBe(
      '/biblioteca',
    );
    expect(screen.getByRole('link', { name: 'Referência' }).getAttribute('rel')).toBe(
      'noopener noreferrer',
    );
  });

  it('renderiza cards editoriais e etiquetas com texto legível', () => {
    render(
      <>
        <Card title="Campanha" description="Registro de uma jornada" variant="ornate">
          Conteúdo do tomo
        </Card>
        <Badge tone="success">Concluído</Badge>
      </>,
    );

    expect(screen.getByRole('article')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Campanha' })).toBeDefined();
    expect(screen.getByText('Conteúdo do tomo')).toBeDefined();
    expect(screen.getByText('Concluído')).toBeDefined();
  });

  it('apresenta alertas sem depender somente da cor', () => {
    const onDismiss = vi.fn();
    render(
      <Alert tone="danger" title="Falha" onDismiss={onDismiss}>
        Não foi possível salvar.
      </Alert>,
    );

    expect(screen.getByRole('alert').textContent).toContain('Falha');
    fireEvent.click(screen.getByRole('button', { name: 'Dispensar aviso' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('permite trocar abas via teclado e ignora abas desabilitadas', () => {
    render(
      <Tabs
        label="Conteúdos da campanha"
        items={[
          { id: 'historia', label: 'História', content: <p>História ativa</p> },
          { id: 'bloqueado', label: 'Rascunho', disabled: true, content: <p>Oculto</p> },
          { id: 'mapas', label: 'Mapas', content: <p>Mapas ativos</p> },
        ]}
      />,
    );

    const tablist = screen.getByRole('tablist', { name: 'Conteúdos da campanha' });
    const history = within(tablist).getByRole('tab', { name: 'História' });
    const maps = within(tablist).getByRole('tab', { name: 'Mapas' });
    expect(history.getAttribute('aria-selected')).toBe('true');

    history.focus();
    fireEvent.keyDown(history, { key: 'ArrowRight' });
    expect(maps.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(maps);
    expect(screen.getByRole('tabpanel').textContent).toContain('Mapas ativos');

    fireEvent.keyDown(maps, { key: 'Home' });
    expect(history.getAttribute('aria-selected')).toBe('true');
    expect(screen.queryByText('Oculto')).toBeNull();
  });

  it('abre menu de ações por seta, navega e executa somente opção habilitada', () => {
    const disabled = vi.fn();
    const selected = vi.fn();
    render(
      <ActionMenu
        label="Ações do registro"
        items={[
          { id: 'view', label: 'Visualizar', onSelect: selected },
          { id: 'draft', label: 'Rascunho', disabled: true, onSelect: disabled },
          { id: 'archive', label: 'Arquivar', onSelect: selected, danger: true },
        ]}
      />,
    );

    const trigger = screen.getByRole('button', { name: /Ações do registro/ });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const menu = screen.getByRole('menu', { name: 'Ações do registro' });
    expect(within(menu).getByRole('menuitem', { name: 'Rascunho' }).hasAttribute('disabled')).toBe(
      true,
    );
    const view = within(menu).getByRole('menuitem', { name: 'Visualizar' });
    expect(document.activeElement).toBe(view);
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    const archive = within(menu).getByRole('menuitem', { name: 'Arquivar' });
    expect(document.activeElement).toBe(archive);
    fireEvent.click(archive);

    expect(selected).toHaveBeenCalledTimes(1);
    expect(disabled).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('fecha menu com Escape e devolve foco ao acionador', () => {
    render(
      <ActionMenu label="Opções" items={[{ id: 'copy', label: 'Copiar', onSelect: vi.fn() }]} />,
    );

    const trigger = screen.getByRole('button', { name: /Opções/ });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('fecha menu ao interagir fora dele', () => {
    render(
      <ActionMenu
        label="Mais opções"
        items={[{ id: 'copy', label: 'Copiar', onSelect: vi.fn() }]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Mais opções/ }));
    expect(screen.getByRole('menu')).toBeDefined();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('abre modal com foco gerenciado, fecha por Escape e restaura rolagem', () => {
    const onClose = vi.fn();
    render(
      <>
        <button type="button">Origem</button>
        <Dialog open title="Editar registro" onClose={onClose}>
          <p>Conteúdo de edição</p>
        </Dialog>
      </>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Editar registro' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.body.style.overflow).toBe('hidden');
    expect(within(dialog).getByRole('button', { name: 'Fechar janela' })).toBe(
      document.activeElement,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restaura o foco de origem e a rolagem ao fechar o modal', () => {
    const onClose = vi.fn();
    const view = (open: boolean) => (
      <>
        <button type="button">Origem</button>
        <Dialog open={open} title="Janela" onClose={onClose}>
          Conteúdo
        </Dialog>
      </>
    );
    const { rerender } = render(view(false));
    const origin = screen.getByRole('button', { name: 'Origem' });
    origin.focus();

    rerender(view(true));
    expect(document.body.style.overflow).toBe('hidden');
    rerender(view(false));

    expect(document.activeElement).toBe(origin);
    expect(document.body.style.overflow).toBe('');
  });

  it('fecha modal após clicar no fundo, mas não ao clicar no conteúdo', () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="Janela" onClose={onClose}>
        Conteúdo
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Janela' });
    fireEvent.mouseDown(dialog);
    expect(onClose).not.toHaveBeenCalled();

    const backdrop = dialog.parentElement;
    if (!backdrop) throw new Error('Backdrop não encontrada');
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('exige confirmação explícita sem executar ação automaticamente', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Excluir registro?"
        description="A ação não pode ser desfeita."
        onConfirm={onConfirm}
        onClose={onClose}
        confirmLabel="Excluir"
      />,
    );

    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('impede confirmação e fechamento durante operação ocupada', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        busy
        title="Processando"
        description="Aguarde"
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Confirmar/ }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/ }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('apresenta painel expansível com estrutura nativa', () => {
    render(<Accordion title="Detalhes do cenário">Anotações</Accordion>);
    expect(screen.getByText('Detalhes do cenário').closest('summary')).not.toBeNull();
    expect(screen.getByText('Anotações').closest('details')).not.toBeNull();
  });
});
