import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L98: nhật ký city 6 ô, không document click', () => {
  const ui = read('src/ui/daily-3d-runtime.js');
  const css = read('src/ui/daily-3d.css');
  assert.match(ui, /hvDailyCity/);
  assert.match(css, /#hvDailyCity/);
  assert.match(css, /data-dcity="sign"/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
  for (const f of ['diem-danh','chop-mat','ca-truc','viec-vat','viec-tuan','nhat-ky']) {
    const p = join(root, 'assets/ui/daily/tiles', f + '.jpg');
    assert.equal(existsSync(p), true, f);
    assert.ok(statSync(p).size > 40000, f);
  }
});

test('L99: lễ hội city Hoa Đăng / Bách Bảo / Rương', () => {
  const ui = read('src/ui/festival-3d-runtime.js');
  const css = read('src/ui/festival-3d.css');
  assert.match(ui, /hvFestVault/);
  assert.match(css, /#hvFestVault/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
  for (const f of ['hoa-dang','bach-bao','ruong']) {
    const p = join(root, 'assets/ui/festival/tiles', f + '.jpg');
    assert.equal(existsSync(p), true, f);
    assert.ok(statSync(p).size > 40000, f);
  }
});
