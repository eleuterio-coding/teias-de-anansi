# Guia de manutenção — Teias de Anansi 2.0

**Versão de referência:** Etapa 1 / item 1.08 (19/11/2026).

## Rotina de trabalho por item autorizado

1. Conferir a aprovação do item anterior e os limites do item atual. Não usar automaticamente listas antigas de 11 ou 19 etapas.
2. Trabalhar na branch `feature/etapa-1-fundacao-8-etapas`, ou outra branch isolada previamente autorizada; **não alterar `main` ou publicar**.
3. Rodar `npm ci` na primeira instalação e depois `npm run check` (tipos, lint, testes, formatação, limites preventivos, build e conferência de Paths).
4. Executar `git diff --check` e revisar `git diff` antes de registrar mudanças.
5. Confirmar GitHub Actions verde, registrar resultados e pendências em `docs/etapas/etapa-X/`.
6. Apresentar arquivos alterados, critérios testados, riscos e o próximo item **não iniciado**. Aguardar aceite expresso do Mestre.

`npm run check` não instala dependências nem publica. Ele cria arquivos em `dist/`, ignorados pelo Git. `npm run format` faz alterações locais; revise-as antes de incluir em commit.

## Qualidade e testes

- **TypeScript estrito:** `npm run typecheck`.
- **Padrões e formatação:** `npm run lint`, `npm run format:check`.
- **Testes automatizados:** `npm run test:run` (Vitest + jsdom; casos de módulos e rede real devem ser adicionados somente nas etapas correspondentes).
- **Caminho estático Pages:** `npm run build` e `npm run pages:check`.
- **Verificações preventivas:** `npm run verify:boundaries` checa lockfile, campos públicos vazios, nomes de arquivos suspeitos e ausência de comandos de publicação no workflow da fundação.

A verificação de limites tem escopo deliberadamente pequeno. Não analisa o conteúdo de todos os arquivos, não substitui revisão de PR, auditoria de segurança, Rules do Firebase ou testes com contas reais. Mais tarde, quando uma etapa autorizar integração ou deploy, **as verificações de limite deverão ser revisadas por mudança controlada**, sem removê-las silenciosamente.

## Política de dados e segurança

- O repositório é público. **Nunca** versionar senhas, service accounts, tokens, PDFs restritos, fichas de jogadores ou notas privadas do Mestre.
- Os arquivos `src/data/` e `public/` são redistribuíveis publicamente por definição.
- `.env.local` está ignorado. `.env.example` só pode ter nomes de variáveis públicas, sem valores.
- Toda variável `VITE_*` incluída no JavaScript compilado deve ser considerada pública. Dados pessoais de autenticação não devem ficar nessa configuração.
- Evitar alterações de autorização por ocultar elementos da UI. A verificação das Rules do Firestore acontecerá quando explicitamente autorizada, na Etapa 3.
- Não testar login real, Firebase remoto ou migração fora das etapas aprovadas.

## Regra de gratuidade e publicação

- Projeto permanece no GitHub Pages e Firebase Spark; não habilitar Blaze, Cloud Storage, Functions, outros serviços pagos ou cobranças.
- GitHub Actions deve usar `contents: read` e não ter `pages: write`, `id-token: write` nem comandos de deploy durante a fundação.
- O artefato do build criado pela Actions tem retenção limitada; **não é URL pública do Hub**.
- Publicação/substituição do site só com homologação e autorização específica da Etapa 8.

## Tratamento de falhas e recuperação

Quando uma verificação falhar: identificar o comando e o erro concreto, registrar causa, aplicar correção mínima na branch isolada e repetir o workflow. **Nunca** apresentar um build como aprovado se o último teste relevante falhou.

Antes de mudanças futuras no armazenamento ou no acesso, documentar a origem dos dados e um plano de exportação/restauração. Não excluir dados, limpar `localStorage` antigo, recriar contas ou redefinir senhas. A recuperação completa e seu ensaio pertencem à Etapa 8.

## Registro obrigatório

Cada entrega deve informar: item/etapa, versão/data, commits e arquivos alterados, resultado dos testes, restrições/pontos pendentes, estado da `main`, estado da publicação/Firebase e decisão do Mestre. Consulte [Estado atual](ESTADO-ATUAL.md).
