// Optional offline visual check: node docs/qa/preparation-slots-20260930/render-evidence.mjs
// @napi-rs/canvas is a QA-only dependency; it is not needed to build or ship the game.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { preparationSourceSpecs } from '../../../scripts/campaign-preparation-idle-v1.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const out = dirname(fileURLToPath(import.meta.url));
const require = createRequire(root + '/package.json');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const html = readFileSync(root + '/dist/index.html', 'utf8');
const specs = preparationSourceSpecs(html), packs = JSON.parse(readFileSync(root + '/dist/preparation-idle-packs.json', 'utf8'));
function extract(name) {
  const start = html.indexOf('function ' + name + '('); let end = start;
  assert.ok(start >= 0, name);
  while ((end = html.indexOf('}', end + 1)) >= 0) {
    const part = html.slice(start, end + 1);
    try { new vm.Script('(' + part + ')'); return part; } catch (_) {}
  }
  throw Error(name);
}
const images = new Map();
for (const pack of Object.values(packs)) for (const spec of [pack.poster, ...pack.pages]) {
  images.set(spec.src, await loadImage(root + '/dist/' + spec.src));
}
const ids = ['bach_dien', 'linh_dong', 'luc_anh', 'thay_mo', 'dinh_loi', 'ong_hang_pho'];
const draft = ids.map((id, slot) => ({ id, slot, row: slot < 3 ? 'front' : 'back' }));
const report = { method: 'Actual generated drawSceneContents with real RGBA pages and idle fallback, offline Skia. No browser/Safari or deployment certification.',
  authoredFrames: Object.values(specs).reduce((n, s) => n + s.frames, 0), heroes: [], views: [] };
for (const [id, pack] of Object.entries(packs)) {
  const bytes = p => p.atlasWidth * p.atlasHeight * 4;
  const largestPair = Math.max(...pack.pages.map((p, i) => bytes(p) + bytes(pack.pages[(i + 1) % pack.pages.length])));
  const spec = specs[id];
  report.heroes.push({ id, originalBytes: (spec.atlasWidth || spec.cols * (spec.strideW || spec.cellW)) *
    (spec.atlasHeight || Math.ceil(spec.frames / spec.cols) * (spec.strideH || spec.cellH)) * 4,
    maxCurrentNextAndPosterBytes: largestPair + bytes(pack.poster), frames: spec.frames });
}
report.originalIdleMiB = report.heroes.reduce((n, h) => n + h.originalBytes, 0) / 2 ** 20;
report.maxActiveIdleMiB = report.heroes.reduce((n, h) => n + h.maxCurrentNextAndPosterBytes, 0) / 2 ** 20;
assert.ok(report.maxActiveIdleMiB < 64);
for (const [name, w, h] of [['mobile', 390, 310], ['desktop', 768, 610]]) {
  const cv = createCanvas(w * 2, h * 2), ctx = cv.getContext('2d'); let ready = false;
  const box = vm.createContext({ spriteSpecs: specs, preparationIdlePacks: packs, reducedMotion: { matches: false },
    sceneState: { active: true, width: w, height: h, canvas: cv, draft }, sceneImages: new Map(),
    campaignBattleOpen: () => false,
    preparationEnemies: () => draft.slice(0, 3).map(p => ({ ...p, enemy: true })),
    preparationDrag: null, farmAttackSpecs: {}, drawCampaignFarm() {},
    portraitSrc: () => { throw Error('portrait fallback in authored preparation'); },
    imageForScene: src => ready || src.includes('/idle-') ? images.get(src) : { complete: false, naturalWidth: 0 }
  });
  for (const name of ['frameAt', 'preparationSpriteFor', 'drawSceneContents']) vm.runInContext(extract(name), box);
  box.drawSceneContents(0); const delayed = ctx.getImageData(0, 0, cv.width, cv.height).data;
  ready = true; box.drawSceneContents(0); const loaded = ctx.getImageData(0, 0, cv.width, cv.height).data;
  let differences = 0, maxDelta = 0, maxVisibleDelta = 0;
  for (let i = 0; i < loaded.length; i++) if (delayed[i] !== loaded[i]) { differences++; maxDelta = Math.max(maxDelta, Math.abs(delayed[i] - loaded[i])); }
  for (let i = 0; i < loaded.length; i += 4) {
    maxVisibleDelta = Math.max(maxVisibleDelta, Math.abs(delayed[i + 3] - loaded[i + 3]));
    for (let c = 0; c < 3; c++) maxVisibleDelta = Math.max(maxVisibleDelta,
      Math.abs(delayed[i + c] * delayed[i + 3] - loaded[i + c] * loaded[i + 3]) / 255);
  }
  assert.ok(maxVisibleDelta <= 2, 'same idle body with only subpixel filtering differences');
  for (const [state, time] of [['waiting', 0], ['animated', 1100]]) {
    ready = state === 'animated'; box.drawSceneContents(time);
    ctx.save(); ctx.globalCompositeOperation = 'destination-over'; ctx.fillStyle = '#ded5bc'; ctx.fillRect(0, 0, w, h); ctx.restore();
    writeFileSync(`${out}/${name}-${state}.png`, cv.toBuffer('image/png'));
  }
  report.views.push({ name, width: w, height: h, fallbackPixelChannelDifferences: differences, fallbackMaxChannelDelta: maxDelta,
    fallbackMaxPremultipliedChannelDelta: maxVisibleDelta, displayedBodies: 9 });
}
report.ok = true;
writeFileSync(out + '/report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ok: report.ok, originalIdleMiB: report.originalIdleMiB, maxActiveIdleMiB: report.maxActiveIdleMiB, views: report.views }));
