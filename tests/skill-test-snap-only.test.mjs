import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../skill-test.html', import.meta.url), 'utf8');

test('owner-selected snap is fixed: the controller has no movement selector', () => {
  assert.doesNotMatch(page, /data-movement=|movement-button|selectedMovement|selectMovement/);
  assert.match(page, /data-movement-policy="snap"/);
});

test('the skill controller observes the production movement policy without overriding it', () => {
  assert.doesNotMatch(page, /setTravel|\.skillMovement\s*=/);
  assert.doesNotMatch(page, /__HV_SKILL_MOVEMENT_QA/);
});

test('snap-only controller retains all three heroes, nine action paths, Reset and real markers', () => {
  for (const hero of ['luc-anh', 'dinh-loi', 'ong-pho']) assert.ok(page.includes(`data-hero-tab="${hero}"`));
  for (const action of ['basic', 'skill', 'ultimate']) assert.ok(page.includes(`data-action="${action}"`));
  for (const hook of ['qaForceLucAnhAction', 'qaForceDinhLoiAction', 'qaForceOngPhoAction']) assert.ok(page.includes(hook));
  for (const marker of ['action:start', 'marker:impact', 'action:complete']) assert.ok(page.includes(marker));
  assert.ok(page.includes('id="resetBattle"'));
  assert.ok(page.includes('Math.hypot(unit.x-unit.baseX,unit.y-unit.baseY)<=2'));
});
