import crypto from 'node:crypto';

// 3.01: apenas consultas GET a APIs administrativas do projeto historico.
// POST e usado unicamente para trocar a credencial existente por token OAuth.
// Nenhuma colecao, conta, senha, ruleset ou outro recurso sera modificado.
const projectId = 'teais-de-anansi';
const credentialsRaw = process.env.FIREBASE_SERVICE_ACCOUNT_TEIAS_DE_ANANSI || '';
const report = {
  project: 'unverified',
  webApp: 'unverified',
  firestore: 'unverified',
  authentication: 'unverified',
  rules: 'unverified',
  rulesComparedWithHistorical: 'unverified',
};

const b64 = (input) => Buffer.from(input).toString('base64url');

async function tokenFromServiceAccount(raw) {
  const credentials = JSON.parse(raw);
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Formato da credencial administrativa invalido.');
  }
  const now = Math.floor(Date.now() / 1000);
  const header = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 1800,
  }));
  const payload = `${header}.${claims}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(payload), credentials.private_key).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${payload}.${signature}`,
    }),
  });
  if (!response.ok) throw new Error(`Falha OAuth (HTTP ${response.status}).`);
  const result = await response.json();
  if (!result.access_token) throw new Error('OAuth sem token.');
  return result.access_token;
}

async function readGet(token, url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return { ok: false, status: `http-${response.status}` };
    return { ok: true, data: await response.json() };
  } catch {
    return { ok: false, status: 'network-error' };
  }
}

const state = (response) => response.ok ? 'verified' : `not-verified-${response.status}`;

if (!credentialsRaw) {
  console.log('Auditoria remota nao iniciada: segredo de acesso administrativo ausente nos Actions Secrets.');
  process.exitCode = 2;
} else {
  try {
    const token = await tokenFromServiceAccount(credentialsRaw);
    const prefix = `projects/${projectId}`;

    const project = await readGet(token, `https://firebase.googleapis.com/v1beta1/${prefix}`);
    report.project = !project.ok ? state(project) : project.data.projectId === projectId ? 'verified' : 'different-project';

    const apps = await readGet(token, `https://firebase.googleapis.com/v1beta1/${prefix}/webApps`);
    report.webApp = !apps.ok ? state(apps)
      : Array.isArray(apps.data.apps) && apps.data.apps.some((app) => app.appId === '1:900723445313:web:274b847b3f3145a76c40c0')
        ? 'verified' : 'historical-web-app-not-found';

    const db = await readGet(token, `https://firestore.googleapis.com/v1/${prefix}/databases/(default)`);
    report.firestore = !db.ok ? state(db) : db.data.name === `${prefix}/databases/(default)`
      ? 'verified' : 'different-database';

    const auth = await readGet(token, `https://identitytoolkit.googleapis.com/admin/v2/${prefix}/config`);
    report.authentication = !auth.ok ? state(auth) : auth.data.signIn?.email?.enabled === true
      ? 'email-password-enabled' : 'config-readable-email-provider-unconfirmed';

    const release = await readGet(token, `https://firebaserules.googleapis.com/v1/${prefix}/releases/cloud.firestore`);
    if (!release.ok) {
      report.rules = state(release);
    } else if (typeof release.data.rulesetName !== 'string' || !release.data.rulesetName.startsWith(`${prefix}/rulesets/`)) {
      report.rules = 'release-missing-ruleset';
    } else {
      report.rules = 'release-verified';
      const ruleset = await readGet(token, `https://firebaserules.googleapis.com/v1/${release.data.rulesetName}`);
      if (ruleset.ok) {
        report.rules = 'release-and-ruleset-verified';
        const content = (ruleset.data.source?.files ?? []).map((file) => file.content || '').join('\n');
        const historicalUrl = 'https://raw.githubusercontent.com/eleuterio-coding/teias-de-anansi/1bbad6d8687e49c4856b945d277a4bd0d25b7dc2/firebase/firestore.rules';
        const historical = await fetch(historicalUrl, { signal: AbortSignal.timeout(20000) }).catch(() => null);
        if (historical?.ok && content) {
          const old = await historical.text();
          report.rulesComparedWithHistorical = content.trim() === old.trim() ? 'identical' : 'different';
        } else {
          report.rulesComparedWithHistorical = 'comparison-unavailable';
        }
        for (const name of ['users', 'memberships', 'campaigns', 'media']) {
          report[`rule_${name}`] = content.includes(`match /${name}/{`) ? 'present' : 'absent';
        }
      } else {
        report.rules = `release-verified-ruleset-${ruleset.status}`;
      }
    }

    // NUNCA imprimir token, e-mail, UID, documento, regras ou dados da campanha.
    console.log('Auditoria Firebase somente leitura:', JSON.stringify(report, null, 2));
    if (Object.values(report).some((value) => String(value).startsWith('not-verified') || value === 'unverified')) {
      process.exitCode = 2;
    }
  } catch (error) {
    console.log('Auditoria remota bloqueada:', error instanceof Error ? error.message : 'erro desconhecido');
    process.exitCode = 2;
  }
}
