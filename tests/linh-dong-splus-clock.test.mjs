import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createSplusFixture } from '../scripts/splus-runtime-v1.mjs';
import { SPLUS_HEROES } from '../src/domain/hero/splus-catalog.mjs';
import { LINH_DONG_TIMELINE } from '../src/combat-domain/linh-dong-presentation.mjs';

const root = new URL('../', import.meta.url);
const read = rel => fs.readFileSync(new URL(rel, root), 'utf8');

function performSplusActionSource() {
  const bridge = read('src/runtime/splus-battle-bridge.js');
  const start = bridge.indexOf('async function performSplusAction');
  const end = bridge.indexOf('function drawSplusToken', start);
  assert.ok(start >= 0 && end > start, 'performSplusAction is missing from the S+ bridge');
  return bridge.slice(start, end);
}

test('L146-T1 S+ Linh Đồng uses the shared ATK/Ultimate marker clock', () => {
  const fn = performSplusActionSource();
  assert.match(fn, /beginLinhDongAction\(actor,action,target,battleId\)/);
  assert.match(fn, /waitLinhDongMarker\([^,]+,\s*['"]release['"]/);
  assert.match(fn, /emitLinhDongRelease\(/);
  assert.match(fn, /waitLinhDongMarker\([^,]+,\s*['"]impact['"]/);
  assert.match(fn, /e\.act\(actor\.id,action,target\?\.id\)/);
  assert.equal(fn.split('e.act(').length, 2, 'damage must resolve once at impact');
  assert.match(fn, /waitLinhDongMarker\([^,]+,\s*['"]recovery:end['"]/);
  assert.doesNotMatch(fn, /sleep\(linh\?linhDur/);
  assert.doesNotMatch(fn, /sleep\(linhDur/);
  assert.doesNotMatch(fn, /startLinhDongFx\(action,actor,target\)/);
  assert.equal(LINH_DONG_TIMELINE.atk.releaseMs, 160);
  assert.equal(LINH_DONG_TIMELINE.atk.impactMs, 500);
  assert.equal(LINH_DONG_TIMELINE.atk.recoveryEndMs, 720);
  assert.equal(LINH_DONG_TIMELINE.ultimate.releaseMs, 400);
  assert.equal(LINH_DONG_TIMELINE.ultimate.impactMs, 1600);
  assert.equal(LINH_DONG_TIMELINE.ultimate.recoveryEndMs, 1980);
});

test('L146-T2 S+ Linh Đồng skill bar is passive+ultimate and hurt returns to idle', () => {
  const bridge = read('src/runtime/splus-battle-bridge.js');
  assert.match(bridge, /\['passive','ultimate'\]/);
  assert.doesNotMatch(bridge, /strip\.replaceChildren\(\.\.\.\['passive','skill','ultimate'\]/);
  assert.match(bridge, /setTimeout\(\(\)=>\{ if\(t\.hp>0&&t\.state===['"]hurt['"]\) setUnitState\(t,['"]idle['"],800\); \}/);
  const fn = performSplusActionSource();
  assert.match(fn, /normalizeLinhDongAction\(action\)/);
  assert.match(fn, /action=['"]basic['"]/);
});

test('L146-T3 other S+ fixtures keep timingScale 0.35; marker elapsed stays wall clock', () => {
  const runtime = read('scripts/splus-runtime-v1.mjs');
  assert.match(runtime, /timingScale:0\.35/);
  const other = createSplusFixture(SPLUS_HEROES, 'hero_splus_mang_xa');
  const linh = createSplusFixture(SPLUS_HEROES, 'hero_splus_linh_dong');
  assert.equal(other.timingScale, 0.35);
  assert.equal(linh.timingScale, 0.35);
  const waitSrc = read('scripts/linh-dong-timing-main-v1.mjs');
  const waitStart = waitSrc.indexOf('async function waitLinhDongMarker');
  const waitEnd = waitSrc.indexOf('function emitLinhDongRelease', waitStart);
  const waitFn = waitSrc.slice(waitStart, waitEnd);
  assert.match(waitFn, /performance\.now\(\)-info\.startedAt/);
  assert.doesNotMatch(waitFn, /motionDuration/);
});
