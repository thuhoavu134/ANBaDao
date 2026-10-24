// ONE COMMAND to integrate a Kiếm Thế six-state hero from the owner's video bundle to a reviewable PR.
// Any agent: run this, do not improvise. Full contract: docs/HERO-INTEGRATION-STANDARD.md ("Quy trình 1 lệnh").
//
// New hero (bundle of green-screen clips + a brief):
//   node scripts/integrate-hero.mjs --slug <slug> --id hero_splus_<x> --brief <brief.json> \
//        [--files idle.mp4 run.mp4 ...] | [--bundle C:/lt/packs/<slug>/bundle.json]
// Add --no-vfx when the hero's attack VFX is baked into the atk/ultimate clips (no vfx clips supplied).
// Re-integrate an existing hero from a pack that is already built:
//   node scripts/integrate-hero.mjs --slug <slug> --id hero_splus_<x> --pack <packDir>
//   node scripts/integrate-hero.mjs --slug <slug> --id hero_splus_<x> --manifest <pack-manifest.json>
//
// Steps (stops at the first failure, writes docs/qa/integrate/<slug>.md):
//   1 intake    scripts/hero/intake.mjs          bundle -> probed sources + pack manifest (no hand-written paths)
//   2 pack      kiemthe-animation-packager       --framing uniform, idle anchor always locked
//   3 validate  validate_package.py              pack complete and readable
//   4 parity    scripts/qa-idle-source-parity.mjs packed idle must move like the source video
//   5 import    scripts/import-sixstate-pack.mjs  refuses a pack whose idle anchor moves
//   6 vfx       scripts/hero/key_vfx.py          owner VFX clips -> atlases + provenance
//   7 sfx       scripts/hero/extract_sfx.py      SFX cut from the owner clips' own audio
//   8 scaffold  scripts/hero/scaffold.mjs        hero.json + domain module + registration + tests (brief required)
//   9 portrait  scripts/hero-portrait-from-idle.mjs  portrait = idle frame 0
//  9b landmark scripts/hero/portrait-landmark-check.mjs  roster card needs a reviewed face landmark (grid sheet on fail)
//  10 build     scripts/build-static.mjs         includes HERO DOCTOR
//  11 test      npm test                         must not add failing tests vs the cached baseline
//  12 battle    scripts/qa-authored-battle.mjs   real battle draws the hero's atlases, no JS errors
//  13 detail    scripts/qa-detail-probe.mjs      hero-detail screen has an animating idle canvas
//  14 evidence  scripts/qa-idle-frames.mjs       real canvas frames -> GIF for the PR
//  15 deliver   --deliver only: branch, commit, verified push, PR (never to main; owner merges)
// Special mechanics go INSIDE the generated AUTHORED_HIT.<key> rule and tests/<slug>.test.mjs — never in this file.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const argv = process.argv.slice(2);
const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const flag = k => argv.includes(k);
// A melee hero may carry its attack VFX inside the state clips; then there is no VFX clip to key.
const noVfx = flag('--no-vfx');
const slug = arg('--slug'), heroId = arg('--id') || (slug ? `hero_splus_${slug.replace(/-/g, '_')}` : null);
const key = (arg('--key') || (heroId || '').replace(/^hero_splus_/, '') || '');
const detailId = arg('--detail-id') || (heroId || '').replace(/^hero_splus_/, '');
const brief = arg('--brief'), bundleArg = arg('--bundle'), packArg = arg('--pack'), manifestArg = arg('--manifest');
const fi = argv.indexOf('--files');
const files = fi >= 0 ? argv.slice(fi + 1).filter(a => !a.startsWith('--')) : null;
// Test baseline for origin/main is cached OUTSIDE the repo (419 KB): capture it once on a clean checkout with
//   npm test > C:/lt/qa-baseline/tests.log
const baseline = arg('--baseline') || process.env.KIEMTHE_TEST_BASELINE || 'C:/lt/qa-baseline/tests.log';
if (!slug || !heroId) {
  console.error('usage: --slug <slug> --id hero_splus_<x> (--brief <json> with --files/--bundle) | --pack <dir> | --manifest <json>');
  process.exit(2);
}
const SKILL = process.env.KIEMTHE_PACKAGER_DIR ||
  join(process.env.USERPROFILE || '', 'aicoworker', 'openclaw', 'skills', 'kiemthe-animation-packager', 'scripts');
const PY = process.env.PACK_PYTHON || (existsSync('C:/lt/.venvs/pack/Scripts/python.exe') ? 'C:/lt/.venvs/pack/Scripts/python.exe' : 'python');
const bundle = bundleArg ? resolve(bundleArg) : join('C:/lt/packs', slug, 'bundle.json');

const report = [];
let packDir = packArg ? resolve(packArg) : null;

function step(name, cmd, args, opts = {}) {
  const t0 = Date.now();
  process.stdout.write(`[${name}] ${cmd} ${args.join(' ')}\n`);
  const r = spawnSync(cmd, args, { cwd: opts.cwd || root, encoding: 'utf8', maxBuffer: 128 << 20,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', ...(opts.env || {}) } });
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
  const tail = out.split(/\r?\n/).filter(Boolean).slice(-(opts.tail || 4)).join('\n');
  const ok = r.status === 0 && (!opts.expect || opts.expect.test(out));
  report.push({ name, ok, sec: Math.round((Date.now() - t0) / 1000), tail });
  console.log(`[${name}] ${ok ? 'OK' : 'FAIL'} (${report.at(-1).sec}s)\n${tail}\n`);
  if (!ok) finish(false);
  return out;
}

function finish(ok, extra = []) {
  const dir = join(root, 'docs', 'qa', 'integrate');
  mkdirSync(dir, { recursive: true });
  const md = [`# Integrate ${slug} (${heroId}) — ${ok ? 'PASS' : 'FAIL'}`, '',
    `- pack: \`${packDir || '(not built)'}\``, `- bundle: \`${existsSync(bundle) ? bundle : '(none)'}\``,
    `- date: ${new Date().toISOString()}`, '',
    '| step | result | time | tail |', '|---|---|---|---|',
    ...report.map(r => `| ${r.name} | ${r.ok ? 'OK' : '**FAIL**'} | ${r.sec}s | ${r.tail.replace(/\|/g, '/').replace(/\r?\n/g, '<br>').slice(0, 400)} |`),
    ...extra, '',
    ok ? `Evidence: \`docs/qa/idle-anchor/detail-${detailId}.gif\` and \`docs/qa/${slug}/battle-*.png\` — attach to the PR.` +
      (flag('--deliver') ? '' : '\n\nDeliver yourself: branch, commit, `node scripts/tools/verified-push.mjs <origin/main> HEAD <branch>`, open the PR (never push main).')
      : 'Fix the failing step and re-run the same command.'];
  writeFileSync(join(dir, `${slug}.md`), md.join('\n') + '\n', 'utf8');
  console.log(`${ok ? 'INTEGRATE PASS' : 'INTEGRATE FAIL'} — report docs/qa/integrate/${slug}.md`);
  process.exit(ok ? 0 : 1);
}

function staticServer() {
  return (async () => {
    try { await fetch('http://127.0.0.1:18091/index.html'); return null; } catch { /* not up */ }
    const { spawn } = await import('node:child_process');
    const s = spawn('node', ['scripts/qa-static-server.mjs'], { cwd: root, stdio: 'ignore' });
    await new Promise(r => setTimeout(r, 1500));
    return s;
  })();
}

// 1 intake: turn the owner's clips into a probed bundle + manifest (skipped when a pack/manifest is given).
if (!packDir && !manifestArg && (files || existsSync(bundle))) {
  // --allow-reuse: the clip was already packed for another hero (acceptance runs reuse the same owner videos).
  const reuse = flag('--allow-reuse') ? ['--allow-reuse'] : [];
  if (files) step('intake', 'node', ['scripts/hero/intake.mjs', '--slug', slug, '--files', ...files, ...reuse, ...(noVfx ? ['--no-vfx'] : [])], { tail: 3, expect: /INTAKE PASS/ });
  else step('intake', 'node', ['scripts/hero/intake.mjs', '--slug', slug, '--from', arg('--from') || '', ...reuse, ...(noVfx ? ['--no-vfx'] : [])], { tail: 3, expect: /INTAKE PASS/ });
}

// 2 pack
const man = manifestArg ? resolve(manifestArg) : (existsSync(join('C:/lt/packs', slug, 'manifest.json')) ? join('C:/lt/packs', slug, 'manifest.json') : null);
if (!packDir) {
  if (!man) throw new Error(`no pack, no --manifest and no ${join('C:/lt/packs', slug, 'manifest.json')}`);
  const spec = JSON.parse(readFileSync(man, 'utf8').replace(/^\uFEFF/, ''));
  const out = step('pack', PY, [join(SKILL, 'package_six_states.py'), '--manifest', man, '--framing', 'uniform'], { tail: 3, expect: /"status": "PASS"/ });
  packDir = (out.match(/"packDir":\s*"([^"]+)"/) || [])[1]?.replace(/\\\\/g, '\\') || null;
  if (!packDir && spec.outputRoot && existsSync(spec.outputRoot)) {
    packDir = readdirSync(spec.outputRoot).filter(n => n.startsWith(spec.packName + '-') && statSync(join(spec.outputRoot, n)).isDirectory())
      .sort().map(n => join(spec.outputRoot, n)).pop();
  }
}
if (!packDir || !existsSync(join(packDir, 'idle', 'metadata.json'))) {
  report.push({ name: 'pack', ok: false, sec: 0, tail: `pack dir not found: ${packDir}` });
  finish(false);
}

// 3..5
step('validate', PY, [join(SKILL, 'validate_package.py'), packDir], { tail: 2 });
// The idle source clip may live anywhere (the owner's inbox or a temp dir), so pass its path from the bundle.
const idleSrc = existsSync(bundle) ? (JSON.parse(readFileSync(bundle, 'utf8').replace(/^\uFEFF/, '')).sources?.idle?.path || null) : null;
// A hero whose idle carries a translucent prop (Lăng Nguyệt's glowing bow) cannot be compared like an opaque
// character: the green-screen side treats the glow as background while the keyed atlas counts it, so the ratio blows
// up although the packed cell is steady. The brief may carry an explicit, recorded exception.
let briefSpec = null;
try { briefSpec = brief && existsSync(resolve(brief)) ? JSON.parse(readFileSync(resolve(brief), 'utf8')) : null; } catch (_) { briefSpec = null; }
const parityOverride = briefSpec && briefSpec.parityOverride && Number(briefSpec.parityOverride.max) > 1.5 ? briefSpec.parityOverride : null;
if (parityOverride) report.push({ name: 'parity-override', ok: true, sec: 0, tail: `max x${parityOverride.max}: ${parityOverride.reason || ''}` });
step('parity', 'node', ['scripts/qa-idle-source-parity.mjs', packDir, ...(idleSrc && existsSync(idleSrc) ? [idleSrc] : []),
  ...(parityOverride ? ['--max', String(parityOverride.max)] : []),
  ...(parityOverride && parityOverride.alpha ? ['--alpha', String(parityOverride.alpha)] : [])], { tail: 5, expect: /IDLE PARITY PASS/ });
// The idle keeps every 3rd frame of a 24 fps clip: a wrap that moves the picture much more than an ordinary packed
// step is the hitch the owner sees at the seam ("nó bị khựng ở đoạn nối").
step('seam', 'node', ['scripts/qa-idle-loop-seam.mjs', packDir], { tail: 4, expect: /LOOP SEAM PASS/ });
step('import', 'node', ['scripts/import-sixstate-pack.mjs', packDir, slug, heroId], { tail: 1 });

// 6..7 owner VFX + SFX (only when the clips are known, i.e. a bundle exists)
if (existsSync(bundle)) {
  if (noVfx) {
    report.push({ name: 'vfx', ok: true, sec: 0, tail: 'skipped (--no-vfx): attack VFX is baked into the state clips' });
    console.log('[vfx] skipped (--no-vfx): attack VFX is baked into the state clips');
  } else step('vfx', PY, ['scripts/hero/key_vfx.py', '--bundle', bundle, '--slug', slug, '--root', root], { tail: 4 });
  step('sfx', PY, ['scripts/hero/extract_sfx.py', '--bundle', bundle, '--slug', slug, '--key', key, '--root', root, '--allow-missing'], { tail: 8 });
  // Roles the clip audio could not supply come from the Kiếm Thế SKILLPACK, then the local Pixabay library.
  step('sfx-source', 'node', ['scripts/hero/sfx-source.mjs', '--bundle', bundle, '--slug', slug, '--key', key, '--root', root, '--brief', brief], { tail: 12, expect: /SFX SOURCE PASS/ });
} else {
  console.log('[vfx] skipped (no bundle.json); [sfx] skipped (no bundle.json)');
  report.push({ name: 'vfx', ok: true, sec: 0, tail: 'skipped: no bundle (existing pack)' });
}

// 8 scaffold (brief required for a new hero; scaffold itself never overwrites an existing hero.json)
if (brief) step('scaffold', 'node', ['scripts/hero/scaffold.mjs', '--slug', slug, '--brief', resolve(brief), '--bundle', bundle], { tail: 9, expect: /SCAFFOLD PASS/ });
else if (!existsSync(join(root, 'assets', 'characters', slug, 'hero.json'))) {
  report.push({ name: 'scaffold', ok: false, sec: 0, tail: 'new hero needs --brief <brief.json> (see docs/templates/hero-brief.json)' });
  finish(false);
} else console.log('[scaffold] skipped (hero.json exists, no --brief)');

// 9..10
step('portrait', 'node', ['scripts/hero-portrait-from-idle.mjs', slug], { tail: 1 });
// 9b: no roster card ships without a reviewed face landmark (from Bé An on, nine heroes did and showed tiny).
step('landmark', 'node', ['scripts/hero/portrait-landmark-check.mjs', slug], { tail: 6, expect: /LANDMARK PASS/ });
step('build', 'node', ['scripts/build-static.mjs'], { tail: 1, expect: /HERO DOCTOR PASS/ });

// 11 test gate: no NEW failing test vs the cached baseline (the baseline itself may already have older failures).
if (!flag('--skip-test')) {
  if (!existsSync(baseline)) {
    report.push({ name: 'test', ok: false, sec: 0, tail: `no baseline at ${baseline}. Capture one on a clean origin/main checkout: npm test > docs/qa/baseline/tests.log` });
    finish(false);
  }
  const log = join(root, 'docs', 'qa', 'integrate', `${slug}-tests.log`);
  mkdirSync(join(root, 'docs', 'qa', 'integrate'), { recursive: true });
  const t0 = Date.now();
  const r = spawnSync('npm', ['test'], { cwd: root, encoding: 'utf8', maxBuffer: 256 << 20, shell: true });
  writeFileSync(log, `${r.stdout || ''}${r.stderr || ''}`, 'utf8');
  const gate = spawnSync('node', ['scripts/hero/compare-test-fails.mjs', baseline, log], { cwd: root, encoding: 'utf8' });
  const out = `${gate.stdout || ''}${gate.stderr || ''}`.trim();
  report.push({ name: 'test', ok: gate.status === 0, sec: Math.round((Date.now() - t0) / 1000), tail: out.split(/\r?\n/).slice(-3).join('\n') });
  console.log(`[test] ${gate.status === 0 ? 'OK' : 'FAIL'} (${report.at(-1).sec}s)\n${out.split(/\r?\n/).slice(-3).join('\n')}\n`);
  if (gate.status !== 0) finish(false);
}

// 12 battle QA (real battle draws the hero's own atlases, zero JS errors)
const server = await staticServer();
try {
  if (!flag('--skip-battle')) {
    const out = step('battle', 'node', ['scripts/qa-authored-battle.mjs', key, slug, 'pipeline'], { tail: 1 });
    const row = JSON.parse(out.trim().split(/\r?\n/).pop());
    // The QA hook logs atlas names without the content hash: "basic-0", "ultimate-0", "vfx-basic", "run-0".
    const seen = Object.keys(row.seen || {}).filter(k => !k.startsWith('__'));
    const missing = ['basic', 'ultimate'].filter(c => !seen.some(k => k.startsWith(c)));
    if (missing.length || (row.errors || []).length) {
      report.at(-1).ok = false;
      report.at(-1).tail = `battle QA: missing clips ${missing.join(',') || '-'}; js errors ${JSON.stringify((row.errors || []).slice(0, 3))}`;
      finish(false);
    } else report.at(-1).tail = `drew ${seen.join(', ')}; no JS errors`;
  }

  // 13 detail screen
  const probe = step('detail', 'node', ['scripts/qa-detail-probe.mjs', detailId], { tail: 1 });
  const row = JSON.parse(probe.trim().split(/\r?\n/).pop());
  const live = (row.live || []).find(l => l.animating && l.opaque > 0);
  if (!live) { report.at(-1).ok = false; report.at(-1).tail = `no animating idle canvas on the hero-detail screen: ${JSON.stringify(row)}`; finish(false); }

  // 14 evidence GIF from real canvas frames: one capture per authored idle frame, so the GIF is exactly one
  // cycle of the 30-frame idle (3750ms / 30 = 125ms per frame), not a drifting timed sample.
  step('frames', 'node', ['scripts/qa-idle-frames.mjs', detailId], { tail: 3 });
  const fdir = join(root, 'docs', 'qa', 'idle-anchor', 'frames', detailId);
  const pngs = readdirSync(fdir).filter(f => /^f\d+\.png$/.test(f)).sort();
  const first = await sharp(join(fdir, pngs[0])).metadata();
  const w = Math.round(first.width / 2), h = Math.round(first.height / 2);
  const tiles = await Promise.all(pngs.map(f => sharp(join(fdir, f)).resize(w, h).flatten({ background: '#161a24' }).raw().toBuffer()));
  // Delay = the clip's own frame duration, so the GIF plays at the real speed of the idle.
  const meta = JSON.parse(readFileSync(join(root, 'assets', 'characters', slug, 'runtime-meta.json'), 'utf8'));
  const idle = meta.detail || meta.clips.idle;
  const delay = Math.max(20, Math.round((idle.durationMs || pngs.length * 125) / pngs.length));
  await sharp(Buffer.concat(tiles), { raw: { width: w, height: h * tiles.length, channels: 3, pageHeight: h } })
    .gif({ delay: Array(tiles.length).fill(delay), loop: 0 })
    .toFile(join(root, 'docs', 'qa', 'idle-anchor', `detail-${detailId}.gif`));
  report.push({ name: 'evidence', ok: true, sec: 0, tail: `docs/qa/idle-anchor/detail-${detailId}.gif (${tiles.length} frames, ${delay}ms each = one full loop)` });
} finally { if (server) server.kill(); }

// 15 deliver (opt-in): branch, commit, verified push, PR. Never main, never a merge — the owner reviews.
if (flag('--deliver')) {
  const branch = arg('--branch') || `feat/${slug}`;
  const title = arg('--title') || `feat(hero): ${slug}`;
  const body = arg('--body') || `Integrated ${slug} (${heroId}) with scripts/integrate-hero.mjs.\n\nReport: docs/qa/integrate/${slug}.md\nEvidence: docs/qa/idle-anchor/detail-${detailId}.gif, docs/qa/${slug}/battle-*.png`;
  const git = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8' });
  // Precise staging: only what the pipeline owns. `git add -A docs scripts` would sweep in old QA screenshots
  // and one-off debug scripts that predate this work.
  const paths = [
    `assets/characters/${slug}`, `assets/vfx/${slug}`, `assets/audio/sfx/${slug}`,
    `src/domain/hero/${slug}.mjs`, 'src/domain/hero/splus-extras.mjs', 'src/domain/combat/splus-mechanics.mjs',
    `tests/${slug}.test.mjs`, `docs/qa/integrate/${slug}.md`, `docs/qa/integrate/${slug}-tests.log`,
    `docs/qa/idle-anchor/detail-${detailId}.gif`, `docs/qa/${slug}`,
    'scripts/integrate-hero.mjs', 'scripts/hero',
  ].filter(p => existsSync(join(root, p)));
  const add = git('add', '-A', ...paths);
  if (add.status !== 0) { report.push({ name: 'deliver', ok: false, sec: 0, tail: `git add: ${add.stderr}` }); finish(false); }
  const commit = git('commit', '-m', `${title}\n\n${body}`);
  if (commit.status !== 0 && !/nothing to commit/.test(commit.stdout + commit.stderr)) {
    report.push({ name: 'deliver', ok: false, sec: 0, tail: `git commit: ${commit.stderr || commit.stdout}` }); finish(false);
  }
  const head = git('rev-parse', 'HEAD').stdout.trim();
  step('deliver', 'git', ['push', '-u', 'origin', `HEAD:refs/heads/${branch}`], { tail: 2, env: { GIT_TERMINAL_PROMPT: '0' } });
  step('pr', 'gh', ['pr', 'create', '--base', 'main', '--head', branch, '--title', title, '--body', body], { tail: 2 });
  report.push({ name: 'deliver-head', ok: true, sec: 0, tail: `${branch} @ ${head}` });
}

finish(true);
