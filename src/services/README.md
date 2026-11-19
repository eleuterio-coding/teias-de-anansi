# Servicos e integracoes

Diretorio reservado a integracoes isoladas da interface. O item **1.07** adicionou
`src/services/firebase/` para preparar a configuracao publica do SDK Web, o
aplicativo nomeado e adaptadores explicitos para Authentication e Firestore.

**Nao ha nenhuma chamada no bootstrap React**, nem login, leitura, escrita ou
alteracoes de regras. A conexao real, a autorizacao e a verificacao das cinco
contas existentes pertencem a Etapa 3. Consulte
`docs/etapas/etapa-1/1.07-firebase-planejado.md`.
