# Roadmap oficial de fechamento — Hub de RPG v1.0

Este arquivo é a autoridade do escopo de fechamento da v1.0. Os Blocos 1–8 encerraram o roadmap funcional inicial; os Blocos 9–18 completam fidelidade normativa, resolução de jogo, ferramentas do Mestre, produto, persistência, colaboração e release.

## Regra de encerramento

Quando o Bloco 18 estiver aceito, a v1.0 está concluída. Conteúdo, livros, suplementos ou funcionalidades adicionados depois do congelamento de escopo da v1.0 são expansões futuras e não reabrem a v1.0.

## Regras de plataforma e custo da v1.0

- O Hub de RPG é **somente um site web responsivo**, acessado pelo navegador e hospedado no GitHub Pages.
- Não criar aplicativo Android, iOS ou desktop; não depender de APK, Play Store ou App Store.
- Serviços externos usados pela v1.0 devem funcionar **sem cartão de crédito, sem método de pagamento e sem conta de faturamento**.
- Para Firebase, usar apenas **Spark / No-cost**, sem Blaze, Firebase Hosting, Cloud Functions ou qualquer recurso que exija billing.
- Se um serviço necessário passar a exigir pagamento/cartão, substituir o serviço em vez de ativar cobrança.
- Não usar Supabase.

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
14. Persistência definitiva e portabilidade — ✅ Aceito
15. Usuários, colaboração e sincronização — ✅ Aceito
16. Painel Geral — Planejado
17. Configurações — Planejado
18. Homologação, documentação e release final — Planejado

## Critérios dos blocos restantes

### 9. Auditoria normativa total
Zero entidade sem revisão semântica; zero divergência normativa não justificada; zero precedência incorreta; zero override de Regra da Casa sem registro; zero divergência entre runtime e fonte validada; zero cenário crítico sem teste.

### 10. Fechamento mecânico total da Ficha
Nenhuma característica suportada pelo escopo v1.0 pode permanecer apenas como texto quando deveria alterar cálculo, recurso, condição, rolagem ou estado representável digitalmente.

### 11. Rolagens e resolução de jogo
Ataques, dano, crítico, testes, salvaguardas, cura, CDs, vantagem/desvantagem, resistências, vulnerabilidades, imunidades e modificadores principais resolvíveis pela ficha sem cálculo manual obrigatório.

### 12. Encontros e ferramentas do Mestre
Mestre capaz de conduzir encontro completo no Hub: iniciativa, criaturas, PV, condições, turnos, encontros, recompensas e registro em sessão.

### 13. Aventuras
Planejamento e condução de aventuras com capítulos/arcos, cenas, locais, NPCs, encontros, pistas, handouts e tesouros ligados às Campanhas/Sessões.

### 14. Persistência definitiva e portabilidade
Exportação/importação, backup/restauração, schemas versionados, migrações e proteção contra perda/corrupção. Trocar de dispositivo ou limpar navegador não pode significar perder a campanha.

### 15. Usuários, colaboração e sincronização
Identidade real, propriedade, Mestre/Jogador/Observador, permissões e sincronização entre dispositivos no **site web**, sem aplicativo e sem Supabase. A infraestrutura deve funcionar sem cartão/faturamento; no Firebase, somente plano Spark.

Modelo adotado: acesso fechado administrado manualmente, com login visível por **usuário + senha**. O nome de usuário é convertido internamente para um identificador técnico `@teias.invalid` do Firebase Authentication; não há cadastro público, convite por e-mail ou confirmação de e-mail. O Firestore exige também um registro ativo em `authorizedUsers/{uid}`.

Aceite: projeto Firebase Spark real provisionado; Authentication por E-mail/senha; Cloud Firestore; regras e índice `memberships` publicados; configuração pública Web ativa; gate 15Z verde; login administrativo real homologado no GitHub Pages com reconhecimento do registro `authorizedUsers` e perfil Administrador. O responsável pelo projeto dispensou a etapa manual adicional com conta não autorizada. A homologação E2E multiusuário completa permanece como verificação de release do Bloco 18 e não reabre o Bloco 15.

### 16. Painel Geral
Dashboard real com personagens, Mesas, próxima sessão, personagem em jogo, pendências e atividade recente.

### 17. Configurações
Preferências persistentes de usuário/Mestre, fontes e regras habilitadas, presets de Regras da Casa, ficha, acessibilidade e defaults de campanha.

### 18. Homologação, documentação e release final
E2E em navegador real e mobile, fluxos longos 1–20, campanhas, recuperação de dados, erros de rede, acessibilidade, desempenho, README/manual/arquitetura, limpeza de PRs/branches e release v1.0.

## Política de escopo da v1.0

A lista de fontes normativas e conteúdos da v1.0 foi congelada no encerramento do Bloco 9. Novos suplementos posteriores ao congelamento entram em versão futura.
