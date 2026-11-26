# Teias de Anansi — diretrizes obrigatórias

## Infraestrutura
- Trabalhar no repositório existente `eleuterio-coding/teias-de-anansi` e manter o GitHub Pages atual.
- Reutilizar o Firebase Authentication e o Firestore já existentes. Preservar UIDs, contas, senhas, perfis, vínculos e dados; não recriar usuários nem migrar ou apagar registros sem autorização explícita.

## Segurança mínima
- Apenas dois papéis autenticados: `dm` (Mestre) e `player` (Jogador), mantendo os valores já usados pelo aplicativo.
- Mestre: acesso a todo o conteúdo funcional do Hub. Jogador: acesso apenas a conteúdo liberado e aos próprios personagens ou personagens compartilhados.
- Sem cadastro público, hierarquias intermediárias ou novos sistemas de autenticação.
- Determinar o papel a partir dos perfis existentes no Firebase. Se o papel não estiver confirmado, negar acesso às áreas protegidas. Não permitir alteração do próprio papel pelo cliente.
- Aplicar autorização nas regras do Firestore e, se utilizado, do Storage; esconder menus é apenas uma conveniência visual. Não armazenar informações exclusivas do Mestre em arquivos públicos do GitHub Pages.
- Não substituir regras existentes sem primeiro inspecioná-las e validar os acessos do Mestre, Jogador e visitante não autenticado.

## Áreas
| Área | Jogador | Mestre |
|---|---|---|
| Início | Sim | Sim |
| Compêndio | Conteúdo liberado | Tudo |
| Personagens | Próprios e compartilhados | Tudo |
| Campanhas | Conteúdo liberado | Tudo |
| Ferramentas | Ferramentas permitidas | Tudo |
| Administração | Não | Sim |

A entrada e saída da sessão são funções auxiliares, não áreas adicionais. Usar a mesma estrutura para todos os sistemas de RPG.

## Layout e navegação (obrigatório)
- Todas as páginas do Hub usam o mesmo componente de layout global: cabeçalho, menu, conteúdo e rodapé; manter a mesma folha de estilos compartilhada.
- Não criar layouts, temas ou estilos exclusivos por módulo ou sistema de RPG.
- Nesta etapa, apenas links, rotas protegidas e áreas vazias para receber informações posteriormente. Não criar exemplos, dados fictícios ou elementos visuais novos.
- Manter o registro de áreas em `assets/hub-areas.js` como fonte única para as rotas protegidas e o menu conforme o papel. Preservar a rota existente `/usuarios` para Administração; a consulta de usuários existente fica em `/usuarios/vinculos`. As subáreas derivam do mesmo registro central e usam a mesma proteção por papel.

## Ordem determinística
1. Autenticação e permissões.
2. Estrutura e navegação.
3. Início.
4. Compêndio.
5. Personagens.
6. Campanhas.
7. Ferramentas.
8. Administração.
9. Testes e validação integrados.

Validar cada etapa antes de avançar. Priorizar soluções simples, manter a sessão existente e não publicar conteúdo protegido no repositório público. Não declarar a segurança validada sem testes reais das permissões.

## Estado da estrutura
As seis áreas principais e 27 subáreas estão estruturadas. As páginas de grupo exibem apenas listas de links; as páginas finais permanecem vazias, exceto a consulta de usuários preexistente. O Início oferece acesso rápido após confirmação do papel. Login, sessão e layout global foram preservados. A sintaxe JavaScript e a lógica do registro de rotas e papéis foram verificadas; a publicação no GitHub Pages, as regras do Firebase em produção e os testes autenticados ainda precisam ser validados. A visibilidade futura dos registros individuais dependerá das regras do Firestore.
