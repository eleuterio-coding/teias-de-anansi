# Hub de RPG — Design System global

**Versão:** DS-1 (2026-10-28)  
**Produto:** Teias de Anansi  
**Escopo:** todas as rotas HTML renderizadas pelo Hub, sem alterar permissões, dados ou regras de RPG.

## Princípio

**A mesma função deve usar a mesma família de componente, espaçamentos, estados e motion.** Não tornar funções distintas artificialmente idênticas. Navegação lateral, abas horizontais e etapas da criação são famílias diferentes.

Preservar as três superfícies funcionais existentes: shell escuro operacional; leitura clara de bibliotecas/fichas; login independente antes da autenticação. Nunca neutralizar a paleta semântica de status.

## Arquitetura e precedência

| Arquivo | Responsabilidade |
|---|---|
| hub-ux.css | Identidade existente, shell e comportamentos das abas. |
| hub-layout.css | Composição, superfície de leitura e controles-base. |
| hub-design-system.css | Tokens semânticos, consistência entre componentes, espaçamento, foco e animações. |
| scripts/hub-ux.js | Carregar uma única vez a camada global depois da composição existente. |
| site-light.css | Compatibilidade de módulos antigos, sem interferir no shell. |
| scripts/app-shell.js | Navegação lateral e barra superior. |
| tests/auditar-design-system-global.mjs | Auditoria de cobertura em todas as rotas HTML de raiz. |
| e2e/design-system-global.spec.js | Exercícios em navegador de menus, movimento, tokens e responsividade. |

**Ordem:** CSS específico → estilos globais existentes → camada semântica final. A terceira camada só sobrepõe contratos transversais; não apaga estilos especiais que têm função própria.

## Escala espacial

| Token-fonte | Valor | Uso |
|---|---:|---|
| --hub-space-1 | 4 px | Microalinhamento. |
| --hub-space-2 | 8 px | Separações internas compactas. |
| --hub-space-3 | 12 px | Formulários e ações. |
| --hub-space-4 | 16 px | Distâncias entre elementos equivalentes. |
| --hub-space-5 | 24 px | Blocos e seções grandes. |
| --hub-space-6 | 32 px | Áreas de destaque. |

Contratos:
- --hub-ds-section-nav-space = 16 px **acima e abaixo** dos menus horizontais de seção e de etapas.
- --hub-ds-card-gap = 16 px em grades de cards equivalentes.
- --hub-ds-surface-gap = 16 px entre painéis.
- --hub-ds-control-min-height = 44 px em controles padrão.
- --hub-ds-control-radius = 10 px; --hub-ds-card-radius = 14 px.

**Cuidado:** margens de um menu e gap de seu pai se somam. A simetria das margens calculadas não prova distâncias físicas idênticas em toda estrutura. Auditar caixas reais no navegador ao revisar páginas de detalhe.

## Famílias e exceções

| Família | Componentes | Regra central | Exceção justificada |
|---|---|---|---|
| Abas de seções | .section-nav, .section-nav-indicator | Mesma margem vertical, altura e curva de transição; marcador único. | Sticky e fundo dependem da página e preferências. |
| Etapas de criação | .wizard-nav | Margem vertical simétrica e mesma duração de estados interativos. | Distribuição dos passos é específica. |
| Navegação geral | .hub-sidebar, .hub-nav-link | Shell único e seleção previsível. | Menu móvel recolhível. |
| Menus de entidades | .hub-area-menu | Mesmo espaçamento, cards, hover e foco em Personagens/NPCs. | Ações e permissões diferentes. |
| Listas de campanha | .campaign-list-grid, .campaign-card | Mesma grade, bordas e espaçamento para Campanhas/Aventuras/Sessões. | Capas, estados, ícones e criação possuem conteúdo especial. |
| Cards | .card, .panel, .focus-card, .hub-home-card, .pc | Raio comum e resposta discreta. | Heroes, avatares e status nos cantos. |
| Controles | .form-grid, input, select, textarea, .btn | Alinhamento, alvos e foco. | Botões de ícone e controles de status. |
| Estados | .badge, .tag, .pill | Geometria compartilhada; preservação das cores semânticas. | Atual, Em andamento, Próxima, Planejada, Pausada, Concluída e Cancelada continuam distinguíveis. |
| Leitura | body.hub-content-light | Contraste claro; dados preservados. | Não herda fundo escuro operacional. |
| Acesso | body.hub-login-page | Raio e controle compatíveis. | Não antecipa dados do aplicativo. |

## Animação e acessibilidade

| Token | Duração | Função |
|---|---:|---|
| --hub-ds-motion-fast | 140 ms | Opacidade discreta. |
| --hub-ds-motion-standard | 180 ms | Hover, foco, estados de menu, card e controle. |
| --hub-ds-motion-emphasis | 320 ms | Deslocamento do marcador das abas. |
| --hub-ds-ease | cubic-bezier(.22,1,.36,1) | Curva única. |

Foco visível: contorno de 3 px e deslocamento de 3 px. Usar a mesma animação para interações semanticamente equivalentes, sem forçar animação inicial do marcador. Respeitar prefers-reduced-motion e a preferência interna data-hub-motion="reduce".

## Cobertura de todas as áreas

O auditor lê **todos os arquivos HTML da raiz**, inclusive rotas novas, em vez de depender exclusivamente de lista manual.

- Entrada e painel: index.html, painel.html.
- Mestre e narrativa: campanhas.html, nova-campanha.html, mesa.html, aventuras.html, sessoes.html.
- Personagens e NPCs: personagens.html, lista-personagens.html, npcs.html, lista-npcs.html, criacao-personagem.html, ficha-personagem.html.
- Bibliotecas e catálogos: bibliotecas.html, regras.html, magias.html, armas.html, armaduras.html, ferramentas.html, monstros.html, itens-magicos.html e outras categorias. Módulos com module-clean-loader.js recebem o shell automaticamente.
- Perfil e acesso: usuario.html, usuarios.html, configuracoes.html.
- Biblioteca legada: biblioteca-legado.html também inclui a camada comum.
- Aliases de redirecionamento: biblioteca.html, classes-v2.html, especies.html. Eles não constituem telas renderizadas independentes; o destino define a apresentação.

## Critérios de aceite e testes

1. Nenhuma página renderizada sem o shell (direto ou via loader); aliases conhecidos redirecionam.
2. Estilo hub-design-system-styles montado uma única vez.
3. Tokens resolvidos nas principais famílias de páginas, sem vazamento horizontal.
4. Menus equivalentes com margens calculadas iguais em cima e embaixo.
5. Duração/curva de menu e indicador consistentes.
6. Movimento reduzido efetivo por sistema e configuração interna.
7. Foco e alvos de toque legíveis em desktop, tablet e mobile.
8. Sem alteração em navegação, estados, dados, mecanismos de RPG ou controle de acesso.
9. Inspeção visual de telas vazias e preenchidas, edição, erro, foco e mobile.
10. Exceções documentadas, sem novo CSS arbitrário para uma página específica.

Executar:

    node tests/auditar-design-system-global.mjs
    npm install
    npx playwright install chromium
    npx playwright test e2e/design-system-global.spec.js

## Homologação e dívida técnica

A primeira camada **não elimina automaticamente todos os valores históricos** dos arquivos CSS. Há estilos locais e sobrescritas antigas. Cobertura de carregamento em todas as rotas é diferente de uniformidade visual conferida elemento por elemento.

Para concluir a padronização integral: realizar comparativos antes/depois em todas as áreas, examinar distâncias físicas efetivas entre blocos em estruturas grid, registrar exceções, ajustar conflitos específicos e comprovar regressão zero nos fluxos funcionais.

**Não declarar 100% de uniformidade homologada enquanto a auditoria visual de cada componente em cada área não terminar.**
