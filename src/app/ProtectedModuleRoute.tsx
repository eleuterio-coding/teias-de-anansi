import { useEffect, useState, type ReactNode } from 'react';
import { checkCurrentUserCampaignAccess, type HubOwnAccessResult } from '../services/scoped-access';
import { useLocation } from 'react-router-dom';
import { Button, HubLink } from '../components/ui';
import { HubStateFeedback, OperationFeedback } from '../components/feedback';
import { getHubAuthSession, type HubSessionIdentity } from '../services/session';
import { getHubRoleForCurrentSession, type HubRoleAccess } from '../services/role-access';
import type { ModuleRoute } from './routes';

type GateState =
  | { status: 'checking' }
  | { status: 'signed-out' }
  | { status: 'denied' }
  | { status: 'unavailable' }
  | { status: 'allowed'; uid: string; access: Extract<HubRoleAccess, { status: 'verified' }> };

type Props = { route: Pick<ModuleRoute, 'allowedRoles'>; children: ReactNode };

/** Ação condicionada ao papel, revalida sessão e vínculos no momento do clique. */
function CheckOwnCampaigns({ uid }: { uid: string }) {
  const [result, setResult] = useState<HubOwnAccessResult | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    setResult(null);
  }, [uid]);

  async function verify() {
    if (pending) return;
    setResult(null);
    setPending(true);
    try {
      setResult(await checkCurrentUserCampaignAccess(uid));
    } catch {
      setResult({ status: 'unavailable' });
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-label="Verificação de vínculos">
      <Button loading={pending} variant="secondary" onClick={() => void verify()}>
        Conferir meus vínculos
      </Button>
      {pending && (
        <OperationFeedback
          state="loading"
          title="Conferindo seus vínculos…"
          message="Somente documentos associados à sessão atual serão consultados."
        />
      )}
      {result?.status === 'ok' && (
        <OperationFeedback
          state="success"
          title="Vínculos confirmados"
          message={`Vínculos ativos confirmados: ${result.activeCampaigns}.`}
        />
      )}
      {result?.status === 'denied' && (
        <OperationFeedback
          state="warning"
          title="Vínculo não confirmado"
          message="Seu perfil ou vínculo não autoriza esta consulta."
        />
      )}
      {result?.status === 'unavailable' && (
        <OperationFeedback
          state="error"
          title="Conferência indisponível"
          message="Não foi possível consultar o Firebase. Tente novamente."
          onRetry={() => void verify()}
        />
      )}
    </section>
  );
}

/**
 * Bloqueia area e acoes de modulo ate resolver Auth e papel no servidor.
 * Pagina publica e laboratorio ficam fora do gate. Nao revela dados privados.
 * Autoridade final sobre documentos continua nas Security Rules do Firestore.
 */
export function ProtectedModuleRoute({ route, children }: Props) {
  const location = useLocation();
  const [state, setState] = useState<GateState>({ status: 'checking' });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    let sequence = 0;
    let unsubscribe: () => void = () => undefined;

    async function check(user: HubSessionIdentity) {
      const current = ++sequence;
      setState({ status: 'checking' });
      try {
        const access = await getHubRoleForCurrentSession(user.uid);
        if (!active || current !== sequence) return;
        if (access.status === 'unavailable') {
          setState({ status: 'unavailable' });
        } else if (
          access.status !== 'verified' ||
          !route.allowedRoles.some((role) => role === access.role)
        ) {
          setState({ status: 'denied' });
        } else {
          setState({ status: 'allowed', uid: user.uid, access });
        }
      } catch {
        if (active && current === sequence) setState({ status: 'unavailable' });
      }
    }

    try {
      unsubscribe = getHubAuthSession().observe(
        (user) => {
          if (!active) return;
          if (!user) {
            ++sequence;
            setState({ status: 'signed-out' });
          } else {
            void check(user);
          }
        },
        () => {
          ++sequence;
          if (active) setState({ status: 'unavailable' });
        },
      );
    } catch {
      setState({ status: 'unavailable' });
    }

    return () => {
      active = false;
      ++sequence;
      unsubscribe();
    };
  }, [location.pathname, revision, route]);

  if (state.status === 'checking') {
    return <HubStateFeedback kind="checking-permissions" />;
  }

  if (state.status === 'signed-out') {
    return (
      <section aria-label="Área protegida do Hub">
        <HubStateFeedback kind="signed-out" />
        <p>
          <HubLink to="/entrar" state={{ from: location.pathname }} variant="primary">
            Entrar no Hub
          </HubLink>
        </p>
      </section>
    );
  }

  if (state.status === 'unavailable') {
    return (
      <section aria-label="Área protegida do Hub">
        <HubStateFeedback
          kind="network-unavailable"
          onRetry={() => setRevision((n) => n + 1)}
        />
      </section>
    );
  }

  if (state.status === 'denied') {
    return (
      <section aria-label="Área protegida do Hub">
        <HubStateFeedback kind="access-denied" />
        <HubLink to="/entrar">Ver minha sessão</HubLink>
      </section>
    );
  }

  return (
    <section data-hub-protected-role={state.access.role}>
      <p className="hub-section-kicker">
        Acesso confirmado: {state.access.role === 'dm' ? 'Mestre' : 'Jogador'}
      </p>
      {children}
      <CheckOwnCampaigns uid={state.uid} />
    </section>
  );
}
