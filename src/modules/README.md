# Módulos funcionais

Cada subpasta agrupa as páginas, componentes e lógica de apresentação de uma área do Hub, sem acesso direto a credenciais ou regras do Firestore. Integrações são centralizadas em `src/services`; regras de jogo independentes da UI pertencem a `src/rules`.

Áreas previstas: usuários, biblioteca, personagens, campanhas, aventuras, NPCs, sessões, área do jogador e preferências. Essas pastas são somente reservadas em 1.03; nenhuma funcionalidade foi implementada.


## Padrão obrigatório para a implementação futura (Etapa 2.11)

**Os diretórios reservados da Etapa 1 não são módulos implementados.**
A reserva é reconhecida pelo verificador somente quando a pasta é uma das
nove reservas originais e contém exclusivamente o arquivo README.md.
Acrescentar qualquer código funcional encerra automaticamente a dispensa.

Todo módulo implementado deve seguir a estrutura:

~~~text
src/modules/biblioteca/
  README.md
  module.json
  index.tsx
tests/modules/biblioteca.test.tsx
docs/modules/biblioteca.md
~~~

Exemplo **documental**, não implementado, de manifesto module.json:

~~~json
{
  "id": "biblioteca",
  "label": "Biblioteca",
  "route": "/biblioteca",
  "stage": 4,
  "status": "draft"
}
~~~

O id deve ser igual à pasta; a rota, o rótulo e a etapa devem coincidir
com o catálogo aprovado em src/app/routes.ts. O status draft/ready não
ativa a rota nem autoriza publicação. A entrada index.tsx precisa ter
exportação padrão. Teste e documentação próprios são obrigatórios.

Reutilizar os pontos públicos das bibliotecas src/components/ui,
src/components/data, src/components/form e src/components/feedback.
É proibido criar CSS/Sass local ou componentes genéricos duplicados,
introduzir cores literais, acessar Firebase/fetch/storage diretamente
na interface ou renderizar HTML arbitrário.

Ao autorizar acesso a dados, usar os contratos de serviços centralizados
em src/services, com regras de acesso testadas; lógica de jogo reutilizável
permanece em src/rules. **Nenhum backend foi habilitado por este padrão.**

Verificação:

~~~bash
npm run verify:design-system
npm run check
~~~

Este é um scanner estático com testes de regressão, não substitui revisão
humana, testes assistivos, homologação de segurança nem aprovação expressa
antes de ativar o módulo ou publicar.

Documento completo:
[docs/arquitetura/padrao-obrigatorio-de-desenvolvimento.md](../../docs/arquitetura/padrao-obrigatorio-de-desenvolvimento.md).
