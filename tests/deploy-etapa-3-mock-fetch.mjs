import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

const stateFile = process.env.MOCK_FIREBASE_STATE_FILE;
if (!stateFile) throw Error('MOCK_FIREBASE_STATE_FILE is required');
const baseline = readFileSync('tests/firestore-emulator/baseline.rules', 'utf8');
const proposed = readFileSync('tests/firestore-emulator/proposal.rules', 'utf8');
const rulesetPrefix = 'projects/teais-de-anansi/rulesets/';
const releaseName = 'projects/teais-de-anansi/releases/cloud.firestore';

const response = (value, status = 200) => new globalThis.Response(JSON.stringify(value), {
  status,
  headers: { 'content-type': 'application/json' },
});
globalThis.fetch = async (url, options = {}) => {
  const state = JSON.parse(readFileSync(stateFile, 'utf8'));
  const method = options.method || 'GET';
  if (String(url) === 'https://oauth2.googleapis.com/token') return response({ access_token: 'fake-test-token' });
  const prefix = 'https://firebaserules.googleapis.com/v1/';
  if (!String(url).startsWith(prefix)) throw Error('Mock blocked unexpected network address');
  const path = String(url).slice(prefix.length);
  state.calls.push({ method, path });
  if (method === 'GET' && path === releaseName) {
    writeFileSync(stateFile, JSON.stringify(state));
    return response({ name: releaseName, rulesetName: rulesetPrefix + state.current });
  }
  if (method === 'GET' && path.startsWith(rulesetPrefix)) {
    const id = path.slice(rulesetPrefix.length);
    const content = id === 'original' ? (state.changed ? 'rules_version = "1";' : baseline)
      : id === 'candidate' ? (state.corruptNew ? 'invalid rules' : proposed) : null;
    writeFileSync(stateFile, JSON.stringify(state));
    return content === null ? response({ error: 'missing' }, 404) :
      response({ name: path, source: { files: [{ name: 'firestore.rules', content }] } });
  }
  if (method === 'POST' && path === 'projects/teais-de-anansi/rulesets') {
    state.created = true;
    const body = JSON.parse(options.body);
    if (body.source.files[0].content !== proposed) throw Error('Wrong candidate');
    writeFileSync(stateFile, JSON.stringify(state));
    return response({ name: rulesetPrefix + 'candidate' });
  }
  if (method === 'PATCH' && path === releaseName) {
    if (!state.created || state.current !== 'original') throw Error('Unexpected PATCH');
    const body = JSON.parse(options.body);
    if (body.updateMask !== 'rulesetName' || body.release?.rulesetName !== rulesetPrefix + 'candidate') throw Error('Invalid PATCH payload');
    state.current = 'candidate';
    writeFileSync(stateFile, JSON.stringify(state));
    return response({ name: releaseName, rulesetName: rulesetPrefix + 'candidate' });
  }
  throw Error('Mock rejected method/path: ' + method + ' ' + path);
};
