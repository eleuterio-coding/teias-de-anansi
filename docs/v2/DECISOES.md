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
