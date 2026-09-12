import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

const SHOWCASE = [
  'lac-yen', 'cung-thu-tre', 'co-dao-ganh-hoi', 'phong-tu',
  'thuy-nuong-roi-nuoc', 'hong-lien-dao-nuong', 'thach-quyen',
  'dinh-loi', 'to-diep'
];

test('L43-T1: live hero-detail tabs and three authored showcases stay frozen', () => {
  const html = read('index.html');
  assert.match(html, /function renderHeroDetail\(/);
  assert.match(html, /detailBackground:'assets\/ui\/hero-detail\/ong-pho-showcase-bg\.png'/);
  assert.match(html, /detailBackground:'assets\/ui\/hero-detail\/luc-anh-showcase-bg\.png'/);
  assert.match(html, /detailBackground:'assets\/ui\/hero-detail\/thay-mo-showcase-bg\.png'/);
  const tabs = read('src/ui/hero-detail-tabs.js');
  assert.match(tabs, /body.replaceChildren\(stage, dock, workspace\)/);
});

test('L43-T2: #hvHeroDetailRoot is a body overlay with overflow auto', () => {
  const css = read('src/ui/hero-detail-hall.css');
  assert.match(css, /#hvHeroDetailRoot\{[^}]*position:fixed;[^}]*inset:0;[^}]*overflow:auto/);
  assert.match(css, /#hvHeroDetailRoot\.is-open\{display:flex/);
  assert.match(css, /#hvHeroDetailRoot\[hidden\]\{display:none!important/);
  assert.doesNotMatch(css, /#hvHeroDetailRoot\{[^}]*overflow:hidden/);
  assert.match(css, /assets\/ui\/hero-detail\/hero-detail-hall\.jpg/);
  assert.doesNotMatch(css, /menu-v3233/);
});

test('L43-T3: hall mounts on body and wraps showScreen without a second document listener', () => {
  const ui = read('src/ui/hero-detail-hall-runtime.js');
  assert.match(ui, /document\.body\.append\(root\)/);
  assert.match(ui, /const baseShowScreen = showScreen/);
  assert.match(ui, /root\.classList\.toggle\(['"]is-open['"]/);
  assert.match(ui, /getElementById\(['"]hdBody['"]\)/);
  assert.match(ui, /renderHeroDetail/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
});

test('L43-T4: stub lane loads runtime and build-static keeps the reserved import', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/hero-detail-hall-v1.mjs');
  const stub = read('scripts/lanes/tkt-0053-hero-detail.mjs');
  assert.match(build, /lanes\/tkt-0053-hero-detail\.mjs/);
  assert.match(stub, /await import\(['"]\.\.\/hero-detail-hall-v1.mjs['"]\)/);
  assert.match(inject, /src\/ui\/hero-detail-hall-runtime\.js/);
  assert.match(inject, /src\/ui\/hero-detail-hall\.css/);
});

test('L43-T5: nine remaining showcases are dedicated 3D files, not menu-v3233', () => {
  const ui = read('src/ui/hero-detail-hall-runtime.js');
  const hall = join(root, 'assets/ui/hero-detail/hero-detail-hall.jpg');
  assert.equal(existsSync(hall), true);
  assert.ok(readFileSync(hall).length > 50000);
  for (const slug of SHOWCASE) {
    const file = join(root, 'assets/ui/hero-detail/' + slug + '-showcase-bg.jpg');
    assert.equal(existsSync(file), true, slug);
    assert.ok(readFileSync(file).length > 50000, slug + ' too small');
    assert.match(ui, new RegExp(slug.replace(/-/g, '-') + '-showcase-bg\\.jpg'));
  }
  assert.match(ui, /lac_yen:/);
  assert.match(ui, /to_diep:/);
  assert.doesNotMatch(ui, /ong_hang_pho:/);
  assert.doesNotMatch(ui, /luc_anh:/);
  assert.doesNotMatch(ui, /thay_mo:/);
});
