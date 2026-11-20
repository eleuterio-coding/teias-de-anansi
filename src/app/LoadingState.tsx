import { OperationFeedback } from '../components/feedback';

export function LoadingState() {
  return (
    <div className="page-state">
      <OperationFeedback state="loading" title="Carregando página…" />
    </div>
  );
}
