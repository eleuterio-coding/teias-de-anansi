# Decisões da V2 — autenticação

> Registro documental aprovado em 18/11/2026. **Não autoriza implementação, migração, acesso a contas ou conexão com Firebase real.**

## Regra de autenticação — aprovada somente como documentação

- Exclusivamente o proprietário do Hub define **o nome de usuário e a senha de todos os usuários**, sem exceções.
- Não haverá autocadastro, cadastro público, criação autônoma de contas ou definição independente de credenciais por jogadores.
- Cada usuário terá credenciais individuais, protegidas. Senhas não devem aparecer em texto claro no código, no GitHub, em logs ou em documentos; a futura implementação deverá usar mecanismos apropriados de autenticação e armazenamento seguro.
- Preservar todas as contas existentes, seus vínculos, perfis, permissões e acesso. Nenhuma exclusão, redefinição ou troca de credencial ocorre por esta decisão.
- A entrega/distribuição de credenciais e eventuais mudanças futuras serão controladas exclusivamente pelo proprietário, por meio seguro à sua escolha, sem impor canal externo de confirmação; não registrar nomes, e-mails, IDs, senhas ou outros dados pessoais neste planejamento.
- O futuro desenho técnico deve considerar o método de login atual e eventual necessidade de migração compatível, **sem tocar no ambiente real nesta etapa**.

## 01.04 — Escopo dos módulos da reconstrução (decisão aprovada documentalmente em 18/11/2026)

**Status:** escopo aprovado para planejamento; implementação, testes, migração e publicação não autorizados por esta aprovação.

O Teias de Anansi V2 será planejado com **11 blocos funcionais**, preservando os limites do Checklist Mestre:

1. **Estrutura e layout:** identidade visual única e navegação.
2. **Usuários e permissões:** preservação das cinco contas existentes, com funções de Mestre e jogadores.
3. **Livros:** organização e extração das fontes de RPG.
4. **Biblioteca:** regras, referências e Regras da Casa.
5. **Motor de regras:** mecânicas, cálculos e validações.
6. **Personagens:** criação, evolução e fichas digitais integradas.
7. **Campanhas:** organização, participantes e vínculos.
8. **Aventuras e sessões:** planejamento, cenas e registros.
9. **NPCs e encontros:** criaturas, personagens e encontros.
10. **Combate e ferramentas:** iniciativa, condições, recursos e rolagens.
11. **Painel e configurações:** áreas do Mestre e dos jogadores, preferências.

**Etapas transversais, não blocos funcionais adicionais:** testes, homologação e publicação.

**Limites do escopo:**
- Não haverá autocadastro público nem definição independente de nomes de usuário ou senhas; tais credenciais são definidas exclusivamente pelo proprietário.
- Não haverá manutenção obrigatória de uma V1 paralela permanente; a V2 somente substituirá a anterior depois de aprovada e homologada.
- Nenhuma funcionalidade anterior será eliminada sem inventário e decisão específica.
- As contas, vínculos, permissões e configurações Firebase existentes deverão ser preservados, sem nenhuma alteração real nesta etapa.
- O registro de 01.04 aprovou apenas o escopo. As decisões 01.05 e 01.06 foram aprovadas documentalmente em etapa posterior, conforme seções abaixo; nenhuma implementação foi autorizada.

## 01.05 — Fluxos do Mestre e dos jogadores (aprovada documentalmente em 18/11/2026)

**Status:** proposta aprovada para planejamento; fluxo não implementado, não testado e não homologado.

**Fluxo do Mestre:**
- Acessar o painel administrativo e gerenciar personagens e sua atribuição.
- Organizar campanhas, preparar aventuras e sessões e conduzir NPCs, encontros e informações narrativas.
- Consultar todas as informações do Hub, definir as revelações aos jogadores e editar a Biblioteca e as Regras da Casa.
- Criar e editar personagens e atribuir fichas a jogadores.

**Fluxo de cada jogador:**
- Acessar o próprio painel e consultar integralmente a Biblioteca e as Regras da Casa.
- Criar os próprios personagens, sem limite de quantidade definido nesta etapa, e editar somente as fichas sob sua responsabilidade ou expressamente autorizadas.
- Acompanhar campanhas, aventuras e sessões das quais participa, respeitando a visibilidade definida pelo Mestre.
- Consultar personagens de outros jogadores somente pela ficha pública prevista em 01.06.

A autenticação continua subordinada à regra já aprovada: **somente o proprietário define nome de usuário e senha de todos os usuários**; não há autocadastro nem requisitos de confirmação adicional.

## 01.06 — Matriz de visibilidade e permissões (aprovada documentalmente em 18/11/2026)

**Status:** regra de planejamento aprovada; nenhuma permissão real alterada nem acesso ao Firebase realizado.

| Conteúdo | Mestre | Jogador |
| --- | --- | --- |
| Biblioteca e Regras da Casa | Consulta e edição | Consulta completa |
| Personagens próprios | Acesso completo | Criação e edição autorizada |
| Fichas de colegas | Acesso completo | Somente ficha pública |
| Campanhas | Controle completo | Campanhas em que participa |
| Histórico de campanhas | Acesso completo | Conforme liberação do Mestre |
| Aventuras e sessões | Acesso completo | Conteúdo autorizado |
| NPCs e mapas | Acesso completo | Elementos revelados |
| Segredos e notas privadas | Acesso exclusivo | Sem acesso |
| Administração e usuários | Controle exclusivo | Sem acesso |

**Ficha pública de personagens de outros jogadores — exatamente cinco campos:**
1. Nome.
2. Espécie.
3. Classe.
4. Nível.
5. Aparência.

A ficha completa permanece restrita ao Mestre e ao jogador responsável pelo personagem. O Mestre controla a liberação do histórico de campanhas e dos conteúdos narrativos. O bloqueio de informações deve ser aplicado pelas regras efetivas de acesso aos dados, não apenas ocultando elementos na interface; verificações com contas reais são etapas posteriores e não autorizadas aqui.

**Nota de escopo:** esta aprovação estabelece os fluxos e a matriz de visibilidade, sem autorizar edição, criação, exclusão de contas, alteração de permissões existentes ou conexão ao Firebase real.

## 01.02 — Edição-base de D&D (decisão anterior consolidada documentalmente em 18/11/2026)

**Status:** exigência de escolher uma edição-base **dispensada/retirada** do planejamento; não se estabelece D&D 2024/5.5e, D&D 2014 ou outra edição como base única obrigatória. Esta é uma decisão de escopo, e não uma implementação. O Checklist Mestre original permanece inalterado.

## 01.03 — Compatibilidade de livros e regras (decisão anterior consolidada documentalmente em 18/11/2026)

**Status:** decisão de planejamento aprovada.

- Os conteúdos de regras dos livros que forem incluídos no Hub serão considerados compatíveis para fins de catalogação e poderão **coexistir**, sem exclusão automática por serem de edições ou fontes diferentes.
- Caso existam **versões diferentes da mesma regra**, a decisão sobre qual versão deve ser aplicada em cada situação **ainda precisa ser definida especificamente**. A compatibilidade geral não determina, por si só, uma precedência universal entre versões.
- A identificação das fontes, diferenças e eventuais conflitos deve ser preservada no planejamento da Biblioteca e do motor de regras, sem implementação nesta etapa.

## 01.07 — Prioridades e ordem de construção (decisão anterior consolidada documentalmente em 18/11/2026)

**Status:** sequência de planejamento aprovada anteriormente; não significa que as etapas tenham sido implementadas.

Ordem aprovada:
1. Estrutura e layout.
2. Usuários e permissões.
3. Catalogação e extração dos livros.
4. Biblioteca e Regras da Casa.
5. Motor de regras.
6. Personagens e fichas.
7. Campanhas.
8. Aventuras e sessões.
9. NPCs e encontros.
10. Combate e ferramentas.
11. Painel Geral e configurações.
12. Testes e publicação, como etapas de validação e entrega, **não como um 12º bloco funcional**.

Os onze blocos correspondem ao escopo aprovado em 01.04. As etapas de testes, homologação e publicação continuam transversais/finais.

## 01.08 — Critérios de aprovação por módulo (decisão anterior consolidada documentalmente em 18/11/2026)

**Status:** critérios aprovados para futura homologação, sem presumir que qualquer módulo já esteja implementado ou testado.

Um módulo somente poderá ser considerado aprovado quando:
1. Todas as funcionalidades planejadas para o módulo estiverem completas.
2. Funcionar sem erros impeditivos.
3. Os dados pertinentes puderem ser salvos e recuperados corretamente.
4. As permissões de acesso funcionarem corretamente.
5. Apresentar padrão visual consistente em computador e celular.
6. Houver **aprovação final do proprietário**.

## 01.09 — Consolidação documental da Fase 01 (registrada em 18/11/2026)

- [x] Consolidar a decisão de 01.02 sem impor edição-base única.
- [x] Consolidar a decisão de 01.03 de coexistência de conteúdos, com a aplicação de versões conflitantes ainda a definir.
- [x] Consolidar a ordem de construção previamente aprovada em 01.07.
- [x] Consolidar os seis critérios de aprovação de 01.08.
- [x] Manter válidas as decisões aprovadas em 01.04, 01.05 e 01.06 e a regra de autenticação.
- [x] Consolidar as decisões no presente Markdown, **sem alterar o Checklist Mestre original**.

**Status:** 01.09 concluída **apenas no âmbito documental**. As verificações técnicas e operacionais continuam pendentes das respectivas fases; o Checklist Mestre original e demais arquivos não foram alterados por este registro.

## 02.01 — Repositório e endereço de publicação da V2 (aprovada documentalmente em 18/11/2026)

**Status:** decisão de planejamento aprovada. Não configura publicação, implantação ou migração.

- **Repositório mantido:** `eleuterio-coding/teias-de-anansi` — https://github.com/eleuterio-coding/teias-de-anansi
- **Endereço de publicação planejado:** https://eleuterio-coding.github.io/teias-de-anansi/
- **Hospedagem prevista:** GitHub Pages, preservando o projeto e o endereço já adotados.
- A V2 será reconstruída sem substituir a aplicação atual até a homologação e autorização expressa do proprietário.
- Nenhum código de produção, workflow, arquivo de configuração, conta, credencial, permissão ou serviço Firebase é alterado por esta decisão.
- **Próxima tarefa: 02.02 — identificar documentalmente os arquivos essenciais para preservar usuários, permissões e integração Firebase.** O inventário será apresentado separadamente para conferência, sem classificar arquivos como removíveis antes de análise.

## Restrições e pendências preservadas

- [x] Registrar documentalmente a regra de autenticação V2.
- [ ] D1.3 — pendente. A escolha de eventual operador/revisor cabe ao proprietário. O procedimento **não exige aceite individual, confirmação adicional do proprietário, confirmação por WhatsApp, Signal ou outros canais externos, nem verificação adicional de identidade**. Nenhuma designação, contato ou operação é realizada por este registro documental.
- [ ] G2.1 — pendente; não aprovada para execução.
- [ ] G1 — pendente; não aprovada para execução.
- [ ] G2 — pendente; não aprovada para execução (inclusive G2.1).
- [ ] G3 — pendente; não aprovada para execução.
- [ ] G4 — pendente; não aprovada para execução.
- [ ] G5 — pendente; não aprovada para execução.
- [ ] Conectar ou modificar Firebase real — proibido nesta etapa.
- [ ] Implementar autenticação ou modificar contas existentes — não autorizado.

## Relação com Checklist de reconstrução

Este registro complementa, sem substituir ou marcar como executadas, as tarefas do Checklist Mestre de reconstrução da V2. A aprovação desta regra significa **aprovação do texto**, não conclusão de testes, integração, desenvolvimento, revisão de segurança ou deploy.
