import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';

export type DataListProps<T> = {
  items: readonly T[];
  label: string;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function DataList<T>({
  items,
  label,
  getKey,
  renderItem,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription,
}: DataListProps<T>) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="ds-data-list" aria-label={label}>
      {items.map((item) => (
        <li key={getKey(item)} className="ds-data-list-item">
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}
