# Mensagens de sistema — Etapa 2.08

Biblioteca compartilhada para notificação global e estado de operações no
**Teias de Anansi 2.0**. Ela não consulta Firebase, não faz alterações remotas
nem simula salvamento. Estilos exclusivamente em `src/styles/feedback.css`,
usando os tokens globais da Etapa 2.02.

## Estrutura

- `ToastProvider`: um provedor global integrado a `AppContent`, envolvendo
  o AppShell e todas as rotas.
- `useToast`: hook com ações `notify`, `dismiss` e `clear`.
- `ToastNotice`: componente interno de notificação temporária ou persistente,
  com controle de foco, temporizador e pausa durante leitura.
- `OperationFeedback`: apresenta estado `idle`, `loading`,
  `success`, `warning` ou `error`, reutilizando `Alert` da 2.05.
- `Alert` (2.05) permanece disponível para avisos persistentes no corpo da
  página; `ConfirmDialog` (2.05) permanece o padrão para confirmação.

## Contrato das notificações

```tsx
import { useToast } from '../../components/feedback';

function Exemplo() {
  const { notify, dismiss, clear } = useToast();

  function concluirOperacaoLocal() {
    // Exemplo: a operação de domínio deve ser concluída ANTES de anunciar sucesso.
    const id = notify({
      tone: 'success',
      title: 'Operação concluída',
      message: 'Os dados foram atualizados.',
    });
    // dismiss(id) remove uma notificação específica.
    // clear() elimina as notificações da fila, quando necessário.
    void id;
    void dismiss;
    void clear;
  }

  return <button onClick={concluirOperacaoLocal}>Concluir exemplo</button>;
}
```

O trecho é ilustrativo, não está montado em uma rota e não confirma que
qualquer registro real foi salvo.

| Tom | Papel de acessibilidade | Duração padrão |
| --- | --- | --- |
| `info` | `status` / anúncio não intrusivo | 6500 ms |
| `success` | `status` / anúncio não intrusivo | 6500 ms |
| `warning` | `alert` / anúncio prioritário | Persistente até dispensar |
| `danger` | `alert` / anúncio prioritário | Persistente até dispensar |

`durationMs` pode ser definido entre 0 e 60000 ms; `0` mantém a mensagem
até dispensa. Valores não finitos recorrem ao padrão do tom.
Avisos usam **título e mensagem em texto**, nunca exclusivamente cor.

**Atenção:** o consumidor deve evitar inundar a fila com avisos redundantes.
O provedor exibe até **três notificações simultâneas**, mantendo as seguintes
em ordem de chegada até haver espaço. Mensagens críticas persistentes podem
bloquear a visualização de mensagens posteriores enquanto não forem
dispensadas. Para erros de formulário, prefira `FormErrorSummary` (2.07).

## Acessibilidade

- Toast não recebe foco automaticamente e não interrompe digitação.
- Botão **Fechar** sempre possui nome acessível próprio.
- Temporizadores param durante hover, foco ou quando a página não está
  visível; o tempo restante é retomado ao voltar a interagir com a página.
- Mensagens críticas não são removidas por temporizador por padrão.
- Não anunciar segredos, tokens, dados privados, conteúdos pessoais ou
  informações confidenciais em toasts.
- O CSS é responsivo e respeita `prefers-reduced-motion`.
- O modal `ConfirmDialog` continua necessário quando o usuário precisa
  decidir antes de uma ação irreversível; toast não substitui confirmação.

## Feedback de operação

```tsx
import { OperationFeedback } from '../../components/feedback';

<OperationFeedback
  state="error"
  title="Não foi possível concluir"
  message="Tente novamente."
  onRetry={repetirOperacao}
/>
```

- `idle`: nada é renderizado.
- `loading`: estado `status` com mensagem e indicador sem percentual
  inventado.
- `success` e `warning`: usam `Alert` já padronizado.
- `error`: aviso persistente; botão de repetição aparece somente se
  `onRetry` for fornecido. **Não** executa retry automaticamente.
- A camada consumidora determina se uma operação realmente terminou ou
  falhou; o componente não consulta nem altera o estado de um servidor.

## Integração e validação

- `src/app/App.tsx`: `ToastProvider` envolve o layout e as rotas.
- `src/app/LoadingState.tsx`: estado global de carregamento reutilizado.
- `src/app/PageErrorBoundary.tsx`: falha de página e retry usando o mesmo
  padrão de feedback; link de retorno à home permanece operacional.
- `src/app/main.tsx`: `feedback.css` importado uma vez.
- `tests/system-feedback.test.tsx`: cenários de foco, duração, fila,
  prioridade, fechamento e estados operacionais.

A suíte automatizada foi validada em CI nas Etapas 2 e 3. A inspeção visual e a navegação com tecnologias assistivas em navegador real seguem pendentes; aprovação de CI não substitui homologação visual.

## Integração da Etapa 3.08

- `HubStateFeedback`: catálogo fixo e seguro de estados de carregamento, sessão ausente, papel negado, indisponibilidade de rede, inventário incompleto e lista vazia; mapeado para `OperationFeedback` ou `EmptyState`.
- `src/services/feedback-messages.ts`: somente textos de autenticação previamente aprovados podem atravessar a fronteira do SDK; exceções arbitrárias são convertidas em mensagem genérica, sem expor UID, e-mail técnico, caminho privado ou stack.
- `LoginPage`: formulário mantém `FormErrorSummary`, mensagens de autenticação seguras, espera de Auth e verificação de papel com feedback acessível, sem criar novos fluxos de login.
- `ProtectedModuleRoute`: avisos consistentes para logout, negação e falha; botão de retry executa nova verificação **apenas após clique**, nunca automaticamente.
- `UsersAdminPage`: carregamento, permissão negada, inventário inconsistente, indisponibilidade e vazio; operação simulada apresenta sucesso/aviso e nunca anuncia gravação remota.

Evidência: [item 3.08](../../docs/etapas/etapa-3/3.08-estados-e-feedback.md). Testes com mocks e Firestore Emulator fictício, sem alterar Firebase de produção.
