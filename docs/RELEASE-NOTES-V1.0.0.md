# Teias de Anansi — v1.0.0

Primeira versão estável do Hub de RPG **Teias de Anansi**, um site web responsivo para criação, progressão e uso de personagens, condução de Mesas e organização de campanhas de D&D 5.5e/2024 dentro do escopo normativo congelado da v1.0.

## Destaques

- criação de personagem integrada ao runtime da ficha;
- Ficha Digital / Modo de Jogo com recursos mecânicos, rolagens, combate, condições, descansos e magias;
- progressão sequencial do Level 1 ao Level 20;
- inventário, equipamento em uso, economia e ataques derivados do estado real do personagem;
- Campanhas/Mesas, Sessões, Encontros e Aventuras;
- ferramentas do Mestre para iniciativa, criaturas, PV, condições, turnos, recompensas, pistas, handouts e material privado;
- Biblioteca e dados normativos auditados dentro do escopo v1.0;
- persistência local versionada, exportação, importação, backup e restauração;
- usuários fechados com Firebase Authentication + Cloud Firestore em plano Spark, sem cobrança, com papéis Administrador/Mestre/Jogador/Observador;
- sincronização de personagens e Mesas com projeção compartilhada separada de conteúdo privado do Mestre;
- Painel Geral com personagem em jogo, próxima sessão, Mesas, pendências e atividade recente;
- Configurações persistentes para preferências de uso, fontes, presets de Regras da Casa, ficha, acessibilidade e defaults de campanha;
- interface web responsiva para desktop e mobile.

## Qualidade e homologação

A v1.0.0 só é publicada depois de:

- gate estrutural/documental verde;
- suíte de cobertura total verde;
- Playwright em Chromium Desktop e Mobile verde;
- criação de Mesa, Configurações e backup/restauração homologados em navegador real;
- regressões críticas dos Blocos 1–17 aprovadas;
- homologação Firebase real com duas identidades, papéis distintos, Rules, projeção compartilhada e retomada de rede aprovada;
- limpeza dos PRs e branches oficiais do roadmap concluída.

## Plataforma e custo

A v1.0.0 é **somente site web** e permanece hospedada no GitHub Pages. O Firebase é usado exclusivamente em **Spark / No-cost**, sem cartão de crédito, sem Firebase Hosting, sem Cloud Functions e sem recursos que exijam billing. Se um serviço necessário passar a exigir cobrança, a política do projeto é substituir o serviço em vez de ativar faturamento.

## Escopo

O conteúdo normativo da v1.0 foi congelado no encerramento do Bloco 9. Novos livros, suplementos, regras ou funcionalidades entram em versões posteriores e não reabrem esta release.

## Documentação

- `README.md` — visão geral e uso do Hub;
- `ROADMAP-V1.md` — autoridade do escopo e aceite dos 18 blocos;
- `docs/HOMOLOGACAO-V1.md` — evidências de homologação;
- `docs/AUDITORIA-BRANCHES-V1.md` — auditoria e limpeza administrativa;
- `FIREBASE-PROVISIONAMENTO.md` — arquitetura e homologação da colaboração real.
