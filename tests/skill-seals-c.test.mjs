import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');
const HEROES = ['thach_quyen', 'dinh_loi', 'to_diep'];
const OTHER = ['lac_yen', 'cung_thu_tre', 'co_dao_ganh_hoi', 'phong_tu', 'thuy_nuong_roi_nuoc', 'hong_lien_dao_nuong', 'ong_hang_pho', 'luc_anh', 'thay_mo'];

test('L53-T1: wrap renderHeroDetail calls base; hero-detail-tabs stays frozen', () => {
  const tabs = read('src/ui/hero-detail-tabs.js');
  assert.match(tabs, /icon\.className = 'hv-scene-skill-seal'/);
  assert.match(tabs, /icon\.textContent = skill\.dataset\.skillIcon/);
  assert.match(tabs, /const baseDetail = renderHeroDetail/);
  const html = read('index.html');
  assert.match(html, /function renderHeroDetail\(/);
  const ui = read('src/ui/skill-seals-c-runtime.js');
  assert.match(ui, /const baseRender = renderHeroDetail/);
  assert.match(ui, /baseRender\.apply\(this, arguments\)/);
  for (const id of HEROES) assert.match(ui, new RegExp("'" + id + "'"));
  for (const id of OTHER) assert.doesNotMatch(ui, new RegExp("'" + id + "'"));
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
  assert.doesNotMatch(ui, /battle\.html/);
  assert.doesNotMatch(ui, /assets\/characters\/dinh-loi/);
});

test('L53-T2: nine exclusive jpgs exist and are larger than 8KB', () => {
  for (const id of HEROES) {
    for (const slot of ['basic', 'ultimate', 'passive']) {
      const file = join(root, 'assets/ui/skill-seals', id, slot + '.jpg');
      assert.equal(existsSync(file), true, id + '/' + slot);
      assert.ok(readFileSync(file).length > 8192, id + '/' + slot + ' too small');
    }
  }
});

test('L53-T3: CSS is scoped to the three C ids and does not paint others', () => {
  const css = read('src/ui/skill-seals-c.css');
  for (const id of HEROES) {
    assert.match(css, new RegExp('\\[data-hero-id="' + id + '"\\]'));
    for (const slot of ['basic', 'ultimate', 'passive']) {
      assert.match(css, new RegExp('assets/ui/skill-seals/' + id + '/' + slot + '\\.jpg'));
    }
  }
  for (const id of OTHER) assert.doesNotMatch(css, new RegExp(id));
  assert.match(css, /content:""!important/);
  assert.match(css, /\.hv-scene-skill-seal/);
  assert.match(css, /\.skillbox\[data-skill-slot\]:before/);
  assert.doesNotMatch(css, /menu-v3233/);
  assert.doesNotMatch(css, /assets\/characters\/dinh-loi/);
});

test('L53-T4: stub lane loads runtime; no battle.html; Đình Lôi combat atlas stays frozen', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/skill-seals-c-v1.mjs');
  const stub = read('scripts/lanes/tkt-0063-skill-seals-c.mjs');
  assert.match(build, /lanes\/tkt-0063-skill-seals-c\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/skill-seals-c-v1\.mjs['"]\)/);
  assert.match(inject, /src\/ui\/skill-seals-c-runtime\.js/);
  assert.match(inject, /src\/ui\/skill-seals-c\.css/);
  assert.doesNotMatch(inject, /battle\.html/);
  assert.doesNotMatch(inject, /assets\/characters\/dinh-loi/);
  assert.doesNotMatch(read('src/ui/skill-seals-c-runtime.js'), /index\.html|campaign-scene|dinh-loi\//);
});
