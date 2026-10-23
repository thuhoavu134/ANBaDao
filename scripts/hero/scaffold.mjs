// STEP: turn the owner's hero brief + the imported pack into a playable, registered, tested hero.
// Replaces the per-hero make_hero_<x>.mjs / patch_<x>.mjs / patch_test_sfx.mjs scripts. Idempotent: every part
// that already exists is left alone (re-integrating an existing hero never rewrites its hand-tuned hero.json).
//
//   node scripts/hero/scaffold.mjs --slug <slug> --brief <brief.json> [--bundle C:/lt/packs/<slug>/bundle.json]
//
// Needs (run after scripts/import-sixstate-pack.mjs + scripts/hero/key_vfx.py + scripts/hero/extract_sfx.py):
//   assets/characters/<slug>/runtime-meta.json, assets/vfx/<slug>/provenance.json (optional), <packs>/<slug>/sfx-rows.json
// Writes / registers:
//   assets/characters/<slug>/hero.json           markers derived from the clip audio, VFX + SFX wired, approval pending
//   src/domain/hero/<slug>.mjs                   <KEY>_KIT + <KEY>_HERO profile from the brief
//   src/domain/hero/splus-extras.mjs             one import + one entry (at the @scaffold markers)
//   src/domain/combat/splus-mechanics.mjs        AUTHORED_KITS.<key> + default AUTHORED_HIT.<key> rule
//   tests/<slug>.test.mjs                        registration + hit-count + targeting contract
// Special mechanics (stacks, statuses, execute...) are then written INSIDE the generated AUTHORED_HIT.<key>.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { ELEMENT, TARGETS, validateBrief, markers, cueAt, domainModule, heroTest, effectsSpec } from './scaffold-lib.mjs';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
async function medianBodyHeight(file, cols, cellW, cellH, frames) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const hs = [];
  for (let i = 0; i < frames; i++) {
    const ox = (i % cols) * cellW, oy = Math.floor(i / cols) * cellH;
    let top = -1, bottom = -1;
    for (let y = 0; y < cellH; y++) {
      let any = false;
      for (let x = 0; x < cellW && !any; x++) any = data[((oy + y) * info.width + ox + x) * 4 + 3] > 20;
      if (any) { if (top < 0) top = y; bottom = y; }
    }
    if (top >= 0) hs.push(bottom - top + 1);
  }
  hs.sort((a, b) => a - b);
  return hs[Math.floor(hs.length / 2)] || 0;
}

const read = p => JSON.parse(readFileSync(p, 'utf8'));
const write = (p, v) => writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n', 'utf8');
const js = v => JSON.stringify(v);
const constName = key => key.toUpperCase();

export async function buildHeroJson({ slug, brief, meta, prov, sfxRows, today }) {
  const b = brief, key = b.key, prefix = key.replace(/_/g, '-');
  const vfx = prov?.clips || {};
  const cueStart = role => { const r = sfxRows[`${prefix}-${role}`]; return r ? Math.round(r.trim[0] * 1000) : null; };
  const vfxMs = role => (vfx[role] ? vfx[role].frames * vfx[role].frameMs : 0);
  const hits = { basic: b.kit.basic.hits || 1, ultimate: b.kit.ultimate.hits || 1 };
  const mb = markers(meta.clips.basic.durationMs, hits.basic, cueStart('basic'), vfxMs('vfx-basic'));
  const mu = markers(meta.clips.ultimate.durationMs, hits.ultimate, cueStart('ultimate'), vfxMs('vfx-ultimate'));
  const has = role => Object.hasOwn(sfxRows, `${prefix}-${role}`);
  const sfxBasic = [], sfxUlt = [];
  if (has('basic')) sfxBasic.push(cueAt(`${prefix}-basic`, cueStart('basic'), mb));
  if (has('basic-hit')) sfxBasic.push({ cue: `${prefix}-basic-hit`, at: 'hit' });
  if (has('ultimate')) sfxUlt.push(cueAt(`${prefix}-ultimate`, cueStart('ultimate'), mu));
  if (has('ultimate-vfx')) sfxUlt.push({ cue: `${prefix}-ultimate-vfx`, at: 'release', lead: 0 });
  if (has('ultimate-hit')) sfxUlt.push({ cue: `${prefix}-ultimate-hit`, at: 'hit' });
  // Melee heroes (duelist/striker/guardian) close the distance on every action; ranged ones stay put.
  const lunge = ['duelist', 'striker', 'guardian'].includes(String(brief.archetype || '').toLowerCase()) ? { dashMs: 240 } : null;
  const basic = { clip: 'basic', ...mb, sfx: sfxBasic, ...(lunge ? { lunge } : {}) };
  if (vfx['vfx-basic']) {
    if (b.kit.basic.target === 'enemy') basic.projectile = { vfx: 'vfx-basic', from: [0.55, 0.5], scale: 1.25, arc: 0, flight: Math.max(200, Math.min(500, mb.hits[0] - mb.release)) };
    basic.impact = { vfx: 'vfx-basic', anchor: 'body', scale: 1, shake: 4 };
  }
  const ultimate = { clip: 'ultimate', ...mu, sfx: sfxUlt, ...(lunge ? { lunge } : {}) };
  if (vfx['vfx-ultimate']) ultimate.area = { vfx: 'vfx-ultimate', anchor: 'body', scale: 1.6, shake: 7 };
  const battle = { tempo: { basic: 1.3, ultimate: 1.2 }, actions: { basic, ultimate }, reactions: { ...(has('hit') ? { hitCue: `${prefix}-hit` } : {}),  hit: 'hit', death: 'fall-die', durationMs: meta.clips.hit.durationMs } };
  // Victory: the run clip is boxed with a long stride and can come out smaller than idle.
  const base = join(ROOT, 'assets', 'characters', slug);
  const h = async c => medianBodyHeight(join(base, meta.clips[c].pages[0].file), meta.clips[c].pages[0].cols, meta.clips[c].cellW, meta.clips[c].cellH, meta.clips[c].frames);
  const hIdle = await h('idle'), hRun = await h('run');
  if (hRun > 0 && hIdle / hRun >= 1.05) battle.victory = { runVisualScale: +(hIdle / hRun).toFixed(2) };
  const sfx = Object.fromEntries(Object.entries(sfxRows).map(([cue, r]) => [cue, r.file]));
  return {
    schema: 'luc-than-authored-hero/v1', id: key, sourceId: `hero_splus_${key}`, slug,
    identityVersion: meta.assetRevision || `kiemthe-sixstate-${today}`,
    host: {
      he: b.he, faction: b.faction || (b.he === 'soul' ? 'am_hon' : 'hu_mong'), archetype: b.archetype || 'mystic', rarity: b.rarity || 'ssr',
      name: b.name, role: b.role || '', col: b.color || '#5f8fb8',
      stats: { hp: 1150, mp: 60, atk: 150, def: 65, spd: 102, ...(b.stats || {}) },
    },
    kit: {
      passive: { name: b.kit.passive.name, desc: b.kit.passive.desc },
      basic: { name: b.kit.basic.name, cost: 0, desc: b.kit.basic.desc, fx: { kind: 'damage', target: b.kit.basic.target, power: b.kit.basic.power } },
      ultimate: { name: b.kit.ultimate.name, cost: 60, desc: b.kit.ultimate.desc, fx: { kind: 'damage', target: b.kit.ultimate.target, power: b.kit.ultimate.power } },
    },
    art: { portrait: `assets/characters/${slug}/portrait-00000000.webp` },
    clipsMeta: 'runtime-meta.json',
    vfxBase: `assets/vfx/${slug}/`, vfxMeta: `assets/vfx/${slug}/provenance.json`,
    battle, sfx,
    surfaces: ['roster', 'formation', 'hero-detail', 'battle'],
    approval: {
      animation: `six-state pack ${meta.assetRevision || ''} (--framing uniform, idle anchor locked); owner review pending`,
      vfx: Object.keys(vfx).length ? 'owner VFX clips keyed by scripts/hero/key_vfx.py; owner review pending' : 'no VFX clip supplied',
      sfx: 'cut from the owner clip audio by scripts/hero/extract_sfx.py; owner review pending',
      timing: `markers derived from the clip audio by scripts/hero/scaffold.mjs (${today}); owner review pending`,
    },
  };
}

function patchOnce(file, anchor, insert, already) {
  const p = join(ROOT, file);
  const s = readFileSync(p, 'utf8');
  if (already.test(s)) return 'skip';
  const n = s.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${file}: anchor found ${n}x: ${anchor.slice(0, 70)}`);
  writeFileSync(p, s.replace(anchor, insert + anchor), 'utf8');
  return 'added';
}

export function register(b, slug) {
  const key = b.key, K = constName(key), done = {};
  done.import = patchOnce('src/domain/hero/splus-extras.mjs', '/* @scaffold:import', `import {${K}_HERO} from './${slug}.mjs';\n`, new RegExp(`import \\{${K}_HERO\\}`));
  done.entry = patchOnce('src/domain/hero/splus-extras.mjs', '\n  /* @scaffold:hero', `, ${K}_HERO`, new RegExp(`[ ,]${K}_HERO\\s*\\n\\s*/\\* @scaffold:hero`));
  const M = 'src/domain/combat/splus-mechanics.mjs';
  const kit = `${key}:{basic:{hits:${b.kit.basic.hits || 1},area:${b.kit.basic.target === 'aoe_enemy'}},ultimate:{hits:${b.kit.ultimate.hits || 1},area:${b.kit.ultimate.target === 'aoe_enemy'}}}`;
  done.kits = patchOnce(M, '}};\n  const INK_SET', `},${kit.slice(0, -1)}`, new RegExp(`AUTHORED_KITS=\\{[^\\n]*\\b${key}:\\{basic:`));
  const rule = `    // ${b.name} (scaffold): default rule ${Math.round(b.kit.basic.power * 100)}% / ${Math.round(b.kit.ultimate.power * 100)}% elemental damage split over the hits.\n` +
    `    // Write this hero's special mechanics HERE and extend tests/${slug}.test.mjs.\n` +
    `    ${key}(actor,target,cast,index){\n      const power=cast.kind==='basic'?${b.kit.basic.power}:${b.kit.ultimate.power};\n` +
    `      damage(actor,target,{multiplier:power/cast.hits,action:cast.kind,type:'elemental'});\n    },\n`;
  done.hit = patchOnce(M, '    tinh_mac(actor,target,cast,index){', rule, new RegExp(`\\n    ${key}\\(actor,target,cast,index\\)\\{`));
  // Brief-declared mechanics: one AUTHORED_EFFECTS entry, executed by src/domain/combat/authored-effects.mjs.
  const spec = effectsSpec(b);
  if (spec) done.effects = patchOnce('src/domain/combat/authored-effects-registry.mjs', '  /* @scaffold:effects',
    `  ${key}: ${JSON.stringify(spec)},\n`, new RegExp(`\\n  ${key}: \\{`));
  else done.effects = 'none declared';
  return done;
}

async function main() {
  const argv = process.argv.slice(2);
  const val = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  const slug = val('--slug'), briefPath = val('--brief');
  if (!slug || !briefPath) { console.error('usage: --slug <slug> --brief <brief.json> [--bundle <bundle.json>]'); process.exit(2); }
  const brief = validateBrief(read(briefPath));
  const today = new Date().toISOString().slice(0, 10);
  const charDir = join(ROOT, 'assets', 'characters', slug);
  const metaPath = join(charDir, 'runtime-meta.json');
  if (!existsSync(metaPath)) throw new Error(`${metaPath} missing: run scripts/import-sixstate-pack.mjs first`);
  const meta = read(metaPath);
  const provPath = join(ROOT, 'assets', 'vfx', slug, 'provenance.json');
  const prov = existsSync(provPath) ? read(provPath) : null;
  const bundlePath = val('--bundle') || join('C:/lt/packs', slug, 'bundle.json');
  const rowsPath = join(dirname(bundlePath), 'sfx-rows.json');
  const sfxRows = existsSync(rowsPath) ? read(rowsPath).cues : (prov?.sfx || {});
  const report = {};

  const heroPath = join(charDir, 'hero.json');
  if (existsSync(heroPath)) report.heroJson = 'skip (exists: re-integration keeps the hand-tuned hero.json)';
  else { write(heroPath, await buildHeroJson({ slug, brief, meta, prov, sfxRows, today })); report.heroJson = 'created'; }

  const modPath = join(ROOT, 'src', 'domain', 'hero', `${slug}.mjs`);
  if (existsSync(modPath)) report.domain = 'skip';
  else { write(modPath, domainModule(brief, slug, today)); report.domain = 'created'; }

  Object.assign(report, register(brief, slug));

  const testPath = join(ROOT, 'tests', `${slug}.test.mjs`);
  if (existsSync(testPath)) report.test = 'skip';
  else { write(testPath, heroTest(brief, slug)); report.test = 'created'; }

  for (const [k, v] of Object.entries(report)) console.log(`  ${k.padEnd(9)} ${v}`);
  console.log('SCAFFOLD PASS');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(e => { console.error('SCAFFOLD FAIL: ' + e.message); process.exit(1); });
}
