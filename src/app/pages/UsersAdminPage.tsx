import { useEffect, useState } from 'react';
import { DataTable, type DataColumn } from '../../components/data';
import { HubStateFeedback, OperationFeedback } from '../../components/feedback';
import { SelectField } from '../../components/form';
import { Alert, Button, Card, ConfirmDialog, HubLink } from '../../components/ui';
import {
  getCurrentMasterRoster,
  type MasterRosterEntry,
  type MasterRosterResult,
} from '../../services/users-admin';
import {
  INITIAL_SIMULATED_MEMBERSHIPS,
  SIMULATED_CAMPAIGNS,
  SIMULATED_USERS,
  simulateMembershipChange,
  type SimulatedAction,
  type SimulatedCommand,
  type SimulatedMembership,
} from '../../services/users-admin-simulation';

const columns: readonly DataColumn<MasterRosterEntry>[] = [
  { id: 'name', header: 'Conta existente', cell: (item) => item.displayName },
  {
    id: 'role',
    header: 'Papel confirmado',
    cell: (item) => (item.role === 'dm' ? 'Mestre' : 'Jogador'),
  },
  {
    id: 'memberships',
    header: 'Vínculos no Firestore',
    cell: (item) => (
      <ul>
        {item.memberships.map((relation, index) => (
          <li key={index}>
            {relation.campaign} · {relation.active ? 'Ativo' : 'Inativo'}
            {relation.hasCharacter ? ' · personagem vinculado' : ''}
          </li>
        ))}
        {item.memberships.length === 0 && <li>Sem vínculo registrado</li>}
      </ul>
    ),
  },
];

function ExistingAccountsReadOnly() {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<MasterRosterResult | null>(null);

  useEffect(() => {
    let active = true;
    setResult(null);
    void getCurrentMasterRoster()
      .then((value) => {
        if (active) setResult(value);
      })
      .catch(() => {
        if (active) setResult({ status: 'unavailable' });
      });
    return () => {
      active = false;
    };
  }, [version]);

  return (
    <Card title="Cinco contas existentes — leitura do Firebase" variant="ornate">
      <p>
        Perfis e vínculos consultados somente pelo Mestre autenticado, sem alterar registros. Nenhum
        UID, e-mail técnico ou identificador de campanha é apresentado nesta tela.
      </p>
      {result === null && <HubStateFeedback kind="roster-loading" />}
      {result?.status === 'denied' && <HubStateFeedback kind="roster-denied" />}
      {result?.status === 'incomplete' && <HubStateFeedback kind="roster-incomplete" />}
      {result?.status === 'unavailable' && (
        <HubStateFeedback
          kind="roster-unavailable"
          onRetry={() => setVersion((value) => value + 1)}
        />
      )}
      {result?.status === 'ok' && result.entries.length === 0 && (
        <HubStateFeedback
          kind="roster-empty"
          onRetry={() => setVersion((value) => value + 1)}
        />
      )}
      {result?.status === 'ok' && result.entries.length > 0 && (
        <>
          <p role="status">
            {result.entries.length} perfis conferidos · {result.activeMembershipCount} vínculos
            ativos · {result.campaignCount} campanhas identificadas.
          </p>
          <DataTable
            caption="Perfis e vínculos reais — somente leitura"
            items={result.entries}
            columns={columns}
            getKey={(item) => item.key}
            emptyTitle="Nenhum perfil disponível"
          />
        </>
      )}
      <div className="hub-session-actions">
        <Button variant="secondary" onClick={() => setVersion((value) => value + 1)}>
          Atualizar leitura
        </Button>
        <HubLink to="/entrar">Voltar à conta</HubLink>
      </div>
    </Card>
  );
}

type LaboratoryState = {
  memberships: readonly SimulatedMembership[];
  history: readonly (readonly SimulatedMembership[])[];
  messages: readonly string[];
};

const initialLaboratory: LaboratoryState = {
  memberships: INITIAL_SIMULATED_MEMBERSHIPS,
  history: [],
  messages: [],
};

const actionLabels: Record<SimulatedAction, string> = {
  include: 'Incluir',
  suspend: 'Suspender',
  reactivate: 'Reativar',
  remove: 'Remover',
};

function MembershipLaboratory() {
  const [laboratory, setLaboratory] = useState<LaboratoryState>(initialLaboratory);
  const [userKey, setUserKey] = useState('bruno');
  const [campaignKey, setCampaignKey] = useState(SIMULATED_CAMPAIGNS[0].key);
  const [action, setAction] = useState<SimulatedAction>('suspend');
  const [confirmation, setConfirmation] = useState<SimulatedCommand | null>(null);
  const [notice, setNotice] = useState('');
  const [noticeState, setNoticeState] = useState<'success' | 'warning'>('success');

  const labelsFor = (key: string) =>
    laboratory.memberships
      .filter((item) => item.userKey === key)
      .map((relation) => {
        const campaign = SIMULATED_CAMPAIGNS.find((item) => item.key === relation.campaignKey);
        return (
          (campaign?.name ?? 'Campanha fictícia') + (relation.active ? ' · ativo' : ' · suspenso')
        );
      });

  function confirmLocalChange() {
    if (!confirmation) return;
    const change = simulateMembershipChange(laboratory.memberships, confirmation);
    if (change.status === 'denied') {
      setNoticeState('warning');
      setNotice(change.reason);
    } else {
      setLaboratory((previous) => ({
        memberships: change.memberships,
        history: [...previous.history, previous.memberships],
        messages: [change.description, ...previous.messages].slice(0, 8),
      }));
      setNoticeState('success');
      setNotice(change.description + '. Nenhum dado foi enviado ao Firebase.');
    }
    setConfirmation(null);
  }

  function undo() {
    setLaboratory((previous) => {
      if (previous.history.length === 0) return previous;
      return {
        memberships: previous.history[previous.history.length - 1],
        history: previous.history.slice(0, -1),
        messages: ['Última simulação desfeita no navegador.', ...previous.messages].slice(0, 8),
      };
    });
    setNoticeState('success');
    setNotice('Última simulação desfeita. Nenhum dado real foi alterado.');
  }

  return (
    <Card title="Laboratório de vínculos — 100% fictício">
      <Alert tone="info" title="Modo de simulação">
        Os vínculos, campanhas e alterações abaixo são inventados e mantidos apenas na memória desta
        página. As ações NÃO salvam dados, não criam contas e não usam o Firestore.
      </Alert>
      <DataTable
        caption="Vínculos fictícios para testar administração"
        items={SIMULATED_USERS}
        columns={[
          { id: 'user', header: 'Conta ilustrativa', cell: (item) => item.label },
          {
            id: 'role',
            header: 'Papel no exemplo',
            cell: (item) => (item.role === 'dm' ? 'Mestre (imutável)' : 'Jogador'),
          },
          {
            id: 'campaigns',
            header: 'Campanhas fictícias',
            cell: (item) => labelsFor(item.key).join(' · ') || 'Sem vínculo simulado',
          },
        ]}
        getKey={(item) => item.key}
      />
      <form
        aria-label="Simulação de administração de vínculos"
        onSubmit={(event) => {
          event.preventDefault();
          setNotice('');
          setConfirmation({ userKey, campaignKey, action });
        }}
      >
        <SelectField
          label="Jogador fictício"
          id="hub-sim-user"
          value={userKey}
          onChange={(event) => setUserKey(event.currentTarget.value)}
          options={SIMULATED_USERS.filter((user) => user.role === 'player').map((user) => ({
            value: user.key,
            label: user.label,
          }))}
        />
        <SelectField
          label="Campanha fictícia"
          id="hub-sim-campaign"
          value={campaignKey}
          onChange={(event) => setCampaignKey(event.currentTarget.value as typeof campaignKey)}
          options={SIMULATED_CAMPAIGNS.map((campaign) => ({
            value: campaign.key,
            label: campaign.name,
          }))}
        />
        <SelectField
          label="Ação de teste"
          id="hub-sim-action"
          value={action}
          onChange={(event) => setAction(event.currentTarget.value as SimulatedAction)}
          options={Object.entries(actionLabels).map(([value, label]) => ({ value, label }))}
        />
        <div className="hub-session-actions">
          <Button type="submit" variant="primary">
            Simular alteração
          </Button>
          <Button disabled={laboratory.history.length === 0} onClick={undo} variant="secondary">
            Desfazer última simulação
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setLaboratory(initialLaboratory);
              setNoticeState('success');
              setNotice('Laboratório fictício reiniciado.');
            }}
          >
            Reiniciar laboratório
          </Button>
        </div>
      </form>
      {notice && (
        <OperationFeedback
          state={noticeState}
          title={noticeState === 'success' ? 'Simulação local concluída' : 'Simulação não aplicada'}
          message={notice}
        />
      )}
      {laboratory.messages.length > 0 && (
        <section aria-label="Histórico local das simulações">
          <h4>Histórico local (não persistido)</h4>
          <ol>
            {laboratory.messages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ol>
        </section>
      )}
      <ConfirmDialog
        open={confirmation !== null}
        title="Confirmar somente a simulação"
        description="Esta confirmação altera apenas o exemplo fictício visível nesta página. Não existe gravação no Firebase."
        onClose={() => setConfirmation(null)}
        onConfirm={confirmLocalChange}
        confirmLabel="Confirmar simulação"
        tone="primary"
      />
    </Card>
  );
}

export default function UsersAdminPage() {
  return (
    <section aria-labelledby="hub-users-admin-heading">
      <h2 id="hub-users-admin-heading">Administração de usuários e vínculos</h2>
      <p>
        Área exclusiva do Mestre: consulta dos perfis existentes e ensaio isolado de operações
        futuras. Nenhuma alteração real está habilitada nesta etapa.
      </p>
      <ExistingAccountsReadOnly />
      <MembershipLaboratory />
    </section>
  );
}
