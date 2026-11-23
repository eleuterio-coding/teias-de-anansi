import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import { URLSearchParams } from 'node:url';

const PROJECT = 'teais-de-anansi';
const PREFIX = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents';
const secret = process.env.FIREBASE_SERVICE_ACCOUNT_TEIAS_DE_ANANSI;
if (!secret) throw Error('Missing existing Actions secret for read-only inventory');
const account = JSON.parse(secret);
if (account.project_id !== PROJECT || !account.private_key || !account.client_email)
  throw Error('Wrong Firebase project/service account');
const encode = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const jwt = encode({ alg: 'RS256', typ: 'JWT' }) + '.' + encode({
  iss: account.client_email, scope: 'https://www.googleapis.com/auth/cloud-platform',
  aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 900,
});
const signature = crypto.sign('RSA-SHA256', Buffer.from(jwt), account.private_key).toString('base64url');
const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt + '.' + signature }),
  signal: AbortSignal.timeout(20000),
});
if (!tokenResponse.ok) throw Error('OAuth HTTP ' + tokenResponse.status);
const token = (await tokenResponse.json()).access_token;
if (!token) throw Error('Missing access token');

async function fetchDocuments(relative, fields) {
  const documents = [];
  let next = '';
  for (let page = 0; page < 30; page++) {
    const url = new URL(PREFIX + '/' + relative);
    url.searchParams.set('pageSize', '100');
    for (const name of fields) url.searchParams.append('mask.fieldPaths', name);
    if (next) url.searchParams.set('pageToken', next);
    const response = await fetch(url, {
      headers: { authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      if (response.status === 404 && page === 0) return [];
      throw Error('Firestore read failed: ' + relative.split('/').pop() + ' HTTP ' + response.status);
    }
    const body = await response.json();
    documents.push(...(body.documents || []));
    next = body.nextPageToken || '';
    if (!next) return documents;
  }
  throw Error('Unexpected pagination limit');
}
async function authAccountsReadOnly() {
  const expectedEmails = new Set([
    'rafael@teias.invalid', 'bruno@teias.invalid', 'gus@teias.invalid',
    'leo@teias.invalid', 'fernanda@teias.invalid',
  ]);
  const activeUids = new Set();
  const seenEmails = new Set();
  let allAccounts = 0;
  let enabledAccounts = 0;
  let unexpectedEnabled = 0;
  let expectedEnabled = 0;
  let next = '';
  for (let page = 0; page < 30; page++) {
    const url = new URL('https://identitytoolkit.googleapis.com/v1/projects/' + PROJECT + '/accounts:batchGet');
    url.searchParams.set('maxResults', '1000');
    if (next) url.searchParams.set('nextPageToken', next);
    const response = await fetch(url, {
      method: 'GET',
      headers: { authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw Error('Auth read-only inventory HTTP ' + response.status);
    const result = await response.json();
    for (const person of result.users || []) {
      allAccounts++;
      const enabled = person.disabled !== true;
      const email = String(person.email || '').trim().toLowerCase();
      if (email) seenEmails.add(email);
      if (!enabled) continue;
      enabledAccounts++;
      if (person.localId) activeUids.add(person.localId);
      if (expectedEmails.has(email)) expectedEnabled++;
      else unexpectedEnabled++;
    }
    next = result.nextPageToken || '';
    if (!next) return {
      activeUids, allAccounts, enabledAccounts, unexpectedEnabled, expectedEnabled,
      expectedMissing: [...expectedEmails].filter(email => !seenEmails.has(email)).length,
    };
  }
  throw Error('Auth read-only inventory pagination limit');
}
const auth = await authAccountsReadOnly();
const field = (d, name) => d.fields?.[name]?.stringValue || null;
const id = (d) => d.name?.split('/').pop() || '';
const users = await fetchDocuments('users', ['uid', 'role', 'username']);
const campaigns = await fetchDocuments('campaigns', ['ownerId']);
const media = await fetchDocuments('media', ['ownerId', 'campaignId', 'entityType', 'entityId', 'mime', 'size']);
const master = users.filter(d => field(d, 'role') === 'dm' && field(d, 'username') === 'rafael');
const expectedUsernames = new Set(['rafael', 'bruno', 'gustavo', 'leo', 'fernanda']);
const roles = { dm: 0, player: 0, other: 0 };
for (const user of users) {
  const role = field(user, 'role');
  if (role === 'dm' || role === 'player') roles[role]++;
  else roles.other++;
}
const knownUid = new Set(users.map(d => field(d, 'uid')).filter(Boolean));
const knownCampaign = new Map(campaigns.map(d => [id(d), field(d, 'ownerId')]));
const masterUid = master.length === 1 ? field(master[0], 'uid') : null;
const checks = {
  userCount: users.length,
  authAccountCount: auth.allAccounts,
  authEnabled: auth.enabledAccounts,
  authExpectedEnabled: auth.expectedEnabled,
  authUnexpectedEnabled: auth.unexpectedEnabled,
  authExpectedMissing: auth.expectedMissing,
  profileWithoutActiveAuth: users.filter(d => !auth.activeUids.has(field(d, 'uid'))).length,
  activeAuthWithoutProfile: [...auth.activeUids].filter(uid => !users.some(d => field(d, 'uid') === uid)).length,
  masterProfiles: master.length,
  campaigns: campaigns.length,
  media: media.length,
  chunks: 0,
  profilesNotInFiveExpectedNames: users.filter(d => !expectedUsernames.has(field(d, 'username'))).length,
  profilesMissingUid: users.filter(d => !field(d, 'uid')).length,
  profileDocumentUidMismatch: users.filter(d => field(d, 'uid') !== id(d)).length,
  duplicateProfileUids: users.length - new Set(users.map(d => field(d, 'uid'))).size,
  roleDmProfiles: roles.dm,
  rolePlayerProfiles: roles.player,
  roleOtherProfiles: roles.other,
  mediaWithNoChunks: 0,
  mediaWithMultipleChunks: 0,
  mediaWithUnknownCampaignReference: 0,
  mediaMissingCampaign: 0,
  mediaMissingOwner: 0,
  mediaUnknownOwner: 0,
  mediaInvalidCampaign: 0,
  mediaOwnerNotMaster: 0,
  mediaWithoutEntityType: 0,
  campaignsNotMasterOwned: campaigns.filter(d => field(d, 'ownerId') !== masterUid).length,
};
for (const item of media) {
  const ownerId = field(item, 'ownerId');
  const campaignId = field(item, 'campaignId');
  if (!ownerId) checks.mediaMissingOwner++;
  if (ownerId && !knownUid.has(ownerId)) checks.mediaUnknownOwner++;
  if (ownerId && ownerId !== masterUid) checks.mediaOwnerNotMaster++;
  if (!campaignId) checks.mediaMissingCampaign++;
  if (campaignId && !knownCampaign.has(campaignId)) {
    checks.mediaInvalidCampaign++;
    checks.mediaWithUnknownCampaignReference++;
  }
  if (!field(item, 'entityType')) checks.mediaWithoutEntityType++;
  // Select a deliberately nonexistent field to enumerate chunk document names,
  // without fetching the content, binary payload or any private text.
  const chunks = await fetchDocuments('media/' + encodeURIComponent(id(item)) + '/chunks', ['_audit_never_fetch_payload_']);
  checks.chunks += chunks.length;
  if (chunks.length === 0) checks.mediaWithNoChunks++;
  if (chunks.length > 1) checks.mediaWithMultipleChunks++;
}
console.log('MEDIA_LEGACY_READONLY_COUNTS', JSON.stringify(checks));
console.log('MEDIA_LEGACY_NOTE', 'Metadata-only; 6th profile and missing campaign references are not silently deleted or accepted.');
// The exceptions below are observations from the authenticated GET audit, not
// guessed data migrations. If ANY count changes, stop before a deployment.
// Passing this gate does not mean that historic UIs or all downloads work.
const structurallySafe = Boolean(masterUid)
  && checks.userCount === 6
  && checks.authAccountCount === 5
  && checks.authEnabled === 5
  && checks.authExpectedEnabled === 5
  && checks.authUnexpectedEnabled === 0
  && checks.authExpectedMissing === 0
  && checks.profileWithoutActiveAuth === 1
  && checks.activeAuthWithoutProfile === 0
  && checks.profilesNotInFiveExpectedNames === 1
  && checks.profilesMissingUid === 0
  && checks.profileDocumentUidMismatch === 0
  && checks.duplicateProfileUids === 0
  && checks.roleDmProfiles === 1
  && checks.rolePlayerProfiles === 5
  && checks.roleOtherProfiles === 0
  && checks.masterProfiles === 1
  && checks.campaigns === 3
  && checks.campaignsNotMasterOwned === 0
  && campaigns.length === knownCampaign.size
  && checks.media === 14
  && checks.chunks === 14
  && checks.mediaWithNoChunks === 0
  && checks.mediaWithMultipleChunks === 0
  && checks.mediaMissingCampaign === 1
  && checks.mediaInvalidCampaign === 1
  && checks.mediaWithUnknownCampaignReference === 1
  && checks.mediaMissingOwner === 0
  && checks.mediaUnknownOwner === 0
  && checks.mediaOwnerNotMaster === 0
  && checks.mediaWithoutEntityType === 0;
if (!structurallySafe) {
  console.error('MEDIA_LEGACY_GATE_BLOCKED: unexpected metadata; no writes attempted.');
  process.exitCode = 2;
} else {
  console.log('MEDIA_LEGACY_METADATA_CHECK_PASSED_WITH_DOCUMENTED_EXCEPTIONS: 1 inactive historical profile, 1 media without campaignId and 1 media linked to missing campaign. Functional legacy UI compatibility and real user sessions NOT certified.');
}
