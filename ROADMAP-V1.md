# Roadmap oficial de fechamento — Hub de RPG v1

Este arquivo registra o fechamento da v1.0 e a correção de escopo consolidada na v1.0.1. Os Blocos 1–18 permanecem encerrados; a v1.0.1 não reabre o roadmap funcional, apenas substitui requisitos que deixaram de fazer sentido para um Hub pessoal e particular.

## Regra de encerramento

O Bloco 18 está aceito e a linha v1 está concluída. Conteúdo, livros, suplementos ou funcionalidades adicionados depois do congelamento de escopo entram em expansões futuras e não reabrem a v1.

## Regras de plataforma e custo

- O Hub de RPG é **somente um site web responsivo**, acessado pelo navegador e hospedado no GitHub Pages.
- Não criar aplicativo Android, iOS ou desktop; não depender de APK, Play Store ou App Store.
- Serviços externos devem funcionar **sem cartão de crédito, sem método de pagamento e sem conta de faturamento**.
- Para Firebase, usar apenas **Spark / No-cost**, sem Blaze, Firebase Hosting, Cloud Functions ou qualquer recurso que exija billing.
- Se um serviço necessário passar a exigir pagamento/cartão, substituir o serviço em vez de ativar cobrança.
- Não usar Supabase.

## Decisão de escopo consolidada na v1.0.1

O Hub é um projeto pessoal, particular e destinado a poucas pessoas de confiança. Por decisão explícita do responsável pelo projeto:

- **Backup/exportação/restauração não fazem parte do produto atual.**
- Não existe objetivo de hardening contra participantes maliciosos.
- O Firebase Authentication é a única barreira de entrada: contas são criadas manualmente pelo proprietário.
- O login visível é apenas **usuário + senha**; nenhum e-mail real é necessário. O domínio `@teias.invalid` existe somente como identificador técnico interno do Firebase Authentication.
- Não existe segunda lista de autorização (`authorizedUsers`), `isAdmin` ou papel administrativo global para liberar acesso.
- A distinção **Mestre / Jogador / Observador permanece**, porque é necessária à experiência da Mesa.
- Mestre recebe a visão privada; Jogador e Observador recebem a projeção compartilhada, que omite conteúdo ainda não revelado ou exclusivo do Mestre.
- Essa diferença de visão é comportamento funcional da aplicação, não uma fronteira de segurança contra usuários maliciosos.

A persistência normal e a sincronização Firebase continuam fazendo parte do produto. O que foi removido foi a área específica de Backup e a camada adicional de autorização/hardening.

## Blocos

1. Ficha Digital / Modo de Jogo — ✅ Aceito
2. Progressão de Level — ✅ Aceito
3. Inventário e economia pós-criação — ✅ Aceito
4. Combate e recursos mecânicos — ✅ Aceito
5. Magias e descansos — ✅ Aceito
6. Campanhas/Mesas — ✅ Aceito
7. Biblioteca e dados — ✅ Aceito
8. UX, mobile e auditoria funcional — ✅ Aceito
9. Auditoria normativa total — ✅ Aceito
10. Fechamento mecânico total da Ficha — ✅ Aceito
11. Rolagens e resolução de jogo — ✅ Aceito
12. Encontros e ferramentas do Mestre — ✅ Aceito
13. Aventuras — ✅ Aceito
14. Persistência definitiva — ✅ Aceito · escopo atualizado na v1.0.1
15. Usuários, colaboração e sincronização — ✅ Aceito · escopo atualizado na v1.0.1
16. Painel Geral — ✅ Aceito
17. Configurações — ✅ Aceito
18. Homologação, documentação e release final — ✅ Aceito

## Critérios consolidados

### 9. Auditoria normativa total
Zero entidade sem revisão semântica; zero divergência normativa não justificada; zero precedência incorreta; zero override de Regra da Casa sem registro; zero divergência entre runtime e fonte validada; zero cenário crítico sem teste.

### 10. Fechamento mecânico total da Ficha
Nenhuma característica suportada pelo escopo v1 pode permanecer apenas como texto quando deveria alterar cálculo, recurso, condição, rolagem ou estado representável digitalmente.

### 11. Rolagens e resolução de jogo
Ataques, dano, crítico, testes, salvaguardas, cura, CDs, vantagem/desvantagem, resistências, vulnerabilidades, imunidades e modificadores principais resolvíveis pela ficha sem cálculo manual obrigatório.

### 12. Encontros e ferramentas do Mestre
Mestre capaz de conduzir encontro completo no Hub: iniciativa, criaturas, PV, condições, turnos, encontros, recompensas e registro em sessão.

### 13. Aventuras
Planejamento e condução de aventuras com capítulos/arcos, cenas, locais, NPCs, encontros, pistas, handouts e tesouros ligados às Campanhas/Sessões.

### 14. Persistência definitiva
Personagens, Campanhas, Aventuras e demais estados duráveis suportados usam schemas e chaves versionadas, normalização/migração quando aplicável e persistência local consistente. A sincronização online cobre os estados previstos pelo modelo de colaboração.

**Histórico:** a v1.0.0 incluía exportação/importação, Backup/restauração, checksum e recuperação transacional como critério do bloco. Esses recursos foram deliberadamente removidos na v1.0.1 e não são mais requisito do produto.

### 15. Usuários, colaboração e sincronização
Identidade real no Firebase Authentication, login simples por usuário + senha e sincronização entre navegadores/dispositivos no **site web**, sem aplicativo e sem Supabase. A infraestrutura deve funcionar sem cartão/faturamento; no Firebase, somente plano Spark.

Modelo atual: acesso fechado administrado manualmente pelo proprietário no Firebase Authentication. O nome de usuário é convertido internamente para um identificador técnico `@teias.invalid`; não há cadastro público, convite por e-mail, confirmação de e-mail ou segunda autorização no Firestore.

Papéis de Mesa: `dm`, `player` e `observer`. A aplicação escolhe entre bundle privado e projeção compartilhada de acordo com o papel funcional do participante.

Aceite atual: Authentication por E-mail/senha usado apenas como mecanismo técnico, Cloud Firestore, configuração Web ativa, login simples e E2E real Mestre/Jogador aprovados. O Firestore aceita leitura e escrita para qualquer usuário autenticado; isso é intencional para o grupo de confiança.

### 16. Painel Geral
Dashboard real com personagens, Mesas, próxima sessão, personagem em jogo, pendências e atividade recente.

Aceite: `painel.html` agrega o estado persistente de personagens, Campanhas/Sessões e Aventuras; destaca personagem vinculado a sessão ativa, resolve a próxima sessão planejada, lista Mesas por prioridade operacional, detecta pendências acionáveis e ordena atividade recente por `updatedAt`.

### 17. Configurações
Preferências persistentes de usuário/Mestre, fontes e regras habilitadas, presets de Regras da Casa, ficha, acessibilidade e defaults de campanha.

Aceite: `configuracoes.html` usa estado versionado `hub-rpg:settings:v1`; preferências de perfil de uso, fontes normativas, presets de Regras da Casa, densidade e navegação da Ficha, tamanho de texto, contraste, redução de movimento e defaults de Mestre/cenário/sistema. Configurações são estado durável local e não reescrevem retroativamente personagens ou Campanhas existentes.

### 18. Homologação, documentação e release final
E2E em navegador real e mobile, fluxos longos 1–20, campanhas, acessibilidade, responsividade, documentação e release.

Aceite original: v1.0.0 publicada após gate estrutural, cobertura total, E2E Chromium Desktop/Mobile e homologação Firebase real.

Aceite consolidado da v1.0.1: o Firebase real foi novamente homologado após a simplificação de escopo. O teste confirmou login por usuário/senha, criação de Jogador efêmero, vínculo como `player`, visão privada para Mestre e apenas projeção compartilhada para Jogador. Gate estrutural e E2E Desktop/Mobile também passaram antes da publicação automática da `v1.0.1`.

## Política de escopo da v1

A lista de fontes normativas e conteúdos da v1.0 foi congelada no encerramento do Bloco 9. Novos suplementos posteriores ao congelamento entram em versão futura.
