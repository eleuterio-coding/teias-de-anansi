# Manual do Hub de RPG — Teias de Anansi v1

Este manual descreve o uso atual do Hub após a simplificação consolidada na v1.0.1. O produto é um site web responsivo: os dados locais ficam no navegador e, quando o usuário está autenticado, a camada de Colaboração sincroniza os estados previstos pelo modelo online.

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

Abra **Campanhas / Mesas** para criar uma Mesa. O formulário aceita nome, Mestre, cenário e resumo. O sistema e os defaults de Mestre/cenário podem vir de Configurações e permanecem editáveis antes da criação.

Dentro da Mesa é possível administrar participantes, personagens vinculados, contexto compartilhado e Sessões. Cada personagem deve manter relações consistentes com os participantes aos quais está vinculado.

### Sessões e encontros

Sessões podem ser planejadas, iniciadas, concluídas ou canceladas. Apenas uma sessão permanece ativa por Mesa. Encontros pertencem à sessão e permitem iniciativa, criaturas, PV, condições, turnos e recompensas. Uma sessão com encontro ativo não pode ser concluída antes de finalizar esse encontro.

## 6. Aventuras

A área Aventuras organiza planejamento narrativo vinculado à campanha: capítulos/arcos, cenas, locais, NPCs, encontros, pistas, handouts e tesouros. Pistas e handouts possuem estados próprios, permitindo manter material oculto até sua revelação.

Na Colaboração, a projeção compartilhada não inclui notas privadas do Mestre, pistas ocultas nem handouts ainda não revelados.

## 7. Bibliotecas

As Bibliotecas expõem os catálogos congelados para a linha v1: regras, classes, espécies, antecedentes, talentos, equipamentos, magias e demais entidades suportadas. A precedência normativa foi consolidada no Bloco 9 e novas fontes posteriores ao congelamento pertencem a versões futuras.

## 8. Usuários e Colaboração

A Colaboração usa acesso fechado por **usuário + senha**. As contas são criadas manualmente pelo proprietário no Firebase Authentication. Não existe cadastro público, convite por e-mail nem confirmação de e-mail.

O Firebase Authentication exige tecnicamente um identificador em formato de e-mail. Por isso, um usuário como `rafael` é convertido internamente em `rafael@teias.invalid`. Esse identificador é apenas técnico; o Hub não solicita nem exibe e-mail real como credencial de uso.

Se a conta existe no Firebase Authentication e a senha está correta, o usuário pode entrar. Não existe uma segunda coleção de autorização (`authorizedUsers`), `isAdmin` ou bloqueio administrativo dentro do Hub.

Os papéis de Mesa são:

- **Mestre (`dm`)**: recebe a visão privada/completa da Mesa.
- **Jogador (`player`)**: recebe a projeção compartilhada e pode ter personagem vinculado à Mesa.
- **Observador (`observer`)**: recebe a projeção compartilhada sem assumir personagem quando a Mesa assim estiver organizada.

A projeção compartilhada omite conteúdo exclusivo do Mestre, como notas privadas, pistas ocultas e handouts ainda não revelados.

Essa diferença é um comportamento funcional do Hub para organizar a experiência da Mesa. O projeto é particular e pressupõe participantes de confiança; não existe objetivo de proteção contra um usuário autenticado que tente manipular diretamente o Firestore.

## 9. Sincronização

A sincronização Firebase permite que os estados cobertos pela Colaboração sejam atualizados entre navegadores/dispositivos.

Use a área **Usuários e Colaboração** para entrar e sincronizar. O estado local continua sendo usado pelo Hub; a camada online complementa esse estado.

Se houver perda de conexão, os fluxos estritamente locais continuam disponíveis. Quando a rede retorna, a Colaboração pode voltar a consultar e sincronizar o Firestore.

## 10. Configurações

Configurações guarda preferências locais de perfil, fontes, preset de Regras da Casa, densidade da ficha, referências de fonte, navegação fixa, tamanho de texto, contraste, redução de movimento e defaults de campanha.

Alterar uma configuração não reescreve retroativamente personagens ou Mesas existentes. O preset de Regras da Casa é uma preferência normativa local e não é gravado artificialmente no schema atual da campanha.

## 11. Troca de navegador ou dispositivo

**Não existe Backup/exportação/restauração no produto atual.**

Para estados cobertos pela Colaboração, entre com a mesma conta e use a sincronização Firebase. Estados que existirem apenas localmente não têm garantia de continuidade se o armazenamento do navegador for apagado antes de serem sincronizados.

Por isso, a regra prática é simples: antes de limpar dados do navegador ou abandonar um dispositivo, sincronize os personagens/Mesas que deseja manter online.

## 12. Limitações deliberadas da linha v1

O Hub é somente web e permanece hospedado no GitHub Pages. Firebase é usado apenas no plano Spark / No-cost. Não há aplicativo Android/iOS/desktop, Firebase Hosting, Cloud Functions, Supabase ou dependência de faturamento.

Também são decisões deliberadas do produto atual:

- não possuir área de Backup;
- não possuir cadastro público;
- não exigir e-mail real;
- não possuir autorização administrativa paralela ao Firebase Authentication;
- manter Mestre/Jogador/Observador como papéis funcionais de Mesa, não como camada de segurança contra participantes maliciosos.

Novas fontes normativas após o congelamento da linha v1 são expansão futura.
