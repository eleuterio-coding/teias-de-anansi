# Emulador Firestore — auditoria 3.05

**Somente teste:** dados completamente fictícios e projeto Firebase de demonstração `demo-teias-305`; não apontar o emulador ao projeto de produção. Este diretório **não** é utilizado para deploy.

- `baseline.rules`: cópia literal da versão das regras que o item 3.01 identificou como idêntica à implantada em produção.
- `proposal.rules`: proposta experimental com alterações restritas de leitura de perfis, vínculos, fichas compartilhadas, criação de campanhas e mídias sem campanha, bem como edição de `ownerId` e de campos identitários. A proposta também impede que propriedade de campanha antiga conceda administração a Jogador.
- `run.mjs`: testa **ambas** as versões por identidades fictícias no Firestore Emulator, identificando permissões indevidas do legado e confirmando a negação na proposta.
- `firebase.json`: configura **apenas** Firestore Emulator local na porta 8089, sem Hosting e sem recursos remotos.

A CI executa a suíte com Java 21 e dependências de teste instaladas temporariamente, sem mudar o `package-lock.json` da aplicação e **sem secrets**. O workflow não contém `firebase deploy`.

Os testes positivos de sessão/atribuição e os testes negativos de acesso por outras identidades devem permanecer aprovados. A proposta **não pode ser publicada** sem autorização específica e sem revisão de compatibilidade do cliente antigo, especialmente as consultas de listas de perfis, memberships e fichas que deixam de ser permitidas aos jogadores.
