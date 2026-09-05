# Validação observável do CI — Bloco 18

Arquivo técnico temporário de evidência para abrir um PR sobre a `main` atual e tornar os workflows `pull_request` observáveis pelo conector de GitHub durante a homologação da v1.0.

Este arquivo não altera runtime, regras, schemas, dados, Firebase ou critérios de release. O PR correspondente só poderá ser mesclado se os gates normais do Bloco 18 ficarem verdes.

Revalidação disparada após a correção sintática de `scripts/character-sheet-rest-ui.js` identificada pela auditoria de cobertura total.

Nova revalidação disparada após alinhar `tests/auditar-painel-geral.mjs` ao estado pós-Bloco 17, em que Configurações já está disponível e nenhuma área principal permanece desabilitada.

Validação final disparada para tornar observável também o gate Firebase multiusuário real; ausência de qualquer Secret obrigatório deve falhar explicitamente no preflight.
