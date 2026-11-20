## Autorização e escopo

- Item/etapa expressamente aprovado:
- Branch de trabalho:
- Branch de destino (**main** somente com autorização adicional):
- Entregas incluídas e excluídas:

## Contrato do módulo

- [ ] Diretório src/modules/<slug> e manifesto module.json válidos.
- [ ] index.tsx com entrada React e rota, label, etapa coerentes.
- [ ] docs/modules/<slug>.md e tests/modules/<slug>.test.tsx.
- [ ] Componentes reutilizados de ui, data, form e feedback.
- [ ] Nenhum CSS local, cor literal ou componente global duplicado.
- [ ] Nenhum Firebase, fetch ou storage diretamente na interface.
- [ ] Controles de autorização e privacidade revisados nos serviços.
- [ ] Ações destrutivas exigem confirmação e efeitos efetivamente autorizados.

## Evidências de qualidade

- [ ] npm run verify:design-system — log e SHA:
- [ ] npm run check — log e SHA:
- [ ] Testes de loading, vazio, sucesso, erro e controle por teclado.
- [ ] Revisão responsiva (320/375/768/1024/1440px) e zoom.
- [ ] Contraste, rótulos, foco e leitor de tela quando aplicáveis.
- [ ] Fixtures e capturas sem dados privados.
- [ ] Branch main, publicação e Firebase mantidos inalterados.

## Pendências / exceções

- Testes escritos mas não executados:
- Falhas ainda abertas:
- Evidências e logs (sem segredos):
- Exceções solicitadas e decisão do Mestre:

> Nenhuma caixa deve ser marcada apenas pela existência de arquivo.
> O CI não substitui o aceite do Mestre e não autoriza publicação.
