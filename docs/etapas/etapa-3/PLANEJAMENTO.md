# Planejamento detalhado — Etapa 3: Firebase, Usuários e Acesso

**Data de elaboração:** 20/11/2026  
**Estado:** proposta para análise; **nenhum item 3.01–3.09 autorizado para execução**.  
**Branch documental:** `feature/etapa-3-usuarios-acesso-20261120`.  
**Base:** `9f9f1407d8434aeb22342890cbcc1fd3d0d101c4`, commit com CI verde da Etapa 2.

## 1. Escopo de referência e decisões já tomadas

O plano de reconstrução v0.1 de 19/11/2026 define **exatamente nove itens 3.01–3.09** para esta etapa. A versão arquivada do plano ainda traz a marca histórica “pendente de análise do Mestre”; as **aprovações posteriores no diálogo** encerraram as Etapas 1 e 2 e autorizaram **somente planejar** a Etapa 3 agora. Esta proposta não modifica retroativamente o documento original.

**Objetivo aprovado para planejamento:** preservar as cinco contas legadas, as informações do Mestre e dos jogadores, e recuperar autenticação e separação de dados sem exigir novas credenciais ou mecanismos adicionais.

Os participantes indicados historicamente são Rafael (Mestre/administrador), Bruno, Gustavo/Gus, Léo e Fernanda (jogadores). **Essa lista é uma referência histórica, não uma confirmação do estado atual das identidades ou dos seus vínculos no Firebase.** Nenhum UID, e-mail pessoal, senha, token ou dado de jogo deverá ser colocado no repositório, relatório ou captura.

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
| **3.01 — Identificar o Firebase** | Inventariar, inicialmente em leitura autorizada, projeto/app Web ativo, Auth, Firestore, coleções e caminhos; comparar com documentação histórica | Relatório de correspondências e divergências, com evidência redigida sem segredos | **Primeira autorização necessária**. Nenhuma conexão remota neste planejamento. Não trocar projeto/configuração |
| **3.02 — Inventariar cinco contas** | Validar identidades, UIDs e vínculos das cinco contas preexistentes, com acesso administrativo autorizado e mínimo | Matriz de presença, papéis e vínculos com identificadores protegidos; diferenças explicitadas | Depende de 3.01; sem senha, criação, remoção ou redefinição |
| **3.03 — Login conhecido** | Integrar Auth através de `src/services/firebase` e UI compartilhada; entrada, saída, persistência controlada de sessão e mensagens de erros | Testes de autenticação, logout, sessão expirada, credencial inválida e rede indisponível | Só após confirmar método histórico e autorização específica para ativar integração; sem obstáculo novo |
| **3.04 — Perfis e papéis** | Derivar Mestre/Jogador de fonte autorizada; mostrar ações e navegação adequadas, sem cadastrar papéis extras | Perfis corretos em testes de ambos os papéis; negação ao usuário sem perfil autorizado | Não confiar em username hardcoded ou aparência da interface como prova de privilégio |
| **3.05 — Regras de dados** | Examinar regras implantadas e coleções atuais; propor o menor ajuste para novas coleções quando necessário, com matriz de permissões | Testes de permitir/negar por usuário, por documento e por operação, incluindo leituras transversais | **Qualquer alteração de regras em produção exige aprovação separada**, revisão, cópia de segurança adequada e plano de reversão |
| **3.06 — Rotas e conteúdo** | Controlar acesso por rota, consulta, ação e origem de dados; manter conteúdo privado fora do pacote público do Pages | Testes de URL direta, refresh, usuário não autenticado e tentativas por consulta/ID de outra pessoa | Guardas React são UX, não controle de segurança por si só |
| **3.07 — Administração mínima** | Painel privado do Mestre para visualizar usuários e administrar vínculos que as regras permitirem | Jogador não acessa painel nem modifica relações; ações permitidas testadas e auditáveis | Não criar novas contas pelo navegador; novas contas, se necessárias, ficam em processo privilegiado e aprovado à parte |
| **3.08 — Estados de erro** | Integrar `OperationFeedback`, `Alert`, `FormErrorSummary` e padrões de rota para sessão inválida, acesso negado, ausências e rede | Textos claros, sem expor detalhes privados; tentativas seguras e sem repetição automática indevida | Reutilizar Design System 2.05–2.09 |
| **3.09 — Verificação com contas reais** | Validar entradas/saídas e a matriz de acesso com as cinco identidades existentes, com plano de execução e consentimentos | Evidência dos cinco logins e de operações permitidas/negadas; sem mudança de senha ou dados legítimos | **Autorização expressa adicional para testes remotos**; primeiro emulador/fixtures sintéticas quando possível; nenhuma escrita em dados reais não previamente aprovada |

Esses itens são **o escopo original**, não novas subdivisões criadas para ampliar a fase.

## 3. Arquitetura proposta (sem implementação)

### Fluxo de autenticação

**Navegador (GitHub Pages)** → formulário compartilhado → serviço de autenticação aprovado → Firebase Authentication do projeto existente.

A sessão autenticada indica **quem entrou**. A autorização dos documentos deve ser aferida por regras de segurança no Firestore, correspondendo a identidade real e vínculo/role autorizados. **A identidade do Mestre não pode ser concedida por dados alteráveis pelo navegador, por inspeção da UI ou por nomes de usuário.**

### Componentes já existentes e o que falta

| Estado atual da branch herdada | Planejamento do próximo uso |
| --- | --- |
| `src/services/firebase/config.ts` aceita configuração pública e estados unconfigured/incomplete/ready | Confirmar projeto e opções públicas existentes; não inserir valores em Git |
| `src/services/firebase/app.ts` inicializa instância nomeada sob chamada | Só invocar após autorização do item e configuração conferida |
| `src/services/firebase/auth.ts` expõe `prepareHubAuth` | Acrescentar operações de sessão/login/logout em serviço autorizado no futuro |
| `src/services/firebase/firestore.ts` expõe `prepareHubFirestore` | Acrescentar serviços de consultas autorizadas futuramente, não em componentes React |
| `src/modules/usuarios/README.md` está reservado | Ao iniciar implementação funcional, cumprir o manifesto, testes e documentação exigidos pelo 2.11 |
| `src/app/routes.ts` contém oito módulos provisórios, sem rota de usuários | Propor alteração controlada do catálogo na hora apropriada; não ativar rota neste planejamento |
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

1. **Planejamento (atual):** aprovar ou ajustar este documento e a branch documental.
2. **3.01:** autorização específica para inventário do projeto Firebase existente — definir se há acesso remoto somente leitura e sua forma; nenhuma alteração de dados.
3. **3.02:** autorização distinta para conferir identidades reais e vínculos (dados privados; acesso mínimo).
4. **3.03 e 3.04:** autorização para implementar autenticação e papéis na branch, inicialmente sob testes simulados; ativação real depende da configuração aprovada.
5. **3.05:** autorização expressa para propor, revisar e, separadamente, aplicar eventuais alterações de Rules.
6. **3.06 a 3.08:** aprovação individual da UI protegida, painel administrativo e estados de erro.
7. **3.09:** aprovação explícita do procedimento de validação com cinco contas reais, limitada a operações previamente revisadas.
8. **Encerramento:** exigir CI, evidência de segurança, documentação e aceite do Mestre antes de considerar a Etapa 3 concluída. A Etapa 4 e publicação não são autorizadas automaticamente.

Não existem ações destrutivas ou reversões de dados aprovadas neste momento.

## 7. Riscos a resolver antes da implementação

- **Projeto histórico ≠ projeto ativo confirmado:** `teais-de-anansi` é somente a grafia no histórico; não “corrigir” nem criar outro por suposição.
- **Cinco contas não verificadas:** a lista histórica pode divergir do estado real; preservar mesmo em caso de diferença até haver decisão.
- **Nomes de usuário históricos:** a transformação para um domínio artificial não pode ser adotada sem validar os dados atuais e o método Auth.
- **Regras implantadas desconhecidas:** ocultar campos da UI não impede extração via consultas; deve haver testes efetivos.
- **GitHub Pages é público:** materiais privados não podem entrar no `public/`, `src/data/` nem em bundles JavaScript, mesmo que a tela seja protegida.
- **Custo:** confirmar limites do plano Spark, sem depender de funções pagas/Storage.
- **Pendências da Etapa 2:** auditoria visual e assistiva continua obrigatória antes de homologação visual definitiva.

## 8. Branch, escopo documental e não execução

A branch `feature/etapa-3-usuarios-acesso-20261120` foi derivada exclusivamente do commit validado `9f9f1407d8434aeb22342890cbcc1fd3d0d101c4` da Etapa 2. Esta entrega adiciona/atualiza **somente documentação** para a futura Etapa 3; não altera scripts, componentes, rotas, Rules ou configuração Firebase.

**Não realizado:** conexão Firebase, listagem de usuários, autenticação real, operações Firestore, manipulação de senhas, novos testes em produção, deploy, merge ou alteração da `main`.

**Próximo ato permitido:** submeter o planejamento à aprovação do Mestre. Após aceite, solicitar autorização do item 3.01, começando pelo inventário documental/local e delimitando qualquer leitura remota de forma explícita.
