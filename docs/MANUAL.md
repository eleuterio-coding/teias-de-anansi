# Manual do Hub de RPG — Teias de Anansi v1

Este manual descreve o uso atual do Hub na **v1.0.2**. O produto é um site web responsivo: os dados locais ficam no navegador e, quando o usuário está autenticado, a camada de Colaboração sincroniza os estados previstos pelo modelo online.

## 1. Início e Painel Geral

A página inicial reúne Personagens, Campanhas / Mesas, Sessões, Aventuras, Bibliotecas, Usuários, Painel Geral e Configurações. O Painel Geral é a visão operacional: mostra personagens recentes, Mesas, próxima sessão, personagem em jogo, pendências e atividade recente.

A antiga área **Dados / Backup** não faz parte do produto atual.

## 2. Criação de Personagem

Abra **Personagens → Criar Personagem**. A Criação de Personagem é organizada em sete etapas, com o menu de etapas fixo durante a navegação:

1. Classe e Nível.
2. Origem.
3. Raça.
4. Valores de Atributos.
5. Progressão.
6. Equipamento.
7. Revisão.

O construtor aplica catálogos e Regras da Casa já consolidados na linha v1. A criação pode produzir personagens acima do Level 1 quando isso fizer parte da proposta inicial da Mesa, mas isso não equivale a registrar progressões pós-criação.

Depois de concluir a estrutura inicial, use a Ficha Digital para jogar e administrar mudanças de estado.

## 3. Ficha Digital e Modo de Jogo

Em **Personagens → Abrir Fichas / Jogar**, escolha o personagem. A Ficha Digital é a autoridade de uso durante a campanha. Nela ficam atributos derivados, perícias, recursos, ataques, inventário, economia, magias, descansos, condições e progressão pós-criação.

Quando a conta conectada é de Jogador, a Lista de Personagens mostra somente a ficha atribuída pelo Mestre. Essa ficha continua editável normalmente durante o jogo.

### Equipamento e ataques

Armas são derivadas do inventário real do personagem. Armas Versáteis permanecem um único item com modos de uma ou duas mãos. O modo de duas mãos só fica disponível quando a segunda mão estiver livre. Propriedades e Maestria entram como mecânicas quando aplicáveis.

### Combate

A ficha resolve ataques, dano, crítico, testes, salvaguardas, cura, vantagem/desvantagem e modificadores mecânicos cobertos pela linha v1. Alterações de PV, recursos e condições são persistidas no estado do personagem.

### Magias e descansos

A ficha apresenta a progressão mágica derivada da classe/subclasse e controla os recursos relacionados. Descansos restauram apenas o que as regras implementadas determinam.

## 4. Subir de Level

A progressão pós-criação acontece na Ficha Digital. Use **Subir de Level** na seção Progressão.

O fluxo é sequencial: um personagem no Level 5 avança para o Level 6 antes de poder chegar ao 7. Não é permitido saltar Levels pelo fluxo de progressão. O sistema aplica características de classe/subclasse, escolhas obrigatórias, talentos e aumentos previstos pela Progressão Universal.

A progressão não reaplica equipamento inicial, não recria o orçamento de criação e não concede uma nova riqueza automática por Level. Quando o PV máximo aumenta, o sistema preserva o dano atual em vez de curar artificialmente o personagem. O limite da linha v1 é Level 20.

## 5. Campanhas / Mesas

### Mestre

Abra **Campanhas / Mesas** para criar e administrar uma Mesa. O formulário aceita nome, Mestre, cenário e resumo. O sistema e os defaults de Mestre/cenário podem vir de Configurações e permanecem editáveis antes da criação.

Dentro da Mesa, o Mestre administra participantes, personagens vinculados, contexto compartilhado e Sessões.

### Jogador

O Jogador vê somente as **Campanhas/Mesas às quais sua conta foi vinculada**. Ele não cria, altera ou exclui a Mesa nem modifica o próprio vínculo.

A página da Mesa entra em modo de leitura para o Jogador e não carrega as ferramentas exclusivas do Mestre.

## 6. Sessões e encontros

Sessões podem ser planejadas, iniciadas, concluídas ou canceladas pelo Mestre. Apenas uma Sessão permanece ativa por Mesa. Encontros pertencem à Sessão e permitem iniciativa, criaturas, PV, condições, turnos e recompensas. Uma Sessão com encontro ativo não pode ser concluída antes de finalizar esse encontro.

Para Jogadores, a visibilidade é derivada da ficha atribuída: ele vê somente as **Sessões em que esse personagem está listado como participante**.

O Jogador não altera a Sessão nem os vínculos de participação.

## 7. Aventuras

A área Aventuras organiza planejamento narrativo vinculado à Campanha: capítulos/arcos, cenas, locais, NPCs, encontros, pistas, handouts e tesouros.

O Mestre administra as Aventuras. Para Jogadores, o Hub mostra somente as **Aventuras ligadas às Sessões das quais a ficha atribuída participa**.

Mesmo dentro de uma Aventura visível, a visão do Jogador não inclui notas privadas do Mestre, pistas ocultas nem handouts ainda não revelados.

O Jogador não altera a Aventura.

## 8. Bibliotecas

As Bibliotecas expõem os catálogos congelados para a linha v1: regras, classes, espécies, antecedentes, talentos, equipamentos, magias e demais entidades suportadas. A precedência normativa foi consolidada no Bloco 9 e novas fontes posteriores ao congelamento pertencem a versões futuras.

**Bibliotecas permanecem disponíveis aos Jogadores.**

## 9. Usuários e Colaboração

A Colaboração usa acesso fechado por **usuário + senha**. As contas são criadas manualmente pelo proprietário no Firebase Authentication. Não existe cadastro público, convite por e-mail nem confirmação de e-mail.

O Firebase Authentication exige tecnicamente um identificador em formato de e-mail. Por isso, um usuário como `gus` é cadastrado tecnicamente como `gus@teias.invalid`, mas no Hub usa apenas `gus` + senha.

Não existe `authorizedUsers`, `isAdmin` ou uma segunda liberação administrativa para entrar no Hub.

Os papéis de Mesa são:

- **Mestre (`dm`)**: administra a Mesa e recebe a visão privada/completa.
- **Jogador (`player`)**: recebe apenas o conteúdo associado à sua participação e possui uma ficha atribuída.
- **Observador (`observer`)**: recebe a visão compartilhada conforme o vínculo da Mesa, sem edição de ficha de Jogador.

### Como atribuir um Jogador

O fluxo é controlado pelo Mestre:

1. a conta do Jogador já deve existir no Firebase Authentication;
2. o Jogador entra no Hub pelo menos uma vez para que sua identidade seja conhecida pela colaboração;
3. o Mestre vincula essa conta à Campanha/Mesa com papel `player`;
4. o Mestre associa a ficha correta ao Jogador;
5. nas Sessões, o Mestre define quais personagens participam;
6. Aventuras visíveis são derivadas das Sessões associadas às cenas da Aventura.

O Jogador não escolhe nem altera essas atribuições.

## 10. O que o Jogador pode e não pode alterar

O contrato da v1.0.2 é simples:

**Pode alterar:**

- somente a própria ficha atribuída.

**Não pode alterar:**

- Campanha/Mesa;
- papel ou vínculo de participante;
- Sessão;
- participação em Sessão;
- Aventura;
- conteúdo privado do Mestre;
- ficha de outro personagem.

## 11. Sincronização

A sincronização Firebase permite que os estados cobertos pela Colaboração sejam atualizados entre navegadores/dispositivos.

Use a área **Usuários e Colaboração** para entrar e sincronizar. O estado local continua sendo usado pelo Hub; a camada online complementa esse estado.

Se houver perda de conexão, os fluxos estritamente locais continuam disponíveis. Quando a rede retorna, a Colaboração pode voltar a consultar e sincronizar o Firestore.

Quando o mesmo navegador é usado por contas diferentes, o Hub filtra o cache de colaboração pela identidade conectada para evitar que conteúdo de outro Jogador apareça na interface.

## 12. Configurações

Configurações guarda preferências locais de perfil, fontes, preset de Regras da Casa, densidade da ficha, referências de fonte, navegação fixa, tamanho de texto, contraste, redução de movimento e defaults de campanha.

Alterar uma configuração não reescreve retroativamente personagens ou Mesas existentes. O preset de Regras da Casa é uma preferência normativa local e não é gravado artificialmente no schema atual da campanha.

## 13. Troca de navegador ou dispositivo

**Não existe Backup/exportação/restauração no produto atual.**

Para estados cobertos pela Colaboração, entre com a mesma conta e use a sincronização Firebase. Estados que existirem apenas localmente não têm garantia de continuidade se o armazenamento do navegador for apagado antes de serem sincronizados.

## 14. Limitações deliberadas da linha v1

O Hub é somente web e permanece hospedado no GitHub Pages. Firebase é usado apenas no plano Spark / No-cost. Não há aplicativo Android/iOS/desktop, Firebase Hosting, Cloud Functions, Supabase ou dependência de faturamento.

Também são decisões deliberadas do produto atual:

- não possuir área de Backup;
- não possuir cadastro público;
- não exigir e-mail real;
- não possuir autorização administrativa global paralela ao Firebase Authentication;
- manter as permissões de Mestre/Jogador apenas no nível necessário para entregar a experiência correta da Mesa.

Novas fontes normativas após o congelamento da linha v1 são expansão futura.

**Versão de referência deste manual: v1.0.2.**
