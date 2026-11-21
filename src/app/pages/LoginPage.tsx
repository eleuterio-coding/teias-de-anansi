import { useEffect, useRef, useState } from 'react';
import { FormErrorSummary, FormPanel, TextField } from '../../components/form';
import {
  getHubRoleForCurrentSession,
  type HubRoleAccess,
} from '../../services/role-access';
import { Alert, Button, Card, HubLink } from '../../components/ui';
import {
  getHubAuthSession,
  HubAuthError,
  type HubAuthDriver,
  type HubSessionIdentity,
} from '../../services/session';

type SessionView =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; identity: HubSessionIdentity }
  | { status: 'error'; message: string };

const genericMessage = 'Não foi possível concluir o acesso agora. Tente novamente.';

/**
 * A UI so consulta a fachada de servico para permissao. O papel de interface
 * deriva de Auth + perfil + memberships de servidor; nunca somente do nome.
 * Acesso efetivo a documentos/rotas fica para os itens 3.05 e 3.06.
 */
export default function LoginPage() {
  const [session, setSession] = useState<SessionView>({ status: 'loading' });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [roleRevision, setRoleRevision] = useState(0);
  const [roleResult, setRoleResult] = useState<{
    uid: string;
    revision: number;
    access: HubRoleAccess;
  } | null>(null);
  const [operationError, setOperationError] = useState('');
  const driverRef = useRef<HubAuthDriver | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => undefined;
    try {
      const driver = getHubAuthSession();
      driverRef.current = driver;
      unsubscribe = driver.observe(
        (user) => {
          if (!active) return;
          setRoleResult(null);
          setRoleRevision((revision) => revision + 1);
          setSession(user ? { status: 'signed-in', identity: user } : { status: 'signed-out' });
          setOperationError('');
        },
        (message) => {
          if (active) setSession({ status: 'error', message });
        },
      );
    } catch {
      setSession({
        status: 'error',
        message: 'A conexão do Hub não está disponível nesta prévia.',
      });
    }

    return () => {
      active = false;
      driverRef.current = null;
      unsubscribe();
    };
  }, [retryCount]);

  const authenticatedUid = session.status === 'signed-in' ? session.identity.uid : null;
  useEffect(() => {
    if (!authenticatedUid) return;
    let active = true;
    const uid = authenticatedUid;
    void getHubRoleForCurrentSession(uid)
      .then((access) => {
        if (active) setRoleResult({ uid, revision: roleRevision, access });
      })
      .catch(() => {
        if (active) setRoleResult({ uid, revision: roleRevision, access: { status: 'unavailable' } });
      });
    return () => {
      active = false;
    };
  }, [authenticatedUid, roleRevision]);

  const usernameError = submitted && !username.trim() ? 'Informe seu usuário.' : '';
  const passwordError = submitted && !password ? 'Informe sua senha.' : '';

  async function submitLogin() {
    setSubmitted(true);
    setOperationError('');
    if (!username.trim() || !password || !driverRef.current || pending) return;
    setPending(true);
    try {
      await driverRef.current.signIn(username, password);
      // O onAuthStateChanged publica o estado confirmado e restaurado pelo SDK.
      setPassword('');
    } catch (error) {
      setOperationError(error instanceof HubAuthError ? error.message : genericMessage);
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    if (!driverRef.current || pending) return;
    setPending(true);
    setOperationError('');
    try {
      await driverRef.current.signOut();
      // O observador confirma a saída real.
    } catch (error) {
      setOperationError(error instanceof HubAuthError ? error.message : genericMessage);
    } finally {
      setPending(false);
    }
  }

  if (session.status === 'loading') {
    return <div role="status">Verificando sua sessão existente…</div>;
  }

  if (session.status === 'error') {
    return (
      <div className="hub-login-panel">
        <Alert tone="danger" title="Acesso indisponível">
          {session.message}
        </Alert>
        <div className="hub-session-actions">
          <Button
            variant="secondary"
            onClick={() => {
              setSession({ status: 'loading' });
              setRetryCount((count) => count + 1);
            }}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (session.status === 'signed-in') {
    return (
      <section className="hub-login-panel" aria-labelledby="hub-session-title">
        <Card title="Sessão ativa" variant="ornate">
          <p id="hub-session-title">Conta conectada: {session.identity.displayName}.</p>
          {!session.identity.knownAccount && (
            <Alert tone="warning" title="Conta não reconhecida">
              A conta existe no Firebase, mas seu perfil ainda precisa de validação no Hub.
            </Alert>
          )}
          {(() => {
            const access =
              roleResult?.uid === session.identity.uid &&
              roleResult.revision === roleRevision
                ? roleResult.access
                : null;
            if (access === null) {
              return <p role="status">Conferindo perfil e vínculos no Firebase…</p>;
            }
            if (access.status === 'unavailable') {
              return (
                <Alert tone="warning" title="Permissões indisponíveis">
                  Não foi possível conferir as permissões com o Firebase. Acesso às áreas
                  associadas ao papel suspenso até nova verificação.
                </Alert>
              );
            }
            if (access.status === 'denied') {
              return (
                <Alert tone="warning" title="Perfil não autorizado">
                  Sua sessão está autenticada, mas não há um papel confirmado pelos perfis
                  e vínculos existentes. Nenhuma permissão foi concedida.
                </Alert>
              );
            }
            return (
              <>
                <p>
                  Perfil confirmado: <strong>{access.role === 'dm' ? 'Mestre' : 'Jogador'}</strong>
                  {' · '}
                  {access.displayName}.
                </p>
                <p>
                  {access.campaignCount === 1
                    ? '1 vínculo ativo confirmado.'
                    : access.campaignCount + ' vínculos ativos confirmados.'}
                </p>
                {access.role === 'dm' ? (
                  <nav aria-label="Ações do Mestre" className="hub-session-actions">
                    <HubLink to="/campanhas" variant="primary">
                      Abrir Campanhas
                    </HubLink>
                    <HubLink to="/personagens" variant="secondary">
                      Abrir Personagens
                    </HubLink>
                  </nav>
                ) : (
                  <nav aria-label="Ações do Jogador" className="hub-session-actions">
                    <HubLink to="/area-jogador" variant="primary">
                      Abrir Área do jogador
                    </HubLink>
                    <HubLink to="/personagens" variant="secondary">
                      Abrir Personagens
                    </HubLink>
                  </nav>
                )}
                <p>
                  Estas seções ainda são prévias sem dados privados. Permissões de leitura e
                  escrita serão verificadas nas próximas etapas.
                </p>
              </>
            );
          })()}
          {operationError && (
            <Alert tone="danger" title="Não foi possível sair">
              {operationError}
            </Alert>
          )}
          <div className="hub-session-actions">
            <Button variant="secondary" onClick={() => setRoleRevision((revision) => revision + 1)}>
              Atualizar permissões
            </Button>
            <Button variant="primary" onClick={() => void logout()} loading={pending}>
              Sair da conta
            </Button>
            <HubLink to="/">Voltar ao início</HubLink>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="hub-login-panel" aria-label="Entrada no Hub de RPG">
      <FormPanel
        title="Entrar no Teias de Anansi"
        description="Use o mesmo nome de usuário e a mesma senha do Hub anterior."
        onSubmit={() => void submitLogin()}
        footer={
          <Button type="submit" variant="primary" loading={pending}>
            Entrar
          </Button>
        }
      >
        <FormErrorSummary
          errors={[
            ...(usernameError
              ? [{ fieldId: 'hub-login-username', label: 'Usuário', message: usernameError }]
              : []),
            ...(passwordError
              ? [{ fieldId: 'hub-login-password', label: 'Senha', message: passwordError }]
              : []),
          ]}
        />
        {operationError && (
          <Alert tone="danger" title="Não foi possível entrar">
            {operationError}
          </Alert>
        )}
        <TextField
          id="hub-login-username"
          name="username"
          label="Usuário"
          autoComplete="username"
          placeholder="Seu nome de usuário"
          required
          disabled={pending}
          value={username}
          error={usernameError}
          onChange={(event) => {
            setUsername(event.currentTarget.value);
            setOperationError('');
          }}
        />
        <TextField
          id="hub-login-password"
          name="password"
          type="password"
          label="Senha"
          autoComplete="current-password"
          required
          disabled={pending}
          value={password}
          error={passwordError}
          onChange={(event) => {
            setPassword(event.currentTarget.value);
            setOperationError('');
          }}
        />
        <p>
          O Hub não exige novo cadastro, e-mail pessoal ou troca de senha. A sessão é mantida neste
          navegador até você sair.
        </p>
      </FormPanel>
    </section>
  );
}
