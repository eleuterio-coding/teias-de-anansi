import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import { URLSearchParams } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const PROJECT = 'teais-de-anansi';
const RELEASE = 'projects/' + PROJECT + '/releases/cloud.firestore';
const EXPECTED_OLD = 'aad19cc694bab02c0d97fb93d8709c21c14c5a8ae73f32b7d19f2313df13af08';
const EXPECTED_NEW = '9321a03bfed8152b15a7bbb79df7ad7d6be2a264db66b41676b14990b2719a81';
const root = 'https://firebaserules.googleapis.com/v1/';
const [mode] = process.argv.slice(2);
const secret = process.env.FIREBASE_SERVICE_ACCOUNT_TEIAS_DE_ANANSI;
if (!['prepare', 'publish', 'verify'].includes(mode)) throw Error('Invalid mode');
if (!secret) throw Error('Missing Firebase service account GitHub Actions secret');
const credential = JSON.parse(secret);
if (credential.project_id !== PROJECT || !credential.private_key || !credential.client_email) throw Error('Wrong Firebase service account');

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const expected = (s, digest, label) => {
  if (sha(s.trim()) !== digest) throw Error(label + ': SHA256 mismatch; STOP');
};
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

async function token() {
  const timestamp = Math.floor(Date.now() / 1000);
  const jwt = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({
    iss: credential.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: timestamp, exp: timestamp + 900,
  });
  const signature = crypto.sign('RSA-SHA256', Buffer.from(jwt), credential.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt + '.' + signature }),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw Error('Token exchange HTTP ' + r.status);
  return (await r.json()).access_token;
}
const accessToken = await token();
async function api(method, path, body) {
  const r = await fetch(root + path, {
    method,
    headers: { authorization: 'Bearer ' + accessToken, ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw Error(method + ' ' + path.split('?')[0] + ': HTTP ' + r.status);
  return r.json();
}
async function active() {
  const release = await api('GET', RELEASE);
  if (!release.rulesetName?.startsWith('projects/' + PROJECT + '/rulesets/')) throw Error('Unexpected active ruleset');
  const ruleset = await api('GET', release.rulesetName);
  const files = ruleset.source?.files;
  if (files?.length !== 1 || typeof files[0].content !== 'string') throw Error('Unexpected Rules file structure');
  return { release, content: files[0].content };
}
const candidate = readFileSync('tests/firestore-emulator/proposal.rules', 'utf8');
expected(candidate, EXPECTED_NEW, 'Candidate rules');

function encryptedBackup(payload) {
  // AES-256-GCM encrypted backup; the secret is never copied to the artifact.
  // The currently configured service account private key is needed to recover this artifact.
  const key = crypto.createHash('sha256').update('teias-de-anansi-rules-backup-v1\n' + credential.private_key).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const out = { version: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), content: encrypted.toString('base64') };
  mkdirSync('.deploy-private', { recursive: true });
  writeFileSync('.deploy-private/rules-backup.aes256gcm.json', JSON.stringify(out), { mode: 0o600 });
}
if (mode === 'prepare') {
  const old = await active();
  expected(old.content, EXPECTED_OLD, 'Published rules');
  const historical = readFileSync('tests/firestore-emulator/baseline.rules', 'utf8');
  if (historical.trim() !== old.content.trim()) throw Error('Baseline changed; STOP');
  encryptedBackup({ originalRulesetName: old.release.rulesetName, originalRelease: old.release, source: old.content, sha256: sha(old.content.trim()), preparedAt: new Date().toISOString() });
  writeFileSync('.deploy-private/prepared.json', JSON.stringify({ oldRulesetName: old.release.rulesetName, oldSha256: sha(old.content.trim()), newSha256: sha(candidate.trim()) }), { mode: 0o600 });
  console.log('PREPARED: exact source verified and encrypted backup created. No production changes.');
} else if (mode === 'publish') {
  const backup = JSON.parse(readFileSync('.deploy-private/prepared.json', 'utf8'));
  if (backup.oldSha256 !== EXPECTED_OLD || backup.newSha256 !== EXPECTED_NEW) throw Error('Prepared digest mismatch');
  const old = await active();
  if (old.release.rulesetName !== backup.oldRulesetName) throw Error('Concurrent Rules release change; STOP');
  expected(old.content, EXPECTED_OLD, 'Published rules before cutover');
  const ruleset = await api('POST', 'projects/' + PROJECT + '/rulesets', {
    source: { files: [{ name: 'firestore.rules', content: candidate }] },
  });
  if (!ruleset.name?.startsWith('projects/' + PROJECT + '/rulesets/')) throw Error('Failed to create versioned ruleset');
  // Immutable candidate is created first. Only this PATCH changes active permissions.
  const release = await api('PATCH', RELEASE, { release: { name: RELEASE, rulesetName: ruleset.name }, updateMask: 'rulesetName' });
  if (release.rulesetName !== ruleset.name) throw Error('Release response did not confirm new ruleset');
  const updated = await active();
  if (updated.release.rulesetName !== ruleset.name) throw Error('Updated ruleset mismatch');
  expected(updated.content, EXPECTED_NEW, 'Published rules after cutover');
  console.log('RULES_PUBLISHED_AND_VERIFIED. Previous ruleset retained in Firebase; encrypted backup in workflow artifact.');
} else {
  const current = await active();
  expected(current.content, EXPECTED_NEW, 'Final published rules');
  console.log('VERIFIED: corrected Firestore Rules still active.');
}
