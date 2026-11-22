# Servicos e integracoes

Diretorio reservado a integracoes isoladas da interface. O item **1.07** adicionou
`src/services/firebase/` para preparar a configuracao publica do SDK Web, o
aplicativo nomeado e adaptadores explicitos para Authentication e Firestore.

**Nao ha nenhuma chamada no bootstrap React**, nem login, leitura, escrita ou
alteracoes de regras. A conexao real, a autorizacao e a verificacao das cinco
contas existentes pertencem a Etapa 3. Consulte
`docs/etapas/etapa-1/1.07-firebase-planejado.md`.

## Situação da Etapa 3.08

A inicialização do Firebase **não é feita no bootstrap**: login, perfil e consultas protegidas são invocados apenas nas rotas correspondentes. `feedback-messages.ts` normaliza e restringe mensagens expostas à interface, sem chamar Firebase. O painel 3.07 executa GETs autenticados para inventário, mas o laboratório de vínculos continua sem operação de escrita. A verificação com cinco contas reais e publicação de Rules permanecem fora do escopo 3.08.
