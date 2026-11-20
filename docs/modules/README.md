# Documento obrigatório de cada módulo

Quando um módulo real for autorizado, criar
**docs/modules/<slug>.md** correspondente ao manifesto e aos testes.

## Modelo a preencher

| Campo | O que registrar |
| --- | --- |
| Módulo, rota, etapa | id, label, route, stage e status do manifesto |
| Autorização | quem aprovou o item e quais alterações são permitidas |
| Objetivo e limites | o que o módulo faz, o que não faz nesta entrega |
| Dados | entidades, autorizações, serviços, leitura/escrita e riscos |
| Componentes | quais bibliotecas do Design System são utilizadas |
| Estados | loading, vazio, erro, sucesso, disabled e recuperação |
| Acessibilidade | teclado, foco, rótulos, ARIA, contraste, zoom e leitores |
| Responsividade | comportamento em 320, 375, 768, 1024 e 1440px |
| Testes | nome dos arquivos, casos, SHA, logs e resultado executado |
| Pendências | falhas abertas, riscos, justificativa e próximos passos |
| Publicação | confirmar que merge/deploy ainda exigem autorização |

**Não confundir testes escritos com testes executados.**

O repositório também contém o modelo de revisão em
.github/pull_request_template.md. O padrão completo está em
docs/arquitetura/padrao-obrigatorio-de-desenvolvimento.md.
