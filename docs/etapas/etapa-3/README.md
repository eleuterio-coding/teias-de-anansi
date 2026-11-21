# Etapa 3 — Usuários e Acesso

**Situação:** **3.01 e 3.02 verificados no Firebase real; 3.03 implementado e validado em CI**; itens 3.04–3.09 não iniciados. O avanço será solicitado pelo botão da conversa.  
**Planejamento iniciado:** 20/11/2026.  
**Branch isolada:** `feature/etapa-3-usuarios-acesso-20261120`.  
**Ponto de origem imutável:** Etapa 2, commit `9f9f1407d8434aeb22342890cbcc1fd3d0d101c4`.  
**CI da Etapa 2 aprovada:** [execução #44815698745](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44815698745).

O Mestre aprovou a Etapa 2 no que se refere à implementação e aos testes automatizados, ciente de que inspeção visual e tecnologias assistivas ainda não foram verificadas em navegadores reais. Inicialmente autorizou **somente o planejamento** da Etapa 3; em 20/11/2026, autorizou o início do **item 3.01**, mantendo as demais restrições.

## Objetivo

Restabelecer acesso ao Hub por meio das **cinco contas já existentes**, reconhecendo Mestre/Jogador e preservando seus identificadores, senhas, dados e vínculos. A segurança dos dados deve ser aplicada por autorização no Firestore e serviços, e não apenas por botões ocultos.

Consulte [PLANEJAMENTO.md](PLANEJAMENTO.md) para os nove itens, dependências, testes, riscos e limites de autorização.

## Nove itens do escopo original

| Item | Planejamento | Situação |
| --- | --- | --- |
| 3.01 | Identificação do Firebase existente | **Finalizado:** projeto/app Web/Auth/Firestore/Rules confirmados em consulta remota somente leitura; 18 testes específicos e 155 gerais aprovados |
| 3.02 | Inventário controlado de cinco contas e vínculos | **Finalizado:** cinco contas reais ativas, perfis e UIDs correspondentes, seis vínculos ativos e referências de personagens/sessões/aventuras verificadas |
| 3.03 | Login, saída, sessão e erros conhecidos | **Finalizado em branch:** login e logout do Auth existente, persistência local, restauração de sessão e mensagens de erro; 27 novos testes, CI aprovada (182/182). Login com senhas reais fica para 3.09 |
| 3.04 | Papéis Mestre/Jogador existentes | Proposto; não implementado |
| 3.05 | Regras e acesso efetivo aos documentos | Proposto; não implementado |
| 3.06 | Proteção de rotas, consultas e ações | Proposto; não implementado |
| 3.07 | Área administrativa mínima para vínculos | Proposto; não implementado |
| 3.08 | Estados e mensagens de erro | Proposto; não implementado |
| 3.09 | Validação autorizada com cinco contas reais | Proposto; não executado |

## Situação técnica de partida

- A Etapa 2 foi aprovada em 20/11/2026. Sua branch original não deve receber novos itens da Etapa 3.
- `src/services/firebase/` mantém os adaptadores de configuração e inicialização e agora o **serviço Auth do item 3.03**, chamado explicitamente pela rota `/entrar`. O bootstrap continua sem ligação direta ao Firebase; nenhuma leitura ou escrita no Firestore é realizada ao entrar.
- `src/modules/usuarios/` continua apenas com `README.md`, reserva da Fundação. Não há rota oficial de usuários no catálogo atual.
- `main` permanece preservada com “Novo início”, sem merge da reconstrução.
- A CI da Etapa 3 monitora esta branch, executa validações de projeto, Vitest, TypeScript, ESLint, Prettier, contrato de Design System e build **sem deploy**.
- O item 3.01 foi concluído e auditado em [3.01-inventario-historico.md](3.01-inventario-historico.md): projeto ativo, app Web, e-mail/senha, Firestore e Rules implantadas verificados por leitura remota em [GitHub Actions #44843476230](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44843476230).
- **Implementação preparatória 3.01:** `src/services/firebase/legacy-contract.ts` identifica as cinco contas **esperadas** e compara configurações locais com o `projectId` e `authDomain` históricos, sem conexões nem privilégios. `tests/firebase-legacy-contract.test.ts` define sete cenários offline. Foram executados em GitHub Actions: **18 testes Firebase aprovados, 155 testes gerais aprovados**.
- As regras implantadas **foram consultadas** em modo de leitura e são idênticas ao histórico.
- O item **3.02** conferiu via API administrativa de leitura as cinco contas reais, seus UIDs e perfis no Firestore e seis vínculos existentes, sem divulgar os identificadores. Também verificou referências de quatro fichas, doze sessões e oito visões de aventuras. Evidências em [3.02-contas-e-vinculos.md](3.02-contas-e-vinculos.md), [CI #44902355786](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44902355786) e [CI #44902526056](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44902526056).
- A verificação administrativa **não é um teste de login dos cinco usuários nem das regras de autorização na perspectiva de cada jogador**. O item 3.03 tem testes simulados de autenticação; login real e matriz de autorização permanecem para 3.05/3.09.
- O item **3.03** disponibilizou `/entrar` pela página global do Hub e integrou o Firebase Web público já existente: [relatório 3.03](3.03-login-e-sessao.md) e [CI #44903994998](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44903994998), **182 testes aprovados**.

## Limites imediatos

**Não autorizado neste momento:** iniciar 3.04 antes do avanço solicitado na conversa; modificar Rules, gravar documentos, alterar senhas, remover/criar contas, ativar o módulo de usuários para administração, publicar, mudar o plano de cobrança ou alterar `main`. A leitura administrativa dos itens 3.01 e 3.02 foi concluída; novas leituras de produção dependerão de escopo específico.

A autorização para **3.01** resultou em conclusão em 20/11/2026. O avanço solicitado pelo usuário autorizou **3.02**, concluído em 21/11/2026, e depois **3.03**, implementado e validado tecnicamente em 21/11/2026. As verificações ocorreram via GitHub Actions usando segredo administrativo já existente e operações de leitura. **3.04–3.09 não foram iniciados**, e alterações em Rules, gravações reais, publicação e mudanças de contas continuam fora do escopo executado.

## Continuidade da conversa

Ao **finalizar e validar** cada item 3.01–3.09, o assistente deve registrar a conclusão com evidências verificáveis e apresentar no chat um botão **Seguir para 3.XX** que somente solicita o próximo item; o botão não faz deploy nem altera Firebase automaticamente. Não avançar um item que ainda tenha critério de aprovação pendente.
