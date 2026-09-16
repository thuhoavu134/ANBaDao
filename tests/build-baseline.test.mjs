import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('BASELINE-0 Luc Anh runtime patch is idempotent after source already contains a replacement', () => {
  const script = read('scripts/luc-anh-runtime-patch.mjs');
  assert.match(script, /if \(!s\.includes\(from\)\)/);
  assert.match(script, /if \(s\.includes\(to\)\) continue/);
  assert.match(script, /replace\(\/\\r\\n\/g, '\\n'\)/);
});

test('BASELINE-1 Linh Dong timing patch tolerates already-integrated v6 fall state and CRLF', () => {
  const script = read('scripts/linh-dong-timing-main-v1.mjs');
  assert.match(script, /source = source\.replace\(\/\\r\\n\/g, '\\n'\)/);
  assert.match(script, /source\.includes\(to\)/);
  assert.match(script, /label === 'fall state' && source\.includes\('isBachDien\(unit\)'\)/);
});

test('BASELINE-2 SPLUS build patch accepts CRLF source input', () => {
  const script = read('scripts/splus-runtime-v1.mjs');
  assert.match(script, /let html=input\.replace\(\/\\r\\n\/g,'\\n'\)/);
});

test('BASELINE-3 package declares the locked sharp image dependency', () => {
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(pkg.devDependencies.sharp, '0.34.3');
  assert.equal(lock.packages[''].devDependencies.sharp, '0.34.3');
});
