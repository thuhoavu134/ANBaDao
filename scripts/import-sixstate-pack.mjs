// Generic importer: Kiếm Thế six-state pack (kiemthe-animation-packager, --framing uniform)
// -> assets/characters/<slug>/ battle atlases + detail atlas + runtime-meta.json + presentation.json.
// One script for every hero; hero.json stays the single source of truth for rules/sfx/battle.
// Usage: node scripts/import-sixstate-pack.mjs <packDir> <slug> <heroId> [budgetScale=0.5]
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const [packDir, slug, heroId, scaleArg, idleScaleArg] = process.argv.slice(2);
if (!packDir || !slug || !heroId) { console.error('usage: <packDir> <slug> <heroId> [budgetScale] [idleScale]'); process.exit(2); }
const budgetScale = Number(scaleArg || 0.5);
// idle may be stored smaller than the other clips (a phone draws a hero at about a third of the idle cell).
const idleScale = Number(idleScaleArg || budgetScale);
const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const outDir = join(root, 'assets', 'characters', slug);
mkdirSync(outDir, { recursive: true });
const STATE_TO_CLIP = { idle: 'idle', run: 'run', atk: 'basic', ultimate: 'ultimate', hit: 'hit', 'fall-die': 'fall-die' };
const sha8 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 8);

// Drop previously imported hashed atlases so the folder holds exactly one revision.
for (const f of readdirSync(outDir)) if (/^(idle|run|basic|ultimate|hit|fall-die)-0-[0-9a-f]{8}\.webp$|^detail-[0-9a-f]{8}\.webp$/.test(f)) unlinkSync(join(outDir, f));

async function alphaBoxes(png, cols, cellW, cellH, frames) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const boxes = [];
  for (let i = 0; i < frames; i++) {
    const cx = (i % cols) * cellW, cy = Math.floor(i / cols) * cellH;
    let top = -1, bottom = -1;
    for (let y = 0; y < cellH; y++) {
      let any = false;
      for (let x = 0; x < cellW; x++) if (data[((cy + y) * info.width + cx + x) * 4 + 3] > 12) { any = true; break; }
      if (any) { if (top < 0) top = y; bottom = y; }
    }
    if (top >= 0) boxes.push({ top, bottom, height: bottom - top + 1 });
  }
  return boxes;
}
const median = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

// Owner rule 2026-10-22 (root cause of the Nguyệt Diệp / Tịnh Mặc hero-detail shake): the idle of a uniform
// pack must use ONE body anchor for every frame. A per-frame anchor follows whatever swings in the bottom band
// (sword, tassel, hem) and shifts the whole character sideways although the source video is smooth.
// Packs from the fixed packager carry crop.anchor.locked=true; older packs are checked on the anchors themselves.
export function assertIdleAnchorLocked(meta) {
  const rows = (meta.crop?.frames || []).map(f => f.anchorXSourcePx).filter(v => typeof v === 'number');
  const spread = rows.length ? Math.max(...rows) - Math.min(...rows) : 0;
  if (meta.crop?.anchor?.locked === false || spread > 0.5) {
    throw new Error(`idle: body anchor moves ${spread.toFixed(1)}px across frames (per-frame anchor => shaking idle). ` +
      'Re-pack with the current kiemthe-animation-packager (idle is always anchor-locked), ' +
      'or add "idle" to fixedAnchorStates in the manifest. See docs/HERO-INTEGRATION-STANDARD.md.');
  }
}

const clips = {}; let detail = null; let bodyFull = null, footFull = null;
for (const [state, clip] of Object.entries(STATE_TO_CLIP)) {
  const meta = JSON.parse(readFileSync(join(packDir, state, 'metadata.json'), 'utf8'));
  if (!/uniform/.test(meta.crop?.method || '')) throw new Error(`${state}: pack must be built with --framing uniform`);
  if (state === 'idle') assertIdleAnchorLocked(meta);
  const page = meta.atlasPages[0], [cellW, cellH] = meta.crop.cell, frames = meta.frameCount;
  const png = join(packDir, state, page.file);
  const durationMs = state === 'idle'
    ? Math.round(meta.frames.reduce((s, f) => s + f.durationMs, 0) * 1000) / 1000
    : Math.round(meta.sourceDurationSeconds * 1000);
  if (state === 'idle') {
    const boxes = await alphaBoxes(png, page.columns, cellW, cellH, frames);
    bodyFull = median(boxes.map(b => b.height));
    footFull = meta.crop.footLineCellY;
// smartSubsample: full-resolution chroma. Default 4:2:0 halves colour resolution and cost ~4% saturation on the
// downscaled hero atlases (Lăng Vân: -8% -> -4% vs source, same pixels) for +2% file size (owner 2026-10-24: nhợt nhạt).
    const DETAIL_MAX_MIB = 30;                       // doctor limit is 32 MiB decoded; keep headroom
    const srcW = page.canvas[0], srcH = page.canvas[1];
    const fit = Math.min(1, Math.sqrt((DETAIL_MAX_MIB * 1024 * 1024) / (srcW * srcH * 4)));
    // Shrink by whole cells so the metadata below describes the file exactly; resizing the sheet without the cell
    // size left Khaos' detail at 3796x2071 against 4032x2200 in metadata and every frame was cut a little further
    // off - the hero screen idle shook (owner 2026-10-24).
    const dCellW = fit < 1 ? Math.floor(cellW * fit) : cellW, dCellH = fit < 1 ? Math.floor(cellH * fit) : cellH;
    const dW = fit < 1 ? dCellW * page.columns : srcW, dH = fit < 1 ? dCellH * page.rows : srcH;
    const detailImg = fit < 1 ? sharp(png).resize(dW, dH, { kernel: 'lanczos3' }) : sharp(png);
    const buf = await detailImg.webp({ quality: 92, alphaQuality: 100, effort: 5, smartSubsample: true }).toBuffer();
    const file = `detail-${sha8(buf)}.webp`; writeFileSync(join(outDir, file), buf);
    detail = { file, frames, cols: page.columns, cellW: dCellW, cellH: dCellH, durationMs, atlasWidth: dW, atlasHeight: dH, note: 'hero-detail screen only (full resolution); battle uses clips.idle' };
  }
  // Cell and atlas must agree exactly: deriving both from the same rounded cell keeps cols*cellW == atlas width
  // (importing at an odd budget scale left Khaos 2 px short of his metadata and the doctor refused the build).
  // Owner 2026-10-24: six authored idle pages (~39 MiB) do not fit the ~44.7 MiB an iPhone gives decoded images, so
  // action pages evicted them and the heroes flickered all battle long. A phone draws a hero at roughly a third of
  // the idle cell, so idle is imported smaller (idleScale) and drawScale scales it back at draw time: same size on
  // screen, a fraction of the memory.
  const clipScale = state === 'idle' ? idleScale : budgetScale;
  const cw = Math.max(1, Math.floor(page.canvas[0] * clipScale / page.columns));
  const ch = Math.max(1, Math.floor(page.canvas[1] * clipScale / page.rows));
  const w = cw * page.columns, h = ch * page.rows;
  const buf = await sharp(png).resize(w, h, { kernel: 'lanczos3' }).webp({ quality: 90, alphaQuality: 100, effort: 5, smartSubsample: true }).toBuffer();
  const file = `${clip}-0-${sha8(buf)}.webp`; writeFileSync(join(outDir, file), buf);
  // Phone variant of idle: same frames at half the cell. An iPhone draws a hero at ~40 px, so half size is still
  // twice the drawn pixels, while six idle pages drop from ~39 MiB to ~10 MiB - which is what leaves room for the
  // action pages (the flicker). Desktop keeps the full page, so nothing looks softer there.
  let lite = null;
  if (state === 'idle') {
    const lcw = Math.max(1, Math.floor(cw / 2)), lch = Math.max(1, Math.floor(ch / 2));
    const lbuf = await sharp(png).resize(lcw * page.columns, lch * page.rows, { kernel: 'lanczos3' })
      .webp({ quality: 92, alphaQuality: 100, effort: 5, smartSubsample: true }).toBuffer();
    const lfile = `idle-lite-${sha8(lbuf)}.webp`; writeFileSync(join(outDir, lfile), lbuf);
    lite = { file: lfile, cellW: lcw, cellH: lch, drawScale: 2, foot: Math.round(footFull * (clipScale / 2) * 10) / 10,
      atlasWidth: lcw * page.columns, atlasHeight: lch * page.rows };
  }
  clips[clip] = { frames, cols: page.columns, cellW: cw, cellH: ch, durationMs, pageFrames: frames, ...(lite ? { lite } : {}),
    pages: [{ file, frames, cols: page.columns, rows: page.rows, atlasWidth: cw * page.columns, atlasHeight: ch * page.rows }],
    budgetScale, ...(clipScale !== budgetScale ? { drawScale: budgetScale / clipScale } : {}), sourceState: state, frameDurationsMs: meta.frames.map(f => f.durationMs) };
}
const pivot = Math.round(clips.idle.cellW / 2);
const foot = Math.round(footFull * budgetScale * 10) / 10;
const body = Math.round(bodyFull * budgetScale);
// Wide states (clones, long slashes) get a wider cell from the packager with the body centred,
// so the pivot is per clip; scale, foot line and body height are shared by every state.
for (const [key, c] of Object.entries(clips)) Object.assign(c, { pivot: Math.round(c.cellW / 2), foot, body });
// idle is on its own scale: its foot line lives in its own pixels
if (clips.idle && idleScale !== budgetScale) clips.idle.foot = Math.round(footFull * idleScale * 10) / 10;

const pm = JSON.parse(readFileSync(join(packDir, 'PACK-MANIFEST.json'), 'utf8'));
const runtime = {
  schema: 'authored-hero-assets/v1', assetRevision: `kiemthe-sixstate-${pm.version}-uniform`,
  source: `kiemthe-animation-packager ${pm.version} (--framing uniform, validate_package PASS)`,
  clips, budget: { reason: 'iOS battle working set: idle page <= 8 MiB, any page <= 12 MiB (hero:doctor)', date: new Date().toISOString().slice(0, 10) }, detail
};
writeFileSync(join(outDir, 'runtime-meta.json'), JSON.stringify(runtime, null, 2) + '\n');
const presentation = {
  schema: 'battle-hero-presentation/v1', heroId, aliases: [slug, heroId, heroId.replace(/^hero_splus_/, '')],
  referenceBodyHeight: body, footOffsetY: 0, registration: 'source-body',
  clips: Object.fromEntries(Object.entries(clips).map(([k, c]) => [k, { bodyHeight: body, footX: c.pivot, footY: foot }])),
  vfxClips: [], states: { idle: ['idle'], attack: ['basic'], ultimate: ['ultimate'] },
  evidence: `Uniform-framed six-state pack ${pm.version}: one shared scale for every state; body ${bodyFull}px / foot line ${footFull}px measured from idle alpha at full cell, x${budgetScale}.`
};
writeFileSync(join(outDir, 'presentation.json'), JSON.stringify(presentation, null, 2) + '\n');
console.log(JSON.stringify({ slug, body, foot, pivot, clips: Object.fromEntries(Object.entries(clips).map(([k, c]) => [k, c.pages[0].file])), detail: detail.file }));
