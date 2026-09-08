# Release Notes — Hub de RPG v1.0.2

A v1.0.2 consolida o modelo de **acesso por atribuição** para Mestre, Jogador e Observador, mantendo o Hub simples, pessoal e sem Backup.

## Mudanças principais

- Login continua por **usuário + senha**.
- Contas continuam sendo criadas manualmente no Firebase Authentication.
- Nenhum e-mail real é necessário no Hub; `@teias.invalid` permanece apenas como identificador técnico.
- Não existe `authorizedUsers`, `isAdmin` ou autorização administrativa global para entrar.
- Jogador vê somente Campanhas/Mesas às quais está vinculado.
- Jogador vê somente Sessões em que sua ficha atribuída participa.
- Jogador vê somente Aventuras relacionadas a essas Sessões.
- Conteúdo privado do Mestre, pistas ocultas e handouts não revelados continuam fora da visão do Jogador.
- Jogador só pode alterar a própria ficha atribuída.
- Jogador não pode alterar Mesa, membership, Sessão ou Aventura.
- Bibliotecas permanecem disponíveis.
- O cache local da colaboração é filtrado por UID para evitar mistura entre contas no mesmo navegador.
- A Mesa do Jogador usa modo de leitura e não carrega ferramentas de Mestre.

## Firebase

As Firestore Rules foram atualizadas para refletir o contrato funcional da v1.0.2 sem reintroduzir a antiga camada administrativa global.

A homologação Firebase real validou:

- Mestre com visão privada;
- Jogador efêmero com conteúdo somente atribuído;
- Sessões não atribuídas ausentes;
- Aventuras não atribuídas ausentes;
- conteúdo privado bloqueado;
- alteração de Mesa/vínculo bloqueada para Jogador;
- ficha alheia bloqueada;
- própria ficha atribuída editável;
- retomada após perda de rede.

## Homologação

Commit homologado e publicado:

`c9bf6befd4a4214c475ceedb9bf8f4a851dedc10`

Evidências principais:

- Firebase real: run `34247492736` — **success**.
- Homologação Desktop/Mobile: run `34247492757` — **success**.
- Cobertura total: run `34247492728` — **success**.
- Publicação da release: run `34247632130` — **success**.
- GitHub Pages: run `34247492772` — **success**.

## Release

- Tag: `v1.0.2`
- Nome: **Hub de RPG v1.0.2**
- Draft: não
- Prerelease: não

## Estado da linha v1

A linha v1 está encerrada.

A **v1.0.2 é a referência funcional atual**. Novas funcionalidades ou novos suplementos pertencem a uma versão/expansão futura e não reabrem os Blocos 1–18.
