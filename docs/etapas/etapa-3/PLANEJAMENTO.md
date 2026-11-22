# Planejamento detalhado — Etapa 3: Firebase, Usuários e Acesso

**Data de elaboração:** 20/11/2026  
**Estado:** **3.01–3.08 concluídos em seus escopos, 3.08 validado em 22/11/2026**, sem modificar produção; item 3.09 aguarda autorização explícita.  
**Branch documental:** `feature/etapa-3-usuarios-acesso-20261120`.  
**Base:** `9f9f1407d8434aeb22342890cbcc1fd3d0d101c4`, commit com CI verde da Etapa 2.

## 1. Escopo de referência e decisões já tomadas

O plano de reconstrução v0.1 de 19/11/2026 define **exatamente nove itens 3.01–3.09** para esta etapa. A versão arquivada do plano ainda traz a marca histórica “pendente de análise do Mestre”; as **aprovações posteriores no diálogo** encerraram as Etapas 1 e 2, autorizaram o planejamento e, posteriormente, os itens **3.01, 3.02, 3.03, 3.04, 3.05, 3.06, 3.07 e 3.08** da Etapa 3. Esta proposta não modifica retroativamente o documento original.

**Objetivo aprovado para planejamento:** preservar as cinco contas legadas, as informações do Mestre e dos jogadores, e recuperar autenticação e separação de dados sem exigir novas credenciais ou mecanismos adicionais.

Os participantes indicados historicamente são Rafael (Mestre/administrador), Bruno, Gustavo/Gus, Léo e Fernanda (jogadores). **A auditoria 3.02 confirmou a existência das cinco identidades, seus perfis e os vínculos existentes no Firebase.** Nenhum UID, e-mail pessoal, senha, token ou dado de jogo deverá ser colocado no repositório, relatório ou captura.

### Princípios obrigatórios

1. **Preservação:** não recriar, renomear, excluir nem redefinir as cinco contas; não modificar vínculos antigos sem análise, plano reversível e aprovação específica.
2. **Projeto existente:** o histórico aponta `teais-de-anansi` (grafia histórica “teais”); a correspondência com o projeto ativo precisa ser confirmada antes de qualquer uso. Não criar projeto Firebase substituto por conveniência.
3. **Login conhecido:** usar credenciais e método de acesso já existentes; nenhuma exigência nova de 2FA, SMS, login social, CAPTCHA, verificação de e-mail ou troca obrigatória de senha. O histórico menciona um mapeamento interno de username para `teias.invalid`, **a verificar**, não assumir como formato efetivo atual.
4. **Autorização real:** esconder controles não impede consulta direta; regras Firestore e operações em serviços devem impedir acesso cruzado a contas, fichas, notas privadas e informações não reveladas.
5. **Privilégios mínimos:** Mestre/Jogador são os papéis previstos; não inventar papéis intermediários, poderes novos ou cadastro público.
6. **Gratuidade:** manter GitHub Pages e Firebase Spark, sem Blaze, Cloud Functions, Cloud Storage pago ou contratação.
7. **Processo:** branch isolada derivada da Etapa 2, uma aprovação por item; nada de merge, publicação, alteração de `main` ou Firebase por implicação.

## 2. Itens e sequência de autorização

| Item | Trabalho futuro proposto | Critério verificável para aprovação individual | Limite / dependência |
| --- | --- | --- | --- |
| **3.01 — Identificar o Firebase** | Inventariar, inicialmente em leitura autorizada, projeto/app Web ativo, Auth, Firestore, coleções e caminhos; comparar com documentação histórica | Relatório de correspondências e divergências, com evidência redigida sem segredos | **Concluído**, com leitura autorizada, em [auditoria #44843476230](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44843476230); nenhuma troca de projeto/configuração |
| **3.02 — Inventariar cinco contas** | Validar identidades, UIDs e vínculos das cinco contas preexistentes, com acesso administrativo autorizado e mínimo | Matriz de presença, papéis e vínculos com identificadores protegidos; diferenças explicitadas | **Concluído** por duas auditorias somente leitura: [#44902355786](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44902355786) e [#44902526056](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44902526056); sem senha, criação, remoção ou redefinição |
| **3.03 — Login conhecido** | Integrar Auth através de `src/services/firebase` e UI compartilhada; entrada, saída, persistência controlada de sessão e mensagens de erros | Testes de autenticação, logout, sessão expirada, credencial inválida e rede indisponível | **Concluído na branch**: rota `/entrar`, Auth Web do projeto antigo, 27 testes novos, [CI #44903994998](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44903994998) aprovada; sem obstáculo novo e sem deploy |
| **3.04 — Perfis e papéis** | Derivar Mestre/Jogador de fonte autorizada; mostrar ações e navegação adequadas, sem cadastrar papéis extras | Perfis corretos em testes de ambos os papéis; negação ao usuário sem perfil autorizado | **Concluído na branch:** leitura de perfil e vínculos do servidor, confirmação adicional de ownership do Mestre, UI por papel; [CI #44905296167](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44905296167) 205/205 aprovada; nenhuma Rule modificada |
| **3.05 — Regras de dados** | Auditar regras publicadas (versão comprovada em 3.01), propor ajustes mínimos sem deploy e reproduzir os cenários com emulador | **Concluído:** 92/92 testes de duas versões, 12 permissões excessivas históricas, matriz `get/list/create/update/delete`. [Relatório](3.05-auditoria-rules.md) e [CI #44906723651](https://github.com/eleuterio-coding/teias-de-anansi/actions/runs/44906723651) | A proposta **não foi aplicada**. Publicação exige autorização separada, adaptação do cliente, cópia e plano de reversão |
| **3.06 — Rotas e conteúdo** | Guardas por sessão e role, leitura de servidor com vínculo específico e ações com UID corrente; sem conteúdo privado no bundle | **Concluído na branch:** 238/238 Vitest e 98/98 verificações do emulador, incluindo URL, refresh, logout, revogação, negação cruzada e erro de rede. [Relatório 3.06](3.06-rotas-consultas-acoes.md) | Guardas React protegem a UI; servidor continua sob Rules antigas até publicação separada da proposta 3.05 |
| **3.07 — Administração mínima** | Painel privado do Mestre com cinco perfis/vínculos em modo leitura, e laboratório independente de ações simuladas | **Concluído:** [relatório 3.07](3.07-administracao-usuarios.md); 265/265 Vitest e 122/122 emulador. Login real do Mestre pendente de 3.09 | **Sem writers reais**, sem cadastro e sem alteração de Rules; o módulo original segue reservado, rota global protegida `/usuarios` |
| **3.08 — Estados de erro** | Integrar feedback compartilhado nas rotas, autenticação, inventário e simulações com texto sanitizado e retry somente manual | **Concluído na branch:** 287/287 Vitest e 122/122 emulador, [relatório 3.08](3.08-estados-e-feedback.md); sem credenciais e sem deploy | Inspeção visual real e acesso individual permanecem para homologação; Rules propostas continuam não publicadas |
| **3.09 — Verificação com contas reais** | Validar entradas/saídas e a matriz de acesso com as cinco identidades existentes, com plano de execução e consentimentos | Evidência dos cinco logins e de operações permitidas/negadas; sem mudança de senha ou dados legítimos | **Autorização expressa adicional para testes remotos**; primeiro emulador/fixtures sintéticas quando possível; nenhuma escrita em dados reais não previamente aprovada |

Esses itens são **o escopo original**, não novas subdivisões criadas para ampliar a fase.

## 3. Arquitetura proposta (login e resolução de papéis implementados em branch, demais etapas pendentes)

### Fluxo de autenticação

**Navegador (GitHub Pages)** → formulário compartilhado → serviço de autenticação aprovado → Firebase Authentication do projeto existente.

A sessão autenticada indica **quem entrou**. A autorização dos documentos deve ser aferida por regras de segurança no Firestore, correspondendo a identidade real e vínculo/role autorizados. **A identidade do Mestre não pode ser concedida por dados alteráveis pelo navegador, por inspeção da UI ou por nomes de usuário.**

### Componentes já existentes e o que falta

| Estado atual da branch herdada | Planejamento do próximo uso |
| --- | --- |
| `src/services/firebase/config.ts` aceita configuração pública e estados unconfigured/incomplete/ready | Confirmar projeto e opções públicas existentes; não inserir valores em Git |
| `src/services/firebase/app.ts` inicializa instância nomeada sob chamada | Só invocar após autorização do item e configuração conferida |
| `src/services/firebase/auth.ts` expõe `prepareHubAuth` | Implementado em 3.03 através de `src/services/firebase/auth-session.ts` e fachada `src/services/session.ts`; sem leitura Firestore |
| `src/services/firebase/firestore.ts` expõe `prepareHubFirestore` | 3.04: `src/services/firebase/role-access.ts` consulta perfil/memberships/campaigns por fachada `src/services/role-access.ts`; sem consultas diretas nos componentes React |
| `src/modules/usuarios/README.md` está reservado | Mantido reservado; a página de login é global em `src/app/pages/LoginPage.tsx` e a rota `/entrar` não ativa módulo de administração |
| `src/app/routes.ts` contém oito módulos provisórios, sem rota de usuários | O catálogo dos módulos não mudou; foi criada apenas a rota global `/entrar` para autenticação |
| `src/components/ui`, `form`, `feedback` e Design System 2.02 | Reutilizar telas e feedback sem alterar a linguagem visual |

**Nota técnica:** valores `VITE_*` são públicos no JS gerado. Nunca inserir segredos administrativos, senhas, service accounts ou tokens pessoais no bundle.

## 4. Matriz preliminar de segurança

| Sujeito | Próprio perfil | Perfil de outro jogador | Notas privadas do Mestre | Gestão de vínculos |
| --- | --- | --- | --- | --- |
| Mestre autenticado e autorizado | Conforme dados existentes | Conforme escopo administrativo verificado | Conforme titularidade e regras atuais | Somente ações explicitamente autorizadas |
| Jogador autenticado | Ler e editar campos permitidos | **Negar**, salvo relações específicas autorizadas | **Negar** | **Negar**, exceto operações explicitamente permitidas pelas regras existentes |
| Visitante / sessão inválida | **Negar** | **Negar** | **Negar** | **Negar** |

Este quadro é **modelo preliminar**, não substitui a inspeção dos dados e das Rules atuais. O controle real é por documento/coleção/ação, não só por categoria de usuário.

## 5. Estratégia de testes e evidências

**Testes automatizados sem dados reais**, para cada item de implementação autorizado:
- Configuração ausente/incompleta e projeto divergente.
- Login válido/inválido e logout usando SDK simulado ou ambiente autorizado.
- Restauração/expiração de sessão, atualização do papel e acessos desabilitados.
- Guards de rota, navegação direta e tentativa de consulta a documentos de outra conta.
- Regras Firestore: read/list/get/create/update/delete permitidos e negados conforme matriz, preferencialmente com emulador e fixtures fictícias.
- Ações administrativas de vínculo e falhas de autorização, com rollback quando aplicável.
- Falta de rede, dados inexistentes, permissão negada e ausência de vazamento de detalhes.
- Execução da bateria anterior: `npm run check`, com CI da nova branch **somente após configuração explicitamente autorizada**.

**Testes reais**, apenas quando autorizado:
- Confirmar os cinco acessos sem solicitar ou registrar senhas.
- Verificar que cada jogador vê apenas dados permitidos e que acessos cruzados falham, inclusive em consultas diretas.
- Testar o papel do Mestre e vínculos permitidos.
- Não gerar, destruir, sobrescrever nem migrar dados legítimos para testar o produto. Toda escrita de teste exige plano específico, alvo isolado ou autorização explícita sobre o efeito.

Registrar cada execução: SHA, ambiente, conta representada por identificador não sensível, ação, resultado esperado/real, logs sem segredos, pendências e aprovação. O relatório não deve conter UIDs reais, nomes de documentos privados nem detalhes reveladores da campanha.

## 6. Gates de aprovação

1. **Planejamento:** aprovado no início da Etapa 3; 3.01 foi executado em branch isolada.
2. **3.01:** concluído; inventário histórico, consulta remota real de projeto, app Web, Auth, Firestore e Rules, sem alteração de dados. Ver [3.01-inventario-historico.md](3.01-inventario-historico.md).
3. **3.02:** concluído em 21/11/2026; cinco contas verificadas via Authentication, cinco perfis e seis memberships consistentes; validação adicional de referências de sessões e aventuras. Ver [3.02-contas-e-vinculos.md](3.02-contas-e-vinculos.md).
4. **3.03:** concluído em 21/11/2026, com [relatório de login](3.03-login-e-sessao.md) e testes simulados; **3.04:** concluído em 21/11/2026, com [relatório de papéis](3.04-perfis-e-papeis.md) e testes simulados. Login real individual permanece em 3.09.
5. **3.05:** proposta e testes concluídos em 21/11/2026. Publicação de Rules **não autorizada** nem efetuada; depende de revisão de compatibilidade, backup/diff e aprovação específica.
6. **3.06:** implementado e validado no código com testes de acesso. **3.07** concluído com UI e simulações sem escrita; **3.08** concluído em 22/11/2026 com feedback unificado e testes automatizados.
7. **3.09:** aprovação explícita do procedimento de validação com cinco contas reais, limitada a operações previamente revisadas.
8. **Encerramento:** exigir CI, evidência de segurança, documentação e aceite do Mestre antes de considerar a Etapa 3 concluída. A Etapa 4 e publicação não são autorizadas automaticamente.

Não existem ações destrutivas ou reversões de dados aprovadas neste momento.

## 7. Riscos a resolver antes da implementação

- **Projeto histórico ≠ projeto ativo confirmado:** `teais-de-anansi` é somente a grafia no histórico; não “corrigir” nem criar outro por suposição.
- **Cinco contas verificadas em 3.02:** cadastros, UIDs, perfis, vínculos e referências estruturais conferidos em leitura. Testar autenticação individual e acesso real continua pendente (3.03/3.09).
- **Nomes de usuário históricos:** os cinco logins técnicos `teias.invalid` foram encontrados no Authentication; o fluxo foi implementado em 3.03 com testes simulados. Validação individual com senha real continua para 3.09.
- **Rules 3.05 auditadas em emulador:** 12 permissões amplas do legado confirmadas e bloqueadas na proposta. As regras reais continuam iguais; a proposta pode afetar consultas antigas de listas de perfis/vínculos/fichas. Teste de acesso com cinco identidades reais continua para 3.09.
- **GitHub Pages é público:** materiais privados não podem entrar no `public/`, `src/data/` nem em bundles JavaScript, mesmo que a tela seja protegida.
- **Custo:** confirmar limites do plano Spark, sem depender de funções pagas/Storage.
- **Pendências da Etapa 2:** auditoria visual e assistiva continua obrigatória antes de homologação visual definitiva.

## 8. Branch, escopo documental e não execução

A branch `feature/etapa-3-usuarios-acesso-20261120` foi derivada exclusivamente do commit validado `9f9f1407d8434aeb22342890cbcc1fd3d0d101c4` da Etapa 2. A implantação dos itens 3.01 a 3.08 adicionou documentação, contrato histórico, scripts de auditoria remotos somente leitura, serviço de login/logout, consulta de papel por Auth/Firestore, página global de acesso por perfil, Rules de baseline e proposta **isoladas para testes**, matriz do emulador, guardas de rotas, consultas restritas por vínculo, ações de conferência e painel exclusivo do Mestre com simulações locais de vínculos, estados e mensagens padronizados e testes de regressão. O workflow de CI permanece **sem deploy**. Não alterou rotas, Rules, dados ou configuração Firebase em produção.

**Não realizado:** login real com senha dos cinco usuários, escrita Firestore, manipulação de senhas, alteração de Rules, deploy, merge ou alteração da `main`. **Realizado:** acesso administrativo de **leitura** ao projeto e metadados do Firestore, Auth e Rules no item 3.01, seguido de verificação de contas reais/UIDs e vínculos do Firestore no 3.02. Nenhum UID foi exposto nos relatórios. **3.03 e 3.04:** implementados em código, com autenticação via SDK Firebase Web e conferência de papéis por fontes remotas, testes unitários/UI simulados sem senha real, sem publicação.

**Próximo item:** 3.09 — homologação de leitura e login com as cinco contas existentes, **somente com autorização específica de procedimento e sem solicitar senhas ao usuário**. Nenhuma publicação de Rules nem escrita real está incluída. Mantêm-se os limites de não criar, alterar ou redefinir contas e de não expor UIDs/dados sensíveis.
