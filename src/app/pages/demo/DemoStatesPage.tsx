import { useState } from 'react';
import { DataLoading, EmptyState } from '../../../components/data';
import { OperationFeedback, useToast } from '../../../components/feedback';
import {
  Alert,
  Button,
  Card,
  type BadgeTone,
} from '../../../components/ui';
import { DemoScaffold } from './DemoScaffold';

type FeedbackState = 'idle' | 'loading' | 'success' | 'warning' | 'error';

const exampleMessages = [
  {
    tone: 'info' as const,
    title: 'Informação fictícia',
    message: 'Esta mensagem é um exemplo de notificação.',
  },
  {
    tone: 'success' as const,
    title: 'Exemplo concluído',
    message: 'Uma interação local terminou; nada foi salvo.',
  },
  {
    tone: 'warning' as const,
    title: 'Atenção de demonstração',
    message: 'Aviso persistente até ser dispensado.',
  },
  {
    tone: 'danger' as const,
    title: 'Erro simulado',
    message: 'Esta falha foi criada para testar o feedback.',
  },
];

export default function DemoStatesPage() {
  const { notify, clear } = useToast();
  const [state, setState] = useState<FeedbackState>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const [inlineAlert, setInlineAlert] = useState(true);

  return (
    <DemoScaffold
      title="Estados e mensagens"
      description="Feedback de ações e estados de conteúdo apresentados sem chamadas ao servidor."
    >
      <Card title="Notificações globais" description="As mensagens são criadas apenas após cada clique.">
        <div className="hub-demo-actions">
          {exampleMessages.map((message) => (
            <Button
              key={message.tone}
              variant={message.tone === 'danger' ? 'danger' : 'secondary'}
              onClick={() => notify(message)}
            >
              {message.title}
            </Button>
          ))}
          <Button variant="ghost" onClick={clear}>Dispensar todas</Button>
        </div>
        <p className="hub-demo-help">
          Informações e sucessos expiram; atenção e erros permanecem até serem fechados.
        </p>
      </Card>

      <Card title="Estado da operação" description="Selecione um estado para observar a mensagem.">
        <div className="hub-demo-actions" role="group" aria-label="Selecionar estado fictício">
          {(['idle', 'loading', 'success', 'warning', 'error'] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={state === status ? 'primary' : 'secondary'}
              aria-pressed={state === status}
              onClick={() => setState(status)}
            >
              {({
                idle: 'Ocioso',
                loading: 'Carregando',
                success: 'Sucesso',
                warning: 'Atenção',
                error: 'Erro',
              })[status]}
            </Button>
          ))}
        </div>
        <OperationFeedback
          state={state}
          message={
            state === 'loading'
              ? 'Simulação visual, sem requisição à rede.'
              : 'Estado fictício para revisão do componente.'
          }
          onRetry={
            state === 'error'
              ? () => {
                  setRetryCount((count) => count + 1);
                  setState('loading');
                }
              : undefined
          }
        />
        <p className="hub-demo-result" role="status">
          Tentativas locais de repetição: {retryCount}
        </p>
      </Card>

      <div className="hub-demo-grid">
        <Card title="Coleção vazia">
          <EmptyState
            title="Nenhum tomo de exemplo"
            description="A ausência de registros é exibida sem criar elementos artificiais."
          />
        </Card>
        <Card title="Carregamento sem percentual">
          <DataLoading message="Carregamento visual de demonstração…" />
        </Card>
      </div>

      <Card title="Alerta contextual">
        {inlineAlert ? (
          <Alert
            tone={'info' satisfies BadgeTone}
            title="Mensagem na própria página"
            onDismiss={() => setInlineAlert(false)}
          >
            Esta informação é persistente até o usuário dispensar o aviso.
          </Alert>
        ) : (
          <Button onClick={() => setInlineAlert(true)}>Reexibir alerta</Button>
        )}
      </Card>
    </DemoScaffold>
  );
}
