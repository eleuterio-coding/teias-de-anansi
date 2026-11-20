import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DataExplorer,
  DataList,
  DataLoading,
  DataTable,
  EmptyState,
  FilterSelect,
  Pagination,
  ProgressMeter,
  SearchField,
  type DataColumn,
} from '../src/components/data';

type RecordItem = {
  id: string;
  name: string;
  category: 'lore' | 'nature';
  level: number;
};

const records: RecordItem[] = [
  { id: 'a', name: 'Árvore Ancestral', category: 'nature', level: 12 },
  { id: 'b', name: 'Tomo 10', category: 'lore', level: 10 },
  { id: 'c', name: 'Tomo 2', category: 'lore', level: 2 },
  { id: 'd', name: 'Zéfiro', category: 'nature', level: 4 },
];

const columns: DataColumn<RecordItem>[] = [
  {
    id: 'name',
    header: 'Nome',
    cell: (item) => item.name,
    sortValue: (item) => item.name,
  },
  {
    id: 'level',
    header: 'Nível',
    cell: (item) => item.level,
    sortValue: (item) => item.level,
    align: 'end',
  },
  {
    id: 'category',
    header: 'Categoria',
    cell: (item) => item.category,
  },
];

const base = {
  items: records,
  columns,
  label: 'Registros fictícios',
  getKey: (item: RecordItem) => item.id,
  searchText: (item: RecordItem) => item.name,
  filter: {
    label: 'Categoria',
    getValue: (item: RecordItem) => item.category,
    options: [
      { value: 'lore', label: 'Conhecimento' },
      { value: 'nature', label: 'Natureza' },
    ],
  },
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Apresentação de dados — item 2.06', () => {
  it('exibe um estado vazio com ação opcional', () => {
    const action = vi.fn();
    render(
      <EmptyState
        title="Nenhum tomo"
        description="A biblioteca ainda está vazia."
        action={<button onClick={action}>Tentar novamente</button>}
      />,
    );
    expect(screen.getByText('Nenhum tomo')).toBeDefined();
    expect(screen.getByText('A biblioteca ainda está vazia.')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('permite buscar e limpar o valor por controle rotulado', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SearchField label="Buscar tomos" value="Anansi" onChange={onChange} />,
    );
    expect(screen.getByRole('searchbox', { name: 'Buscar tomos' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar busca' }));
    expect(onChange).toHaveBeenCalledWith('');
    rerender(<SearchField label="Buscar tomos" value="" onChange={onChange} />);
    expect(screen.queryByRole('button', { name: 'Limpar busca' })).toBeNull();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar tomos' }), {
      target: { value: 'Mapa' },
    });
    expect(onChange).toHaveBeenCalledWith('Mapa');
  });

  it('altera filtro por seleção acessível', () => {
    const onChange = vi.fn();
    render(
      <FilterSelect
        label="Tipo"
        value=""
        options={[
          { value: '', label: 'Todos' },
          { value: 'lore', label: 'Conhecimento' },
        ]}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Tipo' }), {
      target: { value: 'lore' },
    });
    expect(onChange).toHaveBeenCalledWith('lore');
  });

  it('limita progresso aos valores válidos e mantém texto percentual', () => {
    const { rerender } = render(
      <ProgressMeter label="Leitura" value={17} max={20} description="Etapas concluídas" />,
    );
    expect(screen.getByText('85%')).toBeDefined();
    expect(screen.getByRole('progressbar', { name: 'Leitura' }).getAttribute('value')).toBe(
      '17',
    );
    rerender(<ProgressMeter label="Leitura" value={500} max={20} />);
    expect(screen.getByText('100%')).toBeDefined();
    rerender(<ProgressMeter label="Leitura" value={-4} max={20} />);
    expect(screen.getByText('0%')).toBeDefined();
  });

  it('não exibe navegação de páginas quando a coleção está vazia', () => {
    render(<Pagination page={9} pageSize={2} totalItems={0} onPageChange={vi.fn()} />);
    expect(screen.getByText('Nenhum resultado')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Próxima' })).toBeNull();
  });

  it('calcula limites de paginação, desabilitando extremos', () => {
    const onPageChange = vi.fn();
    const { rerender } = render(
      <Pagination page={1} pageSize={2} totalItems={5} onPageChange={onPageChange} />,
    );
    expect(screen.getByText('Exibindo 1–2 de 5 resultados')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Anterior' }).hasAttribute('disabled')).toBe(
      true,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    rerender(
      <Pagination page={3} pageSize={2} totalItems={5} onPageChange={onPageChange} />,
    );
    expect(screen.getByText('Exibindo 5–5 de 5 resultados')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Próxima' }).hasAttribute('disabled')).toBe(
      true,
    );
  });

  it('renderiza tabela com cabeçalho, linhas e ordenação semântica', () => {
    const onSortChange = vi.fn();
    render(
      <DataTable
        items={records}
        columns={columns}
        getKey={(item) => item.id}
        caption="Registros fictícios"
        sort={{ columnId: 'name', direction: 'asc' }}
        onSortChange={onSortChange}
      />,
    );
    const table = screen.getByRole('table', { name: 'Registros fictícios' });
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    const nameHeader = within(table).getByRole('columnheader', { name: /Nome/ });
    expect(nameHeader.getAttribute('aria-sort')).toBe('ascending');
    fireEvent.click(within(nameHeader).getByRole('button'));
    expect(onSortChange).toHaveBeenCalledWith('name');
  });

  it('apresenta um estado vazio em tabela ou lista sem elementos fictícios', () => {
    const { rerender } = render(
      <DataTable
        items={[] as RecordItem[]}
        columns={columns}
        getKey={(item) => item.id}
        caption="Registros fictícios"
      />,
    );
    expect(screen.getByText('Nenhum registro encontrado')).toBeDefined();
    expect(screen.queryByRole('table')).toBeNull();
    rerender(
      <DataList
        items={[] as RecordItem[]}
        label="Registros fictícios"
        getKey={(item) => item.id}
        renderItem={(item) => item.name}
      />,
    );
    expect(screen.getByText('Nenhum registro encontrado')).toBeDefined();
  });

  it('mostra uma lista com chaves estáveis e rótulo próprio', () => {
    render(
      <DataList
        items={records}
        label="Tomos fictícios"
        getKey={(item) => item.id}
        renderItem={(item) => <strong>{item.name}</strong>}
      />,
    );
    const list = screen.getByRole('list', { name: 'Tomos fictícios' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    expect(within(list).getByText('Zéfiro')).toBeDefined();
  });

  it('combina a busca ignorando acentos e caixa', () => {
    render(<DataExplorer {...base} />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar registros' }), {
      target: { value: 'arvore' },
    });
    expect(screen.getByText('Árvore Ancestral')).toBeDefined();
    expect(screen.queryByText('Tomo 10')).toBeNull();
    expect(screen.getByText('Exibindo 1–1 de 1 resultados')).toBeDefined();
  });

  it('filtra categorias e preserva apenas os registros corretos', () => {
    render(<DataExplorer {...base} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Categoria' }), {
      target: { value: 'lore' },
    });
    expect(screen.getByText('Tomo 10')).toBeDefined();
    expect(screen.getByText('Tomo 2')).toBeDefined();
    expect(screen.queryByText('Zéfiro')).toBeNull();
    expect(screen.getByText('Exibindo 1–2 de 2 resultados')).toBeDefined();
  });

  it('ordena valores numéricos e inverte a direção', () => {
    render(<DataExplorer {...base} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Ordenar por' }), {
      target: { value: 'level' },
    });
    const names = () =>
      within(screen.getByRole('table')).getAllByRole('row').slice(1).map(
        (row) => row.querySelector('td')?.textContent,
      );
    expect(names()).toEqual(['Tomo 2', 'Zéfiro', 'Tomo 10', 'Árvore Ancestral']);
    fireEvent.click(screen.getByRole('button', { name: 'Ordenação crescente' }));
    expect(names()).toEqual(['Árvore Ancestral', 'Tomo 10', 'Zéfiro', 'Tomo 2']);
  });

  it('ordena nomes com collation numérica do português', () => {
    render(<DataExplorer {...base} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Ordenar por' }), {
      target: { value: 'name' },
    });
    const names = within(screen.getByRole('table')).getAllByRole('row').slice(1).map(
      (row) => row.querySelector('td')?.textContent,
    );
    expect(names.indexOf('Tomo 2')).toBeLessThan(names.indexOf('Tomo 10'));
  });

  it('alterna tabela e lista sem perder busca ou ordenação', () => {
    render(
      <DataExplorer
        {...base}
        renderListItem={(item) => <strong>{item.name}</strong>}
      />,
    );
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar registros' }), {
      target: { value: 'tomo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lista' }));
    expect(screen.queryByRole('table')).toBeNull();
    expect(within(screen.getByRole('list', { name: 'Registros fictícios' })).getAllByRole(
      'listitem',
    )).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Tabela' }));
    expect(screen.getByRole('table', { name: 'Registros fictícios' })).toBeDefined();
  });

  it('pagina depois dos filtros e reinicia a página ao buscar', () => {
    render(<DataExplorer {...base} pageSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(screen.getByText('Exibindo 3–4 de 4 resultados')).toBeDefined();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar registros' }), {
      target: { value: 'tomo' },
    });
    expect(screen.getByText('Exibindo 1–2 de 2 resultados')).toBeDefined();
  });

  it('distingue ausência de dados de busca sem correspondências', () => {
    const { rerender } = render(<DataExplorer {...base} items={[]} />);
    expect(screen.getByText('Nenhum registro disponível')).toBeDefined();
    rerender(<DataExplorer {...base} />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar registros' }), {
      target: { value: 'não existe' },
    });
    expect(screen.getByText('Nenhum resultado encontrado')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByRole('table')).toBeDefined();
  });

  it('prioriza carregamento em vez de resultado vazio', () => {
    const { rerender } = render(<DataLoading />);
    expect(screen.getByRole('status').textContent).toContain('Carregando registros');

    rerender(
      <DataTable
        items={[] as RecordItem[]}
        columns={columns}
        getKey={(item) => item.id}
        caption="Registros fictícios"
        loading
      />,
    );
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.queryByText('Nenhum registro encontrado')).toBeNull();

    rerender(
      <DataList
        items={[] as RecordItem[]}
        label="Registros fictícios"
        getKey={(item) => item.id}
        renderItem={(item) => item.name}
        loading
      />,
    );
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.queryByText('Nenhum registro encontrado')).toBeNull();
  });

  it('desabilita controles e esconde paginação durante carregamento', () => {
    const { rerender } = render(<DataExplorer {...base} items={[]} loading />);
    expect(screen.getByRole('status').textContent).toContain('Carregando registros');
    expect(screen.queryByText('Nenhum registro disponível')).toBeNull();
    expect(screen.getByRole('searchbox').hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('combobox', { name: 'Categoria' }).hasAttribute('disabled')).toBe(
      true,
    );
    expect(screen.queryByRole('navigation', { name: 'Paginação dos resultados' })).toBeNull();

    rerender(<DataExplorer {...base} items={[]} loading={false} />);
    expect(screen.getByText('Nenhum registro disponível')).toBeDefined();
  });

  it('permite usar o explorador apenas com tabela, sem filtros ou lista', () => {
    render(
      <DataExplorer
        items={records}
        columns={columns}
        label="Lista simples"
        getKey={(item) => item.id}
      />,
    );
    expect(screen.getByRole('table', { name: 'Lista simples' })).toBeDefined();
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Lista' })).toBeNull();
  });
});
