// hero:doctor — mandatory gate for every hero.json hero (and budget-enforced legacy heroes).
// Run by scripts/build-static.mjs before and after installation; any FAIL stops the build.
//   node scripts/hero-doctor.mjs            # source checks
//   node scripts/hero-doctor.mjs --dist     # source + built roster/battle/SFX registration
// Each rule maps to a regression the owner hit when a new hero was added:
//   invisible hero on the field  -> atlas > 4096 px or > 32 MiB decoded, wrong cell grid
//   hero missing from roster     -> not registered in DATA.heroes / roster lists
//   silent combat                -> SFX cue not declared, file missing, or not in HonVietSfx
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { loadAuthoredHeroes, battleDescriptor, authoredSfxMap } from './authored-hero-install.mjs';
import { frameFootLines } from './hero-idle-anchor.mjs';

// iOS battle cache is 64 MiB minus persistent pages (~44 MiB) shared by all 12 units, with one decode
// at a time. A 26 MiB idle page left Khaos as a placeholder on iPhone (19/10/2026), so the limit is per
// page of the in-battle working set, not per device texture size.
export const LIMITS = Object.freeze({ maxEdge: 4096, maxDecodedBytes: 12 * 1024 * 1024, maxIdleBytes: 8 * 1024 * 1024 });
export const REQUIRED_CLIPS = Object.freeze({ idle: 30, run: 18, basic: 18, ultimate: 18, hit: 18, 'fall-die': 18 });
// Legacy heroes whose atlases must also respect the budget (not hero.json yet).
export const BUDGET_ENFORCED_LEGACY = Object.freeze(['be-an']);

async function checkAtlas(root, src, expect, fail, label) {
  const file = join(root, src);
  if (!existsSync(file)) return fail(`${label}: missing ${src}`);
  // /assets is served max-age=1y immutable (vercel.json): a changed atlas under an old name stays
  // cached on players' phones and is cut with the NEW cell grid (garbled Khaos/Bé An, 19/10/2026).
  // Every atlas name therefore carries the first 8 hex of its SHA-256.
  const hashed = /-([0-9a-f]{8})\.webp$/.exec(src);
  const digest = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8);
  if (!hashed) fail(`${label}: ${src} must be named <name>-${digest}.webp (immutable asset cache)`);
  else if (hashed[1] !== digest) fail(`${label}: ${src} content changed; rename to -${digest}.webp`);
  const { width, height } = await sharp(file).metadata();
  const bytes = width * height * 4;
  if (width > LIMITS.maxEdge || height > LIMITS.maxEdge) fail(`${label}: ${src} is ${width}x${height}, edge > ${LIMITS.maxEdge}px`);
  if (bytes > LIMITS.maxDecodedBytes) fail(`${label}: ${src} decodes to ${(bytes / 1048576).toFixed(1)} MiB > 12 MiB`);
  if (/idle/.test(label + src) && !/campaign/.test(src) && bytes > LIMITS.maxIdleBytes) fail(`${label}: idle ${src} decodes to ${(bytes / 1048576).toFixed(1)} MiB > 8 MiB (always resident on iPhone)`);
  if (expect) {
    if (expect.atlasWidth && (expect.atlasWidth !== width || expect.atlasHeight !== height)) fail(`${label}: ${src} is ${width}x${height}, meta says ${expect.atlasWidth}x${expect.atlasHeight}`);
    if (expect.cols && expect.cellW && expect.cols * expect.cellW !== width) fail(`${label}: ${src} width ${width} != cols ${expect.cols} x cellW ${expect.cellW}`);
    if (expect.rows && expect.cellH && expect.rows * expect.cellH !== height) fail(`${label}: ${src} height ${height} != rows ${expect.rows} x cellH ${expect.cellH}`);
    if (expect.frames && expect.cols && expect.rows && expect.frames > expect.cols * expect.rows) fail(`${label}: ${src} holds ${expect.cols * expect.rows} cells < ${expect.frames} frames`);
  }
  return { width, height, bytes };
}

export async function doctorSource(root) {
  const errors = [], report = [];
  const fail = message => { errors.push(message); };
  const heroes = loadAuthoredHeroes(root);
  const mechanics = readFileSync(join(root, 'src/domain/combat/splus-mechanics.mjs'), 'utf8');
  const kits = /const AUTHORED_KITS=\{([^\n]*)\};/.exec(mechanics)?.[1] || '';
  for (const entry of heroes) {
    const { hero, meta } = entry, label = hero.slug, d = battleDescriptor(entry);
    for (const [clip, frames] of Object.entries(REQUIRED_CLIPS)) {
      const c = meta.clips[clip];
      if (!c) { fail(`${label}: required clip ${clip} missing`); continue; }
      if (c.frames !== frames) fail(`${label}: ${clip} has ${c.frames} frames, contract is ${frames}`);
      if (!(c.durationMs > 0)) fail(`${label}: ${clip} needs durationMs`);
    }
    let peak = 0;
    for (const [key, c] of Object.entries(d.clips)) for (const p of c.pages) {
      const r = await checkAtlas(root, p.src, { ...p, cellW: c.cellW, cellH: c.cellH }, fail, `${label}/${key}`);
      if (r) peak = Math.max(peak, r.bytes);
    }
    if (meta.detail) {
      const r = await checkAtlas(root, entry.base + meta.detail.file, { atlasWidth: meta.detail.atlasWidth, atlasHeight: meta.detail.atlasHeight, cols: meta.detail.cols, cellW: meta.detail.cellW, cellH: meta.detail.cellH }, () => {}, `${label}/detail`);
      // Host-page only (one hero on screen): 32 MiB, not the battle working-set limits.
      if (r && r.bytes > 32 * 1024 * 1024) fail(`${label}: detail atlas ${(r.bytes / 1048576).toFixed(1)} MiB > 32 MiB`);
      if (!/-[0-9a-f]{8}\.webp$/.test(meta.detail.file)) fail(`${label}: detail atlas must be content-hash named`);
      // Hero-detail idle must not bob: the source idle lifts the feet between frames, so the pack
      // carries a per-frame footOffsets table the renderer adds back. No table (or a table that
      // still leaves the foot line moving > 2px) is a build failure, not a cosmetic warning.
      const offs = meta.detail.footOffsets;
      if (!Array.isArray(offs) || offs.length !== meta.detail.frames) {
        fail(`${label}: detail idle not anchored — run node scripts/hero-idle-anchor.mjs ${label}`);
      } else {
        const lines = await frameFootLines(join(root, entry.base, meta.detail.file), meta.detail.cols, meta.detail.cellW, meta.detail.cellH, meta.detail.frames);
        const moved = lines.map((v, i) => (v < 0 ? -1 : v + (offs[i] || 0))).filter((v) => v >= 0);
        const span = Math.max(...moved) - Math.min(...moved);
        if (span > 2) fail(`${label}: detail idle foot line still moves ${span}px (max 2) — re-run node scripts/hero-idle-anchor.mjs ${label}`);
      }
    }
    if (!existsSync(join(root, hero.art.portrait))) fail(`${label}: missing portrait ${hero.art.portrait}`);
    // Owner rule 2026-10-20: portrait = idle frame 0, generated by scripts/hero-portrait-from-idle.mjs.
    if (!/\/portrait-[0-9a-f]{8}\.webp$/.test(hero.art.portrait || '')) fail(`${label}: art.portrait must be idle frame 0 — run node scripts/hero-portrait-from-idle.mjs ${hero.slug}`);
    for (const [cue, file] of Object.entries(hero.sfx || {})) if (!existsSync(join(root, 'assets/audio/sfx', file))) fail(`${label}: SFX ${cue} file missing assets/audio/sfx/${file}`);
    for (const kind of ['basic', 'ultimate']) {
      const a = hero.battle?.actions?.[kind];
      if (!a) { fail(`${label}: battle.actions.${kind} missing`); continue; }
      const clip = meta.clips[a.clip];
      if (!clip) fail(`${label}: ${kind} uses unknown clip ${a.clip}`);
      const marks = [a.release, ...a.hits, a.recovery];
      if (!a.hits?.length || marks.some((m, i) => !(m >= 0) || (i && m < marks[i - 1]))) fail(`${label}: ${kind} markers must be release <= hits <= recovery`);
      // The body clip owns recovery, except a projectile/area VFX released from it may finish after the body
      // returns to idle (e.g. Bạch Diện throws the mask at the end of a 2s cast): allow release + VFX length.
      const tailVfx = d.clips[a.projectile?.vfx || a.area?.vfx];
      // A sky-drop area (area.drop) lands on every hit: its tail is the last hit + the landing frames.
      const dropTail = a.area?.drop && tailVfx ? a.hits[a.hits.length - 1] + (tailVfx.frames - (Number(a.area.drop.landFrame) || 0)) * (tailVfx.frameMs || 60) : 0;
      const limit = clip ? Math.max(clip.durationMs, dropTail, tailVfx ? a.release + Number(tailVfx.durationMs || tailVfx.frames * (tailVfx.frameMs || 60)) : 0) : 0;
      if (clip && a.recovery > limit + 1) fail(`${label}: ${kind} recovery ${a.recovery} > clip ${clip.durationMs}ms (+VFX tail ${limit}ms)`);
      for (const v of [a.projectile?.vfx, a.impact?.vfx, a.area?.vfx].filter(Boolean)) if (!d.clips[v]) fail(`${label}: ${kind} VFX ${v} not packaged`);
      for (const s of a.sfx || []) if (!hero.sfx?.[s.cue]) fail(`${label}: ${kind} cue ${s.cue} not declared in hero.sfx`);
      if (!(a.sfx || []).length) fail(`${label}: ${kind} has no SFX cue`);
    }
    for (const [type, spec] of Object.entries(hero.battle?.events || {})) {
      if (spec.vfx && !d.clips[spec.vfx]) fail(`${label}: event ${type} VFX ${spec.vfx} not packaged`);
      if (spec.sfx && !hero.sfx?.[spec.sfx]) fail(`${label}: event ${type} cue ${spec.sfx} not declared`);
    }
    const presentation = join(root, entry.base, 'presentation.json');
    if (!existsSync(presentation)) fail(`${label}: presentation.json missing`);
    else {
      const p = JSON.parse(readFileSync(presentation, 'utf8'));
      if (p.heroId !== hero.sourceId) fail(`${label}: presentation heroId ${p.heroId} != ${hero.sourceId}`);
      for (const clip of Object.keys(REQUIRED_CLIPS)) if (!p.clips?.[clip]) fail(`${label}: presentation lacks ${clip}`);
    }
    const domainKey = hero.sourceId.replace(/^hero_splus_/, '');
    const hasLegacyDomain = new RegExp(`key\\([a-z_]+\\)===['"]${domainKey}['"]`).test(mechanics);
    if (!hasLegacyDomain) {
      if (!new RegExp(`\\b${domainKey}:\\{basic:`).test(kits)) fail(`${label}: no AUTHORED_KITS.${domainKey} in splus-mechanics`);
      if (!new RegExp(`\\n    ${domainKey}\\(actor,target,cast,index\\)\\{`).test(mechanics)) fail(`${label}: no AUTHORED_HIT.${domainKey} rule`);
    }
    report.push({ hero: hero.id, clips: Object.keys(d.clips).length, peakPageMiB: +(peak / 1048576).toFixed(1), cues: Object.keys(hero.sfx || {}).length });
  }
  authoredSfxMap(heroes);
  for (const slug of BUDGET_ENFORCED_LEGACY) {
    const dir = join(root, 'assets/characters', slug);
    for (const name of readdirSync(dir).filter(n => n.endsWith('.webp') && !/campaign|^avatar|^card|^detail-/.test(n))) await checkAtlas(root, `assets/characters/${slug}/${name}`, null, fail, slug);
  }
  return { errors, report, heroes };
}

export function doctorDist(root, heroes) {
  const errors = [];
  const index = readFileSync(join(root, 'dist/index.html'), 'utf8');
  const battle = readFileSync(join(root, 'dist/battle.html'), 'utf8');
  if (!battle.includes('/* AUTHORED_HERO_RUNTIME_V1 */')) errors.push('dist/battle.html: authored runtime not installed');
  if (!index.includes('/* AUTHORED_HERO_HOST_V1 */')) errors.push('dist/index.html: authored host registration not installed');
  for (const html of [index, battle]) if (html.includes('/*HV_AUTHORED_SFX*/{}/*HV_AUTHORED_SFX_END*/')) errors.push('HonVietSfx authored cue map left empty');
  const roster = /OFFICIAL_ROSTER_12_IDS=Object\.freeze\((\[[^\]]*\])\)/.exec(index)?.[1] || '[]';
  for (const { hero } of heroes) {
    if (hero.battle?.owner === 'legacy') continue;
    if (!index.includes(`"${hero.id}":{"he"`)) errors.push(`${hero.id}: not in DATA.heroes`);
    if (!JSON.parse(roster).includes(hero.id)) errors.push(`${hero.id}: not in OFFICIAL_ROSTER_12_IDS`);
    if (!battle.includes(`"${hero.sourceId}":{"id":"${hero.id}"`)) errors.push(`${hero.id}: not in battle AUTHORED_HEROES`);
    for (const cue of Object.keys(hero.sfx || {})) for (const [name, html] of [['index', index], ['battle', battle]])
      if (!html.includes(`"${cue}":"`)) errors.push(`${hero.id}: SFX ${cue} not registered in ${name}`);
  }
  if (/data-hero-id="[a-z_]+",/.test(index)) errors.push('dist/index.html: corrupted CSS selector data-hero-id="a","b" (roster regex hit CSS)');
  return errors;
}

export async function runHeroDoctor(root, { dist = false } = {}) {
  const { errors, report, heroes } = await doctorSource(root);
  if (dist) errors.push(...doctorDist(root, heroes));
  if (errors.length) throw new Error('HERO DOCTOR FAIL\n - ' + errors.join('\n - '));
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  runHeroDoctor(root, { dist: process.argv.includes('--dist') })
    .then(report => console.log('HERO DOCTOR PASS ' + JSON.stringify(report)))
    .catch(error => { console.error(error.message); process.exit(1); });
}
