import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { DataLoading } from './DataLoading';

export type SortDirection = 'asc' | 'desc';
export type SortValue = string | number | null | undefined;

export type DataColumn<T> = {
  id: string;
  header: string;
  cell: (item: T) => ReactNode;
  sortValue?: (item: T) => SortValue;
  align?: 'start' | 'center' | 'end';
};

export type DataTableProps<T> = {
  items: readonly T[];
  columns: readonly DataColumn<T>[];
  getKey: (item: T) => string;
  caption: string;
  sort?: { columnId: string; direction: SortDirection };
  onSortChange?: (columnId: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  loading?: boolean;
};

export function DataTable<T>({
  items,
  columns,
  getKey,
  caption,
  sort,
  onSortChange,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription,
  loading = false,
}: DataTableProps<T>) {
  if (loading) return <DataLoading />;
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="ds-table-scroll" role="region" aria-label={caption} tabIndex={0}>
      <table className="ds-data-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => {
              const sortable = Boolean(column.sortValue && onSortChange);
              const active = sort?.columnId === column.id;
              const order =
                !sortable || !active
                  ? 'none'
                  : sort.direction === 'asc'
                    ? 'ascending'
                    : 'descending';

              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={sortable ? order : undefined}
                  className={'ds-table-align-' + (column.align ?? 'start')}
                >
                  {sortable ? (
                    <button
                      type="button"
                      className="ds-table-sort"
                      onClick={() => onSortChange?.(column.id)}
                    >
                      {column.header}
                      <span aria-hidden="true">
                        {active ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={getKey(item)}>
              {columns.map((column) => (
                <td key={column.id} className={'ds-table-align-' + (column.align ?? 'start')}>
                  {column.cell(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
