import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const qa = readFileSync(new URL('../scripts/qa-skill-test-browser.mjs', import.meta.url), 'utf8');
const workflow = readFileSync(new URL('../.github/workflows/skill-test-tunnel.yml', import.meta.url), 'utf8');

test('direct skill QA accepts an external delivery URL without changing local default', () => {
  assert.ok(qa.includes('process.env.SKILL_TEST_BASE_URL||browser.origin'));
  assert.ok(qa.includes("url:targetBase+'/skill-test.html'"));
  assert.ok(qa.includes('targetBase'));
});

test('live preview builds dist, exposes it through a test-only quick tunnel and runs browser QA on that URL', () => {
  assert.ok(workflow.includes('npm run build'));
  assert.ok(workflow.includes('python3 -m http.server 4173'));
  assert.ok(workflow.includes('cloudflared tunnel --no-autoupdate --url http://127.0.0.1:4173'));
  assert.ok(workflow.includes('SKILL_TEST_BASE_URL:'));
  assert.ok(workflow.includes('node scripts/qa-skill-test-browser.mjs'));
  assert.ok(workflow.includes('PREVIEW_READY='));
});
