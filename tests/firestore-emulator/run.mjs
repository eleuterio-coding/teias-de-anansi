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
  ['campaigns/mesa-ficticia', { id: 'mesa-ficticia', ownerId: masterIdentity.uid, name: 'Mesa de teste fictícia' }],
  ['campaigns/outra-mesa', { id: 'outra-mesa', ownerId: 'uid-outra-pessoa', name: 'Outra mesa fictícia' }],
  ['memberships/mesa-ficticia_rafael@teias.invalid', { email: masterIdentity.email, uid: masterIdentity.uid, username: 'rafael', role: 'dm', active: true, campaignId: 'mesa-ficticia', characterId: null, sessionIds: [], adventureIds: [] }],
  ['memberships/mesa-ficticia_gus@teias.invalid', { email: playerIdentity.email, uid: '', username: 'gustavo', role: 'player', active: true, campaignId: 'mesa-ficticia', characterId: 'char-gus', sessionIds: ['sess-gus'], adventureIds: ['adv-gus'] }],
  ['memberships/mesa-ficticia_bruno@teias.invalid', { email: otherPlayerIdentity.email, uid: otherPlayerIdentity.uid, username: 'bruno', role: 'player', active: true, campaignId: 'mesa-ficticia', characterId: 'char-bruno', sessionIds: ['sess-bruno'], adventureIds: ['adv-bruno'] }],
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
  await check(mode, 'EXPOSURE: Jogador apagar próprio perfil', baseline, () => deleteDoc(doc(player, 'users/uid-player-fixture')));
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
  assert.equal(facts.length, 10, 'A suite deixou de reproduzir alguma permissao historica.');
  console.log('SUCCESS: baseline documentada; proposta satisfaz criterios avaliados.');
}
