import { useState } from 'react';
import {
  Accordion,
  ActionMenu,
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  HubLink,
  Tabs,
} from '../../../components/ui';
import { useToast } from '../../../components/feedback';
import { DemoScaffold } from './DemoScaffold';

const sampleTabs = [
  {
    id: 'descricao',
    label: 'Descrição',
    content: <p>O Tomo do Vento é uma obra inteiramente inventada para esta galeria.</p>,
  },
  {
    id: 'indisponivel',
    label: 'Bloqueada',
    disabled: true,
    content: <p>Esta aba não está disponível.</p>,
  },
  {
    id: 'notas',
    label: 'Notas',
    content: <p>Os componentes mantêm a mesma identidade em todas as páginas.</p>,
  },
];

export default function DemoComponentsPage() {
  const [counter, setCounter] = useState(0);
  const [selectedAction, setSelectedAction] = useState('Nenhuma ação realizada.');
  const [alertVisible, setAlertVisible] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { notify } = useToast();

  return (
    <DemoScaffold
      title="Componentes de interação"
      description="Controles realmente interativos, mas limitados ao estado desta página."
    >
      <div className="hub-demo-grid">
        <Card title="Botões e etiquetas" description="Ações e estados sem gravação.">
          <div className="hub-demo-actions">
            <Button variant="primary" onClick={() => setCounter((value) => value + 1)}>
              Somar ponto
            </Button>
            <Button variant="secondary" onClick={() => setCounter(0)}>
              Reiniciar
            </Button>
            <Button variant="ghost" onClick={() => setDialogOpen(true)}>
              Abrir janela
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Solicitar confirmação
            </Button>
            <Button disabled>Indisponível</Button>
          </div>
          <p className="hub-demo-result" role="status">
            Contador local: <strong>{counter}</strong>
          </p>
          <div className="hub-demo-actions">
            <Badge tone="success">Exemplo concluído</Badge>
            <Badge tone="warning">Atenção fictícia</Badge>
            <Badge tone="danger">Erro ilustrativo</Badge>
            <Badge tone="info">Informação</Badge>
          </div>
        </Card>

        <Card title="Menu de ações" description="Teclado, Escape e opções desabilitadas.">
          <ActionMenu
            label="Ações do tomo de exemplo"
            items={[
              {
                id: 'inspecionar',
                label: 'Inspecionar',
                onSelect: () => setSelectedAction('Inspeção local selecionada.'),
              },
              {
                id: 'editar',
                label: 'Editar',
                disabled: true,
                onSelect: () => undefined,
              },
              {
                id: 'marcar',
                label: 'Marcar como exemplo',
                onSelect: () => setSelectedAction('Exemplo marcado apenas na tela.'),
              },
            ]}
          />
          <p className="hub-demo-result" role="status">
            {selectedAction}
          </p>
          <HubLink to="/laboratorio/dados">Abrir página de dados</HubLink>
        </Card>
      </div>

      <Card title="Abas" description="Setas, Home e End alternam conteúdos.">
        <Tabs label="Informações de um tomo fictício" items={sampleTabs} />
      </Card>

      <div className="hub-demo-grid">
        <Card title="Alertas contextuais">
          {alertVisible ? (
            <Alert
              title="Aviso de demonstração"
              tone="info"
              onDismiss={() => setAlertVisible(false)}
            >
              Este aviso existe somente para testar o componente compartilhado.
            </Alert>
          ) : (
            <Button variant="secondary" onClick={() => setAlertVisible(true)}>
              Mostrar aviso novamente
            </Button>
          )}
        </Card>
        <Card title="Painel expansível">
          <Accordion title="Ler uma anotação fictícia">
            <p>
              Esta anotação não é um registro de campanha. O painel pode ser aberto e fechado por
              teclado ou toque.
            </p>
          </Accordion>
        </Card>
      </div>

      <Dialog
        open={dialogOpen}
        title="Janela de demonstração"
        description="Exemplo de diálogo acessível, sem persistência."
        onClose={() => setDialogOpen(false)}
        footer={
          <Button variant="primary" onClick={() => setDialogOpen(false)}>
            Entendi
          </Button>
        }
      >
        <p>A janela mantém o foco em seus controles e não altera registros.</p>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Reiniciar contador fictício?"
        description="A única alteração será no contador local desta página."
        confirmLabel="Reiniciar contador"
        tone="danger"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setCounter(0);
          setConfirmOpen(false);
          notify({
            tone: 'info',
            title: 'Exemplo reiniciado',
            message: 'Somente o contador local foi zerado.',
          });
        }}
      />
    </DemoScaffold>
  );
}
