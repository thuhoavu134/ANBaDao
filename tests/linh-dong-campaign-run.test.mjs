import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = rel => fs.readFileSync(new URL(rel, root), 'utf8');
const exists = rel => fs.existsSync(new URL(rel, root));

function afkBox() {
  const scene = read('src/ui/campaign-scene.js');
  const start = scene.indexOf('const spriteSpecs =');
  const end = scene.indexOf('const HOME_SLOT');
  assert.ok(start >= 0 && end > start);
  const box = {
    window: {},
    sceneState: { draft: null },
    LUC_ANH_IDLE_1080: {},
    AFK_THAY_MO_IDLE_DURATIONS: []
  };
  vm.createContext(box);
  vm.runInContext(scene.slice(start, end) + `
    this.idle = spriteSpecs.linh_dong;
    this.march = specForAfk({ id: 'linh_dong' });
    sceneState.draft = { some: true };
    this.prep = specForAfk({ id: 'linh_dong' });
  `, box);
  return box;
}

test('L153-T1 march uses Linh Dong Run; preparation stays Idle', () => {
  const box = afkBox();
  assert.equal(box.march.src, 'assets/characters/linh-dong/campaign-lite/run-atlas.webp');
  assert.equal(box.prep.src, 'assets/characters/linh-dong/campaign-lite/idle-atlas.webp');
  assert.equal(box.idle.src, 'assets/characters/linh-dong/campaign-lite/idle-atlas.webp');
  const scene = read('src/ui/campaign-scene.js');
  assert.match(scene, /HonVietCampaignRunSpecs/);
  assert.match(scene, /runSpecs\[pick\.id\]|runSpecs\.linh_dong/);
});

test('L153-T2 Run shares Idle cell and pivot; no invented fps', () => {
  const box = afkBox();
  assert.equal(box.march.src, 'assets/characters/linh-dong/campaign-lite/run-atlas.webp');
  assert.equal(box.march.frames, 96);
  assert.equal(box.march.cols, 8);
  assert.equal(box.march.cellW, 240);
  assert.equal(box.march.cellH, 220);
  assert.equal(box.march.ms, 42);
  assert.equal(box.march.pivot, 120);
  assert.equal(box.march.foot, 220);
  assert.equal(box.march.body, 165);
  assert.equal(box.march.frames, box.idle.frames);
  assert.equal(box.march.cellW, box.idle.cellW);
  assert.equal(box.march.cellH, box.idle.cellH);
  assert.equal(box.march.pivot, box.idle.pivot);
  assert.doesNotMatch(read('src/ui/campaign-scene.js'), /fakeRun|pretendRun|run-placeholder/);
});

test('L153-T3 authored run atlas exists; L144 idle spec unchanged', () => {
  assert.equal(exists('assets/characters/linh-dong/campaign-lite/run-atlas.webp'), true);
  assert.equal(exists('assets/characters/linh-dong/campaign-lite/idle-atlas.webp'), true);
  const box = afkBox();
  assert.equal(box.idle.src, 'assets/characters/linh-dong/campaign-lite/idle-atlas.webp');
  assert.equal(box.idle.frames, 96);
  assert.equal(box.idle.cellW, 240);
  assert.equal(box.idle.cellH, 220);
  const index = read('index.html');
  assert.doesNotMatch(index, /BETS\s*=\s*\[[^\]]*[^2, 10, 50]/);
});
