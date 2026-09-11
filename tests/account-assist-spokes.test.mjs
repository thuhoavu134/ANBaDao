import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ui = readFileSync(join(root, 'src/ui/account-gear-runtime.js'), 'utf8');
const css = readFileSync(join(root, 'src/ui/account-gear-board.css'), 'utf8');

const SPOKES = Object.freeze([
  { key: 'relic', label: 'Bảo Vật', angle: 0, open: 'relic' },
  { key: 'gear', label: 'Trang bị', angle: 33, open: 'board' },
  { key: 'fish', label: 'Đồ Giám Cẩu Cá', angle: 65, open: 'fish' },
  { key: 'pet', label: 'Linh Thú', angle: 98, open: 'pet' },
  { key: 'spirit', label: 'Cửu Ứ Chiến Linh', angle: 131, open: 'spirit' },
  { key: 'divine', label: 'Thần Binh', angle: 164, open: 'divine' },
  { key: 'star', label: 'Tướng Tinh', angle: 196, open: 'star' },
  { key: 'antique', label: 'Cổ Vật', angle: 229, open: 'antique' },
  { key: 'luck', label: 'Tuệ Vận', angle: 262, open: 'luck' },
  { key: 'illusion', label: 'Ảo Hình', angle: 295, open: 'illusion' },
  { key: 'formation', label: 'Quân Trận', angle: 327, open: 'formation' }
]);

test('L23-T1: 11 nan Trợ trận giữ key / nhãn / góc / open', () => {
  assert.match(ui, /const WHEEL = \[/);
  for (const spoke of SPOKES) {
    const block = new RegExp(
      `key:\\s*'${spoke.key}'[\\s\\S]{0,160}label:\\s*'${spoke.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[\\s\\S]{0,80}angle:\\s*${spoke.angle}[\\s\\S]{0,80}open:\\s*'${spoke.open}'`
    );
    assert.match(ui, block, spoke.key);
  }
  const keys = [...ui.matchAll(/\{\s*key:\s*'([a-z]+)'/g)].map(m => m[1]);
  const wheelKeys = keys.slice(0, 11);
  assert.deepEqual(wheelKeys, SPOKES.map(s => s.key));
  const angles = [...ui.matchAll(/angle:\s*(-?\d+)/g)].map(m => ((Number(m[1]) % 360) + 360) % 360);
  assert.equal(angles.length, 11);
  assert.equal(new Set(angles).size, 11);
  let minGap = 360;
  for (let i = 0; i < angles.length; i++) {
    for (let j = i + 1; j < angles.length; j++) {
      const delta = Math.abs(angles[i] - angles[j]) % 360;
      minGap = Math.min(minGap, Math.min(delta, 360 - delta));
    }
  }
  assert.ok(minGap >= 32, 'wheel gap ' + minGap);
});

test('L23-T2: nan dùng ảnh sơn, không còn spokeGlyph SVG', () => {
  assert.match(ui, /assets\/ui\/account-gear\/spokes\//);
  assert.match(ui, /<img src="\$\{spokeIcon\(item\.key\)\}"/);
  assert.doesNotMatch(ui, /function spokeGlyph/);
  assert.doesNotMatch(ui, /<svg viewBox="0 0 24 24"/);
  assert.doesNotMatch(ui, /const ICONS = \{/);
  assert.match(css, /\.hv-assist-spoke img\{/);
  assert.doesNotMatch(css, /\.hv-assist-spoke svg\{/);
});

test('L23-T3: 11 file sơn unique + hall giữ + heroStats không đổi công thức', () => {
  assert.match(css, /assist-hall-day\.jpg/);
  assert.equal(existsSync(join(root, 'assets/ui/account-gear/assist-hall.webp')), true);
  assert.equal(existsSync(join(root, 'assets/ui/account-gear/assist-core.webp')), true);
  assert.equal(existsSync(join(root, 'assets/ui/account-gear/assist-hall-day.jpg')), true);
  const files = new Set();
  for (const spoke of SPOKES) {
    const path = join(root, 'assets/ui/account-gear/spokes', spoke.key + '.jpg');
    assert.equal(existsSync(path), true, spoke.key);
    const st = statSync(path);
    assert.ok(st.size > 4000, spoke.key + ' too small');
    files.add(spoke.key);
  }
  assert.equal(files.size, 11);
  assert.match(ui, /heroStats = function accountGearHeroStats/);
  assert.match(
    ui,
    /stats\.hp \+ add\.hp \+ relicsAdd\.hp \+ petsAdd\.hp \+ spiritsAdd\.hp \+ antiquesAdd\.hp \+ illusionsAdd\.hp \+ fishAdd\.hp\) \* \(1 \+ divineAdd\.hp \+ luckAdd\.hp\)/
  );
  assert.match(
    ui,
    /stats\.atk \+ add\.atk \+ relicsAdd\.atk \+ petsAdd\.atk \+ spiritsAdd\.atk \+ antiquesAdd\.atk \+ illusionsAdd\.atk \+ fishAdd\.atk\) \* \(1 \+ divineAdd\.atk \+ luckAdd\.atk\)/
  );
  assert.match(ui, /name === 'team' && !ST\.hvOpenFormation/);
  assert.match(ui, /assist === 'formation'/);
});

test('L23-P1: clip tròn + pointer-events badge-only', () => {
  assert.match(css, /\.hv-assist-spoke\{[^}]*pointer-events:\s*none/);
  assert.match(css, /\.hv-assist-spoke span\{[^}]*pointer-events:\s*auto/);
  assert.match(css, /\.hv-assist-spoke span\{[^}]*overflow:\s*hidden/);
  assert.match(css, /\.hv-assist-spoke img\{[^}]*object-fit:\s*cover/);
  assert.match(css, /\.hv-assist-spoke img\{[^}]*border-radius:\s*50%/);
  assert.match(css, /--wheel-r:min\(40vw/);
  new Function(ui);
});

test('L23-P2: không thêm data-art-go; inject account-gear giữ chỗ', () => {
  assert.doesNotMatch(ui, /data-art-go=/);
  const index = readFileSync(join(root, 'index.html'), 'utf8');
  const teamDock = [...index.matchAll(/act\('team','team','Trợ trận'\)/g)];
  assert.equal(teamDock.length, 1);
  const inject = readFileSync(join(root, 'scripts/account-gear-v1.mjs'), 'utf8');
  assert.match(inject, /account-gear-runtime\.js/);
  const build = join(root, 'scripts/build-static.mjs');
  assert.match(readFileSync(build, 'utf8'), /account-gear-v1/);
});
