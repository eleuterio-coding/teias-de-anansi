# Etapa 3 — Usuários e Acesso

**Situação:** **3.01 concluído e verificado no Firebase real**; itens 3.02–3.09 ainda não iniciados. O avanço será solicitado pelo botão da conversa.  
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
| 3.02 | Inventário controlado de cinco contas e vínculos | Proposto; exige autorização específica |
| 3.03 | Login, saída, sessão e erros conhecidos | Proposto; não implementado |
| 3.04 | Papéis Mestre/Jogador existentes | Proposto; não implementado |
| 3.05 | Regras e acesso efetivo aos documentos | Proposto; não implementado |
| 3.06 | Proteção de rotas, consultas e ações | Proposto; não implementado |
| 3.07 | Área administrativa mínima para vínculos | Proposto; não implementado |
| 3.08 | Estados e mensagens de erro | Proposto; não implementado |
| 3.09 | Validação autorizada com cinco contas reais | Proposto; não executado |

## Situação técnica de partida

- A Etapa 2 foi aprovada em 20/11/2026. Sua branch original não deve receber novos itens da Etapa 3.
- `src/services/firebase/` contém **somente adaptadores de configuração e inicialização sob chamada explícita**. O bootstrap atual não ativa Firebase, login ou consultas.
- `src/modules/usuarios/` continua apenas com `README.md`, reserva da Fundação. Não há rota oficial de usuários no catálogo atual.
- `main` permanece preservada com “Novo início”, sem merge da reconstrução.
- A CI existente de Design System monitora a branch da Etapa 2; a eventual configuração de CI específica para a branch da Etapa 3 dependerá da autorização de implementação.
- O item 3.01 foi concluído e auditado em [3.01-inventario-historico.md](3.01-inventario-historico.md): projeto ativo, app Web, e-mail/senha, Firestore e Rules implantadas verificados por leitura remota em [GitHub Actions #44843476230](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44843476230).
- **Implementação preparatória 3.01:** `src/services/firebase/legacy-contract.ts` identifica as cinco contas **esperadas** e compara configurações locais com o `projectId` e `authDomain` históricos, sem conexões nem privilégios. `tests/firebase-legacy-contract.test.ts` define sete cenários offline. Foram executados em GitHub Actions: **18 testes Firebase aprovados, 155 testes gerais aprovados**.
- As regras implantadas **foram consultadas** em modo de leitura e são idênticas ao histórico. **Contas reais/UIDs e documentos privados não foram consultados**; isso pertence ao próximo item.

## Limites imediatos

**Não autorizado neste momento:** implementar autenticação, consultar/listar contas reais, modificar regras, gravar documentos, alterar senhas, remover/criar contas, ativar um módulo de usuários, publicar, mudar o plano de cobrança ou alterar `main`. A leitura remota de configuração para **3.01**, sem alterações, depende de conexão autorizada.

A autorização para iniciar **3.01** foi dada em 20/11/2026 e o item **foi concluído no mesmo dia**. A leitura remota ocorreu via GitHub Actions, usando segredo administrativo já existente no repositório. As ações dos itens subsequentes, especialmente alterações em Rules, gravações reais, publicação e mudanças de contas, permanecem fora do escopo atualmente executado.

## Continuidade da conversa

Ao **finalizar e validar** cada item 3.01–3.09, o assistente deve registrar a conclusão com evidências verificáveis e apresentar no chat um botão **Seguir para 3.XX** que somente solicita o próximo item; o botão não faz deploy nem altera Firebase automaticamente. Não avançar um item que ainda tenha critério de aprovação pendente.
