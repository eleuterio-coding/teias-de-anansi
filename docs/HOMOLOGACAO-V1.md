# Homologação do release v1.0

Este documento é o checklist de aceite do Bloco 18. Um item só pode ser marcado como aprovado quando existir evidência automatizada ou homologação real correspondente. O release `v1.0.0` não deve ser criado enquanto houver gate obrigatório pendente.

## Estado do Bloco 18

- Gate estrutural/documental: automatizado por `tests/auditar-release-v1.mjs`.
- E2E Chromium Desktop: automatizado por Playwright.
- E2E Chromium Mobile: automatizado por Playwright.
- Fluxos locais de Configurações, criação de Mesa e backup/restauração: automatizados em navegador real.
- Regressões críticas dos Blocos 1–17: executadas pelo gate estrutural.
- Homologação Firebase multiusuário real: **pendente de evidência E2E autenticada antes do release final**.
- Limpeza de branches/PRs: **pendente de auditoria antes do release final**.
- Tag/release `v1.0.0`: **não publicar enquanto os itens anteriores estiverem pendentes**.

## Matriz de homologação

| Área | Desktop | Mobile | Evidência / critério |
| --- | --- | --- | --- |
| Home e navegação principal | Automático | Automático | Carregamento, heading principal e ausência de overflow horizontal |
| Personagens | Automático | Automático | Superfície carrega sem erro JavaScript |
| Campanhas / Mesas | Automático | Automático | Defaults, criação real e persistência do schema |
| Dados / Backup | Automático | Automático | Exportação, remoção do estado e recuperação pelo arquivo baixado |
| Painel Geral | Automático | Automático | Superfície carrega sem erro JavaScript |
| Configurações | Automático | Automático | Persistência, reload e aplicação de preferências visuais |
| Usuários sem provedor disponível | Automático | Automático | Falha fechada e nenhuma liberação de acesso |
| Firebase autenticado | Pendente | Pendente | Duas identidades reais e papéis distintos na mesma Mesa |

## Progressão Level 1 → Level 20

A progressão possui auditoria mecânica em `tests/auditar-progressao-level.mjs`. O fechamento do release deve combinar duas evidências:

1. **Level 1 / criação:** criação e estado inicial seguem o schema atual, sem histórico artificial de progressão.
2. **Level 20 / limite:** a progressão é sequencial, não permite saltos e encerra no Level 20.

O gate crítico executa a auditoria de progressão em cada homologação. Uma suíte de navegador pode ampliar a cobertura visual do editor de progressão, mas não deve substituir os testes de regra já existentes.

## Campanhas, Sessões, Encontros e Aventuras

Critérios obrigatórios:

- criação de Mesa usa defaults configurados sem modificar Mesas anteriores;
- somente uma Sessão fica ativa por Mesa;
- Sessão não termina com encontro ativo;
- encontros preservam iniciativa, criaturas, PV, condições, turnos e recompensas;
- Aventuras mantêm relações válidas com a campanha;
- projeção compartilhada não contém material privado/oculto do Mestre.

As auditorias de Campanhas, Aventuras e Colaboração são chamadas pelo gate estrutural do release.

## Recuperação e corrupção de dados

O cenário E2E automatizado deve:

1. gravar Personagem, Campanha e Aventura relacionados no armazenamento;
2. exportar Backup pela interface;
3. remover os dados portáteis do navegador;
4. carregar novamente a página e confirmar estado vazio;
5. selecionar o arquivo exportado;
6. validar checksum/manifesto;
7. restaurar em modo `replace` com confirmação explícita;
8. reler `localStorage` e confirmar os três domínios restaurados.

A auditoria Node também testa checksum, relações, snapshot de recuperação e rollback transacional.

## Erros de rede

A homologação deve provar comportamento seguro quando a rede ou o provedor online falham:

- recursos estritamente locais continuam utilizáveis;
- tela de Usuários não transforma falha de Firebase em cadastro ou sessão aberta;
- erro de sincronização é comunicado ao usuário;
- estado local não é apagado por falha remota;
- caches online continuam classificados como regeneráveis.

O E2E intercepta a configuração Firebase em um cenário controlado para verificar o modo fechado quando o provedor está indisponível. A homologação autenticada deve incluir também perda de rede depois de uma sessão válida.

## Acessibilidade e responsividade

Critérios mínimos do release:

- viewport Mobile sem overflow horizontal nas superfícies principais;
- navegação e controles utilizáveis por teclado onde aplicável;
- headings e regiões principais presentes;
- mensagens dinâmicas importantes usam regiões de status/`aria-live` já previstas nas superfícies;
- preferências de tamanho de texto, contraste e redução de movimento persistem e são aplicadas globalmente.

## Desempenho

A v1.0 é um site estático e deve evitar dependência de bundler/runtime pesado para uso normal. O E2E deve tratar erros JavaScript como falha. Recursos externos não essenciais não podem impedir o carregamento das superfícies locais.

Uma regressão de desempenho relevante é qualquer alteração que torne criação, Ficha, Campanhas ou Painel impraticáveis em navegador móvel contemporâneo. Medidas quantitativas adicionais podem ser adicionadas em versões futuras sem reabrir a v1.0.

## Gate Firebase multiusuário

Este é o item que não pode ser simulado como aprovado. A homologação final exige, no projeto Firebase Spark real:

1. uma conta administradora autorizada;
2. uma segunda conta autorizada como Jogador ou Observador;
3. a mesma Campanha publicada pelo proprietário/Mestre;
4. vínculo da segunda conta à Mesa;
5. sincronização em dois contextos de navegador independentes;
6. confirmação de que o Mestre recebe estado privado e o Jogador/Observador recebe apenas projeção compartilhada;
7. tentativa proibida de escrita privada pelo papel sem permissão;
8. atualização permitida do `characterId` da própria membership dentro das Firestore Rules;
9. teste de perda de rede e retomada sem corrupção do estado local.

Sem credenciais reais de teste disponíveis ao workflow, esse item permanece manual/assistido e bloqueia a publicação final. Nenhum teste estático deve ser usado para fingir que essa etapa ocorreu.

## Branches, PRs e release

Antes da tag final:

- listar PRs abertos e resolvê-los explicitamente;
- comparar branches históricas com `main` antes de qualquer exclusão;
- não apagar branch com commits exclusivos sem revisão;
- confirmar `main` com todos os gates verdes;
- atualizar este documento com as evidências finais;
- marcar o Bloco 18 como aceito no `ROADMAP-V1.md`;
- somente depois criar a tag/release `v1.0.0`.
