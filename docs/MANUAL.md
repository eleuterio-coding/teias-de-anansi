# Manual do Hub de RPG — Teias de Anansi v1.0

Este manual descreve os fluxos de uso da v1.0 do Hub. O produto é um site web responsivo: os dados locais ficam no navegador e, quando a conta está autorizada, a camada de Colaboração sincroniza os estados previstos pelo modelo online.

## 1. Início e Painel Geral

A página inicial reúne Personagens, Campanhas / Mesas, Sessões, Aventuras, Bibliotecas, Dados / Backup, Usuários, Painel Geral e Configurações. O Painel Geral é a visão operacional: mostra personagens recentes, Mesas, próxima sessão, personagem em jogo, pendências e atividade recente.

## 2. Criação de Personagem

Abra **Personagens → Criar Personagem**. A Criação de Personagem é organizada em sete etapas, com o menu de etapas fixo durante a navegação:

1. Classe e Nível.
2. Origem.
3. Raça.
4. Valores de Atributos.
5. Progressão.
6. Equipamento.
7. Revisão.

O construtor aplica catálogos e Regras da Casa já consolidados na v1.0. A criação pode produzir personagens acima do Level 1 quando isso fizer parte da proposta inicial da Mesa, mas isso não equivale a registrar progressões pós-criação.

Depois de concluir a estrutura inicial, use a Ficha Digital para jogar e administrar mudanças de estado.

## 3. Ficha Digital e Modo de Jogo

Em **Personagens → Abrir Fichas / Jogar**, escolha o personagem. A Ficha Digital é a autoridade de uso durante a campanha. Nela ficam atributos derivados, perícias, recursos, ataques, inventário, economia, magias, descansos, condições e progressão pós-criação.

### Equipamento e ataques

Armas são derivadas do inventário real do personagem. Armas Versáteis permanecem um único item com modos de uma ou duas mãos. O modo de duas mãos só fica disponível quando a segunda mão estiver livre. Propriedades e Maestria entram como mecânicas quando aplicáveis.

### Combate

A ficha resolve ataques, dano, crítico, testes, salvaguardas, cura, vantagem/desvantagem e modificadores mecânicos cobertos pela v1.0. Alterações de PV, recursos e condições são persistidas no estado do personagem.

### Magias e descansos

A ficha apresenta a progressão mágica derivada da classe/subclasse e controla os recursos relacionados. Descansos restauram apenas o que as regras implementadas determinam.

## 4. Subir de Level

A progressão pós-criação acontece na Ficha Digital. Use **Subir de Level** na seção Progressão.

O fluxo é sequencial: um personagem no Level 5 avança para o Level 6 antes de poder chegar ao 7. Não é permitido saltar Levels pelo fluxo de progressão. O sistema aplica características de classe/subclasse, escolhas obrigatórias, talentos e aumentos previstos pela Progressão Universal.

A progressão não reaplica equipamento inicial, não recria o orçamento de criação e não concede uma nova riqueza automática por Level. Quando o PV máximo aumenta, o sistema preserva o dano atual em vez de curar artificialmente o personagem. O limite da v1.0 é Level 20.

## 5. Campanhas / Mesas

Abra **Campanhas / Mesas** para criar uma Mesa. O formulário aceita nome, Mestre, cenário e resumo. O sistema e os defaults de Mestre/cenário podem vir de Configurações e permanecem editáveis antes da criação.

Dentro da Mesa é possível administrar participantes, personagens vinculados, contexto compartilhado e Sessões. Cada personagem deve manter relações consistentes com os participantes aos quais está vinculado.

### Sessões e encontros

Sessões podem ser planejadas, iniciadas, concluídas ou canceladas. Apenas uma sessão permanece ativa por Mesa. Encontros pertencem à sessão e permitem iniciativa, criaturas, PV, condições, turnos e recompensas. Uma sessão com encontro ativo não pode ser concluída antes de finalizar esse encontro.

## 6. Aventuras

A área Aventuras organiza planejamento narrativo vinculado à campanha: capítulos/arcos, cenas, locais, NPCs, encontros, pistas, handouts e tesouros. Pistas e handouts possuem estados próprios, permitindo manter material oculto até sua revelação.

Na Colaboração, a projeção compartilhada não deve incluir notas privadas do Mestre, encontros privados nem pistas/handouts ainda ocultos.

## 7. Bibliotecas

As Bibliotecas expõem os catálogos congelados para a v1.0: regras, classes, espécies, antecedentes, talentos, equipamentos, magias e demais entidades suportadas. A precedência normativa foi consolidada no Bloco 9 e novas fontes posteriores ao congelamento pertencem a versões futuras.

## 8. Dados / Backup

A página **Dados / Backup** é a ferramenta de portabilidade do estado local.

### Exportar

Use **Exportar backup completo**. O arquivo JSON contém manifesto, schemas versionados e checksum de integridade para Personagens, Campanhas/Sessões e Aventuras.

### Restaurar

Selecione um arquivo válido. O modo **Mesclar** mantém, por ID, o registro mais recente. O modo **Substituir** exige digitar `SUBSTITUIR` e troca todo o estado portátil pelo conteúdo do arquivo.

Antes de uma restauração, o Hub cria um snapshot local de recuperação. Se qualquer gravação falhar, a operação é revertida. A seção **Desfazer última restauração** permite voltar ao snapshot capturado imediatamente antes da importação.

Configurações locais não entram no backup v1 porque possuem um schema separado do pacote portátil já congelado.

## 9. Usuários e Colaboração

A Colaboração usa acesso fechado por **usuário + senha**. Não existe cadastro público nem convite por e-mail. Internamente, o usuário é convertido para um identificador técnico do Firebase Authentication, mas esse endereço não é apresentado como identidade do jogador.

Uma conta só é aceita quando, além de existir no Authentication, possui registro ativo em `authorizedUsers/{uid}`. Os papéis de Mesa são:

- **Mestre**: administra o estado privado da Mesa quando autorizado.
- **Jogador**: acessa o estado compartilhado e pode vincular o próprio personagem nos limites permitidos.
- **Observador**: leitura compartilhada conforme as regras da Mesa.

O administrador pode autorizar/bloquear usuários e definir vínculos com Mesas. A sincronização preserva a separação entre dados privados e compartilhados.

## 10. Configurações

Configurações guarda preferências locais de perfil, fontes, preset de Regras da Casa, densidade da ficha, referências de fonte, navegação fixa, tamanho de texto, contraste, redução de movimento e defaults de campanha.

Alterar uma configuração não reescreve retroativamente personagens ou Mesas existentes. O preset de Regras da Casa é uma preferência normativa local e não é gravado artificialmente no schema atual da campanha.

## 11. Troca de navegador ou dispositivo

Para dados estritamente locais, exporte um Backup antes de limpar o navegador ou mudar de dispositivo. Quando a sincronização online estiver habilitada para sua conta e Mesa, use **Usuários → Sincronizar agora** para atualizar os estados online cobertos pela Colaboração. Backup e sincronização são mecanismos complementares: o primeiro é a cópia portátil explícita; o segundo é a continuidade online autorizada.

## 12. Limitações deliberadas da v1.0

O Hub é somente web e permanece hospedado no GitHub Pages. Firebase é usado apenas no plano Spark / No-cost. Não há aplicativo Android/iOS/desktop, Firebase Hosting, Cloud Functions, Supabase ou dependência de faturamento. Novas fontes normativas após o congelamento da v1.0 são expansão futura.
