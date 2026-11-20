import { Alert, Button } from '../ui';

export type OperationState = 'idle' | 'loading' | 'success' | 'warning' | 'error';

export type OperationFeedbackProps = {
  state: OperationState;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

const DEFAULT_TITLES: Record<Exclude<OperationState, 'idle'>, string> = {
  loading: 'Operação em andamento',
  success: 'Operação concluída',
  warning: 'Atenção necessária',
  error: 'Não foi possível concluir a operação',
};

export function OperationFeedback({
  state,
  title,
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
}: OperationFeedbackProps) {
  if (state === 'idle') return null;

  const heading = title ?? DEFAULT_TITLES[state];

  if (state === 'loading') {
    return (
      <div className="ds-operation-loading" role="status" aria-live="polite">
        <span className="ds-operation-indicator" aria-hidden="true" />
        <div>
          <strong>{heading}</strong>
          {message && <p>{message}</p>}
        </div>
      </div>
    );
  }

  const tone = state === 'error' ? 'danger' : state;

  return (
    <Alert tone={tone} title={heading}>
      {message && <p>{message}</p>}
      {state === 'error' && onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </Alert>
  );
}
