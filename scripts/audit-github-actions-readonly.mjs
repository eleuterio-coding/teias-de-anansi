import process from 'node:process';

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN_READONLY;
if (repository !== 'eleuterio-coding/teias-de-anansi' || !token) {
  throw Error('This read-only check requires the expected repository and GitHub Actions token.');
}
const base = 'https://api.github.com/repos/' + repository;
async function read(label, path) {
  const response = await fetch(base + path, {
    method: 'GET',
    headers: {
      authorization: 'Bearer ' + token,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    console.log('GITHUB_READONLY', JSON.stringify({ name: label, status: 'unverified', http: response.status }));
    return null;
  }
  return response.json();
}
const repo = await read('repository', '');
const pages = await read('pages', '/pages');
const workflowPermissions = await read('actions-permissions', '/actions/permissions/workflow');
const environments = await read('environments', '/environments');
const report = {
  defaultBranch: repo?.default_branch || 'unverified',
  pagesUrl: pages?.html_url || 'unverified',
  pagesBuildType: pages?.build_type || 'unverified',
  pagesSourceBranch: pages?.source?.branch || 'unverified',
  pagesSourcePath: pages?.source?.path || 'unverified',
  pagesStatus: pages?.status || 'unverified',
  pagesHttpsEnforced: pages?.https_enforced ?? 'unverified',
  workflowDefaultPermissions: workflowPermissions?.default_workflow_permissions || 'unverified',
  canApprovePullRequestReviews: workflowPermissions?.can_approve_pull_request_reviews ?? 'unverified',
  knownEnvironments: environments?.environments?.map(e => e.name).filter(n => n === 'github-pages' || n === 'etapa-3-producao') || [],
  environmentsMetadataReadable: Boolean(environments),
};
console.log('GITHUB_ACTIONS_PAGES_READ_ONLY', JSON.stringify(report));
const repoOk = report.defaultBranch === 'main' && report.pagesUrl === 'https://eleuterio-coding.github.io/teias-de-anansi/';
if (!repoOk) {
  console.error('INFRASTRUCTURE_READ_ONLY_GATE_NOT_CONFIRMED: manual deployment remains blocked.');
  process.exitCode = 2;
} else {
  console.log('INFRASTRUCTURE_READ_ONLY_PASS: repository/Pages identity verified; deploy must still verify build_type=workflow and environment permissions.');
}
