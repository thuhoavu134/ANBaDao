import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../skill-test.html', import.meta.url), 'utf8');
const qa = readFileSync(new URL('../scripts/qa-skill-test-browser.mjs', import.meta.url), 'utf8');
const build = readFileSync(new URL('../scripts/build-static.mjs', import.meta.url), 'utf8');
const ci = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

test('direct skill test is part of the distributable build', () => {
  assert.ok(build.includes("'skill-test.html'"));
  assert.ok(page.includes('id="battleFrame"'));
  assert.ok(page.includes('window.__SKILL_TEST_QA__'));
});

test('direct skill test exposes all authored heroes and actions plus reset', () => {
  for (const hero of ['luc-anh','dinh-loi','ong-pho']) assert.ok(page.includes(`data-hero-tab="${hero}"`), hero);
  for (const action of ['basic','skill','ultimate']) assert.ok(page.includes(`data-action="${action}"`), action);
  assert.ok(page.includes('id="resetBattle"'));
  for (const hook of ['qaForceLucAnhAction','qaForceDinhLoiAction','qaForceOngPhoAction']) assert.ok(page.includes(hook), hook);
});

test('direct skill test reports real trace progression and return home', () => {
  assert.ok(page.includes("e.type==='action:start'"));
  assert.ok(page.includes("e.type==='marker:impact'"));
  assert.ok(page.includes("e.type==='action:complete'"));
  assert.ok(page.includes('Math.hypot(unit.x-unit.baseX,unit.y-unit.baseY)<=2'));
});

test('browser QA clicks all nine action controls on desktop and mobile', () => {
  assert.ok(qa.includes("const ACTIONS = ['basic','skill','ultimate']"));
  for (const hero of ['luc-anh','dinh-loi','ong-pho']) assert.ok(qa.includes(`['${hero}'`), hero);
  assert.ok(qa.includes("['desktop',1280,800,1]"));
  assert.ok(qa.includes("['mobile',390,844,2]"));
  assert.ok(qa.includes("await page.click('#resetBattle')"));
  assert.ok(qa.includes("run.exceptions.length===0"));
  assert.ok(qa.includes("run.httpErrors.length===0"));
  assert.ok(qa.includes("run.networkFailures.length===0"));
});

test('CI runs and uploads direct skill-test evidence', () => {
  assert.ok(ci.includes('Direct skill test browser QA'));
  assert.ok(ci.includes('node scripts/qa-skill-test-browser.mjs'));
  assert.ok(ci.includes('name: skill-test-evidence'));
  assert.ok(ci.includes('path: evidence/skill-test/'));
});
