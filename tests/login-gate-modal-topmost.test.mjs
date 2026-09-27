import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('login gate is a modal: open gate stacks above roster and battle overlay', () => {
  const build = read('scripts/build-static.mjs');
  assert.match(build, /login-gate-modal-topmost-v1/);
  const patch = read('scripts/login-gate-modal-topmost-v1.mjs');
  assert.match(patch, /#hvLoginRoot\.is-open\{z-index:1100000!important\}/);
  if (!existsSync(join(root, 'dist/index.html'))) return;
  const dist = read('dist/index.html');
  assert.match(dist, /hv-login-modal-topmost-v1/);
  assert.match(dist, /#hvLoginRoot\.is-open\{z-index:1100000!important\}/);
});

test('enterGame preserves the battle-return destination screen', () => {
  if (!existsSync(join(root, 'dist/index.html'))) return;
  const dist = read('dist/index.html');
  // The unguarded hub reroute must be gone from enterGame...
  assert.doesNotMatch(dist, /playLoginMusic\(\);\n    if \(typeof navTo === 'function'\) navTo\('hub'\);/);
  // ...replaced by the guarded version that keeps a routed destination.
  assert.match(dist, /hv-login-modal-topmost-v1: a battle return/);
  assert.match(dist, /if \(typeof navTo === 'function' && typeof ST === 'object' && \(!ST\.screen \|\| ST\.screen === 'hub'\)\) navTo\('hub'\);/);
});

test('the gate still guards navigation while the player has not entered', () => {
  // The freeze fix must not remove the gate's nav guard; it only makes the
  // gate visible (topmost) and preserves the routed destination after entry.
  const gate = read('src/ui/login-gate-runtime.js');
  assert.match(gate, /navToWithLoginGate/);
  assert.match(gate, /if \(!entered\) \{\s*\n\s*showLogin\(\);\s*\n\s*return;/);
});
