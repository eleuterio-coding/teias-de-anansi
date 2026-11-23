import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repository = path.resolve(here, '..');
const script = path.join(repository, 'scripts/deploy-etapa-3-rules.mjs');
const mock = path.join(here, 'deploy-etapa-3-mock-fetch.mjs');
const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const credential = JSON.stringify({
  project_id: 'teais-de-anansi',
  client_email: 'simulation@teais-de-anansi.iam.gserviceaccount.com',
  private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
});
function fixture() {
  const cwd = mkdtempSync(path.join(os.tmpdir(), 'hub-deploy-309-'));
  mkdirSync(path.join(cwd, 'tests/firestore-emulator'), { recursive: true });
  for (const file of ['baseline.rules', 'proposal.rules']) {
    copyFileSync(path.join(repository, 'tests/firestore-emulator', file), path.join(cwd, 'tests/firestore-emulator', file));
  }
  const stateFile = path.join(cwd, 'state.json');
  writeFileSync(stateFile, JSON.stringify({ current: 'original', changed: false, calls: [] }));
  return { cwd, stateFile };
}
function run(mode, f) {
  return spawnSync(process.execPath, ['--import', mock, script, mode], {
    cwd: f.cwd,
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, FIREBASE_SERVICE_ACCOUNT_TEIAS_DE_ANANSI: credential, MOCK_FIREBASE_STATE_FILE: f.stateFile },
  });
}
const state = (f) => JSON.parse(readFileSync(f.stateFile, 'utf8'));

test('prepare cria backup criptografado sem PATCH e publish troca apenas a release esperada', () => {
  const f = fixture();
  try {
    const prepare = run('prepare', f);
    assert.equal(prepare.status, 0, prepare.stderr);
    assert.equal(state(f).current, 'original');
    assert.ok(!state(f).calls.some(c => ['PATCH', 'POST'].includes(c.method)));
    const backupPath = path.join(f.cwd, '.deploy-private/rules-backup.aes256gcm.json');
    assert.ok(existsSync(backupPath));
    const encrypted = JSON.parse(readFileSync(backupPath, 'utf8'));
    assert.equal(encrypted.version, 1);
    assert.ok(!JSON.stringify(encrypted).includes('rules_version'));
    const key = crypto.createHash('sha256').update('teias-de-anansi-rules-backup-v1\n' + JSON.parse(credential).private_key).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(encrypted.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(encrypted.tag, 'base64'));
    const decrypted = JSON.parse(Buffer.concat([decipher.update(Buffer.from(encrypted.content, 'base64')), decipher.final()]).toString('utf8'));
    assert.equal(decrypted.source.trim(), readFileSync(path.join(f.cwd, 'tests/firestore-emulator/baseline.rules'), 'utf8').trim());
    assert.equal(decrypted.originalRulesetName, 'projects/teais-de-anansi/rulesets/original');
    const publish = run('publish', f);
    assert.equal(publish.status, 0, publish.stderr);
    assert.equal(state(f).current, 'candidate');
    assert.equal(state(f).calls.filter(c => c.method === 'PATCH').length, 1);
    const verify = run('verify', f);
    assert.equal(verify.status, 0, verify.stderr);
  } finally { rmSync(f.cwd, { recursive: true, force: true }); }
});

test('baseline divergente impede backup e escrita', () => {
  const f = fixture();
  try {
    const s = state(f); s.changed = true; writeFileSync(f.stateFile, JSON.stringify(s));
    const result = run('prepare', f);
    assert.notEqual(result.status, 0);
    assert.ok(!existsSync(path.join(f.cwd, '.deploy-private/rules-backup.aes256gcm.json')));
    assert.ok(!state(f).calls.some(c => ['PATCH', 'POST'].includes(c.method)));
  } finally { rmSync(f.cwd, { recursive: true, force: true }); }
});

test('mudanca concorrente de release bloqueia PATCH', () => {
  const f = fixture();
  try {
    assert.equal(run('prepare', f).status, 0);
    const s = state(f); s.current = 'candidate'; writeFileSync(f.stateFile, JSON.stringify(s));
    const result = run('publish', f);
    assert.notEqual(result.status, 0);
    assert.ok(!state(f).calls.some(c => ['PATCH', 'POST'].includes(c.method)));
  } finally { rmSync(f.cwd, { recursive: true, force: true }); }
});

test('candidata alterada impede qualquer chamada remota', () => {
  const f = fixture();
  try {
    writeFileSync(path.join(f.cwd, 'tests/firestore-emulator/proposal.rules'), 'rules_version = "1";');
    const result = run('prepare', f);
    assert.notEqual(result.status, 0);
    assert.equal(state(f).calls.length, 0);
  } finally { rmSync(f.cwd, { recursive: true, force: true }); }
});
