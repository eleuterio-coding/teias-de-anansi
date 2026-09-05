# Teias de Anansi — v1.0.1

A v1.0.1 é uma correção de escopo da v1.0.0 para alinhar o Hub ao seu uso real: projeto pessoal, particular e destinado a poucas pessoas de confiança.

## Mudanças principais

- remoção da área **Dados / Backup**;
- remoção do motor e dos testes específicos de Backup/exportação/restauração;
- remoção da segunda camada de autorização baseada em `authorizedUsers`;
- remoção de `isAdmin` como requisito de acesso;
- login simplificado para **usuário + senha**;
- manutenção do identificador técnico `@teias.invalid` apenas internamente para o Firebase Authentication;
- manutenção dos papéis funcionais `dm`, `player` e `observer`;
- Mestre continua recebendo a visão privada/completa da Mesa;
- Jogador e Observador continuam recebendo somente a projeção compartilhada;
- Firestore Rules simplificadas para aceitar usuários autenticados, coerente com o grupo de confiança do projeto;
- homologação Firebase automatizada no GitHub Actions;
- publicação automática da release após sucesso do Firebase real e E2E final.

## O que não mudou

- o Hub continua sendo somente um site web responsivo;
- hospedagem continua no GitHub Pages;
- Firebase continua no plano Spark / No-cost;
- não há Firebase Hosting, Cloud Functions, Supabase ou dependência de faturamento;
- criação e progressão de personagem, Ficha Digital, Campanhas/Mesas, Sessões, Encontros, Aventuras, Bibliotecas, Painel Geral e Configurações permanecem no produto;
- a separação funcional entre conteúdo do Mestre e conteúdo compartilhado permanece.

## Firebase

As contas continuam sendo criadas manualmente pelo proprietário no Firebase Authentication. O jogador usa apenas nome de usuário e senha no Hub.

Exemplo:

- usuário visível: `rafael`;
- identificador técnico interno: `rafael@teias.invalid`.

Nenhum e-mail real é necessário para usar o Hub.

## Homologação

A v1.0.1 foi publicada somente depois de:

- gate estrutural verde;
- E2E Chromium Desktop/Mobile verde;
- Firebase real verde com Mestre e Jogador efêmero;
- confirmação de visão privada para Mestre e projeção compartilhada para Jogador.

Evidências principais:

- Firebase real: run `33972932056`, attempt 2, **success**;
- publicação final: run `33979568611`, **success**.

## Histórico

A v1.0.0 permanece preservada como registro do desenho anterior, que incluía Backup e regras de autorização mais restritivas. A v1.0.1 é a referência funcional atual da linha v1.
