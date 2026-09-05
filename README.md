# Teias de Anansi — Hub de RPG

**Local onde histórias ganham vida.**

Teias de Anansi é um Hub de RPG web responsivo, pessoal e particular, voltado para um pequeno grupo de pessoas de confiança. O núcleo atual usa D&D 5.5e / 2024, com criação e uso de personagens, Campanhas/Mesas, Sessões, encontros, Aventuras, bibliotecas de regras e colaboração online.

O produto é **somente um site web**, hospedado no GitHub Pages. Não há aplicativo Android/iOS/desktop, Firebase Hosting, Cloud Functions, Supabase ou requisito de faturamento. O Firebase é usado apenas para login e sincronização no plano Spark / No-cost.

## Áreas do Hub

### Personagens

A área de Personagens reúne a Criação de Personagem e a Ficha Digital. O construtor organiza a criação em sete etapas. Depois da criação, a Ficha é a autoridade de jogo: progressão, recursos, ataques, inventário, economia, magias, descansos, condições e demais estados representáveis ficam nela.

A progressão pós-criação é sequencial até o Level 20. Subir de Level não reaplica pacotes iniciais, não recria orçamento de criação e não concede riqueza automática por Level.

### Campanhas / Mesas

Campanhas armazenam Mestre, cenário, contexto compartilhado, participantes e Sessões. Sessões podem conter encontros com iniciativa, criaturas, PV, condições, turnos, recompensas e registro de resultado.

Cada participante recebe um papel na Mesa. **Mestre** usa a visão completa; **Jogador** e **Observador** recebem a visão compartilhada. Essa separação é uma função do Hub para organizar a experiência da Mesa, não uma camada de segurança contra usuários maliciosos.

### Aventuras

Aventuras organizam capítulos/arcos, cenas, locais, NPCs, encontros, pistas, handouts e tesouros vinculados à Mesa. A projeção compartilhada omite notas exclusivas do Mestre, handouts ainda não revelados e pistas ainda ocultas.

### Bibliotecas

As Bibliotecas expõem os catálogos normativos do Hub. A precedência entre fontes, compatibilidade e overrides de Regras da Casa são auditados por testes dedicados.

### Usuários

O acesso é simples: **nome de usuário + senha**. As contas são criadas manualmente pelo proprietário do Hub no Firebase Authentication.

O Firebase exige internamente um identificador no formato de e-mail, por isso o Hub transforma `rafael`, por exemplo, em `rafael@teias.invalid`. Esse identificador é apenas técnico: nenhum e-mail real é solicitado ou exibido pelo Hub.

Não existe cadastro público, convite por e-mail, confirmação de e-mail nem uma segunda lista de autorização. Se a conta existe no Firebase Authentication e a senha está correta, ela pode entrar.

Depois do primeiro login, a conta pode ser vinculada a uma Mesa como Mestre, Jogador ou Observador.

### Painel Geral

O Painel Geral agrega personagens, Mesas, próxima sessão, personagem em jogo, pendências e atividade recente.

### Configurações

Configurações guarda preferências locais de perfil, fontes habilitadas, preset de Regras da Casa, densidade da Ficha, referências de fonte, acessibilidade e defaults de campanha.

## Persistência

O estado local usa `localStorage` com schemas e chaves versionadas. Entre as principais coleções estão:

- `hub-rpg:characters:v4`
- `hub-rpg:campaigns:v1`
- `hub-rpg:adventures:v1`
- `hub-rpg:settings:v1`

**Backup/exportação/restauração não fazem parte do produto atual.** A persistência normal do Hub continua existindo; o que foi removido foi a área específica de Backup.

## Colaboração e Firebase

O Firebase tem três responsabilidades simples:

1. autenticar usuários criados manualmente;
2. sincronizar personagens e Mesas entre navegadores/dispositivos;
3. guardar os dados usados pela colaboração.

O Firestore aceita leitura e escrita de qualquer usuário autenticado. O projeto é pessoal e pressupõe participantes de confiança. A separação Mestre/Jogador acontece na aplicação: a visão do Mestre usa o bundle privado e a visão do Jogador usa a projeção compartilhada.

## Desenvolvimento e testes

A aplicação não exige processo de build para uso normal: basta servir os arquivos estáticos por HTTP. As auditorias de domínio estão em `tests/*.mjs`.

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

A colaboração Firebase real pode ser validada com:

```bash
npm run test:e2e:firebase
```

No GitHub Actions, a homologação de colaboração roda automaticamente quando arquivos dessa área mudam na `main`.

## Documentação

- `ROADMAP-V1.md` — histórico do escopo e dos blocos da v1.
- `docs/MANUAL.md` — fluxos de uso.
- `docs/ARQUITETURA.md` — arquitetura web, persistência e Firebase.
- `FIREBASE-PROVISIONAMENTO.md` — configuração Firebase utilizada pelo Hub.

## Versões

- **v1.0.0** — release inicial publicada.
- **v1.0.1** — simplificação pós-release: remoção da área de Backup e da autorização/hardening adicional; manutenção de login simples e da separação funcional Mestre/Jogador.
