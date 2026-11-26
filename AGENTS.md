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

## Estado inicial
A publicação existente contém início, login Firebase, sessão e consulta de usuários pelo Mestre. Estas diretrizes especificam a evolução desejada; não representam a implementação ou validação das novas áreas.
