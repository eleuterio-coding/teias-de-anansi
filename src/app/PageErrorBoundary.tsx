import { Component, type ReactNode } from 'react';
import { Button, HubLink } from '../components/ui';

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
        <section className="page-state" role="alert">
          <h2>Não foi possível exibir esta página</h2>
          <p>Ocorreu um erro inesperado. Você pode tentar novamente ou voltar ao início.</p>
          <div className="action-links">
            <Button variant="secondary" onClick={() => this.setState({ hasError: false })}>
              Tentar novamente
            </Button>
            <HubLink to="/">Voltar ao início</HubLink>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
