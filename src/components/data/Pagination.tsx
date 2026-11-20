import { Button } from '../ui';

export type PaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: PaginationProps) {
  const count = Number.isFinite(totalItems) ? Math.max(0, Math.floor(totalItems)) : 0;
  const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 1;
  const pages = Math.max(1, Math.ceil(count / size));
  const current = Number.isFinite(page)
    ? Math.max(1, Math.min(Math.floor(page), pages))
    : 1;
  const first = count === 0 ? 0 : (current - 1) * size + 1;
  const last = Math.min(current * size, count);

  return (
    <nav className="ds-pagination" aria-label="Paginação dos resultados">
      <p className="ds-pagination-summary" aria-live="polite">
        {count === 0
          ? 'Nenhum resultado'
          : `Exibindo ${first}–${last} de ${count} resultados`}
      </p>
      {count > 0 && (
        <div className="ds-pagination-controls">
          <Button
            size="sm"
            disabled={current <= 1}
            onClick={() => onPageChange(current - 1)}
          >
            Anterior
          </Button>
          <span aria-live="polite">Página {current} de {pages}</span>
          <Button
            size="sm"
            disabled={current >= pages}
            onClick={() => onPageChange(current + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </nav>
  );
}
