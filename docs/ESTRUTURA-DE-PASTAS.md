# Teias de Anansi 2.0 — estrutura de pastas

**Versão:** 1.03-v1 · **Data:** 19/11/2026 · **Estado:** aguardando aprovação do item 1.03.

## Referência

O escopo oficial é a reconstrução em **oito etapas**, aprovada no item 1.02. Esta organização não herda automaticamente a branch `feature/passo-01-estrutura-layout`, que segue um planejamento anterior de onze passos. O commit foi preparado exclusivamente em `feature/etapa-1-fundacao-8-etapas`, sem tocar na `main` ou na publicação.

## Árvore inicial

```text
.
├── README.md                         # README original da main, preservado
├── docs/
│   ├── ESTRUTURA-DE-PASTAS.md        # este contrato
│   └── etapas/etapa-1/
│       └── 1.03-estrutura-de-pastas.md
├── public/                           # somente ativos realmente públicos
├── src/
│   ├── app/                          # bootstrap, rotas e estados globais (1.05)
│   ├── layouts/                      # estruturas visuais compartilhadas (etapa 2)
│   ├── components/                   # componentes globais (etapa 2)
│   ├── styles/                       # CSS, Tailwind e tokens (1.04 / etapa 2)
│   ├── modules/
│   │   ├── usuarios/                 # etapa 3
│   │   ├── biblioteca/               # etapa 4
│   │   ├── personagens/              # etapa 5
│   │   ├── campanhas/                # etapa 6
│   │   ├── aventuras/                # etapa 6
│   │   ├── npcs/                     # etapa 6
│   │   ├── sessoes/                  # etapa 7
│   │   ├── area-jogador/             # etapa 7
│   │   └── preferencias/             # etapa 7
│   ├── services/                     # Firebase e adaptadores (1.07 / etapa 3)
│   ├── rules/                        # regras de jogo puras (etapa 4)
│   └── data/                         # somente dados estáticos redistribuíveis
└── tests/                            # testes automatizados (1.04 e posteriores)
```

Todas as pastas novas contêm apenas arquivos `README.md` explicativos; **nenhum código executável** foi adicionado.

## Convenções de dependência

1. `src/app` compõe rotas e módulos, sem incorporar regras de jogo ou segredos de usuário.
2. `src/layouts`, `src/components` e `src/styles` concentram os elementos compartilhados. O Design System definitivo depende da etapa 2.
3. `src/modules/<dominio>` organiza telas e lógica de apresentação de cada funcionalidade. Comunicação com Firebase passa por `src/services`.
4. `src/rules` contém regras de jogo puras, reutilizáveis e testáveis sem componentes React.
5. `src/data` e `public` são **públicos** na distribuição. Material protegido, dados privados e segredos nunca entram nessas pastas nem no bundle.
6. `tests` concentra cenários automatizados, com agrupamentos definidos quando as ferramentas de teste forem aprovadas.
7. Mudanças em modelos de dados, contratos de autorização e integrações Firebase exigem aprovação específica das etapas correspondentes.

## Limites desta entrega

A estrutura é um **esqueleto de diretórios versionado** e não uma aplicação executável. Sem instalação de React, TypeScript, Vite, React Router, Tailwind, Firebase SDK, lint ou ferramentas de teste. Também não foram criados arquivos de configuração, rotas, interfaces, pipelines de CI ou workflows de deploy. A configuração de tecnologias só poderá começar no item **1.04**, após aprovação do Mestre.
