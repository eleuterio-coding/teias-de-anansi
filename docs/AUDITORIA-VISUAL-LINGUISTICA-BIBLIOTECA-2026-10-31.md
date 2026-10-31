# Auditoria visual e linguística — Biblioteca Teias de Anansi

Data: 31/10/2026
Escopo: Biblioteca, Classes, Subclasses e conteúdo editorial de subclasses.

## Escopo documental

- 119 subclasses distintas distribuídas pelos sete catálogos de mecânicas do projeto;
- 119 resumos editoriais + 628 descrições de progressão = **747 trechos** submetidos ao normalizador e à auditoria textual;
- 591 nomes distintos de características com correspondência PT-BR;
- 119 títulos traduzidos, preservando IDs e dados bibliográficos;
- 537 nomes de magias no glossário já existente do Hub, combinados a um glossário técnico contextual de mais de 400 termos.

## Problemas detectados e corrigidos

1. A interface anterior localizava nomes, mas preservava anglicismos nos parágrafos de regras.
2. A tradução por substituições sucessivas podia retraduzir partes das traduções já aplicadas, corrompendo nomes e termos.
3. Expressões como *saving throw*, *ability check*, *spell slot*, *Sneak Attack*, *Opportunity Attack*, nomes de ferramentas e tipos de dano exigiam tratamento específico.
4. A primeira tentativa de teste visual foi redirecionada para autenticação sem sessão de teste. O teste automatizado agora utiliza somente uma sessão local isolada (não muda autenticação de produção).
5. O cache do módulo exigia atualização para o cliente receber a revisão.

As alterações foram implementadas em `scripts/subclasses-biblioteca-ui.js`, `dados/localizacao-ptbr-termos-mecanicos.json` e rotas/carregador. As fontes de mecânicas permanecem sem alterações.

## Controles automatizados

O teste `tests/auditar-linguistica-subclasses.mjs` percorre os 747 trechos e falha em caso de resíduos do vocabulário técnico crítico, além de validar a integridade das 119 subclasses e 591 características.

O teste `e2e/biblioteca-auditoria-visual.spec.js` usa Chromium em viewport desktop (1440×1000) e celular (390×844), com capturas e verificações de:

- existência e ordem dos 18 cards da Biblioteca;
- 13 cards de Classes e tratamento do Artífice no mesmo leitor, incluindo progressão de 20 níveis;
- 119 subclasses em ordem alfabética, identificadas por livro, sem metadados técnicos e com abertura por interação;
- filtros, erros de JavaScript e overflow horizontal.

O workflow `.github/workflows/auditoria-visual-biblioteca.yml` publica os registros como artefato GitHub Actions.

## Ressalvas

Este trabalho valida a localização editorial e as interfaces; não compara mecanicamente cada regra resumida com o texto integral de cada livro protegido, nem substitui uma revisão científica de fidelidade normativa. A sessão injetada pelo Playwright é apenas para permitir testar a interface autenticada.

Os relatórios de execução do GitHub Actions são a fonte do estado final das verificações de navegador, incluindo falhas eventualmente encontradas.
