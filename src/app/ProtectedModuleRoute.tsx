import { useEffect, useState, type ReactNode } from 'react';
import { checkCurrentUserCampaignAccess, type HubOwnAccessResult } from '../services/scoped-access';
import { useLocation } from 'react-router-dom';
import { Alert, Button, HubLink } from '../components/ui';
import { getHubAuthSession, type HubSessionIdentity } from '../services/session';
import { getHubRoleForCurrentSession, type HubRoleAccess } from '../services/role-access';
import type { ModuleRoute } from './routes';

type GateState =
  | { status: 'checking' }
  | { status: 'signed-out' }
  | { status: 'denied' }
  | { status: 'unavailable' }
  | { status: 'allowed'; uid: string; access: Extract<HubRoleAccess, { status: 'verified' }> };

type Props = { route: ModuleRoute; children: ReactNode };

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
      {result?.status === 'ok' && (
        <p role="status">Vínculos ativos confirmados: {result.activeCampaigns}.</p>
      )}
      {result?.status === 'denied' && (
        <Alert tone="warning" title="Vínculo não confirmado">
          Seu perfil ou vínculo não autoriza esta consulta.
        </Alert>
      )}
      {result?.status === 'unavailable' && (
        <Alert tone="warning" title="Conferência indisponível">
          Não foi possível consultar o Firebase. Tente novamente.
        </Alert>
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
    let unsubscribe = () => undefined;

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
    return <p role="status">Verificando sessão e permissões no Firebase…</p>;
  }

  if (state.status === 'signed-out') {
    return (
      <section aria-label="Área protegida do Hub">
        <Alert tone="warning" title="Entre para continuar">
          Esta área exige uma sessão autenticada do Hub.
        </Alert>
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
        <Alert tone="warning" title="Não foi possível conferir as permissões">
          A conexão ou a consulta ao Firebase falhou. Nenhum conteúdo protegido foi carregado.
        </Alert>
        <Button onClick={() => setRevision((n) => n + 1)}>Tentar novamente</Button>
      </section>
    );
  }

  if (state.status === 'denied') {
    return (
      <section aria-label="Área protegida do Hub">
        <Alert tone="warning" title="Acesso não autorizado">
          O seu perfil ou vínculo não permite abrir esta área.
        </Alert>
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
