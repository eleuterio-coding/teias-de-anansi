// Homologação real: Rafael atribui Campanha, Sessões, Aventuras e ficha por nome de usuário.
import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';

const env = {
  adminUsername: process.env.E2E_FIREBASE_ADMIN_USERNAME || '',
  adminPassword: process.env.E2E_FIREBASE_ADMIN_PASSWORD || '',
};
const hasCredentials = Boolean(env.adminUsername && env.adminPassword);
const CAMPAIGN_ID = 'e2e-explicit-player-access';
const PRIVATE_MARK = 'E2E_PRIVATE_MASTER_ONLY';
const SHARED_MARK = 'E2E_SHARED_ASSIGNED_OK';
const OTHER_MARK = 'E2E_SHARED_NOT_ASSIGNED';
const CHARACTER_ID = 'e2e-player-character';
const OTHER_CHARACTER_ID = 'e2e-other-character';
const PERSONAL_CHARACTER_ID = 'e2e-player-personal-character';

async function connect(page, username, password) {
  await page.goto('/index.html');
  return page.evaluate(async ({ username, password }) => {
    const url = new URL('/scripts/firebase-collaboration-provider.js?v=party-visibility-e2e', location.origin).href;
    const { createFirebaseCollaborationProvider } = await import(url);
    const provider = await createFirebaseCollaborationProvider();
    if (!provider.configured) throw new Error(`Firebase real indisponível: ${provider.reason || 'configuração ausente'}`);
    const account = await provider.signInUsername({ username, password });
    globalThis.__e2eProvider = provider;
    return { uid: account.uid, username: account.username };
  }, { username, password });
}

// O Hub aceita somente as contas oficiais na tela de login. Para testar as Rules sem
// criar/apagar uma conta real de Bruno, Gustavo, Léo ou Fernanda, a identidade efêmera
// entra diretamente pelo Firebase Auth apenas dentro desta homologação.
async function connectEphemeralPlayer(page, username, password) {
  await page.goto('/index.html');
  return page.evaluate(async ({ username, password }) => {
    const url = new URL('/scripts/firebase-collaboration-provider.js?v=party-visibility-e2e', location.origin).href;
    const { createFirebaseCollaborationProvider } = await import(url);
    const provider = await createFirebaseCollaborationProvider();
    if (!provider.configured) throw new Error(`Firebase real indisponível: ${provider.reason || 'configuração ausente'}`);
    const version = provider.config.sdkVersion || '12.18.0';
    const authLib = await import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`);
    const technicalEmail = `${username}@${provider.config.usernameDomain}`;
    const result = await authLib.signInWithEmailAndPassword(provider.auth, technicalEmail, password);
    const account = await provider.ensureProfile(result.user);
    globalThis.__e2eProvider = provider;
    return { uid: account.uid, username: account.username };
  }, { username, password });
}

async function createEphemeralPlayer(page, username, password) {
  await page.goto('/index.html');
  return page.evaluate(async ({ username, password }) => {
    const config = await fetch('/dados/firebase-config.json', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error(`Configuração Firebase indisponível (HTTP ${response.status}).`);
      return response.json();
    });
    const version = config.sdkVersion || '12.18.0';
    const base = `https://www.gstatic.com/firebasejs/${version}`;
    const appLib = await import(`${base}/firebase-app.js`);
    const authLib = await import(`${base}/firebase-auth.js`);
    const app = appLib.initializeApp(
      { apiKey: config.apiKey, authDomain: config.authDomain, projectId: config.projectId, appId: config.appId },
      `e2e-player-create-${crypto.randomUUID()}`,
    );
    try {
      const auth = authLib.getAuth(app);
      const technicalEmail = `${username}@${config.usernameDomain}`;
      const result = await authLib.createUserWithEmailAndPassword(auth, technicalEmail, password);
      const uid = result.user.uid;
      await authLib.signOut(auth);
      return { uid, username };
    } finally {
      await appLib.deleteApp(app).catch(() => {});
    }
  }, { username, password });
}

async function providerCall(page, operation, args = {}) {
  try {
    return await page.evaluate(async ({ operation, args }) => {
      const p = globalThis.__e2eProvider;
      if (!p) throw new Error('Provider E2E não inicializado.');
      if (operation === 'publish') return p.saveCampaignBundle(args.campaign, args.adventures || [], args.characters || []);
      if (operation === 'membership') return p.upsertMembership(args);
      if (operation === 'bundle') return p.getCampaignBundle(args.campaignId);
      if (operation === 'memberships') return p.listMemberships();
      if (operation === 'saveCharacter') return p.saveCampaignCharacter(args.campaignId, args.character);
      if (operation === 'campaignCharacters') return p.listCampaignCharacters(args.campaignId);
      if (operation === 'saveOwnPersonal') return p.saveOwnCharacter(args.character);
      if (operation === 'ownCharacters') return p.listOwnCharacters();
      if (operation === 'saveManagedPersonal') return p.saveManagedPlayerCharacter(args.character);
      if (operation === 'deleteManagedPersonal') {
        const url = new URL('/scripts/firebase-realtime-ops.js?v=master-delete-e2e', location.origin).href;
        const { deleteRemoteManagedCharacter } = await import(url);
        return deleteRemoteManagedCharacter(p, args.characterId, args.ownerUid);
      }
      if (operation === 'deleteAnyCharacterAsMaster') {
        const url = new URL('/scripts/firebase-realtime-ops.js?v=master-delete-e2e', location.origin).href;
        const { deleteRemoteCharacterAsMaster } = await import(url);
        return deleteRemoteCharacterAsMaster(p, args.characterId);
      }
      if (operation === 'clearTombstone') {
        const version = p.config.sdkVersion || '12.18.0';
        const f = await import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`);
        return f.deleteDoc(f.doc(p.db, 'characterTombstones', args.characterId));
      }
      throw new Error(`Operação E2E desconhecida: ${operation}`);
    }, { operation, args });
  } catch (error) {
    throw new Error(`providerCall[${operation}] falhou: ${error?.message || error}`, { cause: error });
  }
}

async function directFirestore(page, operation, args = {}) {
  return page.evaluate(async ({ operation, args }) => {
    const p = globalThis.__e2eProvider;
    const version = p.config.sdkVersion || '12.18.0';
    const f = await import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`);
    try {
      if (operation === 'campaign-update') await f.updateDoc(f.doc(p.db, 'campaigns', args.campaignId), { name: 'ALTERAÇÃO PROIBIDA' });
      if (operation === 'private-read') await f.getDoc(f.doc(p.db, 'campaigns', args.campaignId, 'private', 'state'));
      if (operation === 'membership-update') await f.updateDoc(f.doc(p.db, 'memberships', `${args.campaignId}_${args.username}@${p.config.usernameDomain}`), { adventureIds: ['a-other'] });
      if (operation === 'other-character-read') await f.getDoc(f.doc(p.db, 'campaigns', args.campaignId, 'characters', args.characterId));
      if (operation === 'other-character-update') await f.updateDoc(f.doc(p.db, 'campaigns', args.campaignId, 'characters', args.characterId), { updatedAt: new Date().toISOString() });
      if (operation === 'other-session-read') await f.getDoc(f.doc(p.db, 'campaigns', args.campaignId, 'sessions', args.sessionId));
      if (operation === 'other-adventure-read') await f.getDoc(f.doc(p.db, 'campaigns', args.campaignId, 'adventureViews', args.adventureId));
      return { allowed: true };
    } catch (error) {
      return { allowed: false, code: error?.code || '', message: error?.message || '' };
    }
  }, { operation, args });
}

async function cleanupPlayerIdentity(page, { username, password, uid }) {
  if (!username || !password || !uid) return;
  await page.goto('/index.html').catch(() => {});
  await page.evaluate(async ({ username, password, uid }) => {
    const config = await fetch('/dados/firebase-config.json', { cache: 'no-store' }).then(response => response.json());
    const version = config.sdkVersion || '12.18.0';
    const base = `https://www.gstatic.com/firebasejs/${version}`;
    const appLib = await import(`${base}/firebase-app.js`);
    const authLib = await import(`${base}/firebase-auth.js`);
    const f = await import(`${base}/firebase-firestore.js`);
    const app = appLib.initializeApp(
      { apiKey: config.apiKey, authDomain: config.authDomain, projectId: config.projectId, appId: config.appId },
      `e2e-player-cleanup-${crypto.randomUUID()}`,
    );
    try {
      const auth = authLib.getAuth(app);
      const db = f.getFirestore(app);
      const technicalEmail = `${username}@${config.usernameDomain}`;
      const result = await authLib.signInWithEmailAndPassword(auth, technicalEmail, password);
      const chars = await f.getDocs(f.collection(db, 'users', uid, 'characters')).catch(() => null);
      for (const row of chars?.docs || []) await f.deleteDoc(row.ref).catch(() => {});
      await f.deleteDoc(f.doc(db, 'users', uid)).catch(() => {});
      await authLib.deleteUser(result.user);
    } finally {
      await appLib.deleteApp(app).catch(() => {});
    }
  }, { username, password, uid }).catch(error => console.warn(`Cleanup da identidade E2E: ${error.message}`));
}

async function cleanupCampaign(page, { campaignId }) {
  await page.evaluate(async ({ campaignId }) => {
    const p = globalThis.__e2eProvider;
    if (!p) return;
    const version = p.config.sdkVersion || '12.18.0';
    const f = await import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`);
    for (const child of ['sessions', 'adventureViews', 'characters']) {
      const snap = await f.getDocs(f.collection(p.db, 'campaigns', campaignId, child)).catch(() => null);
      for (const row of snap?.docs || []) await f.deleteDoc(row.ref).catch(() => {});
    }
    const memberships = await f.getDocs(f.query(f.collection(p.db, 'memberships'), f.where('campaignId', '==', campaignId))).catch(() => null);
    for (const row of memberships?.docs || []) await f.deleteDoc(row.ref).catch(() => {});
    await f.deleteDoc(f.doc(p.db, 'campaigns', campaignId, 'shared', 'state')).catch(() => {});
    await f.deleteDoc(f.doc(p.db, 'campaigns', campaignId, 'private', 'state')).catch(() => {});
    await f.deleteDoc(f.doc(p.db, 'campaigns', campaignId)).catch(() => {});
  }, { campaignId }).catch(error => console.warn(`Cleanup da Mesa E2E: ${error.message}`));
}

test.describe('Firebase real · acessos explícitos do Jogador', () => {
  test.skip(!hasCredentials, 'Credenciais E2E da conta principal não estão disponíveis.');

  test('Jogador lê fichas da Campanha, edita somente a própria e mantém acessos explícitos', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const playerContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    const playerPage = await playerContext.newPage();
    const suffix = `${Date.now().toString(36)}-${randomBytes(5).toString('hex')}`;
    const personalCharacterId = `${PERSONAL_CHARACTER_ID}-${suffix}`;
    const playerUsername = `e2e-player-${suffix}`;
    const playerPassword = `E2E!${randomBytes(24).toString('base64url')}9a`;
    let playerUid = '';

    try {
      const admin = await connect(adminPage, env.adminUsername, env.adminPassword);
      expect(admin.username).toBe(env.adminUsername.toLowerCase());

      const now = new Date().toISOString();
      const campaign = {
        schema: 'hub-rpg/campaign/v1',
        id: CAMPAIGN_ID,
        name: 'Mesa E2E · acessos explícitos',
        status: 'active',
        system: 'D&D 5.5e',
        setting: 'Homologação',
        description: 'Mesa técnica',
        dmName: 'Rafael',
        sharedNotes: SHARED_MARK,
        dmNotes: PRIVATE_MARK,
        members: [
          { id: 'm-player', name: 'Jogador E2E', role: 'player', characterId: CHARACTER_ID, active: true },
          { id: 'm-other', name: 'Outro jogador', role: 'player', characterId: OTHER_CHARACTER_ID, active: true },
        ],
        sessions: [
          { id: 's-assigned', number: 1, title: 'Sessão atribuída', status: 'planned', sharedNotes: SHARED_MARK, dmNotes: PRIVATE_MARK, participantCharacterIds: [CHARACTER_ID, OTHER_CHARACTER_ID] },
          { id: 's-other', number: 2, title: 'Sessão não atribuída', status: 'planned', sharedNotes: OTHER_MARK, dmNotes: PRIVATE_MARK, participantCharacterIds: [CHARACTER_ID, OTHER_CHARACTER_ID] },
        ],
        createdAt: now,
        updatedAt: now,
      };
      const adventures = [
        {
          schema: 'hub-rpg/adventure/v1', id: 'a-assigned', campaignId: CAMPAIGN_ID, title: 'Aventura atribuída', status: 'planned', summary: SHARED_MARK, dmNotes: PRIVATE_MARK,
          handouts: [{ id: 'h-visible', title: 'Visível', revealed: true, content: SHARED_MARK }, { id: 'h-hidden', title: 'Oculto', revealed: false, content: PRIVATE_MARK }],
          clues: [{ id: 'c-visible', title: 'Descoberta', status: 'discovered', text: SHARED_MARK }, { id: 'c-hidden', title: 'Oculta', status: 'hidden', text: PRIVATE_MARK }],
          createdAt: now, updatedAt: now,
        },
        { schema: 'hub-rpg/adventure/v1', id: 'a-other', campaignId: CAMPAIGN_ID, title: 'Aventura não atribuída', status: 'planned', summary: OTHER_MARK, handouts: [], clues: [], createdAt: now, updatedAt: now },
      ];
      const characters = [
        { id: CHARACTER_ID, name: 'Ficha atribuída', updatedAt: now },
        { id: OTHER_CHARACTER_ID, name: 'Ficha de outro jogador', updatedAt: now },
      ];

      await providerCall(adminPage, 'publish', { campaign, adventures, characters });
      const ephemeral = await createEphemeralPlayer(playerPage, playerUsername, playerPassword);
      playerUid = ephemeral.uid;
      expect(playerUid).toBeTruthy();

      await providerCall(adminPage, 'membership', {
        campaignId: CAMPAIGN_ID,
        username: playerUsername,
        characterId: CHARACTER_ID,
        sessionIds: ['s-assigned'],
        adventureIds: ['a-assigned'],
      });

      const firstLogin = await connectEphemeralPlayer(playerPage, playerUsername, playerPassword);
      expect(firstLogin.uid).toBe(playerUid);

      const personalCharacter = {
        id: personalCharacterId,
        name: 'Ficha pessoal antes da edição do Mestre',
        ownerUid: playerUid,
        ownerUsername: playerUsername,
        updatedAt: new Date().toISOString(),
      };
      await providerCall(playerPage, 'saveOwnPersonal', { character: personalCharacter });
      await expect(providerCall(adminPage, 'saveManagedPersonal', {
        character: {
          ...personalCharacter,
          name: 'Ficha pessoal editada pelo Mestre',
          updatedAt: new Date(Date.now() + 1000).toISOString(),
        },
      })).resolves.toBeUndefined();
      await expect.poll(async () => {
        const rows = await providerCall(playerPage, 'ownCharacters');
        return rows.find(row => row.id === personalCharacterId)?.name || '';
      }, { timeout: 5000 }).toBe('Ficha pessoal editada pelo Mestre');
      const adminBundle = await providerCall(adminPage, 'bundle', { campaignId: CAMPAIGN_ID });
      expect(adminBundle.mode).toBe('private');
      expect(JSON.stringify(adminBundle.payload)).toContain(PRIVATE_MARK);

      const playerBundle = await providerCall(playerPage, 'bundle', { campaignId: CAMPAIGN_ID });
      expect(playerBundle.mode).toBe('shared');
      const sharedJson = JSON.stringify(playerBundle.payload);
      expect(sharedJson).toContain(SHARED_MARK);
      expect(sharedJson).not.toContain(PRIVATE_MARK);
      expect(sharedJson).not.toContain(OTHER_MARK);
      expect(playerBundle.payload.campaign.sessions.map(s => s.id)).toEqual(['s-assigned']);
      expect(playerBundle.payload.revealedAdventures.map(a => a.id)).toEqual(['a-assigned']);
      expect(playerBundle.payload.revealedAdventures[0].handouts.map(x => x.id)).toEqual(['h-visible']);
      expect(playerBundle.payload.revealedAdventures[0].clues.map(x => x.id)).toEqual(['c-visible']);

      const otherRead = await directFirestore(playerPage, 'other-character-read', { campaignId: CAMPAIGN_ID, characterId: OTHER_CHARACTER_ID });
      expect(otherRead.allowed, 'a ficha de outro participante deve ser legível').toBe(true);

      for (const [operation, args] of [
        ['campaign-update', { campaignId: CAMPAIGN_ID }],
        ['private-read', { campaignId: CAMPAIGN_ID }],
        ['membership-update', { campaignId: CAMPAIGN_ID, username: playerUsername }],
        ['other-character-update', { campaignId: CAMPAIGN_ID, characterId: OTHER_CHARACTER_ID }],
        ['other-session-read', { campaignId: CAMPAIGN_ID, sessionId: 's-other' }],
        ['other-adventure-read', { campaignId: CAMPAIGN_ID, adventureId: 'a-other' }],
      ]) {
        const result = await directFirestore(playerPage, operation, args);
        expect(result.allowed, `${operation} deveria ser bloqueada`).toBe(false);
      }

      const linked = await providerCall(playerPage, 'campaignCharacters', { campaignId: CAMPAIGN_ID });
      expect(linked.map(c => c.id).sort()).toEqual([CHARACTER_ID, OTHER_CHARACTER_ID].sort());
      const ownCharacter = linked.find(c => c.id === CHARACTER_ID);
      const otherCharacter = linked.find(c => c.id === OTHER_CHARACTER_ID);
      const edited = { ...ownCharacter, name: 'Ficha editada pelo próprio jogador', updatedAt: new Date().toISOString() };
      await expect(providerCall(playerPage, 'saveCharacter', { campaignId: CAMPAIGN_ID, character: edited })).resolves.toBeUndefined();
      await expect(providerCall(playerPage, 'saveCharacter', { campaignId: CAMPAIGN_ID, character: { ...otherCharacter, name: 'ALTERAÇÃO PROIBIDA', updatedAt: new Date().toISOString() } })).rejects.toThrow(/só pode alterar a ficha atribuída/i);

      const memberships = await providerCall(playerPage, 'memberships');
      const own = memberships.find(row => row.campaignId === CAMPAIGN_ID);
      expect(own?.role).toBe('player');
      expect(own?.username).toBe(playerUsername);
      expect(own?.characterId).toBe(CHARACTER_ID);
      expect(own?.sessionIds).toEqual(['s-assigned']);
      expect(own?.adventureIds).toEqual(['a-assigned']);

      await providerCall(adminPage, 'membership', {
        campaignId: CAMPAIGN_ID,
        username: playerUsername,
        characterId: personalCharacterId,
        sessionIds: ['s-assigned'],
        adventureIds: ['a-assigned'],
      });
      await expect(providerCall(playerPage, 'saveCharacter', {
        campaignId: CAMPAIGN_ID,
        character: { ...personalCharacter, id: personalCharacterId, updatedAt: new Date().toISOString() },
      })).resolves.toBeUndefined();

      await expect(providerCall(adminPage, 'deleteAnyCharacterAsMaster', {
        characterId: personalCharacterId,
      })).resolves.toMatchObject({ deleted: true, characterId: personalCharacterId });

      await expect.poll(async () => {
        const rows = await providerCall(playerPage, 'ownCharacters');
        return rows.some(row => row.id === personalCharacterId);
      }, { timeout: 5000 }).toBe(false);
      await expect.poll(async () => {
        const rows = await providerCall(playerPage, 'memberships');
        return rows.find(row => row.campaignId === CAMPAIGN_ID)?.characterId ?? null;
      }, { timeout: 5000 }).toBe(null);
      await expect.poll(async () => {
        const rows = await providerCall(playerPage, 'campaignCharacters', { campaignId: CAMPAIGN_ID });
        return rows.some(row => row.id === personalCharacterId);
      }, { timeout: 5000 }).toBe(false);
      await expect(providerCall(playerPage, 'saveOwnPersonal', {
        character: { ...personalCharacter, id: personalCharacterId, updatedAt: new Date().toISOString() },
      })).rejects.toThrow(/permission|insufficient|missing/i);
    } finally {
      await cleanupCampaign(adminPage, { campaignId: CAMPAIGN_ID });
      await providerCall(adminPage, 'clearTombstone', { characterId: personalCharacterId }).catch(() => {});
      if (playerUid) await cleanupPlayerIdentity(playerPage, { username: playerUsername, password: playerPassword, uid: playerUid });
      await Promise.allSettled([adminContext.close(), playerContext.close()]);
    }
  });
});
