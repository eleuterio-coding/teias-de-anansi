# Contrato inicial do Compêndio — hub-compendio/1.0

Estado: contrato de preparação estrutural do Hub, não homologado para integração com o RPG Extractor. Não autoriza importação nem publicação de livros.

## Envelope JSON
- schemaVersion: literal "hub-compendio/1.0".
- systems: lista de {id, name, edition}. Cada id representa uma combinação sistema/edição.
- publications: lista de {id, systemId, title, source, rights}. A publicação pertence a uma edição cadastrada; source e rights são declarações obrigatórias, não verificações de proveniência ou licença.
- records: lista de {id, systemId, publicationId, category, title, visibility, locator, data}. A publicação deve existir no mesmo sistema/edição. locator identifica a origem documental; data é um objeto JSON passivo, jamais código executado.

IDs: 1 a 128 caracteres ASCII minúsculos, dígitos, ponto, sublinhado e hífen; começar com letra ou dígito. Identidade do registro: (systemId, publicationId, category, id). Não misturar edições ou sobrescrever registros automaticamente.

Categorias: regras, classes, especies, magias, equipamentos, criaturas. Sistemas e Livros correspondem às listas systems e publications.

Visibilidade proposta: master (Mestre) ou shared (Jogador e Mestre). O atributo é uma declaração de dados, não uma autorização de acesso. O Firestore deve impor a política na fase de persistência; dados privados não podem ficar no GitHub público.

## Fluxo
Administração > Importação de JSONs ou Validação de dados. Selecionar JSON até 20 MiB. O navegador confere envelope, campos, categorias, vínculos, identidades duplicadas e visibilidade. Não envia, salva ou publica o arquivo. O resultado apresenta contagens ou até 100 erros. Importação permanece bloqueada inclusive com estrutura válida.

O contrato não aceita diretamente ZIPs ou manifestos do extrator. Será preciso mapear uma exportação autorizada e verificar proveniência, direitos, evidências, dependências e homologação antes de permitir armazenamento. Nenhum adaptador ou teste de interoperabilidade foi executado.

## Testes
Ver tests/compendio-1.0-results.json. Testes com fixtures isoladas em memória e conferências estáticas; não há homologação do navegador, Firebase ou conteúdo de RPG.
