import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = join(root, '.github/workflows/ci.yml');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L25-C1: CI workflow fires on PR, main, and manual run', () => {
  assert.equal(existsSync(workflow), true);
  const yml = read('.github/workflows/ci.yml');
  assert.match(yml, /pull_request:/);
  assert.match(yml, /branches:\s*\[[^\]]*main/);
  assert.match(yml, /workflow_dispatch:/);
});

test('L25-C2: CI installs devDependencies, builds, and runs node tests', () => {
  const yml = read('.github/workflows/ci.yml');
  assert.match(yml, /npm install/);
  assert.doesNotMatch(yml, /omit=dev/);
  assert.match(yml, /npm run build/);
  assert.match(yml, /node --test/);
  assert.match(yml, /tests\/\*\.test\.mjs/);
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.ci.includes('npm run build'), true);
  assert.equal(pkg.scripts.ci.includes('node --test'), true);
});

test('L25-C3: main push checks live after CI', () => {
  const yml = read('.github/workflows/ci.yml');
  assert.match(yml, /luc-than\.vercel\.app/);
  assert.match(yml, /github\.ref == 'refs\/heads\/main'/);
  assert.match(yml, /needs:\s*ci/);
});
