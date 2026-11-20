# Biblioteca compartilhada de componentes — Teias de Anansi

A partir do item 2.05, a biblioteca de componentes genéricos fica em [ui/](ui/).
Os estilos ficam centralizados em `src/styles/components.css` e consomem os
tokens globais aprovados em `src/styles/tokens.css`.

## Importação

```tsx
import {
  Button, HubLink, Card, Badge, Alert, Tabs,
  ActionMenu, Dialog, ConfirmDialog, Accordion,
} from '../components/ui';
```

Ajuste o caminho conforme a posição do módulo. Para componentes do próprio
Hub (sem regras de jogo), use a biblioteca e não reproduza CSS ou JSX paralelo.

## Componentes

| Nome | Uso principal |
| --- | --- |
| `Button` | Ações locais, com variants `primary`, `secondary`, `ghost`, `danger`, opção `loading`, `disabled` e tamanhos `sm/md` |
| `HubLink` | Rotas internas via `to` (React Router) ou URLs externas via `href`; `target="_blank"` recebe `noopener noreferrer` |
| `Card` | Conteúdo em superfície padronizada, variante `default` ou `ornate`, título e ações opcionais |
| `Badge` | Etiqueta visual que também precisa conter texto; `neutral/gold/success/warning/danger/info` |
| `Alert` | Aviso com título, conteúdo, tom e fechamento opcional; usa `alert` para perigo/aviso e `status` nos demais |
| `Tabs` | Abas acessíveis, escolha controlada por `value` ou interna por `defaultValue`, setas, Home e End |
| `ActionMenu` | Menu de ações por botão, com setas, Home, End, Escape, clique fora e itens desabilitados |
| `Dialog` | Janela controlada, com foco inicial, ciclo de Tab, Escape, fundo clicável e restauração do foco |
| `ConfirmDialog` | Confirmação explícita; `onConfirm` deve persistir/fechar pela camada que o utiliza |
| `Accordion` | Painel expansível nativo com `details`/`summary` e ativação por teclado |

## Regras de uso

1. Use `Button` para ações e `HubLink` para navegação; nunca um link fictício com comportamento de botão.
2. `type="button"` é o padrão de `Button`. Para formulários futuros, passe explicitamente `type="submit"`.
3. Não use cores como única fonte de informação: badges e alertas precisam de texto explícito.
4. A variante `danger` representa ação destrutiva: confirmar antes de excluir e fazer autorização no serviço.
5. `Dialog` e `ConfirmDialog` não fazem acesso à rede, salvam informações ou alteram dados por conta própria. O pai controla `open`.
6. `ConfirmDialog` não fecha automaticamente ao confirmar; a camada que executa a ação deve atualizar o estado após concluir a operação.
7. IDs das abas e itens de menu precisam ser únicos em sua coleção. Os itens de abas desabilitados não recebem foco por setas.
8. O modo `loading` de botões bloqueia cliques repetidos; o estado deve ser controlado por quem chama.
9. Os componentes são agnósticos de domínio, sem autenticação, Firestore, regras de RPG ou dados reais.
10. Não crie versões paralelas por módulo sem justificar e aprovar uma exceção. A política definitiva será ampliada em 2.11.

## Exemplos

```tsx
<Button variant="primary" onClick={abrirFormulario}>
  Novo personagem
</Button>

<HubLink to="/biblioteca" variant="secondary">Biblioteca</HubLink>

<Badge tone="warning">Pendente</Badge>

<Accordion title="Notas da aventura">
  <p>Detalhes opcionais.</p>
</Accordion>

<Tabs
  label="Informações do personagem"
  items={[
    { id: 'resumo', label: 'Resumo', content: <p>Dados gerais.</p> },
    { id: 'notas', label: 'Notas', content: <p>Anotações.</p> },
  ]}
/>
```

## Componentes de apresentação de dados (2.06)

A biblioteca de tabelas, listas, buscas, filtros, ordenação, paginação,
progresso e estados vazios/carregamento está em [data/](data/).
Consulte o [guia de apresentação de dados](data/README.md) e importe
os componentes por `src/components/data/index.ts`.

Os novos estilos ficam exclusivamente em `src/styles/data.css`,
importados uma única vez na entrada da aplicação. Os módulos deverão
fornecer seus registros **após** a verificação de permissões;
a biblioteca não consulta Firebase.

## Escopo e testes

Os componentes são a entrega 2.05, mas a galeria de páginas demonstrativas
fica reservada ao item 2.10. Formulários completos, tabelas e mensagens de
sistema avançadas permanecem para 2.06–2.08. Acessibilidade aprofundada
ainda requer a auditoria 2.09 e a verificação global 2.12.

Os cenários de comportamento estão em `tests/components-interaction.test.tsx`.
Não declarar esses testes aprovados até haver execução verificável de CI ou local.
