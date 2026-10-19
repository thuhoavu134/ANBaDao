// Push local commit SRC (diff vs BASE) as GitHub-verified commits onto BRANCH whose head is BASE.
import { execFileSync } from 'node:child_process';
const [BASE, SRC, BRANCH] = process.argv.slice(2);
// Usage: node scripts/tools/verified-push.mjs <remote branch head> <local commit> <branch>
// Vercel only deploys GitHub-verified commits; this re-creates the diff via GraphQL createCommitOnBranch.
const repo = process.cwd();
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const gh = (args, input) => execFileSync('gh', args, { input, encoding: 'utf8', maxBuffer: 1 << 28 });
const items = git('diff', '--name-status', '--no-renames', BASE, SRC).trim().split('\n').map(l => { const p = l.split('\t'); return { status: p[0], path: p[p.length - 1] }; });
items.sort((a, b) => (/\.(webp|wav)$/.test(a.path) ? 0 : 1) - (/\.(webp|wav)$/.test(b.path) ? 0 : 1));
const message = git('log', '-1', '--format=%B', SRC).trim();
let head = BASE, n = 0, batch = { additions: [], deletions: [], bytes: 0 };
function flush(last) {
  if (!batch.additions.length && !batch.deletions.length) return;
  n++;
  const first = message.split('\n')[0];
  const input = { branch: { repositoryNameWithOwner: (process.env.GH_REPO || 'bktimmy247/luc-than'), branchName: BRANCH }, expectedHeadOid: head,
    message: { headline: last && n === 1 ? first : `${first} (part ${n})`, body: last ? message.split('\n').slice(1).join('\n').trim() : 'Asset batch.' },
    fileChanges: { additions: batch.additions, deletions: batch.deletions } };
  const out = JSON.parse(gh(['api', 'graphql', '--input', '-'], JSON.stringify({ query: 'mutation($input: CreateCommitOnBranchInput!){ createCommitOnBranch(input:$input){ commit { oid } } }', variables: { input } })));
  if (out.errors) throw new Error(JSON.stringify(out.errors).slice(0, 500));
  head = out.data.createCommitOnBranch.commit.oid; console.log('commit', n, head);
  batch = { additions: [], deletions: [], bytes: 0 };
}
for (const it of items) {
  if (it.status.startsWith('D')) { batch.deletions.push({ path: it.path }); continue; }
  const buf = execFileSync('git', ['-C', repo, 'cat-file', 'blob', `${SRC}:${it.path}`], { maxBuffer: 1 << 28 });
  if (batch.bytes + buf.length > 6 * 1024 * 1024 && batch.additions.length) flush(false);
  batch.additions.push({ path: it.path, contents: buf.toString('base64') }); batch.bytes += buf.length;
}
flush(true);
console.log('HEAD', head, 'files', items.length);
