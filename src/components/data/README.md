# Apresentação de dados — Etapa 2.06

Biblioteca compartilhada e tipada para **registros já autorizados e carregados**
pela página. Não acessa Firebase, não autentica usuários e não persiste dados.
Consulte o [registro da etapa](../../../docs/etapas/etapa-2/2.06-apresentacao-de-dados.md)
para critérios de aceite, limitações e evidências.

## Importação

```tsx
import {
  DataExplorer,
  DataTable,
  DataList,
  SearchField,
  FilterSelect,
  Pagination,
  ProgressMeter,
  EmptyState,
  DataLoading,
  type DataColumn,
} from '../../components/data';
```

## Interfaces

| Componente | Props essenciais |
| --- | --- |
| `DataTable<T>` | `items`, `columns`, `getKey`, `caption`, `sort`, `onSortChange`, `loading` |
| `DataList<T>` | `items`, `label`, `getKey`, `renderItem`, `loading` |
| `SearchField` | `label`, `value`, `onChange`, `disabled` |
| `FilterSelect` | `label`, `value`, `options`, `onChange` |
| `Pagination` | `page`, `pageSize`, `totalItems`, `onPageChange` |
| `ProgressMeter` | `label`, `value`, `max` |
| `EmptyState` | `title`, `description`, `action` |
| `DataLoading` | `message` opcional |
| `DataExplorer<T>` | `items`, `columns`, `getKey`, `label`, `searchText`, `filter`, `pageSize`, `renderListItem`, `loading` |

`getKey` deve devolver **chave estável e única** por registro, derivada do
identificador do registro, nunca do índice de apresentação.

Cada coluna tem `id` único, `header` textual, `cell(item)` e, para
ordenação, `sortValue(item)` que retorna string/número ou vazio. Campos
complexos renderizados não devem ser usados como chave de ordenação.

O `DataExplorer` é um controlador **local**. Sua busca é limitada ao valor
explicitamente devolvido pela função `searchText` e ignora acentuação e
maiúsculas/minúsculas. Um filtro categórico opcional e a ordenação local são
aplicados antes da paginação. A página responsável fornece somente os
registros que o usuário tem permissão para visualizar.

O estado `loading` evita interpretar como "vazio" o conjunto temporariamente
não carregado. Não usar `loading=false` e `items=[]` durante uma requisição
pendente.

## Contrato visual

- CSS único em `src/styles/data.css`, importado em `src/app/main.tsx`.
- Sem cores hexadecimais, texturas ou paletas independentes.
- Tabelas podem rolar horizontalmente dentro de região identificada e com foco.
- Itens ordenáveis usam botões e `aria-sort`.
- Dados/estados são identificados por texto, não somente por cor.
- Uso de `ProgressMeter` para progresso conhecido, sem inventar percentuais.
- Áreas de exibição permanecem limpas para preservar legibilidade.
- As páginas demonstrativas ficam para 2.10.

## Validação

Os testes com objetos **fictícios em memória** estão em
`tests/data-presentation.test.tsx`. A execução automatizada completa e a
inspeção em navegadores reais continuam pendentes enquanto não forem
confirmadas com evidências.
