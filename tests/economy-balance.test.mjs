import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  RAR_UI, UNLOCK_SHARDS, DAILY_DRIP, WEEKLY_DRIP, JOB_DRIP, CHAPTER_DRIP,
  mergeReward, applyDripTable, rarLabel
} from '../src/domain/economy/balance.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('L111: Tinh/Hoạt nhỏ giọt + nhãn B/A/S/S+ + mở tướng', () => {
  assert.equal(rarLabel('ssr'), 'S+');
  assert.equal(rarLabel('ss'), 'S+');
  assert.equal(rarLabel('s'), 'S');
  assert.equal(UNLOCK_SHARDS.ssr, 50);
  assert.equal(UNLOCK_SHARDS.b, 10);
  assert.equal(DAILY_DRIP.q_win.tinh, 4);
  assert.equal(JOB_DRIP.canh_den.hoat, 8);
  const q = applyDripTable('q_win', { gold: 200 }, DAILY_DRIP);
  assert.equal(q.gold, 200);
  assert.equal(q.tinh, 4);
  const ch = mergeReward({ gold: 900, gems: 80 }, CHAPTER_DRIP);
  assert.equal(ch.tinh, 20);
  assert.equal(WEEKLY_DRIP.w_win.tinh, 12);
  assert.equal(RAR_UI.a, 'A');
  const ui = readFileSync(join(root, 'src/ui/economy-balance-runtime.js'), 'utf8');
  assert.match(ui, /DAILY_DRIP/);
  assert.match(ui, /applyRewardBalanced/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
  const build = readFileSync(join(root, 'scripts/build-static.mjs'), 'utf8');
  assert.ok(build.indexOf('tkt-0111-econ') > build.indexOf('tkt-0109-bbr'));
});
