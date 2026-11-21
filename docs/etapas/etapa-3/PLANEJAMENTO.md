# Planejamento detalhado — Etapa 3: Firebase, Usuários e Acesso

**Data de elaboração:** 20/11/2026  
**Estado:** **3.01 e 3.02 concluídos; 3.03 implementado e validado em CI em 21/11/2026**; itens 3.04–3.09 aguardam início específico.  
**Branch documental:** `feature/etapa-3-usuarios-acesso-20261120`.  
**Base:** `9f9f1407d8434aeb22342890cbcc1fd3d0d101c4`, commit com CI verde da Etapa 2.

## 1. Escopo de referência e decisões já tomadas

O plano de reconstrução v0.1 de 19/11/2026 define **exatamente nove itens 3.01–3.09** para esta etapa. A versão arquivada do plano ainda traz a marca histórica “pendente de análise do Mestre”; as **aprovações posteriores no diálogo** encerraram as Etapas 1 e 2, autorizaram o planejamento e, posteriormente, os itens **3.01, 3.02 e 3.03** da Etapa 3. Esta proposta não modifica retroativamente o documento original.

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
| **3.04 — Perfis e papéis** | Derivar Mestre/Jogador de fonte autorizada; mostrar ações e navegação adequadas, sem cadastrar papéis extras | Perfis corretos em testes de ambos os papéis; negação ao usuário sem perfil autorizado | Não confiar em username hardcoded ou aparência da interface como prova de privilégio |
| **3.05 — Regras de dados** | Examinar regras implantadas e coleções atuais; propor o menor ajuste para novas coleções quando necessário, com matriz de permissões | Testes de permitir/negar por usuário, por documento e por operação, incluindo leituras transversais | **Qualquer alteração de regras em produção exige aprovação separada**, revisão, cópia de segurança adequada e plano de reversão |
| **3.06 — Rotas e conteúdo** | Controlar acesso por rota, consulta, ação e origem de dados; manter conteúdo privado fora do pacote público do Pages | Testes de URL direta, refresh, usuário não autenticado e tentativas por consulta/ID de outra pessoa | Guardas React são UX, não controle de segurança por si só |
| **3.07 — Administração mínima** | Painel privado do Mestre para visualizar usuários e administrar vínculos que as regras permitirem | Jogador não acessa painel nem modifica relações; ações permitidas testadas e auditáveis | Não criar novas contas pelo navegador; novas contas, se necessárias, ficam em processo privilegiado e aprovado à parte |
| **3.08 — Estados de erro** | Integrar `OperationFeedback`, `Alert`, `FormErrorSummary` e padrões de rota para sessão inválida, acesso negado, ausências e rede | Textos claros, sem expor detalhes privados; tentativas seguras e sem repetição automática indevida | Reutilizar Design System 2.05–2.09 |
| **3.09 — Verificação com contas reais** | Validar entradas/saídas e a matriz de acesso com as cinco identidades existentes, com plano de execução e consentimentos | Evidência dos cinco logins e de operações permitidas/negadas; sem mudança de senha ou dados legítimos | **Autorização expressa adicional para testes remotos**; primeiro emulador/fixtures sintéticas quando possível; nenhuma escrita em dados reais não previamente aprovada |

Esses itens são **o escopo original**, não novas subdivisões criadas para ampliar a fase.

## 3. Arquitetura proposta (login de 3.03 implementado em branch, demais etapas pendentes)

### Fluxo de autenticação

**Navegador (GitHub Pages)** → formulário compartilhado → serviço de autenticação aprovado → Firebase Authentication do projeto existente.

A sessão autenticada indica **quem entrou**. A autorização dos documentos deve ser aferida por regras de segurança no Firestore, correspondendo a identidade real e vínculo/role autorizados. **A identidade do Mestre não pode ser concedida por dados alteráveis pelo navegador, por inspeção da UI ou por nomes de usuário.**

### Componentes já existentes e o que falta

| Estado atual da branch herdada | Planejamento do próximo uso |
| --- | --- |
| `src/services/firebase/config.ts` aceita configuração pública e estados unconfigured/incomplete/ready | Confirmar projeto e opções públicas existentes; não inserir valores em Git |
| `src/services/firebase/app.ts` inicializa instância nomeada sob chamada | Só invocar após autorização do item e configuração conferida |
| `src/services/firebase/auth.ts` expõe `prepareHubAuth` | Implementado em 3.03 através de `src/services/firebase/auth-session.ts` e fachada `src/services/session.ts`; sem leitura Firestore |
| `src/services/firebase/firestore.ts` expõe `prepareHubFirestore` | Acrescentar serviços de consultas autorizadas futuramente, não em componentes React |
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
4. **3.03:** concluído em 21/11/2026, com [relatório de login](3.03-login-e-sessao.md) e testes simulados; **3.04** ainda aguarda avanço específico. Login real individual permanece em 3.09.
5. **3.05:** autorização expressa para propor, revisar e, separadamente, aplicar eventuais alterações de Rules.
6. **3.06 a 3.08:** aprovação individual da UI protegida, painel administrativo e estados de erro.
7. **3.09:** aprovação explícita do procedimento de validação com cinco contas reais, limitada a operações previamente revisadas.
8. **Encerramento:** exigir CI, evidência de segurança, documentação e aceite do Mestre antes de considerar a Etapa 3 concluída. A Etapa 4 e publicação não são autorizadas automaticamente.

Não existem ações destrutivas ou reversões de dados aprovadas neste momento.

## 7. Riscos a resolver antes da implementação

- **Projeto histórico ≠ projeto ativo confirmado:** `teais-de-anansi` é somente a grafia no histórico; não “corrigir” nem criar outro por suposição.
- **Cinco contas verificadas em 3.02:** cadastros, UIDs, perfis, vínculos e referências estruturais conferidos em leitura. Testar autenticação individual e acesso real continua pendente (3.03/3.09).
- **Nomes de usuário históricos:** os cinco logins técnicos `teias.invalid` foram encontrados no Authentication; o fluxo foi implementado em 3.03 com testes simulados. Validação individual com senha real continua para 3.09.
- **Regras implantadas examinadas em 3.01:** não basta ocultar campos da UI; o alcance e a restrição efetiva das Rules ainda precisam ser testados em 3.05 e 3.09.
- **GitHub Pages é público:** materiais privados não podem entrar no `public/`, `src/data/` nem em bundles JavaScript, mesmo que a tela seja protegida.
- **Custo:** confirmar limites do plano Spark, sem depender de funções pagas/Storage.
- **Pendências da Etapa 2:** auditoria visual e assistiva continua obrigatória antes de homologação visual definitiva.

## 8. Branch, escopo documental e não execução

A branch `feature/etapa-3-usuarios-acesso-20261120` foi derivada exclusivamente do commit validado `9f9f1407d8434aeb22342890cbcc1fd3d0d101c4` da Etapa 2. A implantação dos itens 3.01 a 3.03 adicionou documentação, contrato histórico, scripts de auditoria remotos somente leitura, serviço de login/logout, página global de acesso e testes de regressão. O workflow de CI permanece **sem deploy**. Não alterou rotas, Rules, dados ou configuração Firebase em produção.

**Não realizado:** login real com senha dos cinco usuários, escrita Firestore, manipulação de senhas, alteração de Rules, deploy, merge ou alteração da `main`. **Realizado:** acesso administrativo de **leitura** ao projeto e metadados do Firestore, Auth e Rules no item 3.01, seguido de verificação de contas reais/UIDs e vínculos do Firestore no 3.02. Nenhum UID foi exposto nos relatórios. **3.03:** implementado em código, com autenticação via SDK Firebase Web e testes unitários/UI sem senha real, sem publicação.

**Próximo item:** 3.04 — perfis e papéis Mestre/Jogador, exclusivamente após avanço pelo botão solicitado na conversa. Mantêm-se os limites de não criar, alterar ou redefinir contas e de não expor UIDs/dados sensíveis.
