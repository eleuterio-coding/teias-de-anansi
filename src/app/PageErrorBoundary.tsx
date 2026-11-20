import { Component, type ReactNode } from 'react';
import { OperationFeedback } from '../components/feedback';
import { HubLink } from '../components/ui';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/** Proteção básica contra falhas de renderização. Reinicia ao mudar de rota. */
export class PageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="page-state" aria-label="Falha ao exibir a página">
          <OperationFeedback
            state="error"
            title="Não foi possível exibir esta página"
            message="Ocorreu um erro inesperado. Você pode tentar novamente ou voltar ao início."
            onRetry={() => this.setState({ hasError: false })}
          />
          <div className="action-links">
            <HubLink to="/">Voltar ao início</HubLink>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
