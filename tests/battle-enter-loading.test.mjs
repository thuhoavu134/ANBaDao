import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const battle = readFileSync(new URL('../battle.html', import.meta.url), 'utf8');

test('L12-B1: loading copy tells the player combat is starting, not a formation/engine lab', () => {
  assert.match(index, /Đang vào trận/);
  assert.match(index, /Đội hình vừa bày sẽ ra sân ngay/);
  assert.doesNotMatch(index, /chỉ thay engine chiến đấu/);
});

test('L12-B2: iframe load does not hide the veil; only battle-ready does', () => {
  const fn = index.slice(index.indexOf('function markBattleDocumentLoaded'), index.indexOf('frame.addEventListener("load"'));
  assert.match(fn, /if \(!activeBattle\) return;/);
  assert.doesNotMatch(fn, /loading\.hidden = true/);
  assert.match(index, /message\.type === "battle-ready"/);
  assert.match(index, /overlay\.classList\.remove\("is-loading"\)/);
});

test('L12-B3: embedded battle URL forces autostart and a retreat control while the overlay is open', () => {
  assert.match(index, /battle\.html\?embedded=1&session=\$\{encodeURIComponent\(sessionId\)}&autostart=1/);
  assert.match(index, /#hvBattleOverlay\.is-open \.hv-battle-exit\{display:block/);
});

test('L12-B4: embedded battle.html starts combat and reports the URL session even if config parse fails', () => {
  assert.match(battle, /if \(EMBED_CONFIG\.autoStart \|\| EMBEDDED\) setTimeout\(beginBattle, 250\);/);
  assert.match(battle, /sessionId: EMBED_CONFIG\.sessionId \|\| new URLSearchParams\(location\.search\)\.get\("session"\) \|\| ""/);
});

test('L12-B5: a nested preview (Grok/iOS webview) opens battle.html as a full page instead of a child iframe', () => {
  assert.match(index, /window\.parent !== window/);
  assert.match(index, /location\.assign\(url\)/);
  assert.match(index, /hvBattleHostLease/);
});

test('L12-B6: same-window embedded battle returns through sessionStorage, not a missing parent iframe', () => {
  assert.match(battle, /function postToHonVietHost/);
  assert.match(battle, /hvBattleHostEvent/);
  assert.match(battle, /index\.html\?hvBattleReturn=1/);
  assert.match(index, /hvBattleReturn/);
});
