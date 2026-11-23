import crypto from 'node:crypto';

const repository = 'eleuterio-coding/teias-de-anansi';
const site = 'https://eleuterio-coding.github.io/teias-de-anansi/';
const token = process.env.GITHUB_TOKEN || '';
const digest = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function get(url, authenticated = true) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/vnd.github+json',
        ...(authenticated && token ? { authorization: 'Bearer ' + token } : {}),
        ...(authenticated ? { 'X-GitHub-Api-Version': '2022-11-28' } : {}),
      },
      signal: AbortSignal.timeout(20000),
    });
    return { status: response.status, ok: response.ok,
      type: response.headers.get('content-type') || '',
      data: response.ok ? await response.text() : '' };
  } catch {
    return { ok: false, status: 'network-error', data: '' };
  }
}
const pages = await get('https://api.github.com/repos/' + repository + '/pages');
const deployments = await get('https://api.github.com/repos/' + repository + '/deployments?environment=github-pages&per_page=5');
const page = await get(site, false);
const pagesData = pages.ok ? JSON.parse(pages.data) : null;
const deploymentData = deployments.ok ? JSON.parse(deployments.data) : null;
const title = page.ok ? page.data.match(/<title[^>]*>([^<]{0,200})<\/title>/i)?.[1] : null;
const report = {
  repo: repository,
  pagesSettings: pages.ok
    ? {
      status: pagesData.status,
      buildType: pagesData.build_type || 'unknown',
      sourceBranch: pagesData.source?.branch || 'n/a',
      sourcePath: pagesData.source?.path || 'n/a',
      httpsEnforced: pagesData.https_enforced === true,
      url: pagesData.html_url || site,
    }
    : { status: 'unverified-http-' + pages.status },
  deployments: deployments.ok && Array.isArray(deploymentData)
    ? deploymentData.map((row) => ({
      environment: row.environment,
      ref: row.ref || 'unknown',
      shaPrefix: typeof row.sha === 'string' ? row.sha.slice(0, 12) : 'unknown',
      createdAt: row.created_at || 'unknown',
    }))
    : { status: 'unverified-http-' + deployments.status },
  site: {
    httpStatus: page.status,
    title: title || 'unknown',
    htmlSHA256: page.ok ? digest(page.data) : 'unknown',
    containsLoginText: page.ok ? /entrar|senha|login/i.test(page.data) : null,
  },
  productionMutations: 0,
};
console.log('PREPUBLICATION_GITHUB_PAGES_READ_ONLY', JSON.stringify(report, null, 2));
if (!pages.ok || !page.ok) process.exitCode = 2;
