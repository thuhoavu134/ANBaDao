import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L75-T1: login gate wraps navTo, mounts overlay, no document click', () => {
  const ui = read('src/ui/login-gate-runtime.js');
  assert.match(ui, /root\.id = ['"]hvLoginRoot['"]/);
  assert.match(ui, /document\.body\.append/);
  assert.match(ui, /const baseNav = navTo/);
  assert.match(ui, /navTo = function/);
  assert.match(ui, /\/api\/register/);
  assert.match(ui, /\/api\/login/);
  assert.match(ui, /login-bg\.mp4/);
  assert.match(ui, /playsinline/);
  assert.match(ui, /muted/);
  assert.match(ui, /hvLoginWelcome/);
  assert.match(ui, /hvLoginMethods/);
  assert.match(ui, /Tiếp tục chơi game/);
  assert.match(ui, /Du khách/);
  assert.match(ui, /Thỏa thuận người dùng/);
  assert.match(ui, /Chính sách bảo mật/);
  assert.match(ui, /playBgm\(['"]maincity['"]\)/);
  assert.match(ui, /Tạo tài khoản xong/);
  assert.match(ui, /@tmp/);
  assert.match(ui, /assets\/legal\/thoa-thuan\.html/);
  assert.match(ui, /assets\/legal\/chinh-sach\.html/);
  assert.match(ui, /data-panel="google"/);
  assert.match(ui, /data-panel="facebook"/);
  assert.match(ui, /data-panel="apple"/);
  assert.match(ui, /hvLoginLegalBody/);
  assert.match(ui, /accounts\.google\.com\/gsi\/client/);
  assert.match(ui, /FB\.login/);
  assert.match(ui, /AppleID/);
  assert.doesNotMatch(ui, /<iframe/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"]click['"]/);
  assert.doesNotMatch(ui, /campaign-scene/);
  assert.doesNotMatch(ui, /login-hero/);
});

test('L75-T2: video + poster exist and CSS covers the viewport', () => {
  const css = read('src/ui/login-gate.css');
  assert.match(css, /#hvLoginRoot\{[^}]*position:fixed;[^}]*inset:0/);
  assert.match(css, /z-index:\s*200/);
  assert.match(css, /login-bg\.mp4|hv-login-video/);
  assert.match(css, /hv-login-frame\{[^}]*z-index:\s*3/);
  assert.doesNotMatch(css, /hv-login-hero/);
  const legalT = join(root, 'assets/legal/thoa-thuan.html');
  const legalP = join(root, 'assets/legal/chinh-sach.html');
  assert.equal(existsSync(legalT), true);
  assert.equal(existsSync(legalP), true);
  assert.match(read('assets/legal/thoa-thuan.html'), /Thỏa thuận người dùng/);
  assert.match(read('assets/legal/chinh-sach.html'), /Chính sách bảo mật/);
  const mp4 = join(root, 'assets/ui/auth/login-bg.mp4');
  const jpg = join(root, 'assets/ui/auth/login-bg.jpg');
  assert.equal(existsSync(mp4), true);
  assert.equal(existsSync(jpg), true);
  assert.ok(statSync(mp4).size > 80 * 1024, 'login video too small');
  assert.ok(statSync(jpg).size > 20 * 1024, 'login poster too small');
});

test('L75-T3: frozen shells stay frozen; stub loads gate after auth', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /hvLoginRoot/);
  assert.doesNotMatch(html, /login-bg\.mp4/);
  assert.doesNotMatch(read('battle.html'), /hvLoginRoot|login-gate-runtime/);
  assert.doesNotMatch(read('src/ui/campaign-scene.js'), /hvLoginRoot|login-gate-runtime/);
  const stub = read('scripts/lanes/tkt-0074-auth.mjs');
  assert.match(stub, /await import\(['"]\.\.\/net-auth-v1\.mjs['"]\)/);
  assert.match(stub, /await import\(['"]\.\.\/login-gate-v1\.mjs['"]\)/);
});
