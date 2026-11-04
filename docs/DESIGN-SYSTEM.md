# Design System — Teias de Anansi

> Etapa 2 — fundacao visual centralizada, sem redesenho e sem mudanca de comportamento.
> Branch de trabalho: `refactor/design-system-global-etapa-2`.

## Objetivo e limites desta etapa

Consolidar os valores visuais que ja existiam no HUB em um unico arquivo CSS:
[`hub-design-tokens.css`](../hub-design-tokens.css). A criacao de componentes
visuais reutilizaveis e a eliminacao de regras antigas/duplicadas em cada modulo
pertencem a Etapa 3. Esta etapa **nao altera** HTML, dados, navegacao, permissoes,
JavaScript de producao ou persistencia.

O tema atual continua composto por:
- **Shell escuro** (menu lateral, barra superior, paineis e areas interativas).
- **Superficies claras de leitura** somente onde o projeto ja as utiliza.
- Identidade azul e feedback verde/vermelho existentes.

## Fonte unica: `hub-design-tokens.css`

| Familia | Tokens | Valores mantidos |
| --- | --- | --- |
| Fundo e superficie | `--hub-bg`, `--hub-bg-raised`, `--hub-sidebar`, `--hub-surface`, `--hub-surface-2`, `--hub-surface-3` | #080d14, #0c131d, #09111a, #101923, #131f2b, #182634 |
| Texto e borda | `--hub-text`, `--hub-text-2`, `--hub-muted`, `--hub-border`, `--hub-border-soft` | #f4f7fb, #c5cfdb, #8290a3, #223245, #1a2837 |
| Destaque e estados | `--hub-accent`, `--hub-accent-2`, `--hub-accent-soft`, `--hub-focus`, `--hub-green`, `--hub-green-soft`, `--hub-red` | Preservados do tema original |
| Leitura | `--hub-reader-bg`, `--hub-reader-paper`, `--hub-reader-ink`, `--hub-reader-border`, `--hub-reader-muted` | Preservados de `hub-layout.css` |
| Espacamento | `--hub-space-1` a `--hub-space-6` | 4, 8, 12, 16, 24 e 32 px |
| Cantos | `--hub-radius`, `--hub-radius-sm`, `--hub-control-radius`, `--hub-panel-radius` | 14, 10, 10 e 14 px |
| Tipografia | `--hub-font-sans` | Inter, fontes de sistema e Segoe UI |
| Shell | `--hub-sidebar-width`, `--hub-topbar-height`, `--hub-touch`, `--hub-sticky-offset` | 258, 64, 44 e 0 px |
| Sombra | `--hub-shadow` | `0 18px 50px rgba(0,0,0,.22)` |

O menu lateral permanece com **220 px em larguras de ate 980 px**;
a navegacao movel permanece governada pelas regras ja existentes em
`hub-ux.css`. O breakpoint foi movido para o arquivo de tokens sem alterar
a condicao ou os valores.

## Pontos de integracao

- `hub-ux.css`: importa os tokens, mantem o tema, os seletores e todas as
  regras de composicao existentes.
- `hub-layout.css`: importa os mesmos tokens, mantem as regras de layout
  e de componentes existentes, sem duplicar a declaracao de variaveis.
- `biblioteca-light.css`: importa os tokens e utiliza a mesma familia de
  fontes do shell; preserva as diferencas de leitura de seus catalogos.
- `site-light.css`: **nao alterado**. Continua atendendo a compatibilidade
  das telas legadas. A alteracao do seu escopo exige auditoria propria.
- `scripts/app-shell.js` e `scripts/hub-ux.js`: **nao alterados**.

Os tres imports garantem disponibilidade independente em paginas carregadas
diretamente e nos modulos de biblioteca gerados pelo carregador legado.
O navegador pode requisitar o mesmo arquivo em diferentes folhas; o cache
HTTP evita transferencias repetidas.

## Contrato para novas areas

1. Reutilizar `var(--hub-*)` para qualquer valor global correspondente.
2. Nao redefinir tokens globais em estilos locais. Criar excecoes somente
   com justificativa e escopo de componente explicitos.
3. Adotar `--hub-font-sans` em novas telas com tipografia do produto.
4. Nao substituir a paleta de leitura por fundos escuros indiscriminadamente.
5. Preservar `aria-*`, foco visivel e alvo de toque minimo de 44 px.
6. Validar desktop, mobile, Mestre e Jogador antes de publicar alteracoes.

Exemplo:

```css
.meu-componente {
  color: var(--hub-text);
  background: var(--hub-surface);
  border: 1px solid var(--hub-border);
  border-radius: var(--hub-radius);
  padding: var(--hub-space-4);
}
```

## Verificacoes desta etapa

Teste estatico local, sem necessidade de servidor:

```sh
node --test tests/design-system-tokens.test.mjs
```

Regressao existente em navegador (requer dependencias/Playwright instalados):

```sh
npm run test:e2e
```

A validacao por capturas de tela de **todas** as paginas e estados do produto
nao faz parte do escopo de refatoracao desta etapa e continua pendente de
homologacao visual. Nao mesclar esta branch em `main` antes dessa revisao.

## Proximas etapas

- **Etapa 3:** componentes reutilizaveis (botoes, cards, campos, titulos,
  abas, tabelas, modais, selos) com nomes consistentes.
- **Etapa 4:** migrar area por area, incluindo estilos legados e HTML inline.
- **Etapa 5:** testes visuais cobrindo todas as rotas e estados.
