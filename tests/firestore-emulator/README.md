# Emulador Firestore — auditoria 3.05

**Somente teste:** dados completamente fictícios e projeto Firebase de demonstração `demo-teias-305`; não apontar o emulador ao projeto de produção. Este diretório **não** é utilizado para deploy.

- `baseline.rules`: cópia literal da versão das regras que o item 3.01 identificou como idêntica à implantada em produção.
- `proposal.rules`: proposta experimental com alterações restritas de leitura de perfis, vínculos, fichas compartilhadas, criação de campanhas e mídias sem campanha, bem como edição de `ownerId` e de campos identitários. A proposta também impede que propriedade de campanha antiga conceda administração a Jogador.
- `run.mjs`: testa **ambas** as versões por identidades fictícias no Firestore Emulator, identificando permissões indevidas do legado e confirmando a negação na proposta.
- `firebase.json`: configura **apenas** Firestore Emulator local na porta 8089, sem Hosting e sem recursos remotos.

A CI executa a suíte com Java 21 e dependências de teste instaladas temporariamente, sem mudar o `package-lock.json` da aplicação e **sem secrets**. O workflow não contém `firebase deploy`.

Os testes positivos de sessão/atribuição e os testes negativos de acesso por outras identidades devem permanecer aprovados. A proposta **não pode ser publicada** sem autorização específica e sem revisão de compatibilidade do cliente antigo, especialmente as consultas de listas de perfis, memberships e fichas que deixam de ser permitidas aos jogadores.

## Cobertura adicionada no 3.06

Foram acrescentados três casos para cada conjunto de regras (6 verificações adicionais), em que um vínculo fictício é revogado e, sem nova sessão, consultas diretas por ID à campanha, à sessão atribuída e à ficha atribuída passam a ser **negadas**. A suíte passa de **92 para 98 verificações**; ambos os conjuntos de regras foram testados, sem utilizar a produção. A CI da Etapa 3 continua executando a versão vigente das duas suítes.

## Cobertura do item 3.07

Foram acrescentadas consultas individuais (com `where`) aos cinco perfis fictícios e às cinco memberships correspondentes, sempre sob identidade Mestre, e uma consulta transversal de jogador que demonstra a divergência conhecida entre `baseline.rules` e `proposal.rules`. A atualização de uma membership fictícia por Mestre também é testada **somente no emulador**; nenhuma escrita real foi autorizada. As duas versões somam **122 verificações com 0 falhas**, mantendo as 12 exposições históricas já registradas.

## Ampliação do 3.09

Foi testada no emulador uma matriz adicional com um Mestre e quatro Jogadores inteiramente fictícios: consultas próprias filtradas, campanha/shared, negação de notas privadas, aventura integral, sessão alheia e campanha sem vínculo. **204/204 verificações aprovadas** para Rules históricas e Rules propostas; **12 permissões excessivas persistem no arquivo histórico publicado**. Não há senha nem login Authentication real em nenhum desses testes. Consulte [relatório 3.09](../../docs/etapas/etapa-3/3.09-homologacao.md).

## Preparação coordenada das Rules — revisão de 22/11/2026

A proposta `proposal.rules` foi **reforçada** para validar também a coerência do perfil do Mestre (UID, username e papel) e dos documentos de membership (UID não vazio, email, campanha, papel, vínculo ativo). O vínculo histórico com UID ausente/vazio continua aceito para preservar a conta já existente sem migrar documentos.

A CI de [reavaliação #45085033324](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/45085033324) passou com **214/214 verificações**, **0 falhas**, **12 exposições históricas originais reproduzidas**, **0 alterações em produção**. São dez verificações a mais que na matriz 3.09: quatro vínculos fictícios incoerentes e uma identidade com e-mail Mestre sobre UID/perfil de Jogador, comparados na baseline e na proposta.

**Atenção:** mudanças de Rules em produção exigem aprovação específica **separada** da publicação no único site GitHub Pages existente. O runbook está em [plano de publicação e rollback](../../docs/etapas/etapa-3/3.05-plano-publicacao-e-rollback.md) e a matriz de compatibilidade em [pré-publicação](../../docs/etapas/etapa-3/3.05-compatibilidade-prepublicacao.md). A suite não é mecanismo de deploy.

## Pré-voo de 23/11/2026 — cliente Mestre com cadastro legado

A suite foi expandida de 214 para **218 verificações** e demonstra, sob ambas as versões de Rules, consulta de membership pelo UID do Mestre com e-mail/nome legados, além de negação de listagem pelo UID do Mestre quando a consulta parte de um Jogador. A baseline continua com **12 permissões excessivas conhecidas**, bloqueadas na proposta. Os testes de aplicação (Vitest) são **302/302**; [CI #45164567466](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/45164567466) foi aprovada. Não há deploy de Rules nem uso de identidades reais no emulador.
