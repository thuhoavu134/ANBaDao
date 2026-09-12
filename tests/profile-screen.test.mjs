import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L83-T3: overlay hồ sơ, gift, cài đặt; không đụng shell đóng băng', () => {
  const ui = read('src/ui/profile-runtime.js');
  const css = read('src/ui/profile-screen.css');
  assert.match(ui, /root\.id = ['"]hvProfileRoot['"]/);
  assert.match(ui, /#hubScreen \.art-player/);
  assert.match(css, /pointer-events:\s*auto/);
  assert.match(ui, /data-pf-act="gift"/);
  assert.match(ui, /data-pf-act="settings"/);
  assert.match(ui, /data-pf-act="rename"/);
  assert.match(ui, /redeemCode/);
  assert.match(css, /#hvProfileRoot\{[^}]*position:fixed;[^}]*inset:0/);
  assert.match(css, /z-index:\s*110/);
  assert.doesNotMatch(ui, /index\.html/);
  assert.doesNotMatch(ui, /campaign-scene/);
  assert.doesNotMatch(ui, /battle\.html/);
  assert.doesNotMatch(ui, /hv-pf-mask" data-pf-x/);
  assert.match(ui, /P\.shards/);
  assert.match(ui, /giftLine/);
});

test('L83-P1: inject lane + build-static sau auth', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/profile-v1.mjs');
  const lane = read('scripts/lanes/tkt-0083-profile.mjs');
  assert.match(lane, /TKT-0083/);
  assert.match(inject, /hv-profile-js/);
  assert.match(build, /tkt-0083-profile/);
  const authAt = build.indexOf('tkt-0074-auth');
  const pfAt = build.indexOf('tkt-0083-profile');
  assert.ok(authAt >= 0 && pfAt > authAt);
});
