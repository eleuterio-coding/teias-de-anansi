import crypto from 'node:crypto';

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
  iss: account.client_email, scope: 'https://www.googleapis.com/auth/datastore',
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
const field = (d, name) => d.fields?.[name]?.stringValue || null;
const id = (d) => d.name?.split('/').pop() || '';
const users = await fetchDocuments('users', ['uid', 'role', 'username']);
const campaigns = await fetchDocuments('campaigns', ['ownerId']);
const media = await fetchDocuments('media', ['ownerId', 'campaignId', 'entityType', 'entityId', 'mime', 'size']);
const master = users.filter(d => field(d, 'role') === 'dm' && field(d, 'username') === 'rafael');
const knownUid = new Set(users.map(d => field(d, 'uid')).filter(Boolean));
const knownCampaign = new Map(campaigns.map(d => [id(d), field(d, 'ownerId')]));
const masterUid = master.length === 1 ? field(master[0], 'uid') : null;
const checks = {
  userCount: users.length,
  masterProfiles: master.length,
  campaigns: campaigns.length,
  media: media.length,
  chunks: 0,
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
  if (campaignId && !knownCampaign.has(campaignId)) checks.mediaInvalidCampaign++;
  if (!field(item, 'entityType')) checks.mediaWithoutEntityType++;
  // Select a deliberately nonexistent field to enumerate chunk document names,
  // without fetching the content, binary payload or any private text.
  const chunks = await fetchDocuments('media/' + encodeURIComponent(id(item)) + '/chunks', ['_audit_never_fetch_payload_']);
  checks.chunks += chunks.length;
}
console.log('MEDIA_LEGACY_READONLY_COUNTS', JSON.stringify(checks));
const structurallySafe = Boolean(masterUid)
  && users.length === 5
  && campaigns.length === 3
  && campaigns.length === knownCampaign.size
  && media.length === 14
  && checks.mediaMissingCampaign === 1
  && checks.mediaMissingOwner === 0
  && checks.mediaUnknownOwner === 0
  && checks.mediaInvalidCampaign === 0
  && checks.mediaWithoutEntityType === 0
  && checks.campaignsNotMasterOwned === 0;
if (!structurallySafe) {
  console.error('MEDIA_LEGACY_GATE_BLOCKED: unexpected metadata; no writes attempted.');
  process.exitCode = 2;
} else {
  console.log('MEDIA_LEGACY_METADATA_CHECK_PASSED: GET-only inventory; functional compatibility and chunks behavior still require testing.');
}
