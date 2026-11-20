export type DataLoadingProps = {
  message?: string;
};

export function DataLoading({ message = 'Carregando registros…' }: DataLoadingProps) {
  return (
    <div role="status" aria-live="polite" className="ds-data-loading">
      <span className="ds-data-loading-mark" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
