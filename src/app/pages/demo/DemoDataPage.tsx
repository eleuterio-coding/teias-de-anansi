import { useState } from 'react';
import {
  DataExplorer,
  ProgressMeter,
  type DataColumn,
} from '../../../components/data';
import { Badge, Button, Card } from '../../../components/ui';
import { DemoScaffold } from './DemoScaffold';

type ExampleRecord = {
  id: string;
  title: string;
  category: 'tomo' | 'mapa' | 'relato';
  pages: number;
  reviewed: boolean;
};

const exampleRecords: readonly ExampleRecord[] = [
  { id: 'a', title: 'Tomo das Marés', category: 'tomo', pages: 18, reviewed: true },
  { id: 'b', title: 'Mapa do Vale Nebuloso', category: 'mapa', pages: 3, reviewed: false },
  { id: 'c', title: 'Relato da Primeira Ponte', category: 'relato', pages: 12, reviewed: true },
  { id: 'd', title: 'Tomo dos Sinos', category: 'tomo', pages: 26, reviewed: false },
  { id: 'e', title: 'Mapa das Sete Trilhas', category: 'mapa', pages: 8, reviewed: true },
  { id: 'f', title: 'Relato de Pedra Clara', category: 'relato', pages: 11, reviewed: false },
  { id: 'g', title: 'Tomo dos Jardins', category: 'tomo', pages: 31, reviewed: true },
  { id: 'h', title: 'Mapa do Arquipélago', category: 'mapa', pages: 7, reviewed: false },
  { id: 'i', title: 'Relato do Farol', category: 'relato', pages: 14, reviewed: true },
  { id: 'j', title: 'Tomo da Lua Pálida', category: 'tomo', pages: 20, reviewed: false },
  { id: 'k', title: 'Mapa da Estrada Antiga', category: 'mapa', pages: 5, reviewed: true },
  { id: 'l', title: 'Relato do Bosque Velado', category: 'relato', pages: 9, reviewed: false },
];

const categoryLabels: Record<ExampleRecord['category'], string> = {
  tomo: 'Tomo',
  mapa: 'Mapa',
  relato: 'Relato',
};

const columns: DataColumn<ExampleRecord>[] = [
  {
    id: 'title',
    header: 'Título',
    cell: (record) => record.title,
    sortValue: (record) => record.title,
  },
  {
    id: 'category',
    header: 'Categoria',
    cell: (record) => categoryLabels[record.category],
    sortValue: (record) => categoryLabels[record.category],
  },
  {
    id: 'pages',
    header: 'Páginas',
    cell: (record) => record.pages,
    sortValue: (record) => record.pages,
    align: 'end',
  },
  {
    id: 'reviewed',
    header: 'Estado',
    cell: (record) => (
      <Badge tone={record.reviewed ? 'success' : 'warning'}>
        {record.reviewed ? 'Revisado' : 'Rascunho'}
      </Badge>
    ),
    sortValue: (record) => Number(record.reviewed),
  },
];

export default function DemoDataPage() {
  const [displayMode, setDisplayMode] = useState<'records' | 'empty' | 'loading'>(
    'records',
  );
  const items = displayMode === 'records' ? exampleRecords : [];

  return (
    <DemoScaffold
      title="Apresentação de dados"
      description="Coleções inventadas para avaliar busca, filtros, tabelas e listas."
    >
      <Card title="Alternar os estados do conjunto">
        <div className="hub-demo-actions" role="group" aria-label="Estados da coleção">
          <Button
            variant={displayMode === 'records' ? 'primary' : 'secondary'}
            aria-pressed={displayMode === 'records'}
            onClick={() => setDisplayMode('records')}
          >
            12 registros fictícios
          </Button>
          <Button
            variant={displayMode === 'empty' ? 'primary' : 'secondary'}
            aria-pressed={displayMode === 'empty'}
            onClick={() => setDisplayMode('empty')}
          >
            Coleção vazia
          </Button>
          <Button
            variant={displayMode === 'loading' ? 'primary' : 'secondary'}
            aria-pressed={displayMode === 'loading'}
            onClick={() => setDisplayMode('loading')}
          >
            Simular carregamento
          </Button>
        </div>
        <p className="hub-demo-help">
          A opção de carregamento é uma simulação visual: não existe requisição
          ao servidor. Os registros são constantes no próprio código.
        </p>
      </Card>

      <DataExplorer
        items={items}
        columns={columns}
        getKey={(record) => record.id}
        label="Acervo demonstrativo de tomos e mapas"
        searchText={(record) => record.title}
        filter={{
          label: 'Categoria',
          getValue: (record) => record.category,
          options: [
            { value: 'tomo', label: 'Tomos' },
            { value: 'mapa', label: 'Mapas' },
            { value: 'relato', label: 'Relatos' },
          ],
        }}
        renderListItem={(record) => (
          <div className="hub-demo-list-entry">
            <div>
              <strong>{record.title}</strong>
              <p>{categoryLabels[record.category]} · {record.pages} páginas</p>
            </div>
            <Badge tone={record.reviewed ? 'success' : 'warning'}>
              {record.reviewed ? 'Revisado' : 'Rascunho'}
            </Badge>
          </div>
        )}
        pageSize={5}
        loading={displayMode === 'loading'}
      />

      <Card title="Exemplo de indicador">
        <ProgressMeter
          label="Itens fictícios revisados"
          value={6}
          max={12}
          description="6 de 12 registros inventados possuem a etiqueta Revisado."
        />
      </Card>
    </DemoScaffold>
  );
}
