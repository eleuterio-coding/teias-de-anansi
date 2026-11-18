# Decisões da V2 — autenticação

> Registro documental aprovado em 18/11/2026. **Não autoriza implementação, migração, acesso a contas ou conexão com Firebase real.**

## Regra de autenticação — aprovada somente como documentação

- Exclusivamente o proprietário do Hub define **o nome de usuário e a senha de todos os usuários**, sem exceções.
- Não haverá autocadastro, cadastro público, criação autônoma de contas ou definição independente de credenciais por jogadores.
- Cada usuário terá credenciais individuais, protegidas. Senhas não devem aparecer em texto claro no código, no GitHub, em logs ou em documentos; a futura implementação deverá usar mecanismos apropriados de autenticação e armazenamento seguro.
- Preservar todas as contas existentes, seus vínculos, perfis, permissões e acesso. Nenhuma exclusão, redefinição ou troca de credencial ocorre por esta decisão.
- A entrega/distribuição de credenciais e eventuais mudanças futuras serão controladas pelo proprietário em canal privado; não registrar nomes, e-mails, IDs, senhas ou outros dados pessoais neste planejamento.
- O futuro desenho técnico deve considerar o método de login atual e eventual necessidade de migração compatível, **sem tocar no ambiente real nesta etapa**.

## Restrições e pendências preservadas

- [x] Registrar documentalmente a regra de autenticação V2.
- [ ] D1.3 — pendente. Preservar: escolha de operador/revisor, aceite individual e confirmação expressa do proprietário; sem exigir verificação adicional de identidade. Nenhuma designação ou contato autorizado nesta etapa.
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
