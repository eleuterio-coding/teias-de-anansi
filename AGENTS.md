# AGENTS.md — Contrato de continuidade do Teias de Anansi V2

Este arquivo é a instrução permanente de trabalho para qualquer agente que desenvolva o Hub. O estado verificável do projeto fica em `HUB-CONTINUIDADE.md`, sempre confrontado com o código e com o histórico real do GitHub. Não deduza progresso da conversa.

## Antes de qualquer alteração
1. Ler integralmente este arquivo e `HUB-CONTINUIDADE.md`.
2. Consultar o estado atual da branch, os arquivos existentes e os commits relevantes. Verificar se há alterações de outra sessão.
3. Identificar o **passo atual dentre os 11 fixos** e continuar apenas esse passo; não criar fases, subpassos de aprovação ou etapas extras. Tarefas técnicas podem existir internamente, mas não aumentam o checklist.
4. Consultar a implementação legada no histórico do GitHub quando necessário para preservar funcionalidades e dados; não confundir documentos antigos com código já implementado na V2.
5. Antes de modificar um módulo existente, identificar suas dependências e testes para evitar regressões.

## Restrições permanentes
- O projeto é web, gratuito, com código no GitHub `eleuterio-coding/teias-de-anansi` e publicação prevista no GitHub Pages.
- Stack planejada: React + TypeScript + Vite, estilo centralizado com tokens e componentes compartilhados. O layout estrutural (shell, menus, cabeçalhos, navegação) e os componentes são únicos e reutilizados em todos os módulos. Variações de visual só quando deliberadas e documentadas.
- Preservar o Firebase Authentication e o Cloud Firestore já usados, no plano Spark sem faturamento. Não substituir, redefinir ou migrar contas e credenciais sem autorização explícita.
- O Mestre define exclusivamente usuários e senhas. Manter login simples por nome de usuário e senha, sem autocadastro, confirmação por e-mail, CAPTCHA, 2FA nem novas exigências de autenticação.
- Manter as permissões funcionais existentes: Mestre administra, Jogadores acessam o que lhes foi atribuído; informações privadas do Mestre não são entregues a Jogadores. Preservar as regras de acesso aos dados sem acrescentar fricção ao login.
- Nunca gravar senhas, segredos, tokens ou dados pessoais de contas no repositório, logs ou documentos de continuidade.
- Não remover funcionalidades anteriores sem inventário e decisão do proprietário. Catálogos e decisões documentadas no histórico são referências, não prova de que já foram migrados.
- A Biblioteca pode conter conteúdos de fontes distintas; conflitos de versões não devem ser resolvidos automaticamente sem a regra definida pelo proprietário.
- Evitar serviços pagos, cartão, cobrança, Firebase Hosting ou Cloud Functions. Não prometer custo zero incondicional quando houver cotas de serviço.

## Checklist fixo — exatamente 11 passos
1. Estrutura e layout.
2. Usuários e permissões.
3. Livros.
4. Biblioteca.
5. Motor de regras.
6. Personagens.
7. Campanhas.
8. Aventuras e sessões.
9. NPCs e encontros.
10. Combate e ferramentas.
11. Painel e configurações.

Testes, revisão, correções, homologação, deploy e documentação **não são passos adicionais**: fazem parte da execução e entrega dos passos existentes.

## Conclusão de um passo
Um passo só pode ser declarado concluído quando:
- O escopo definido para ele estiver realmente implementado, sem erros impeditivos conhecidos.
- Salvar e recuperar dados pertinentes funcionar, quando aplicável.
- As permissões pertinentes estiverem verificadas, quando aplicável.
- O comportamento visual e funcional estiver verificado em desktop e mobile.
- Os testes executados e eventuais limitações estiverem registrados.
- O proprietário tiver dado aprovação final.

Não marcar como aprovado aquilo que foi apenas planejado ou documentado. Não inventar resultados de testes ou acesso a ambientes externos.

## Atualização obrigatória antes de encerrar qualquer sessão de desenvolvimento
Atualizar `HUB-CONTINUIDADE.md` com:
- Passo atual, status real e checklist dos 11 passos.
- Entregas efetivas, principais arquivos e dependências.
- Commits/branch relevantes e verificações realizadas (ou não realizadas).
- Decisões preservadas, problemas pendentes e próxima ação exata.
- Data da atualização, sem copiar dados sensíveis.

Se a sessão terminar no meio de um passo, registrar **em andamento** e o ponto de retomada. Somente após a conclusão efetiva e a aprovação do proprietário, oferecer um botão **"Seguir para o próximo passo"**. O próximo passo deve começar obrigatoriamente pela leitura de ambos os arquivos.

**Fonte da verdade:** arquivos e commits atuais do GitHub, corroborados pelo registro de continuidade. Documentos descrevem intenções e decisões; o código e os testes comprovam implementação.
