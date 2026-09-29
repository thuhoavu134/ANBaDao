import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import sharp from 'sharp';
import { preparationSourceSpecs } from '../scripts/campaign-preparation-idle-v1.mjs';
import { createCampaignResourcePackCache } from '../src/assets/campaign-resource-pack-cache.mjs';
import { createCampaignSceneImageOwner } from '../src/ui/campaign-resource-lifecycle.mjs';

const html = readFileSync('dist/index.html', 'utf8');
const specs = preparationSourceSpecs(html);
const packs = JSON.parse(readFileSync('dist/preparation-idle-packs.json', 'utf8'));
const pixels = src => sharp('dist/' + src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
function extract(name) {
  const start = html.indexOf('function ' + name + '(');
  assert.ok(start >= 0, name);
  let end = start;
  while ((end = html.indexOf('}', end + 1)) >= 0) {
    const source = html.slice(start, end + 1);
    try { new vm.Script('(' + source + ')'); return source; } catch (_) {}
  }
  throw Error(name);
}
function fixture(extra = {}) {
  const context = vm.createContext({ spriteSpecs: specs, preparationIdlePacks: packs, reducedMotion: { matches: false }, ...extra });
  for (const name of ['frameAt', 'preparationSpriteFor']) vm.runInContext(extract(name), context);
  return context;
}

test('all 432 authored idle frames retain visible RGBA pixels, dimensions and cell registration', async () => {
  let frameCount = 0;
  for (const [id, pack] of Object.entries(packs)) {
    const spec = specs[id], original = await pixels(spec.src);
    assert.equal(pack.pages.reduce((n, p) => n + p.frames, 0), spec.frames, id);
    for (const [pageIndex, descriptor] of [[-1, pack.poster], ...pack.pages.entries()]) {
      const decoded = await pixels(descriptor.src);
      assert.equal(decoded.info.width, descriptor.atlasWidth);
      assert.equal(decoded.info.height, descriptor.atlasHeight);
      let different = 0;
      for (let f = 0; f < descriptor.frames; f++) {
        const sourceFrame = pageIndex < 0 ? 0 : pageIndex * pack.pageFrames + f;
        const ox = sourceFrame % spec.cols * (spec.strideW || spec.cellW) + (spec.pad || 0);
        const oy = Math.floor(sourceFrame / spec.cols) * (spec.strideH || spec.cellH) + (spec.pad || 0);
        const px = f % descriptor.cols * spec.cellW, py = Math.floor(f / descriptor.cols) * spec.cellH;
        for (let y = 0; y < spec.cellH; y++) for (let x = 0; x < spec.cellW; x++) {
          const a = ((oy + y) * original.info.width + ox + x) * 4;
          const b = ((py + y) * decoded.info.width + px + x) * 4;
          if (original.data[a + 3] !== decoded.data[b + 3] || original.data[a + 3] &&
              (original.data[a] !== decoded.data[b] || original.data[a + 1] !== decoded.data[b + 1] || original.data[a + 2] !== decoded.data[b + 2])) different++;
        }
        if (pageIndex >= 0) frameCount++;
      }
      assert.equal(different, 0, `${id} page ${pageIndex}: no resampling, clipping or alpha loss`);
    }
  }
  assert.equal(frameCount, 432);
});

test('generated preparation clock covers every frame and keeps the original pivot, feet and timing', () => {
  const context = fixture();
  for (const [id, spec] of Object.entries(specs)) {
    const seen = new Set();
    const duration = spec.durations?.reduce((a, b) => a + b, 0) || spec.frames * spec.ms;
    for (let time = 0; time < duration * 2; time += 7) {
      const prepared = context.preparationSpriteFor({ id }, time), frame = context.frameAt(spec, time);
      const page = packs[id].pages.findIndex(p => p.src === prepared.spec.src);
      assert.equal(page * packs[id].pageFrames + prepared.spec.frameIndex, frame);
      for (const key of ['pivot', 'foot', 'body', 'cellW', 'cellH']) assert.equal(prepared.spec[key], spec[key], `${id}/${key}`);
      seen.add(frame);
    }
    assert.equal(seen.size, spec.frames, id);
  }
  context.reducedMotion.matches = true;
  assert.equal(context.preparationSpriteFor({ id: 'linh_dong' }, 9000).spec.frameIndex, 0);
});

test('six animated heroes fit the actual 64 MiB cache across page changes without budget denial', async () => {
  let now = 0, denied = 0, peak = 0;
  const cache = createCampaignResourcePackCache({ maxDecodedBytes: 64 * 1024 * 1024, maxLoading: 1,
    makeImage: () => ({ complete: false, naturalWidth: 0, removeAttribute() {} }),
    load: async (pack, image) => { image.complete = true; image.naturalWidth = 1; return { image, decodedBytes: pack.decodedBytes }; } });
  const context = fixture(), timers = [];
  const owner = createCampaignSceneImageOwner({ images: new Map(), cache, now: () => now,
    packFor: (src, spec) => ({ heroId: src, clip: 'idle', tier: 'campaign-lite', src, decodedBytes: spec.atlasWidth * spec.atlasHeight * 4 }),
    makeImage: () => { throw Error('authored preparation must use the budgeted cache'); },
    draw() {}, scheduleFrame: () => 1, cancelFrame() {},
    setTimer: fn => { denied++; timers.push(fn); return timers.length; }, clearTimer() {} });
  try {
    for (now = 0; now <= 24_000; now += 250) {
      owner.beginFrame();
      const requested = [];
      for (const id of Object.keys(specs)) {
        const prep = context.preparationSpriteFor({ id }, now);
        for (const spec of [prep.poster, prep.spec, prep.next]) {
          owner.image(spec.src, spec); requested.push(spec);
        }
      }
      owner.endFrame();
      for (let flush = 0; flush < 150; flush++) await Promise.resolve();
      const report = cache.inspect(); peak = Math.max(peak, report.bytes + report.reservedBytes);
      assert.ok(peak <= 64 * 1024 * 1024);
      for (const spec of requested) assert.ok(owner.image(spec.src, spec).complete, `idle ready at ${now}: ${spec.src}`);
    }
    assert.equal(denied, 0);
  } finally { owner.clear(); }
  assert.equal(cache.inspect().bytes, 0);
});

test('real preparation draw uses a full-body idle when a page is delayed, then resumes the page', () => {
  const drawn = [], requested = []; let pageReady = false;
  const ctx = new Proxy({ drawImage: (...args) => drawn.push(args) }, { get: (o, k) => k in o ? o[k] : () => {} });
  const context = fixture({
    sceneState: { active: true, width: 390, height: 400, canvas: { width: 390, getContext: () => ctx },
      draft: [{ id: 'linh_dong', slot: 1, row: 'front' }, { id: 'luc_anh', slot: 5, row: 'back' }] },
    sceneImages: new Map(), campaignBattleOpen: () => false, preparationEnemies: () => [],
    preparationDrag: null, farmAttackSpecs: {}, drawCampaignFarm() {},
    portraitSrc: () => { throw Error('portrait/bust must not replace an authored idle'); },
    imageForScene: (src, spec) => {
      requested.push(src);
      const ready = src.includes('/idle-') || pageReady;
      return { src, complete: ready, naturalWidth: ready ? spec.atlasWidth : 0 };
    }
  });
  vm.runInContext(extract('drawSceneContents'), context);
  context.drawSceneContents(0);
  assert.equal(drawn.length, 2);
  for (const args of drawn) assert.match(args[0].src, /\/idle-/);
  assert.ok(requested.every(src => src.includes('preparation-idle-v1')));
  pageReady = true; drawn.length = 0; context.drawSceneContents(1100);
  assert.equal(drawn.length, 2);
  for (const args of drawn) assert.match(args[0].src, /\/page-/);
});
