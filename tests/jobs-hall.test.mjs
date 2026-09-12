import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L29-T1: live commands stay frozen', () => {
  const html = read('index.html');
  assert.match(html, /function startJob\(jobId,heroIds\)/);
  assert.match(html, /function claimJob\(/);
});

test('L29-T2: #hvJobsRoot is a body overlay with overflow auto', () => {
  const css = read('src/ui/jobs-hall.css');
  assert.match(css, /#hvJobsRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvJobsRoot\.is-open\{display:flex/);
  assert.match(css, /#hvJobsRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvJobsRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/jobs\/jobs-hall\.jpg/);
});

test('L29-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/jobs-hall-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /getElementById\(['"]jobsBody['"]\)/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L29-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/jobs-hall-v1.mjs');
  const stub = read('scripts/lanes/tkt-0039-jobs.mjs');
  assert.match(build, /lanes\/tkt-0039-jobs\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/jobs-hall-v1.mjs['"]\)/);
  assert.match(inject, /src\/ui\/jobs-hall-runtime\.js/);
  assert.match(inject, /src\/ui\/jobs-hall\.css/);
});

test('L29-T5: hall art is a dedicated 3D file, not a menu-v3233 reuse', () => {
  const hall = join(root, 'assets/ui/jobs/jobs-hall.jpg');
  assert.equal(existsSync(hall), true);
  const stat = readFileSync(hall);
  assert.ok(stat.length > 50000, 'hall jpg must be a real painted background');
  const css = read('src/ui/jobs-hall.css');
  assert.doesNotMatch(css, /menu-v3233/);
});
