import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import { URLSearchParams } from 'node:url';

// Auditoria 3.02: somente GET de Authentication e Firestore.
// POST é usado exclusivamente para obter token OAuth. Não há escrita no Firebase.
// Nunca imprimir token, UID, e-mail, IDs de campanha, documento ou ficha.
const projectId = 'teais-de-anansi';
const credentialsRaw = process.env.FIREBASE_SERVICE_ACCOUNT_TEIAS_DE_ANANSI || '';
const base = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents';
const expected = [
  { username: 'rafael', authUsername: 'rafael', displayName: 'Rafael', expectedRole: 'dm' },
  { username: 'bruno', authUsername: 'bruno', displayName: 'Bruno', expectedRole: 'player' },
  { username: 'gustavo', authUsername: 'gus', displayName: 'Gustavo', expectedRole: 'player' },
  { username: 'leo', authUsername: 'leo', displayName: 'Léo', expectedRole: 'player' },
  { username: 'fernanda', authUsername: 'fernanda', displayName: 'Fernanda', expectedRole: 'player' },
];
const normalized = (value) => String(value || '').trim().toLowerCase();
const field = (row, key) => row?.fields?.[key]?.stringValue ?? '';
const boolField = (row, key) => row?.fields?.[key]?.booleanValue;
const listField = (row, key) => row?.fields?.[key]?.arrayValue?.values ?? [];

async function accessToken(raw) {
  const creds = JSON.parse(raw);
  if (!creds.client_email || !creds.private_key) throw Error('Credencial administrativa indisponivel.');
  const now = Math.floor(Date.now() / 1000);
  const b64 = (x) => Buffer.from(x).toString('base64url');
  const header = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64(JSON.stringify({
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 1800,
  }));
  const unsigned = header + '.' + payload;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), creds.private_key).toString('base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + signature }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw Error('Token OAuth nao concedido (HTTP ' + res.status + ').');
  const data = await res.json();
  if (!data.access_token) throw Error('Token OAuth nao retornado.');
  return data.access_token;
}

async function read(token, url) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { authorization: 'Bearer ' + token, accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return { ok: false, code: res.status };
  return { ok: true, data: await res.json() };
}

async function authAccounts(token) {
  const found = new Map();
  let next = '';
  let pages = 0;
  let total = 0;
  const target = new Set(expected.map((x) => x.authUsername + '@teias.invalid'));
  do {
    if (++pages > 20) throw Error('Limite seguro de paginas Auth excedido; auditoria inconclusiva.');
    const url = new URL('https://identitytoolkit.googleapis.com/v1/projects/' + projectId + '/accounts:batchGet');
    url.searchParams.set('maxResults', '1000');
    if (next) url.searchParams.set('nextPageToken', next);
    const r = await read(token, url);
    if (!r.ok) throw Error('Leitura Auth indisponivel (HTTP ' + r.code + ').');
    const accounts = r.data.users || [];
    total += accounts.length;
    for (const account of accounts) {
      const mail = normalized(account.email);
      if (!target.has(mail)) continue;
      const entries = found.get(mail) || [];
      // Descartar hash/salt/senhas/outros campos imediatamente.
      entries.push({
        uid: String(account.localId || ''),
        disabled: account.disabled === true,
        email: mail,
      });
      found.set(mail, entries);
    }
    next = r.data.nextPageToken || '';
  } while (next);
  return { found, total };
}

async function profileByUid(token, uid) {
  const url = new URL(base + '/users/' + encodeURIComponent(uid));
  for (const f of ['uid', 'username', 'role']) url.searchParams.append('mask.fieldPaths', f);
  return read(token, url);
}

async function memberships(token) {
  const rows = [];
  let next = '';
  let pages = 0;
  do {
    if (++pages > 20) throw Error('Limite seguro de paginas memberships excedido; auditoria inconclusiva.');
    const url = new URL(base + '/memberships');
    url.searchParams.set('pageSize', '100');
    for (const f of ['email', 'uid', 'username', 'role', 'active', 'campaignId', 'characterId', 'sessionIds', 'adventureIds']) {
      url.searchParams.append('mask.fieldPaths', f);
    }
    if (next) url.searchParams.set('pageToken', next);
    const r = await read(token, url);
    if (!r.ok) {
      if (r.code === 404 && pages === 1) return { rows, collection: 'missing' };
      throw Error('Leitura memberships indisponivel (HTTP ' + r.code + ').');
    }
    rows.push(...(r.data.documents || []));
    next = r.data.nextPageToken || '';
  } while (next);
  return { rows, collection: 'readable' };
}

async function referenceExists(token, path) {
  const url = new URL(base + '/' + path.map(encodeURIComponent).join('/'));
  url.searchParams.append('mask.fieldPaths', 'characterId');
  const r = await read(token, url);
  return r.ok ? 'present' : r.code === 404 ? 'missing' : 'unverified-http-' + r.code;
}

function safeLabel(row) {
  return row.displayName + ' (' + (row.expectedRole === 'dm' ? 'Mestre' : 'Jogador') + ')';
}

async function main() {
  if (!credentialsRaw) throw Error('Secret Firebase existente nao esta disponivel na CI.');
  const token = await accessToken(credentialsRaw);
  const accounts = await authAccounts(token);
  const membershipsResult = await memberships(token);
  const report = [];
  let allAuthConfirmed = true;
  let allProfilesConfirmed = true;
  let allLinksConfirmed = true;
  for (const identity of expected) {
    const email = identity.authUsername + '@teias.invalid';
    const matches = accounts.found.get(email) || [];
    const authUnique = matches.length === 1 && Boolean(matches[0].uid);
    const account = authUnique ? matches[0] : null;
    let profile = 'not-checked';
    let profileRole = 'not-checked';
    let profileUsername = 'not-checked';
    let profileUid = 'not-checked';
    if (account) {
      const response = await profileByUid(token, account.uid);
      if (response.ok) {
        profile = 'present';
        const storedUid = field(response.data, 'uid');
        const storedRole = field(response.data, 'role');
        const storedUsername = normalized(field(response.data, 'username'));
        profileUid = !storedUid ? 'uid-field-absent' : storedUid === account.uid ? 'matches' : 'mismatch';
        profileRole = storedRole === identity.expectedRole ? 'matches' : storedRole ? 'mismatch' : 'missing-field';
        profileUsername = [identity.username, identity.authUsername].includes(storedUsername)
          ? 'matches' : storedUsername ? 'mismatch' : 'missing-field';
      } else if (response.code === 404) {
        profile = 'missing';
      } else {
        profile = 'unverified-http-' + response.code;
      }
    }
    const rows = membershipsResult.rows.filter((row) =>
      normalized(field(row, 'email')) === email ||
      (account?.uid && field(row, 'uid') === account.uid)
    );
    const active = rows.filter((row) => boolField(row, 'active') === true);
    const summary = {
      identity: safeLabel(identity),
      auth: authUnique ? (account.disabled ? 'disabled' : 'present-enabled') : matches.length ? 'duplicate-or-no-uid' : 'absent',
      uid: authUnique ? 'confirmed-private' : 'unverified',
      profile,
      profileUid,
      profileRole,
      profileUsername,
      memberships: rows.length,
      activeMemberships: active.length,
      rolesConsistent: active.every((row) => field(row, 'role') === identity.expectedRole),
      mismatchedUidLinks: active.filter((row) => field(row, 'uid') && field(row, 'uid') !== account?.uid).length,
      characterAssignments: active.filter((row) => field(row, 'characterId')).length,
      sessionAssignments: active.reduce((n, row) => n + listField(row, 'sessionIds').length, 0),
      adventureAssignments: active.reduce((n, row) => n + listField(row, 'adventureIds').length, 0),
      references: { campaignPresent: 0, campaignMissing: 0, campaignUnverified: 0, characterPresent: 0, characterMissing: 0, characterUnverified: 0 },
    };
    for (const row of active) {
      const cid = field(row, 'campaignId');
      if (!cid) { summary.references.campaignUnverified++; continue; }
      const campaign = await referenceExists(token, ['campaigns', cid]);
      summary.references[campaign === 'present' ? 'campaignPresent' : campaign === 'missing' ? 'campaignMissing' : 'campaignUnverified']++;
      const charId = field(row, 'characterId');
      if (!charId) continue;
      const character = await referenceExists(token, ['campaigns', cid, 'characters', charId]);
      summary.references[character === 'present' ? 'characterPresent' : character === 'missing' ? 'characterMissing' : 'characterUnverified']++;
    }
    if (summary.auth !== 'present-enabled') allAuthConfirmed = false;
    if (profile !== 'present' || profileRole !== 'matches' || profileUsername !== 'matches' || profileUid === 'mismatch') allProfilesConfirmed = false;
    if (!summary.rolesConsistent || summary.mismatchedUidLinks || summary.references.campaignMissing || summary.references.characterMissing || summary.references.campaignUnverified || summary.references.characterUnverified) allLinksConfirmed = false;
    report.push(summary);
  }
  console.log('Auditoria 3.02 — resultados sem identificadores ou dados pessoais privados:');
  console.log(JSON.stringify({
    project: projectId,
    authAccountsTotal: accounts.total,
    expectedAccountsPresentAndEnabled: allAuthConfirmed,
    profilesConsistent: allProfilesConfirmed,
    existingActiveLinksConsistent: allLinksConfirmed,
    membershipCollection: membershipsResult.collection,
    accounts: report,
  }, null, 2));
  // Divergencias sao fatos relevantes e nao devem ser "corrigidas" automaticamente.
  if (!allAuthConfirmed || !allProfilesConfirmed || !allLinksConfirmed) process.exitCode = 2;
}

main().catch((error) => {
  // Nao imprimir respostas remotas nem informacoes pessoais.
  console.error('Auditoria 3.02 inconclusiva:', error instanceof Error ? error.message : 'erro desconhecido');
  process.exitCode = 2;
});
