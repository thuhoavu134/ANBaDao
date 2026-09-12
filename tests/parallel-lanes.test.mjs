import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

const LANES = [
  ['TKT-0037', 'bag'],
  ['TKT-0038', 'mail'],
  ['TKT-0039', 'jobs'],
  ['TKT-0040', 'guild'],
  ['TKT-0041', 'friends'],
  ['TKT-0042', 'chat'],
  ['TKT-0043', 'clan'],
  ['TKT-0044', 'vault']
];

test('lane stubs exist and are imported once from build-static', () => {
  const build = read('scripts/build-static.mjs');
  for (const [id, slug] of LANES) {
    const rel = `./lanes/tkt-${id.slice(4)}-${slug}.mjs`;
    const hits = build.split(rel).length - 1;
    assert.equal(hits, 1, id + ' import count');
    const stub = read('scripts/lanes/tkt-' + id.slice(4) + '-' + slug + '.mjs');
    assert.match(stub, new RegExp("LANE = '" + id + "'"));
  }
  assert.match(build, /daily-runtime-v1\.mjs[\s\S]*lanes\/tkt-0037-bag\.mjs/);
});

test('wave A tickets are exclusive and freeze hub wiring', () => {
  const locks = new Set();
  const paths = new Map();
  for (const [id] of LANES) {
    const md = read('tickets/' + id + '/ticket.md');
    assert.match(md, /status: READY/);
    assert.match(md, /Không sửa `index\.html`/);
    assert.match(md, /document\.body\.append/);
    const lock = md.match(/resource_locks: \["([^"]+)"\]/)[1];
    assert.equal(locks.has(lock), false, 'duplicate lock ' + lock);
    locks.add(lock);
    const listed = md.match(/affected_paths: \[([^\]]+)\]/)[1];
    for (const p of listed.match(/[\w./-]+\.(?:js|css|mjs|jpg)|docs\/qa\/[\w./-]+/g) || []) {
      if (paths.has(p) && paths.get(p) !== id) assert.fail(p + ' shared by ' + paths.get(p) + ' and ' + id);
      paths.set(p, id);
    }
  }
  const kit = read('tickets/TKT-0045/ticket.md');
  assert.match(kit, /hero-kits-v2/);
  assert.doesNotMatch(kit, /lanes\/tkt-/);
});

test('forbidden work is not ticketed as READY hall', () => {
  const ids = readdirSync(join(root, 'tickets')).filter(n => n.startsWith('TKT-'));
  for (const id of ids) {
    if (id < 'TKT-0037') continue;
    const md = read('tickets/' + id + '/ticket.md');
    assert.doesNotMatch(md, /splus-lab|Combat V2 vào roster|go:null combat/);
  }
});
