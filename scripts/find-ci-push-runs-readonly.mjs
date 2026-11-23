import process from 'node:process';

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN_READONLY;
if (repository !== 'eleuterio-coding/teias-de-anansi' || !token) throw Error('Repository or Actions token missing');

const endpoint = new URL('https://api.github.com/repos/' + repository + '/actions/runs');
endpoint.searchParams.set('event', 'push');
endpoint.searchParams.set('branch', 'feature/etapa-3-usuarios-acesso-20261120');
endpoint.searchParams.set('per_page', '18');
const response = await fetch(endpoint, {
  method: 'GET',
  headers: {
    authorization: 'Bearer ' + token,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  },
  signal: AbortSignal.timeout(15000),
});
if (!response.ok) {
  console.log('PUSH_RUN_LOOKUP_UNAVAILABLE_HTTP', response.status);
  process.exit(0);
}
const body = await response.json();
for (const run of body.workflow_runs || []) {
  if (!['Verificar Etapa 3 — integracao Firebase (offline)', 'Etapa 3.09 - acionar apenas preflight OIDC uma vez (sem deploy)'].includes(run.name)) continue;
  console.log('PUSH_RUN_EVIDENCE', JSON.stringify({
    id: run.id,
    workflow: run.name,
    headSha: run.head_sha,
    status: run.status,
    conclusion: run.conclusion,
    url: run.html_url,
  }));
}

const preflight = await fetch('https://api.github.com/repos/' + repository + '/actions/workflows/verificar-pages-preflight-manual.yml/runs?event=workflow_dispatch&branch=main&per_page=5', {
  method: 'GET',
  headers: {
    authorization: 'Bearer ' + token,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  },
  signal: AbortSignal.timeout(15000),
});
if (!preflight.ok) {
  console.log('PREFLIGHT_RUN_LOOKUP_UNAVAILABLE_HTTP', preflight.status);
} else {
  const data = await preflight.json();
  for (const run of data.workflow_runs || []) {
    console.log('PREFLIGHT_RUN_EVIDENCE', JSON.stringify({
      id: run.id, headSha: run.head_sha, status: run.status,
      conclusion: run.conclusion, url: run.html_url,
    }));
  }
}
