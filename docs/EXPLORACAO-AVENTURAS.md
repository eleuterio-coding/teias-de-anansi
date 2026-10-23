# Exploração genérica de Aventuras

## Princípio
A arquitetura atende aventuras lineares, não lineares, autorais ou publicadas. Nenhuma aventura comercial é importada como conteúdo. O Hub separa:
- **Campanha**: mundo, elenco, locais e NPCs reutilizáveis.
- **Aventura**: objetivos, cenas, facções, áreas persistentes e exploração.
- **Nível**: agrupamento opcional (andar, bairro, setor, região, nave etc.) e mapa opcional.
- **Área**: unidade persistente explorável, identificador opcional, descrição e condições mutáveis.
- **Cena**: acontecimento narrativo, opcionalmente vinculado a uma Área.
- **Sessão**: o que foi realmente jogado; a crônica registra uma visita sem finalizar a cena.

## Mestre — fluxo de uso
1. Abrir uma Aventura e localizar a seção **Exploração**.
2. Em **Gerenciar níveis e mapas**, criar um nível e informar uma URL HTTPS ou caminho relativo para uma imagem opcional.
3. Em **Adicionar área / sala**, criar quantas áreas forem necessárias, mesmo sem nível ou mapa.
4. Filtrar as áreas por nível, status e texto. Selecionar uma área pela lista ou pelo marcador do mapa.
5. No editor de área, configurar código, nome, tipo, descrições pública e interna, texto para narração, testes, perigos, interações, notas, consequências e coordenadas opcionais X/Y (0 a 100%).
6. Associar Área, nível, área superior, Local da Campanha e Capítulo. Vincular NPCs, Monstros, Facções, Objetivos, Pistas, Tesouros, Materiais e outras Áreas.
7. Registrar status e acontecimentos relacionados à sessão; a crônica preserva data, texto e estado anterior/novo.
8. Criar Facções com nome, relação, objetivo, informação pública e privada; associar às Áreas.
9. No editor de Cenas, vincular a cena à Área pertinente. Muitas cenas podem se passar na mesma área, em diferentes sessões.

Estados de área: unknown (não descoberta), discovered (descoberta), visited (visitada), resolved (resolvida) e blocked (bloqueada). Uma área visitada não implica concluir cenas, objetivos ou encontros.

## Modelo persistido e compatibilidade
A chave de armazenamento continua sendo hub-rpg:adventures:v1 e o schema interno passa a hub-rpg/adventure/v3. Registros antigos ganham exploration vazio, sem alterar cenas e vínculos existentes. A propriedade exploration contém:
- levels: nome, ordem, mapa (mapUrl), descrição privada, notas e publicação do nome;
- areas: código, nome, tipo, nível e hierarquia, status, conteúdos separados por privacidade, marcadores X/Y e IDs de entidades relacionadas;
- factions: nome, postura, objetivo, relação, descrições pública/privada e publicação;
- history: área, sessão opcional, data, estado anterior/novo, texto e publicação.

As cenas recebem areaId opcional. A normalização valida IDs, impede conexões consigo mesma e rompe ciclos de hierarquia. Excluir uma área desvincula cenas e outras áreas, preservando o histórico. Excluir nível ocupado é bloqueado. Ao mover uma aventura entre campanhas, os dados da exploração e facções permanecem, mas referências a sessão antiga e a NPC/Local não existente no destino são removidas.

## Acesso de jogadores
A projeção do Jogador recebe exclusivamente: níveis com nomes explicitamente publicados; áreas publicadas cujo estado não é unknown, com código, nome, tipo, status e descrição pública; facções publicadas, com nome, postura e descrição pública; e registros publicados de áreas já visíveis.

Nunca são enviados aos Jogadores nesta projeção mapas, coordenadas, perigos, testes, conexões secretas, motivações privadas, IDs de criaturas ou notas do Mestre. O mapa completo só pode ser apresentado como material/handout intencionalmente revelado. Vínculos de Campanha e Aventura continuam obrigatórios; exploração não abre permissões novas.

## Limitações intencionais
- O editor de marcador usa coordenadas percentuais, sem posicionamento por arrastar, fog of war, distância ou funcionalidades de VTT.
- Mapas são URLs ou recursos previamente hospedados; nenhum backend ou serviço pago foi acrescentado.
- Facções não alteram automaticamente atributos mecânicos e relações de NPCs.
- Nenhuma aventura, NPC, mapa ou sala é pré-cadastrado pelo sistema.
- Não ocorre importação ou conversão automática de módulos editoriais ou edições de regras.

## Verificação
Rodar node tests/auditar-exploracao.mjs, node tests/auditar-release-v1.mjs e npm run test:e2e. Validar especialmente que um Jogador não recebe informação privada mesmo tendo acesso à Aventura.
