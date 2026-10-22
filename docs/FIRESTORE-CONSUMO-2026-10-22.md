# Firestore — investigação de cota e correção diferencial (22/10/2026)

## Evidência disponibilizada pelo Mestre
Capturas do Console Firebase em 22/10/2026 indicaram cerca de **69 mil leituras**, **20 mil gravações**, pico de **119 assinaturas de snapshot** (métrica por hora), **10 conexões ativas** e cerca de **204 mil avaliações permitidas de Security Rules**. O projeto exibiu o alerta de cota gratuita ultrapassada. Avaliações de rules e assinaturas *não são equivalentes* a leituras faturáveis nem representam necessariamente listeners simultâneos.

Não há traço por operação na captura; portanto, não é possível atribuir percentuais exatos a cada caminho sem observar dados de produção ou telemetria adicional.

## Auditoria de código (antes)
1. `saveCampaignBundle` gravava sempre root, membership, shared/private, todos os documentos de Sessões e Aventuras e vínculos de Jogadores, mesmo quando inalterados.
2. `pushChanges` reenviava **todas** as fichas locais quando a chave inteira de personagens sofria qualquer alteração. O Mestre também reenviava todas as fichas vinculadas a todas as campanhas.
3. `subscribeRealtime` desmontava e reinstalava assinaturas já existentes quando uma Sessão/Aventura ou Campanha era atribuída/removida.
4. Notificações distintas podiam provocar novos pulls completos a cada 400 ms; após `resource-exhausted`, o bloqueio temporário não garantia retentativa caso nenhum novo evento chegasse.
5. Capas WebP de campanhas/sessões/aventuras são gravadas em `media/{id}/chunks` no Firestore, podendo contribuir para armazenamento e leituras. **Otimização/migração de imagens é tarefa separada**, sem remoção automática de mídias na correção atual.

## Implementado nesta branch
- Comparação canônica independente da ordem de propriedades e sem metadados de carimbo do servidor.
- `replaceCollection`: gravar **somente** Sessões/Aventuras novas ou modificadas; excluir as removidas; usar batches de até 300 operações.
- Assinatura em memória de publicações de campanha/fichas para pular republicações idênticas na mesma sessão autenticada. Só registrar a assinatura após a gravação concluída.
- Evitar regravar `adventureIds` idênticos e fichas de campanha inalteradas.
- Registrar IDs realmente alterados no `localStorage` para selecionar fichas na sincronização de Mestre/Jogador. Continuar propagando exclusões, inclusive tombstones e restrições de acesso.
- Reconciliar listeners por identidade de documento/query; adicionar/remover somente os que mudaram. **Não limitar artificialmente o conjunto de recursos visíveis**, pois isso poderia interromper a sincronização necessária à sessão.
- Aplicar espaçamento mínimo entre pulls completos, agrupar sinais repetidos e agendar retentativa após erro de cota.
- Testes locais simulados (sem leitura/gravação no Firestore de produção) e testes de E2E em PR.

## Segurança
Nenhuma regra `firebase/firestore.rules` foi alterada. A seleção incremental de assinaturas continua derivada dos vínculos explícitos do Jogador, e as visões compartilhadas permanecem distintas das privadas. **Não se deve concluir homologação de acesso real Mestre/Jogador somente com testes simulados.**

## Aceite operacional após deploy
1. Exigir gates de testes locais e E2E Desktop/Mobile verdes.
2. Após retorno da cota, testar criação/edição/exclusão e revogação com contas reais em uma campanha de teste, sem gerar volume de dados fictícios.
3. Registrar no Firebase Console, por pelo menos 24 h em períodos comparáveis, o total de leituras, gravações, conexões e assinaturas **antes e depois**, além do número de jogadores efetivos.
4. Se persistirem picos, medir quais telas/ações disparam `saveCampaignBundle`, `pushChanges`, `pullCollaborations` e operações de mídia. Não remover coleções nem sobrescrever dados remotos para tentar recuperar a cota.
5. Manter o workflow `homologar-firebase-real.yml` manual enquanto houver esgotamento de cotas: ele usa dados de produção e **gera operações faturáveis**.

## Riscos residuais
- A primeira publicação ou primeira edição em nova aba pode continuar fazendo consultas de reconciliação; cache local em memória não substitui garantias de consistência remota.
- A taxa real só pode ser verificada no console do projeto; testes unitários provam idempotência, não economia quantitativa sem tráfego de produção.
- `saveCampaignBundle` continua gravando o root e as projeções privadas/compartilhadas quando o pacote **realmente** muda. A arquitetura dos payloads completos deve ser revisada em fase posterior, caso a cota ainda se aproxime do teto.
- Não há migração de infraestrutura, cobrança ou alterações de credenciais nesta branch.
