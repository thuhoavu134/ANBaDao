// The frame cleaner is the gate between a raw AI screen capture and a packed atlas: it must crop the capture
// background, kill the chroma, and delete strays (text, Gemini sparkles, the mouse cursor).
// Its own selftest builds a synthetic frame with every one of those artifacts and asserts each is handled, so this
// test is the contract — not a screenshot someone eyeballed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts', 'hero', 'frame-clean.py');
const candidates = [
  process.env.PYTHON,
  'C:/lt/.venvs/pack/Scripts/python.exe',
  'python',
  'python3',
].filter(Boolean);

function runSelftest() {
  for (const py of candidates) {
    if (py.includes('/') && !existsSync(py)) continue;
    const r = spawnSync(py, [script, '--selftest'], { encoding: 'utf8' });
    if (r.error) continue;
    return r;
  }
  return null;
}

test('frame-clean selftest: cropped, keyed, strays removed', () => {
  const r = runSelftest();
  if (!r) {
    // No python with PIL on this machine: the gate cannot run, but the script must still exist and be valid.
    assert.ok(existsSync(script), 'scripts/hero/frame-clean.py must exist');
    return;
  }
  assert.equal(r.status, 0, `selftest failed:\n${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /OK {3}letterbox cropped/);
  assert.match(r.stdout, /OK {3}text \+ sparkle \+ cursor removed/);
  assert.match(r.stdout, /OK {3}cursor flagged/);
  assert.match(r.stdout, /OK {3}character survived/);
});
