import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '../ui';
import { DataList } from './DataList';
import { DataTable, type DataColumn, type SortDirection, type SortValue } from './DataTable';
import { EmptyState } from './EmptyState';
import { FilterSelect, type FilterOption } from './FilterSelect';
import { Pagination } from './Pagination';
import { SearchField } from './SearchField';

export type DataFilter<T> = {
  label: string;
  options: readonly FilterOption[];
  getValue: (item: T) => string;
};

export type DataExplorerProps<T> = {
  items: readonly T[];
  columns: readonly DataColumn<T>[];
  getKey: (item: T) => string;
  label: string;
  searchText?: (item: T) => string;
  filter?: DataFilter<T>;
  pageSize?: number;
  renderListItem?: (item: T) => ReactNode;
  initialView?: 'table' | 'list';
};

const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

function normalize(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function compare(a: SortValue, b: SortValue) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return collator.compare(String(a), String(b));
}

export function DataExplorer<T>({
  items,
  columns,
  getKey,
  label,
  searchText,
  filter,
  pageSize = 10,
  renderListItem,
  initialView = 'table',
}: DataExplorerProps<T>) {
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [direction, setDirection] = useState<SortDirection>('asc');
  const [pageState, setPageState] = useState(1);
  const [view, setView] = useState<'table' | 'list'>(initialView);
  const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 10;

  const sortableColumns = columns.filter((column) => column.sortValue !== undefined);
  const selectedColumn = sortableColumns.find((column) => column.id === sortBy);
  const activeSort = selectedColumn
    ? { columnId: selectedColumn.id, direction }
    : undefined;

  const matching = useMemo(() => {
    const needle = normalize(search.trim());
    const filtered = items.filter((item) => {
      if (needle && searchText && !normalize(searchText(item)).includes(needle)) return false;
      if (filter && filterValue && filter.getValue(item) !== filterValue) return false;
      return true;
    });

    if (!selectedColumn?.sortValue) return filtered;

    return filtered
      .map((item, index) => ({ item, index }))
      .sort((left, right) => {
        const a = selectedColumn.sortValue?.(left.item);
        const b = selectedColumn.sortValue?.(right.item);
        const order = compare(a, b);
        return order === 0 ? left.index - right.index : direction === 'asc' ? order : -order;
      })
      .map(({ item }) => item);
  }, [items, search, searchText, filter, filterValue, selectedColumn, direction]);

  const pageCount = Math.max(1, Math.ceil(matching.length / size));
  const page = Math.min(pageState, pageCount);
  const visible = matching.slice((page - 1) * size, page * size);

  function sort(columnId: string) {
    if (sortBy === columnId) setDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(columnId);
      setDirection('asc');
    }
    setPageState(1);
  }

  const filterOptions: FilterOption[] = filter
    ? [
        { value: '', label: 'Todas as categorias' },
        ...filter.options.filter((option) => option.value !== ''),
      ]
    : [];
  const sortOptions: FilterOption[] = [
    { value: '', label: 'Ordem original' },
    ...sortableColumns.map((column) => ({ value: column.id, label: column.header })),
  ];

  return (
    <section className="ds-explorer" aria-label={label}>
      <div className="ds-explorer-toolbar">
        {searchText && (
          <SearchField
            label="Buscar registros"
            value={search}
            onChange={(next) => {
              setSearch(next);
              setPageState(1);
            }}
          />
        )}
        {filter && (
          <FilterSelect
            label={filter.label}
            value={filterValue}
            options={filterOptions}
            onChange={(next) => {
              setFilterValue(next);
              setPageState(1);
            }}
          />
        )}
        {sortableColumns.length > 0 && (
          <FilterSelect
            label="Ordenar por"
            value={sortBy}
            options={sortOptions}
            onChange={(next) => {
              setSortBy(next);
              setDirection('asc');
              setPageState(1);
            }}
          />
        )}
        {selectedColumn && (
          <Button
            size="sm"
            variant="secondary"
            aria-label={direction === 'asc' ? 'Ordenação crescente' : 'Ordenação decrescente'}
            onClick={() => {
              setDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
              setPageState(1);
            }}
          >
            {direction === 'asc' ? 'Crescente ↑' : 'Decrescente ↓'}
          </Button>
        )}
      </div>

      {renderListItem && (
        <div className="ds-explorer-view" role="group" aria-label="Modo de apresentação">
          <Button
            size="sm"
            variant={view === 'table' ? 'primary' : 'secondary'}
            aria-pressed={view === 'table'}
            onClick={() => setView('table')}
          >
            Tabela
          </Button>
          <Button
            size="sm"
            variant={view === 'list' ? 'primary' : 'secondary'}
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            Lista
          </Button>
        </div>
      )}

      {matching.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? 'Nenhum registro disponível' : 'Nenhum resultado encontrado'}
          description={
            items.length === 0
              ? 'Os registros serão exibidos aqui quando estiverem disponíveis.'
              : 'Experimente ajustar a busca ou os filtros.'
          }
          action={
            items.length > 0 && (search || filterValue) ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setFilterValue('');
                  setPageState(1);
                }}
              >
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      ) : view === 'list' && renderListItem ? (
        <DataList
          items={visible}
          label={label}
          getKey={getKey}
          renderItem={renderListItem}
        />
      ) : (
        <DataTable
          items={visible}
          columns={columns}
          getKey={getKey}
          caption={label}
          sort={activeSort}
          onSortChange={sort}
        />
      )}

      <Pagination
        page={page}
        pageSize={size}
        totalItems={matching.length}
        onPageChange={setPageState}
      />
    </section>
  );
}
