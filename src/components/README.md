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

## Formulários padronizados (2.07)

Campos de texto, área de texto, seleção, checkbox, radio, organização de
formulários e mensagens de validação foram adicionados em [form/](form/).
Leia o [guia de uso](form/README.md) e importe pelo ponto único
`src/components/form/index.ts`.

Os estilos usam exclusivamente tokens aprovados, em `src/styles/forms.css`,
importado uma vez na entrada. A camada consumidora controla valores, regras de
validação, envio e autorização; a biblioteca não salva dados.

## Mensagens de sistema (2.08)

O padrão global de notificações e estados de operação está na pasta
[feedback/](feedback/), com o [guia de uso](feedback/README.md).

O `ToastProvider` integra o AppShell, enquanto `OperationFeedback` reaproveita
o `Alert` da 2.05 para evitar implementações duplicadas. Os estilos usam
exclusivamente os tokens de Anansi em `src/styles/feedback.css`, importado
na entrada da aplicação. Nenhuma mensagem de sucesso é disparada sem uma
ação efetiva do módulo consumidor.

## Revisão transversal de acessibilidade (2.09)

As correções de relacionamento entre abas, isolação de fundo de modais e
gaveta compacta, gestão do foco e título da rota estão detalhadas em
[2.09 — Acessibilidade](../../docs/etapas/etapa-2/2.09-acessibilidade.md).
O código de regressão está em `tests/accessibility.test.tsx` e a verificação
de contraste foi adicionada ao `npm run check` como `npm run verify:a11y`.

## Páginas demonstrativas integradas (2.10)

A galeria de cinco páginas foi criada em `src/app/pages/demo/`, com rotas
específicas em `src/app/demo-routes.ts`. Todas as páginas usam as bibliotecas
existentes e **somente dados fictícios em memória**. O registro de escopo e
testes está em
[2.10 — Páginas demonstrativas](../../docs/etapas/etapa-2/2.10-paginas-demonstrativas.md).

## Padrão obrigatório de desenvolvimento (2.11)

Cada módulo oficial futuro deve utilizar as bibliotecas públicas e atender ao
[contrato arquitetural](../../docs/arquitetura/padrao-obrigatorio-de-desenvolvimento.md).
O comando `npm run verify:design-system`, adicionado ao `npm run check`,
exige manifesto, documentação, testes, rotas autorizadas e impede estilos
ausentes dos tokens e acessos de interface proibidos em novos módulos.
As nove reservas da Etapa 1 continuam apenas com README e não foram ativadas.

## Escopo e testes

A galeria demonstrativa de 2.10 não ativa módulos reais do RPG.
A consistência automática foi revisada no 2.12: **148/148 testes Vitest** e
**24/24 testes do contrato**, além de tipos, lint, formato e build, aprovados
no GitHub Actions. Relatório: docs/etapas/etapa-2/2.12-testes-de-consistencia.md.
A auditoria em dispositivos reais e tecnologias assistivas ainda permanece
pendente; aprovação automatizada não autoriza merge/publicação.

Os testes da biblioteca estão em `tests/components-interaction.test.tsx`,
`tests/data-presentation.test.tsx`, `tests/forms.test.tsx` e
`tests/system-feedback.test.tsx`, `tests/accessibility.test.tsx` e
`tests/demo-pages.test.tsx`.
Não declarar esses testes aprovados até haver execução verificável de CI ou local.
