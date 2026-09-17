import fs from 'node:fs';
import crypto from 'node:crypto';

const projectId = process.env.FIREBASE_PROJECT_ID || 'teais-de-anansi';
const credentialsRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!credentialsRaw) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT não configurado.');
}

const credentials = JSON.parse(credentialsRaw);
if (!credentials.client_email || !credentials.private_key) {
  throw new Error('Credencial de Service Account inválida.');
}

function base64url(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return input.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), credentials.private_key);
  const assertion = `${unsigned}.${base64url(signature)}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const body = await response.json();
  if (!response.ok || !body.access_token) {
    throw new Error(`Falha ao obter token OAuth: ${response.status} ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

async function api(token, method, url, body) {
  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload = null;
  const text = await response.text();
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
  }
  return { response, payload };
}

const token = await getAccessToken();
const rules = fs.readFileSync('firebase/firestore.rules', 'utf8');
const base = 'https://firebaserules.googleapis.com/v1';

const createRuleset = await api(token, 'POST', `${base}/projects/${projectId}/rulesets`, {
  source: {
    files: [{ name: 'firestore.rules', content: rules }],
  },
});

if (!createRuleset.response.ok || !createRuleset.payload?.name) {
  throw new Error(`Falha ao criar ruleset: ${createRuleset.response.status} ${JSON.stringify(createRuleset.payload)}`);
}

const rulesetName = createRuleset.payload.name;
const releaseName = `projects/${projectId}/releases/cloud.firestore`;

let release = await api(token, 'PATCH', `${base}/${releaseName}`, {
  release: {
    name: releaseName,
    rulesetName,
  },
  updateMask: 'rulesetName',
});

if (release.response.status === 404) {
  release = await api(token, 'POST', `${base}/projects/${projectId}/releases`, {
    name: releaseName,
    rulesetName,
  });
}

if (!release.response.ok || release.payload?.rulesetName !== rulesetName) {
  throw new Error(`Falha ao publicar release: ${release.response.status} ${JSON.stringify(release.payload)}`);
}

console.log(`Firestore Security Rules publicadas: ${rulesetName}`);
