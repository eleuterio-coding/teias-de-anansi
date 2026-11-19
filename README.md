# Teias de Anansi — Hub de RPG

Projeto reconstruído do zero, organizado em uma sequência fixa de **11 passos**.

**Etapa atual: Passo 01 — Estrutura e layout** (ainda não aprovado).

## Tecnologias

- React + TypeScript + Vite
- CSS com tokens centralizados e layout responsivo
- GitHub Pages (destino de publicação; não configurado nesta etapa)
- Firebase existente (integração adiada; **não modificado**)

## Desenvolvimento local

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Para visualizar a compilação: `npm run preview`.

## Escopo deste passo

- AppShell com menu lateral e barra superior
- Visão geral, indicadores vazios, planejamento e atalhos
- Navegação entre áreas via hash, compatível com hospedagem estática em subcaminho
- Biblioteca e áreas do Hub com estados vazios (sem simular dados reais)
- Responsividade, navegação por teclado e estados de foco

**Aviso:** esta é somente uma fundação visual. Não há autenticação, conexão com Firestore, persistência, regras de acesso, CRUD de campanhas ou recursos efetivos de jogo. Não use dados pessoais no layout de demonstração.

O registro deste passo está em [`registros/passo-01-estrutura-layout.md`](registros/passo-01-estrutura-layout.md). Os demais passos não foram iniciados.