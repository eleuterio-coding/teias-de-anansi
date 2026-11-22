import { EmptyState } from '../data';
import { Button } from '../ui';
import { OperationFeedback } from './OperationFeedback';

/** Mensagens fixas, sem dados vindos de exceções do Firebase. */
export type HubFeedbackKind =
  | 'checking-session'
  | 'checking-permissions'
  | 'signed-out'
  | 'access-denied'
  | 'network-unavailable'
  | 'roster-loading'
  | 'roster-denied'
  | 'roster-incomplete'
  | 'roster-unavailable'
  | 'roster-empty';

const FEEDBACK = {
  'checking-session': {
    state: 'loading',
    title: 'Verificando sua sessão existente…',
    message: 'Aguarde a confirmação da sessão antes de continuar.',
  },
  'checking-permissions': {
    state: 'loading',
    title: 'Verificando sessão e permissões no Firebase…',
    message: 'Nenhum conteúdo protegido será exibido antes dessa confirmação.',
  },
  'signed-out': {
    state: 'warning',
    title: 'Entre para continuar',
    message: 'Esta área exige uma sessão autenticada do Hub.',
  },
  'access-denied': {
    state: 'warning',
    title: 'Acesso não autorizado',
    message: 'O seu perfil ou vínculo não permite abrir esta área.',
  },
  'network-unavailable': {
    state: 'error',
    title: 'Não foi possível conferir as permissões',
    message: 'A conexão ou a consulta ao Firebase falhou. Nenhum conteúdo protegido foi carregado.',
  },
  'roster-loading': {
    state: 'loading',
    title: 'Conferindo os perfis e vínculos existentes…',
    message: 'Consulta somente de leitura.',
  },
  'roster-denied': {
    state: 'warning',
    title: 'Consulta não autorizada',
    message: 'Somente o Mestre com sessão e vínculos confirmados pode consultar esta lista.',
  },
  'roster-incomplete': {
    state: 'warning',
    title: 'Registros precisam de conferência',
    message: 'Um perfil, vínculo ou campanha não correspondeu ao inventário. A lista não será exibida parcialmente e nenhum registro será corrigido automaticamente.',
  },
  'roster-unavailable': {
    state: 'error',
    title: 'Leitura indisponível',
    message: 'Não foi possível concluir a consulta do Firestore. Nenhum dado foi alterado.',
  },
  'roster-empty': {
    state: 'empty',
    title: 'Nenhum perfil disponível',
    message: 'Nenhum registro autorizado foi encontrado nesta consulta.',
  },
} as const satisfies Record<
  HubFeedbackKind,
  { state: 'loading' | 'warning' | 'error' | 'empty'; title: string; message: string }
>;

export function HubStateFeedback({
  kind,
  onRetry,
}: {
  kind: HubFeedbackKind;
  onRetry?: () => void;
}) {
  const feedback = FEEDBACK[kind];
  if (feedback.state === 'empty') {
    return (
      <EmptyState
        title={feedback.title}
        description={feedback.message}
        action={
          onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              Tentar novamente
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <OperationFeedback
      state={feedback.state}
      title={feedback.title}
      message={feedback.message}
      onRetry={feedback.state === 'error' ? onRetry : undefined}
    />
  );
}
