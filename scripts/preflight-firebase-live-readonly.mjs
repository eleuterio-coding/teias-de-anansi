import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { URLSearchParams } from 'node:url';

/**
 * Preflight live read-only. NEVER logs credentials, UIDs, emails, user fields,
 * campaign IDs, rules source or tokens. OAuth and IAM testing are POST,
 * but do not change any resource; all production data reads are GET.
 * No Firestore writes, Rules publishing, Auth mutations or deploy calls.
 */
const projectId = 'teais-de-anansi';
const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_TEIAS_DE_ANANSI || '';
const base = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents';
const authNames = [
  { login: 'rafael', profile: 'rafael', role: 'dm', activeLinks: 2 },
  { login: 'bruno', profile: 'bruno', role: 'player', activeLinks: 1 },
  { login: 'gus', profile: 'gustavo', role: 'player', activeLinks: 1 },
  { login: 'leo', profile: 'leo', role: 'player', activeLinks: 1 },
  { login: 'fernanda', profile: 'fernanda', role: 'player', activeLinks: 1 },
];
const normalized = (value) => String(value || '').trim().toLowerCase();
const fld = (doc, name) => doc?.fields?.[name]?.stringValue ?? null;
const bval = (doc, name) => doc?.fields?.[name]?.booleanValue === true;
const hash = (text) => crypto.createHash('sha256').update(text).digest('hex');

async function oauth(raw) {
  if (!raw) throw Error('existing-secret-unavailable');
  const credentials = JSON.parse(raw);
  if (credentials.project_id !== projectId || !credentials.client_email || !credentials.private_key) {
    throw Error('service-account-project-mismatch');
  }
  const now = Math.floor(Date.now() / 1000);
  const enc = (s) => Buffer.from(JSON.stringify(s)).toString('base64url');
  const header = enc({ alg: 'RS256', typ: 'JWT' });
  const claims = enc({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 1200,
  });
  const payload = header + '.' + claims;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(payload), credentials.private_key).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: payload + '.' + signature,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw Error('oauth-http-' + response.status);
  const result = await response.json();
  if (!result.access_token) throw Error('oauth-token-missing');
  return result.access_token;
}

async function request(token, method, url, body) {
  const response = await fetch(url, {
    method,
    headers: {
      authorization: 'Bearer ' + token,
      accept: 'application/json',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) return { ok: false, status: response.status };
  return { ok: true, data: await response.json() };
}

async function listDocs(token, collectionName, fields) {
  const docs = [];
  let next = '';
  for (let page = 0; page < 30; page++) {
    const url = new URL(base + '/' + collectionName);
    url.searchParams.set('pageSize', '100');
    for (const field of fields) url.searchParams.append('mask.fieldPaths', field);
    if (next) url.searchParams.set('pageToken', next);
    const res = await request(token, 'GET', url);
    if (!res.ok) {
      if (res.status === 404 && page === 0) return [];
      throw Error('documents-' + collectionName + '-http-' + res.status);
    }
    docs.push(...(res.data.documents || []));
    if (docs.length > 2000) throw Error('documents-' + collectionName + '-size-limit');
    next = res.data.nextPageToken || '';
    if (!next) return docs;
  }
  throw Error('documents-' + collectionName + '-pagination-limit');
}

async function authAccounts(token) {
  const results = new Map();
  let next = '';
  for (let page = 0; page < 30; page++) {
    const url = new URL('https://identitytoolkit.googleapis.com/v1/projects/' + projectId + '/accounts:batchGet');
    url.searchParams.set('maxResults', '1000');
    if (next) url.searchParams.set('nextPageToken', next);
    const res = await request(token, 'GET', url);
    if (!res.ok) throw Error('auth-http-' + res.status);
    for (const account of res.data.users || []) {
      const email = normalized(account.email);
      const expected = authNames.find((x) => x.login + '@teias.invalid' === email);
      if (!expected) continue;
      const arr = results.get(email) || [];
      arr.push({ uid: account.localId, enabled: account.disabled !== true });
      results.set(email, arr);
    }
    next = res.data.nextPageToken || '';
    if (!next) return results;
  }
  throw Error('auth-pagination-limit');
}

async function run() {
  const token = await oauth(rawCredentials);
  const historical = readFileSync('tests/firestore-emulator/baseline.rules', 'utf8').trim();
  const proposal = readFileSync('tests/firestore-emulator/proposal.rules', 'utf8').trim();
  const releaseUrl = 'https://firebaserules.googleapis.com/v1/projects/' + projectId + '/releases/cloud.firestore';
  const release = await request(token, 'GET', releaseUrl);
  if (!release.ok) throw Error('rules-release-http-' + release.status);
  const name = release.data.rulesetName;
  if (typeof name !== 'string' || !name.startsWith('projects/' + projectId + '/rulesets/')) {
    throw Error('invalid-ruleset-reference');
  }
  const active = await request(token, 'GET', 'https://firebaserules.googleapis.com/v1/' + name);
  if (!active.ok) throw Error('ruleset-http-' + active.status);
  const files = active.data.source?.files || [];
  if (files.length !== 1 || typeof files[0].content !== 'string') {
    throw Error('ruleset-source-multiple-or-missing');
  }
  const rulesSource = files[0].content.trim();

  const identityConfig = await request(token, 'GET', 'https://identitytoolkit.googleapis.com/admin/v2/projects/' + projectId + '/config');
  const domains = identityConfig.ok && Array.isArray(identityConfig.data.authorizedDomains)
    ? identityConfig.data.authorizedDomains : null;

  const accounts = await authAccounts(token);
  const memberships = await listDocs(token, 'memberships', ['email', 'uid', 'role', 'active', 'campaignId', 'username']);
  const campaigns = await listDocs(token, 'campaigns', ['ownerId']);
  const media = await listDocs(token, 'media', ['ownerId', 'campaignId', 'entityType']);

  const master = (accounts.get('rafael@teias.invalid') || [])[0] || null;
  const checks = [];
  for (const person of authNames) {
    const email = person.login + '@teias.invalid';
    const identities = accounts.get(email) || [];
    const account = identities.length === 1 ? identities[0] : null;
    let profileOk = false;
    if (account?.uid) {
      const url = new URL(base + '/users/' + encodeURIComponent(account.uid));
      for (const field of ['uid', 'username', 'role']) url.searchParams.append('mask.fieldPaths', field);
      const result = await request(token, 'GET', url);
      profileOk = result.ok && fld(result.data, 'uid') === account.uid
        && normalized(fld(result.data, 'username')) === person.profile
        && fld(result.data, 'role') === person.role;
    }
    const activeLinks = memberships.filter((doc) => fld(doc, 'email') === email && bval(doc, 'active'));
    const linksOk = activeLinks.length === person.activeLinks && activeLinks.every((doc) => {
      const id = doc.name?.split('/').pop();
      return Boolean(account)
        && id === fld(doc, 'campaignId') + '_' + email
        && fld(doc, 'role') === person.role
        && (!fld(doc, 'uid') || fld(doc, 'uid') === account.uid)
        && normalized(fld(doc, 'username')) === person.profile;
    });
    checks.push({
      login: person.profile,
      auth: identities.length === 1 && account.enabled ? 'enabled' : 'not-confirmed',
      profile: profileOk ? 'coherent' : 'not-confirmed',
      activeLinks: activeLinks.length,
      linksCoherent: linksOk,
    });
  }

  const campaignOwners = {
    total: campaigns.length,
    masterOwned: campaigns.filter((doc) => master?.uid && fld(doc, 'ownerId') === master.uid).length,
    otherOwner: campaigns.filter((doc) => !master?.uid || fld(doc, 'ownerId') !== master.uid).length,
  };
  const mediaReport = {
    total: media.length,
    campaignIdMissingOrNull: media.filter((doc) => !fld(doc, 'campaignId')).length,
  };
  const knownCampaigns = new Set(campaigns.map((doc) => doc.name?.split('/').pop()));
  const mismatchedActiveMembershipCampaigns = memberships.filter((doc) =>
    bval(doc, 'active') && !knownCampaigns.has(fld(doc, 'campaignId'))).length;

  // IAM permissions test is POST but read-only; does NOT grant permissions,
  // create a ruleset, modify a release or publish anything.
  const intended = ['firebaserules.rulesets.create', 'firebaserules.releases.update'];
  const iam = await request(token, 'POST',
    'https://cloudresourcemanager.googleapis.com/v1/projects/' + projectId + ':testIamPermissions',
    { permissions: intended });
  const returned = iam.ok ? iam.data.permissions || [] : [];

  const report = {
    project: projectId,
    remoteRules: {
      release: 'cloud.firestore',
      releaseUpdatedAt: release.data.updateTime || 'unknown',
      activeRulesetSuffix: name.split('/').pop()?.slice(0, 16) || 'unavailable',
      sourceHashSHA256: hash(rulesSource),
      matchesHistoricalRules: rulesSource === historical,
      matchesProposedRules: rulesSource === proposal,
      historicalHashSHA256: hash(historical),
      proposedHashSHA256: hash(proposal),
      historicalRulesetBackupPossible: Boolean(name && rulesSource),
      // Current rules content stays ONLY in memory and is not logged or uploaded.
    },
    accounts: checks,
    totalActiveMemberships: memberships.filter((doc) => bval(doc, 'active')).length,
    mismatchedActiveMembershipCampaigns,
    campaignOwners,
    media: mediaReport,
    authorizedGitHubDomain: domains === null ? 'unverified'
      : domains.includes('eleuterio-coding.github.io') ? 'configured' : 'missing',
    firebaseRulesPublishPermissions: iam.ok
      ? {
          rulesetsCreate: returned.includes(intended[0]) ? 'granted' : 'not-granted',
          releasesUpdate: returned.includes(intended[1]) ? 'granted' : 'not-granted',
        }
      : { status: 'unable-to-check-http-' + iam.status },
    productionMutations: 0,
  };
  console.log('PREPUBLICATION_FIREBASE_READ_ONLY', JSON.stringify(report, null, 2));

  const healthy = report.remoteRules.matchesHistoricalRules
    && checks.every((x) => x.auth === 'enabled' && x.profile === 'coherent' && x.linksCoherent)
    && report.totalActiveMemberships === 6
    && campaignOwners.otherOwner === 0
    && mismatchedActiveMembershipCampaigns === 0;
  if (!healthy) {
    console.log('GATE: BLOCKED — divergences require review; no write was attempted.');
    process.exitCode = 2;
  } else {
    console.log('GATE: READ_ONLY_CHECKS_PASSED — this is NOT a deploy approval.');
  }
}

run().catch((error) => {
  console.log('PREPUBLICATION_READ_ONLY_ERROR', error instanceof Error ? error.message : 'unknown');
  process.exitCode = 2;
});
