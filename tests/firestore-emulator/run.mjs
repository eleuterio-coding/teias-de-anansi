import assert from 'node:assert/strict';
import console from 'node:console';
import process from 'node:process';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

/**
 * Suite 3.05. Execucao exclusivamente no Firebase Emulator, sem chave, token,
 * conta ou projeto real. Use somente o projeto demo e o host fixo local.
 */
const projectId = 'demo-teias-305';
if (
  process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8089' ||
  process.env.GCLOUD_PROJECT !== projectId
) {
  throw new Error('A auditoria exige o Firestore Emulator isolado em 127.0.0.1:8089 e demo-teias-305.');
}

const readRules = (file) => readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8');
const baselineRules = readRules('./baseline.rules');
const proposedRules = readRules('./proposal.rules');

const masterIdentity = { uid: 'uid-master-fixture', email: 'rafael@teias.invalid' };
const playerIdentity = { uid: 'uid-player-fixture', email: 'gus@teias.invalid' };
const otherPlayerIdentity = { uid: 'uid-other-fixture', email: 'bruno@teias.invalid' };

const seed = [
  ['users/uid-master-fixture', { uid: masterIdentity.uid, username: 'rafael', role: 'dm', displayName: 'Mestre Fictício' }],
  ['users/uid-player-fixture', { uid: playerIdentity.uid, username: 'gustavo', role: 'player', displayName: 'Jogador Fictício' }],
  ['users/uid-other-fixture', { uid: otherPlayerIdentity.uid, username: 'bruno', role: 'player', displayName: 'Outro Jogador Fictício' }],
  ['users/uid-leo-fixture', { uid: 'uid-leo-fixture', username: 'leo', role: 'player', displayName: 'Léo Fictício' }],
  ['users/uid-fernanda-fixture', { uid: 'uid-fernanda-fixture', username: 'fernanda', role: 'player', displayName: 'Fernanda Fictícia' }],
  ['campaigns/mesa-ficticia', { id: 'mesa-ficticia', ownerId: masterIdentity.uid, name: 'Mesa de teste fictícia' }],
  ['campaigns/outra-mesa', { id: 'outra-mesa', ownerId: 'uid-outra-pessoa', name: 'Outra mesa fictícia' }],
  ['campaigns/mesa-player-legada', { id: 'mesa-player-legada', ownerId: playerIdentity.uid, name: 'Mesa antiga de jogador, simulada' }],
  ['campaigns/mesa-player-legada/private/state', { payload: { secret: 'Nota privada fictícia em mesa legada' } }],
  ['memberships/mesa-ficticia_rafael@teias.invalid', { email: masterIdentity.email, uid: masterIdentity.uid, username: 'rafael', role: 'dm', active: true, campaignId: 'mesa-ficticia', characterId: null, sessionIds: [], adventureIds: [] }],
  ['memberships/mesa-ficticia_cadastro-legado', { email: 'cadastro-legado@teias.invalid', uid: masterIdentity.uid, username: 'master-antigo', role: 'dm', active: true, campaignId: 'mesa-ficticia', characterId: null, sessionIds: [], adventureIds: [] }],
  ['memberships/mesa-ficticia_gus@teias.invalid', { email: playerIdentity.email, uid: '', username: 'gustavo', role: 'player', active: true, campaignId: 'mesa-ficticia', characterId: 'char-gus', sessionIds: ['sess-gus'], adventureIds: ['adv-gus'] }],
  ['memberships/mesa-ficticia_bruno@teias.invalid', { email: otherPlayerIdentity.email, uid: otherPlayerIdentity.uid, username: 'bruno', role: 'player', active: true, campaignId: 'mesa-ficticia', characterId: 'char-bruno', sessionIds: ['sess-bruno'], adventureIds: ['adv-bruno'] }],
  ['memberships/mesa-ficticia_leo@teias.invalid', { email: 'leo@teias.invalid', uid: 'uid-leo-fixture', username: 'leo', role: 'player', active: true, campaignId: 'mesa-ficticia', characterId: 'char-leo', sessionIds: [], adventureIds: [] }],
  ['memberships/mesa-ficticia_fernanda@teias.invalid', { email: 'fernanda@teias.invalid', uid: 'uid-fernanda-fixture', username: 'fernanda', role: 'player', active: true, campaignId: 'mesa-ficticia', characterId: 'char-fernanda', sessionIds: [], adventureIds: [] }],
  ['campaigns/mesa-ficticia/shared/state', { payload: { heading: 'Somente compartilhado, dado fictício' } }],
  ['campaigns/mesa-ficticia/private/state', { payload: { secret: 'Segredo inventado para teste' } }],
  ['campaigns/mesa-ficticia/sessions/sess-gus', { payload: { name: 'Sessão Gus fictícia' } }],
  ['campaigns/mesa-ficticia/sessions/sess-bruno', { payload: { name: 'Sessão Bruno fictícia' } }],
  ['campaigns/mesa-ficticia/adventureViews/adv-gus', { payload: { name: 'Aventura Gus fictícia' } }],
  ['campaigns/mesa-ficticia/adventureViews/adv-bruno', { payload: { name: 'Aventura Bruno fictícia' } }],
  ['campaigns/mesa-ficticia/adventures/adv-privada', { payload: { name: 'Aventura completa fictícia' } }],
  ['campaigns/mesa-ficticia/characters/char-gus', { characterId: 'char-gus', ownerUid: playerIdentity.uid, ownerUsername: 'gustavo', payload: { name: 'Personagem Gus fictício' } }],
  ['campaigns/mesa-ficticia/characters/char-bruno', { characterId: 'char-bruno', ownerUid: otherPlayerIdentity.uid, ownerUsername: 'bruno', payload: { name: 'Personagem Bruno fictício' } }],
  ['users/uid-player-fixture/characters/char-gus', { ownerId: playerIdentity.uid, payload: { name: 'Minha ficha fictícia' } }],
  ['users/uid-other-fixture/characters/char-bruno', { ownerId: otherPlayerIdentity.uid, payload: { name: 'Outra ficha fictícia' } }],
  ['media/legado-orfao', { ownerId: masterIdentity.uid, campaignId: null, entityType: 'campaign', entityId: 'mesa-ficticia', mime: 'image/webp', size: 20 }],
  ['media/legado-orfao/chunks/parte-01', { data: 'conteudo-ficticio-um' }],
  ['media/legado-sem-campo', { ownerId: masterIdentity.uid, entityType: 'campaign', entityId: 'mesa-ficticia', mime: 'image/webp', size: 20 }],
  ['media/legado-sem-campo/chunks/parte-01', { data: 'conteudo-ficticio-sem-campo' }],
  ['media/legado-campanha-removida', { ownerId: masterIdentity.uid, campaignId: 'campanha-nao-encontrada', entityType: 'session', entityId: 'sess-antiga', mime: 'image/webp', size: 24 }],
  ['media/legado-campanha-removida/chunks/parte-01', { data: 'fragmento-ficticio-historico' }],
  ['media/legado-sessao-gus', { ownerId: masterIdentity.uid, campaignId: 'mesa-ficticia', entityType: 'session', entityId: 'sess-gus', mime: 'image/webp', size: 24 }],
  ['media/legado-sessao-gus/chunks/parte-01', { data: 'conteudo-ficticio-dois' }],
  ['media/legado-sessao-bruno', { ownerId: masterIdentity.uid, campaignId: 'mesa-ficticia', entityType: 'session', entityId: 'sess-bruno', mime: 'image/webp', size: 24 }],
  ['media/legado-sessao-bruno/chunks/parte-01', { data: 'conteudo-ficticio-tres' }],
];

let passed = 0;
let failed = 0;
const facts = [];

async function check(mode, title, allowed, action) {
  const runner = allowed ? assertSucceeds : assertFails;
  try {
    await runner(action());
    passed++;
    console.log('PASS', mode, allowed ? 'PERMIT' : 'DENY', title);
    if (mode === 'baseline' && allowed && title.startsWith('EXPOSURE:')) {
      facts.push(title.slice('EXPOSURE:'.length).trim());
    }
  } catch {
    failed++;
    console.error('FAIL', mode, allowed ? 'PERMIT' : 'DENY', title);
  }
}

async function run(mode, rules) {
  // A versao 6 cria um ambiente por ruleset; o ambiente isolado carrega
  // suas regras na inicializacao, sem usar API de publicacao.
  const env = await initializeTestEnvironment({
    projectId,
    firestore: { host: '127.0.0.1', port: 8089, rules },
  });
  try {
    await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const admin = context.firestore();
    for (const [path, data] of seed) await setDoc(doc(admin, path), data);
  });
  const master = env.authenticatedContext(masterIdentity.uid, { email: masterIdentity.email }).firestore();
  const player = env.authenticatedContext(playerIdentity.uid, { email: playerIdentity.email }).firestore();
  const other = env.authenticatedContext(otherPlayerIdentity.uid, { email: otherPlayerIdentity.email }).firestore();
  const outsider = env.authenticatedContext('uid-estranho', { email: 'estranho@teias.invalid' }).firestore();
  const visitor = env.unauthenticatedContext().firestore();
  const baseline = mode === 'baseline';
  console.log('---', mode.toUpperCase(), '---');

  // Identidade e acesso publico: devem ser negados independentemente da versao.
  await check(mode, 'Visitante não lê perfis', false, () => getDoc(doc(visitor, 'users/uid-player-fixture')));
  await check(mode, 'Visitante não lê campanha', false, () => getDoc(doc(visitor, 'campaigns/mesa-ficticia')));
  await check(mode, 'Visitante não lê memberships', false, () => getDoc(doc(visitor, 'memberships/mesa-ficticia_gus@teias.invalid')));
  await check(mode, 'Visitante não cria campanha', false, () => setDoc(doc(visitor, 'campaigns/mesa-visitante'), { ownerId: 'anon' }));
  await check(mode, 'Visitante não lê fichas particulares', false, () => getDoc(doc(visitor, 'users/uid-player-fixture/characters/char-gus')));

  // Mestre de uma campanha deve poder administrar informacoes de sua mesa.
  await check(mode, 'Mestre lê perfil próprio', true, () => getDoc(doc(master, 'users/uid-master-fixture')));
  await check(mode, 'Mestre lista perfis', true, () => getDocs(collection(master, 'users')));
  await check(mode, 'Mestre lê área privada', true, () => getDoc(doc(master, 'campaigns/mesa-ficticia/private/state')));
  await check(mode, 'Mestre lê outra ficha da mesa', true, () => getDoc(doc(master, 'campaigns/mesa-ficticia/characters/char-gus')));
  await check(mode, 'Mestre lê memberships de membros', true, () => getDoc(doc(master, 'memberships/mesa-ficticia_bruno@teias.invalid')));
  await check(mode, 'Mestre atualiza projeção compartilhada', true, () => updateDoc(doc(master, 'campaigns/mesa-ficticia/shared/state'), { updatedAt: 'agora-ficticio' }));
  await check(mode, 'Mestre cria sessão fictícia', true, () => setDoc(doc(master, 'campaigns/mesa-ficticia/sessions/sess-nova'), { payload: { ficticia: true } }));

  // Compatibilidade 3.09: mídia órfã anterior, mídia atribuída e chunks históricos.
  // Os dados são inteiramente sintéticos e rodam nas Rules antigas e propostas.
  await check(mode, '3.09: Mestre le metadados de midia orfa antiga', true, () => getDoc(doc(master, 'media/legado-orfao')));
  await check(mode, '3.09: Mestre le chunk de midia orfa antiga', true, () => getDoc(doc(master, 'media/legado-orfao/chunks/parte-01')));
  await check(mode, '3.09: Mestre le midia antiga sem campo campaignId', true, () => getDoc(doc(master, 'media/legado-sem-campo')));
  await check(mode, '3.09: Mestre le chunk antigo sem campo campaignId', true, () => getDoc(doc(master, 'media/legado-sem-campo/chunks/parte-01')));
  // Compatibilidade funcional legada: leitura e edicao sao contratos distintos.
  // O campo campaignId verdadeiramente AUSENTE nao e igual ao null, e pode
  // provocar uma negacao nas expressoes de update/delete da Rules atual.
  await check(mode, '3.09: Mestre nao atualiza chunk quando campaignId esta ausente', false, () => updateDoc(doc(master, 'media/legado-sem-campo/chunks/parte-01'), { updatedAt: 'teste-ficticio' }));
  await check(mode, '3.09: Mestre nao atualiza metadados de midia sem campaignId', false, () => updateDoc(doc(master, 'media/legado-sem-campo'), { updatedAt: 'teste-ficticio' }));
  await check(mode, '3.09: Mestre nao exclui midia com campaignId ausente', false, () => deleteDoc(doc(master, 'media/legado-sem-campo')));
  await check(mode, '3.09: Jogador nao acessa midia antiga sem campaignId', false, () => getDoc(doc(player, 'media/legado-sem-campo')));
  await check(mode, '3.09: Jogador nao acessa chunk antigo sem campaignId', false, () => getDoc(doc(player, 'media/legado-sem-campo/chunks/parte-01')));

  await check(mode, '3.09: Mestre le midia cujo campaignId referencia campanha removida', true, () => getDoc(doc(master, 'media/legado-campanha-removida')));
  await check(mode, '3.09: Mestre le chunk de campanha historica removida', true, () => getDoc(doc(master, 'media/legado-campanha-removida/chunks/parte-01')));
  await check(mode, '3.09: Jogador nao le midia da campanha historica removida', false, () => getDoc(doc(player, 'media/legado-campanha-removida')));
  await check(mode, '3.09: Jogador nao le chunk da campanha historica removida', false, () => getDoc(doc(player, 'media/legado-campanha-removida/chunks/parte-01')));
  await check(mode, '3.09: Mestre atualiza chunk de midia propria antiga', true, () => updateDoc(doc(master, 'media/legado-orfao/chunks/parte-01'), { updatedAt: 'agora-ficticio' }));
  await check(mode, '3.09: Jogador nao le midia orfa do Mestre', false, () => getDoc(doc(player, 'media/legado-orfao')));
  await check(mode, '3.09: Jogador nao le chunk orfao do Mestre', false, () => getDoc(doc(player, 'media/legado-orfao/chunks/parte-01')));
  await check(mode, '3.09: Jogador le midia de sessao atribuida', true, () => getDoc(doc(player, 'media/legado-sessao-gus')));
  await check(mode, '3.09: Jogador le chunk de sessao atribuida', true, () => getDoc(doc(player, 'media/legado-sessao-gus/chunks/parte-01')));
  await check(mode, '3.09: Jogador nao le midia de outra sessao', false, () => getDoc(doc(player, 'media/legado-sessao-bruno')));
  await check(mode, '3.09: Jogador nao le chunk de outra sessao', false, () => getDoc(doc(player, 'media/legado-sessao-bruno/chunks/parte-01')));
  await check(mode, '3.09: Jogador nao altera chunk do Mestre', false, () => updateDoc(doc(player, 'media/legado-sessao-gus/chunks/parte-01'), { updatedAt: 'nao-autorizado' }));
  await check(mode, '3.09: Visitante nao le chunk de midia', false, () => getDoc(doc(visitor, 'media/legado-sessao-gus/chunks/parte-01')));

  // Jogador da mesa: apenas dados de sua participacao.
  await check(mode, 'Jogador lê o próprio perfil', true, () => getDoc(doc(player, 'users/uid-player-fixture')));
  await check(mode, 'Jogador lê o próprio vínculo', true, () => getDoc(doc(player, 'memberships/mesa-ficticia_gus@teias.invalid')));
  await check(mode, 'Jogador consulta seus vínculos por email', true, () => getDocs(query(collection(player, 'memberships'), where('email', '==', playerIdentity.email))));
  await check(mode, 'Jogador vê campanha vinculada', true, () => getDoc(doc(player, 'campaigns/mesa-ficticia')));
  await check(mode, 'Jogador vê shared', true, () => getDoc(doc(player, 'campaigns/mesa-ficticia/shared/state')));
  await check(mode, 'Jogador vê a própria sessão', true, () => getDoc(doc(player, 'campaigns/mesa-ficticia/sessions/sess-gus')));
  await check(mode, 'Jogador vê a própria adventureView', true, () => getDoc(doc(player, 'campaigns/mesa-ficticia/adventureViews/adv-gus')));
  await check(mode, 'Jogador vê a própria ficha atribuída', true, () => getDoc(doc(player, 'campaigns/mesa-ficticia/characters/char-gus')));
  await check(mode, 'Jogador vê sua ficha pessoal', true, () => getDoc(doc(player, 'users/uid-player-fixture/characters/char-gus')));
  await check(mode, 'Jogador altera apenas seu displayName', true, () => updateDoc(doc(player, 'users/uid-player-fixture'), { displayName: 'Nome fictício atualizado' }));
  await check(mode, 'Jogador salva sua ficha atribuída', true, () => updateDoc(doc(player, 'campaigns/mesa-ficticia/characters/char-gus'), { updatedAt: 'agora' }));

  await check(mode, 'Jogador não lê notas privadas do Mestre', false, () => getDoc(doc(player, 'campaigns/mesa-ficticia/private/state')));
  await check(mode, 'Jogador não lê aventura completa do Mestre', false, () => getDoc(doc(player, 'campaigns/mesa-ficticia/adventures/adv-privada')));
  await check(mode, 'Jogador não lê sessão de outro jogador', false, () => getDoc(doc(player, 'campaigns/mesa-ficticia/sessions/sess-bruno')));
  await check(mode, 'Jogador não lê adventureView de outro jogador', false, () => getDoc(doc(player, 'campaigns/mesa-ficticia/adventureViews/adv-bruno')));
  await check(mode, 'Jogador não altera sessões', false, () => updateDoc(doc(player, 'campaigns/mesa-ficticia/sessions/sess-gus'), { updatedAt: 'não autorizado' }));
  await check(mode, 'Jogador não altera shared', false, () => updateDoc(doc(player, 'campaigns/mesa-ficticia/shared/state'), { updatedAt: 'não autorizado' }));
  await check(mode, 'Jogador não altera memberships', false, () => updateDoc(doc(player, 'memberships/mesa-ficticia_gus@teias.invalid'), { role: 'dm' }));
  await check(mode, 'Jogador não lê ficha pessoal de outra conta', false, () => getDoc(doc(player, 'users/uid-other-fixture/characters/char-bruno')));
  await check(mode, 'Estranho sem vínculo não lê campanha', false, () => getDoc(doc(outsider, 'campaigns/mesa-ficticia')));
  await check(mode, 'Estranho sem vínculo não lê sessão', false, () => getDoc(doc(outsider, 'campaigns/mesa-ficticia/sessions/sess-gus')));
  await check(mode, 'Outro jogador da mesa não lê ficha pessoal de Gus', false, () => getDoc(doc(other, 'users/uid-player-fixture/characters/char-gus')));

  // 3.09 — matriz sintética de cinco identidades (1 Mestre, 4 Jogadores).
  // As contas abaixo nao sao credenciais reais; o emulador aceita claims
  // inventadas. O teste NAO comprova login real nem autorizacao em producao.
  const playerFixtures = [
    { uid: 'uid-other-fixture', login: 'bruno', ownSession: 'sess-bruno' },
    { uid: 'uid-player-fixture', login: 'gus', ownSession: 'sess-gus' },
    { uid: 'uid-leo-fixture', login: 'leo', ownSession: null },
    { uid: 'uid-fernanda-fixture', login: 'fernanda', ownSession: null },
  ];
  await check(mode, '3.09: Mestre de teste le sua propria campanha', true, () =>
    getDoc(doc(master, 'campaigns/mesa-ficticia')));
  await check(mode, '3.09: Mestre de teste le notas privadas da campanha', true, () =>
    getDoc(doc(master, 'campaigns/mesa-ficticia/private/state')));
  await check(mode, '3.09: Mestre de teste le aventura completa', true, () =>
    getDoc(doc(master, 'campaigns/mesa-ficticia/adventures/adv-privada')));
  for (const fixture of playerFixtures) {
    const db = env.authenticatedContext(fixture.uid, {
      email: fixture.login + '@teias.invalid',
    }).firestore();
    const memberId = 'mesa-ficticia_' + fixture.login + '@teias.invalid';
    const foreignSession = fixture.ownSession === 'sess-gus' ? 'sess-bruno' : 'sess-gus';
    await check(mode, '3.09: ' + fixture.login + ' le perfil proprio', true, () =>
      getDoc(doc(db, 'users/' + fixture.uid)));
    await check(mode, '3.09: ' + fixture.login + ' le proprio vinculo', true, () =>
      getDoc(doc(db, 'memberships/' + memberId)));
    await check(mode, '3.09: ' + fixture.login + ' consulta vinculo por email', true, () =>
      getDocs(query(collection(db, 'memberships'), where('email', '==', fixture.login + '@teias.invalid'))));
    await check(mode, '3.09: ' + fixture.login + ' le campanha vinculada', true, () =>
      getDoc(doc(db, 'campaigns/mesa-ficticia')));
    await check(mode, '3.09: ' + fixture.login + ' le shared', true, () =>
      getDoc(doc(db, 'campaigns/mesa-ficticia/shared/state')));
    await check(mode, '3.09: ' + fixture.login + ' nao le private', false, () =>
      getDoc(doc(db, 'campaigns/mesa-ficticia/private/state')));
    await check(mode, '3.09: ' + fixture.login + ' nao le aventura completa', false, () =>
      getDoc(doc(db, 'campaigns/mesa-ficticia/adventures/adv-privada')));
    await check(mode, '3.09: ' + fixture.login + ' nao le sessao alheia', false, () =>
      getDoc(doc(db, 'campaigns/mesa-ficticia/sessions/' + foreignSession)));
    await check(mode, '3.09: ' + fixture.login + ' nao le campanha sem vinculo', false, () =>
      getDoc(doc(db, 'campaigns/outra-mesa')));
    if (fixture.ownSession) {
      await check(mode, '3.09: ' + fixture.login + ' le sessao atribuida', true, () =>
        getDoc(doc(db, 'campaigns/mesa-ficticia/sessions/' + fixture.ownSession)));
    }
  }

  // Compatibilidade 3.05: payload historico com UID vazio continua valido,
  // mas vinculos contraditorios nunca podem ampliar a visibilidade.
  // As quatro campanhas abaixo so existem no emulador, sem dados reais.
  const invalidLinks = [
    { campaignId: 'mesa-uid-divergente', uid: otherPlayerIdentity.uid, email: playerIdentity.email, role: 'player' },
    { campaignId: 'mesa-email-divergente', uid: playerIdentity.uid, email: otherPlayerIdentity.email, role: 'player' },
    { campaignId: 'mesa-role-divergente', uid: playerIdentity.uid, email: playerIdentity.email, role: 'dm' },
    { campaignId: 'outra-mesa', documentCampaignId: 'mesa-campanha-divergente', uid: playerIdentity.uid, email: playerIdentity.email, role: 'player' },
  ];
  await env.withSecurityRulesDisabled(async (context) => {
    const admin = context.firestore();
    for (const link of invalidLinks) {
      const id = link.documentCampaignId || link.campaignId;
      await setDoc(doc(admin, 'campaigns/' + id), {
        id, ownerId: masterIdentity.uid, name: 'Campanha inconsistente ficticia',
      });
      await setDoc(doc(admin, 'memberships/' + id + '_' + playerIdentity.email), {
        uid: link.uid,
        email: link.email,
        username: 'gustavo',
        role: link.role,
        active: true,
        campaignId: link.campaignId,
        characterId: null,
        sessionIds: [],
        adventureIds: [],
      });
    }
  });
  for (const link of invalidLinks) {
    const id = link.documentCampaignId || link.campaignId;
    await check(mode, '3.05: UID/email/papel/campanha consistentes em ' + id, baseline, () =>
      getDoc(doc(player, 'campaigns/' + id)));
  }
  // Contraprova: nao basta assumir o e-mail do Mestre numa sessao com
  // UID e perfil de jogador. No Firebase real, nenhuma senha e usada aqui.
  const mistakenMaster = env.authenticatedContext(playerIdentity.uid, {
    email: masterIdentity.email,
  }).firestore();
  await check(mode, '3.05: email do Mestre isolado nao autoriza perfil divergente', baseline, () =>
    getDoc(doc(mistakenMaster, 'campaigns/mesa-ficticia/private/state')));

  // 3.06: acesso direto por ID nao contorna atribuicao. A revogacao do
  // membership passa a ser efetiva na proxima leitura, inclusive por URL.
  await env.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), 'memberships/mesa-ficticia_gus@teias.invalid'), {
      active: false,
    });
  });
  await check(mode, '3.06: após revogação, URL da campanha não é acessível', false, () => getDoc(doc(player, 'campaigns/mesa-ficticia')));
  await check(mode, '3.06: após revogação, URL da própria sessão não é acessível', false, () => getDoc(doc(player, 'campaigns/mesa-ficticia/sessions/sess-gus')));
  await check(mode, '3.06: após revogação, URL da própria ficha não é acessível', false, () => getDoc(doc(player, 'campaigns/mesa-ficticia/characters/char-gus')));
  await env.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), 'memberships/mesa-ficticia_gus@teias.invalid'), {
      active: true,
    });
  });

  // 3.07: o Mestre pode consultar os cinco perfis por username e
  // os próprios vínculos administrativos filtrados por e-mail técnico,
  // sem uma listagem desnecessária dos documentos completos.
  for (const [username, login] of [
    ['rafael', 'rafael'],
    ['bruno', 'bruno'],
    ['gustavo', 'gus'],
    ['leo', 'leo'],
    ['fernanda', 'fernanda'],
  ]) {
    await check(mode, '3.07: Mestre consulta perfil conhecido ' + username, true, () =>
      getDocs(query(collection(master, 'users'), where('username', '==', username))));
    await check(mode, '3.07: Mestre consulta vínculo conhecido ' + username, true, () =>
      getDocs(query(collection(master, 'memberships'), where('email', '==', login + '@teias.invalid'))));
  }
  await check(mode, 'preflight: Mestre consulta seus vinculos por UID apesar de email legado', true, () =>
    getDocs(query(collection(master, 'memberships'), where('uid', '==', masterIdentity.uid))));
  await check(mode, 'preflight: Jogador nao consulta membership do UID Mestre', false, () =>
    getDocs(query(collection(player, 'memberships'), where('uid', '==', masterIdentity.uid))));

  await check(mode, '3.07: Jogador não consulta perfil alheio na proposta', baseline, () =>
    getDocs(query(collection(player, 'users'), where('username', '==', 'bruno'))));

  // Exposicoes do legado: devem passar na baseline e ser negadas na proposta.
  await check(mode, 'EXPOSURE: Leitura de perfil de outro jogador', baseline, () => getDoc(doc(player, 'users/uid-other-fixture')));
  await check(mode, 'EXPOSURE: Lista geral de perfis por jogador', baseline, () => getDocs(collection(player, 'users')));
  await check(mode, 'EXPOSURE: Leitura de membership de outro jogador da mesa', baseline, () => getDoc(doc(player, 'memberships/mesa-ficticia_bruno@teias.invalid')));
  await check(mode, 'EXPOSURE: Leitura de ficha atribuída a outro jogador', baseline, () => getDoc(doc(player, 'campaigns/mesa-ficticia/characters/char-bruno')));
  await check(mode, 'EXPOSURE: Lista de fichas de toda a campanha', baseline, () => getDocs(collection(player, 'campaigns/mesa-ficticia/characters')));
  await check(mode, 'EXPOSURE: Criacao de campanha por jogador', baseline, () => setDoc(doc(player, 'campaigns/mesa-do-jogador'), { ownerId: playerIdentity.uid, name: 'Criação fictícia não autorizada' }));
  await check(mode, 'EXPOSURE: Criação de mídia sem campanha por jogador', baseline, () => setDoc(doc(player, 'media/midia-orfao'), { ownerId: playerIdentity.uid, campaignId: null, entityType: 'campaign', entityId: 'qualquer', mime: 'image/webp', size: 3 }));
  await check(mode, 'EXPOSURE: Modificar ownerId da campanha pelo Mestre', baseline, () => updateDoc(doc(master, 'campaigns/mesa-ficticia'), { ownerId: playerIdentity.uid }));
  await check(mode, 'EXPOSURE: Jogador alterar role do próprio perfil', baseline, () => updateDoc(doc(player, 'users/uid-player-fixture'), { role: 'dm' }));
  await check(mode, 'EXPOSURE: Jogador proprietário de mesa legada ler notas privadas', baseline, () => getDoc(doc(player, 'campaigns/mesa-player-legada/private/state')));
  await check(mode, 'EXPOSURE: Jogador proprietário de mesa legada alterar dados da mesa', baseline, () => updateDoc(doc(player, 'campaigns/mesa-player-legada'), { name: 'Alterada por jogador fictício' }));
  await check(mode, 'EXPOSURE: Jogador apagar próprio perfil', baseline, () => deleteDoc(doc(player, 'users/uid-player-fixture')));
  // Escrita 3.07 exercitada APENAS no emulador com payload inventado.
  await check(mode, '3.07: Mestre pode simular atualizacao de membership no emulador', true, () =>
    updateDoc(doc(master, 'memberships/mesa-ficticia_bruno@teias.invalid'), { updatedAt: 'ficticio' }));

  } finally {
    await env.cleanup();
  }
}

try {
  await run('baseline', baselineRules);
  await run('proposal', proposedRules);
  console.log(JSON.stringify({
    suite: 'Firestore Emulator 3.05',
    project: projectId,
    assertionsPassed: passed,
    assertionsFailed: failed,
    historicalExposuresReproduced: facts.length,
    productionChanges: 0,
  }));
  // O legado tem exposicoes conhecidas; a suite compara, nao as aceita.
  assert.equal(failed, 0, 'Existem divergencias entre comportamento esperado e regras emuladas.');
  assert.equal(facts.length, 12, 'A suite deixou de reproduzir alguma permissao historica.');
  console.log('SUCCESS: baseline documentada; proposta satisfaz criterios avaliados.');
} catch (error) {
  console.error('Auditoria emulada inconclusiva:', error instanceof Error ? error.message : 'falha desconhecida');
  process.exitCode = 1;
}
