import { Accordion, Badge, Card, HubLink } from '../../../components/ui';
import { ProgressMeter } from '../../../components/data';
import { DemoScaffold } from './DemoScaffold';

export default function DemoOverviewPage() {
  return (
    <DemoScaffold
      title="Laboratório de interface"
      description="Uma visão integrada dos padrões visuais e comportamentais do Hub."
    >
      <div className="hub-demo-grid">
        <Card
          title="Interações"
          description="Controles com estados reais em memória."
          variant="ornate"
          actions={<Badge tone="gold">2.05</Badge>}
        >
          <p>Botões, menus, abas, alertas, diálogos e painéis expansíveis.</p>
          <HubLink to="/laboratorio/componentes">Explorar componentes</HubLink>
        </Card>
        <Card
          title="Dados"
          description="Busca, filtros e ordenação sem servidor."
          actions={<Badge tone="info">2.06</Badge>}
        >
          <p>Uma coleção inteiramente inventada serve de exemplo para as tabelas.</p>
          <HubLink to="/laboratorio/dados">Explorar dados fictícios</HubLink>
        </Card>
        <Card
          title="Formulários"
          description="Validação local sem persistência."
          actions={<Badge tone="success">2.07</Badge>}
        >
          <p>Campos com ajuda, erros, seleção e controle de submissão.</p>
          <HubLink to="/laboratorio/formularios">Explorar formulários</HubLink>
        </Card>
        <Card
          title="Estados de sistema"
          description="Feedback e notificações."
          actions={<Badge tone="warning">2.08</Badge>}
        >
          <p>Estados de sucesso, erro, carregamento e avisos persistentes.</p>
          <HubLink to="/laboratorio/estados">Explorar mensagens</HubLink>
        </Card>
      </div>

      <Card title="Exemplo de progresso — fictício">
        <ProgressMeter
          label="Leitura de um tomo imaginário"
          value={6}
          max={10}
          description="Indicador ilustrativo de 6 entre 10 partes. Não é progresso real."
        />
      </Card>

      <Accordion title="O que esta demonstração não faz">
        <p>
          Não cria personagens, campanhas, sessões, contas ou registros; não utiliza autenticação e
          não acessa Firebase. Os módulos oficiais continuam como páginas reservadas para suas
          próprias etapas.
        </p>
      </Accordion>
    </DemoScaffold>
  );
}
