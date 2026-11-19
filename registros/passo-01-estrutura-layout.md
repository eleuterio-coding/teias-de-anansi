# Passo 01 — Estrutura e layout

**Situação:** implementação inicial; pendente de revisão e aprovação.
**Data:** 19/11/2026.
**Progresso global:** 0/11 passos concluídos.

## Pedido original desta retomada

> Fazer HUB de RPG.

## Determinações preservadas

- Reconstruir o Teias de Anansi do zero, sem restaurar o código antigo após o reset do repositório.
- Seguir **exatamente 11 passos, na ordem**, sem avançar automaticamente para o próximo.
- Tecnologia: React, TypeScript e Vite; preparação para GitHub Pages e Firebase existente.
- Preservar o Firebase, os usuários e suas permissões atuais. **Não modificar configuração, banco nem regras nesta etapa.**
- Usar registros Markdown individuais por etapa (sem recriar `AGENTS.md` ou `HUB-CONTINUIDADE.md`, excluídos por solicitação expressa).
- Separação conceitual Hub → Campanha → Aventura → Sessão; módulos em construção não devem simular dados reais.

## Checklist deste passo

- [x] Criar projeto React + TypeScript + Vite.
- [x] Criar design system com cores, fontes, espaçamento, bordas, botões, cards e estados.
- [x] Implementar menu lateral, barra superior e navegação por módulos.
- [x] Construir estrutura da visão geral, indicadores e planejamento.
- [x] Construir estados vazios, mensagens de implantação e atalhos.
- [x] Preparar responsividade e navegação acessível por teclado.
- [ ] Revisão visual pelo responsável e aprovação do Passo 01.

## Implementação

- `src/components/AppShell.tsx` — estrutura e busca de seções;
- `src/data/navigation.ts` — contrato de navegação dos módulos;
- `src/App.tsx` — visão geral, rotas e placeholders;
- `src/styles.css` — identidade e responsividade;
- `.github/workflows/validacao.yml` — CI sem deploy;
- `index.html`, `src/main.tsx`, `vite.config.ts`, `tsconfig*`, `package*.json` — fundação do projeto.

## Verificações e correções

- TypeScript: aprovado no GitHub Actions (`npm run typecheck`, 19/11/2026).
- Build para produção: aprovado no GitHub Actions (`npm run build`, 19/11/2026).
- Navegação: revisão manual em navegador ainda pendente de aprovação.
- Firebase: não acessado nem alterado.
- GitHub Pages: não publicado, aguardando etapa prevista no fluxo.

## Pendências e aprovação

Aprovação visual e funcional do responsável. O Passo 02 não será iniciado antes dessa decisão.