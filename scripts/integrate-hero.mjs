// ONE COMMAND to integrate (or re-integrate) a Kiếm Thế six-state hero. Any agent: run this, do not improvise.
// Full contract: docs/HERO-INTEGRATION-STANDARD.md  ("Quy trình 1 lệnh").
//
//   node scripts/integrate-hero.mjs --manifest <pack-manifest.json> --slug <slug> --id <hero_splus_x> [--detail-id <x>]
//   node scripts/integrate-hero.mjs --pack <existing packDir>       --slug <slug> --id <hero_splus_x> [--detail-id <x>]
//
// Steps (stops at the first failure, writes docs/qa/integrate/<slug>.md):
//   1 pack      kiemthe-animation-packager package_six_states.py --framing uniform (idle anchor always locked)
//   2 validate  validate_package.py
//   3 parity    scripts/qa-idle-source-parity.mjs  (packed idle must move like the source video)
//   4 import    scripts/import-sixstate-pack.mjs   (refuses a pack whose idle anchor moves)
//   5 portrait  scripts/hero-portrait-from-idle.mjs (portrait = idle frame 0)
//   6 build     scripts/build-static.mjs           (includes HERO DOCTOR)
//   7 detail    scripts/qa-detail-probe.mjs        (hero-detail screen has an animating idle canvas)
//   8 evidence  scripts/qa-idle-frames.mjs         (real canvas frames -> GIF for the PR)
// hero.json (rules, sfx, battle) is authored by hand BEFORE step 4 for a brand-new hero; this script never edits it.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import sharp from 'sharp';

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const manifest = arg('--manifest'), packArg = arg('--pack'), slug = arg('--slug'), heroId = arg('--id');
const detailId = arg('--detail-id') || (heroId || '').replace(/^hero_splus_/, '');
if ((!manifest && !packArg) || !slug || !heroId) {
  console.error('usage: --manifest <json> | --pack <dir>   --slug <slug> --id <hero_splus_x> [--detail-id <x>]');
  process.exit(2);
}
const SKILL = process.env.KIEMTHE_PACKAGER_DIR ||
  join(process.env.USERPROFILE || '', 'aicoworker', 'openclaw', 'skills', 'kiemthe-animation-packager', 'scripts');
const PY = process.env.PACK_PYTHON || (existsSync('C:/lt/.venvs/pack/Scripts/python.exe') ? 'C:/lt/.venvs/pack/Scripts/python.exe' : 'python');

const report = [];
function step(name, cmd, args, opts = {}) {
  const t0 = Date.now();
  process.stdout.write(`[${name}] ${cmd} ${args.join(' ')}\n`);
  const r = spawnSync(cmd, args, { cwd: opts.cwd || root, encoding: 'utf8', maxBuffer: 64 << 20, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
  const tail = out.split(/\r?\n/).slice(-(opts.tail || 4)).join('\n');
  const ok = r.status === 0 && (!opts.expect || opts.expect.test(out));
  report.push({ name, ok, sec: Math.round((Date.now() - t0) / 1000), tail });
  console.log(`[${name}] ${ok ? 'OK' : 'FAIL'} (${report.at(-1).sec}s)\n${tail}\n`);
  if (!ok) finish(false);
  return out;
}
function finish(ok) {
  const dir = join(root, 'docs', 'qa', 'integrate');
  mkdirSync(dir, { recursive: true });
  const md = [`# Integrate ${slug} (${heroId}) — ${ok ? 'PASS' : 'FAIL'}`, '', `- pack: \`${packDir || '(not built)'}\``, `- date: ${new Date().toISOString()}`, '',
    '| step | result | time | tail |', '|---|---|---|---|',
    ...report.map(r => `| ${r.name} | ${r.ok ? 'OK' : '**FAIL**'} | ${r.sec}s | ${r.tail.replace(/\|/g, '/').replace(/\r?\n/g, '<br>').slice(0, 400)} |`), '',
    ok ? `Evidence GIF: \`docs/qa/idle-anchor/detail-${detailId}.gif\` — attach to the PR, then open the PR (never push main).` : 'Fix the failing step and re-run the same command.'];
  writeFileSync(join(dir, `${slug}.md`), md.join('\n') + '\n');
  console.log(`${ok ? 'INTEGRATE PASS' : 'INTEGRATE FAIL'} — report docs/qa/integrate/${slug}.md`);
  process.exit(ok ? 0 : 1);
}

// 1 pack
let packDir = packArg && resolve(packArg);
if (manifest) {
  const spec = JSON.parse(readFileSync(manifest, 'utf8').replace(/^\uFEFF/, ''));
  const out = step('pack', PY, [join(SKILL, 'package_six_states.py'), '--manifest', resolve(manifest), '--framing', 'uniform'], { tail: 3, expect: /"status": "PASS"/ });
  packDir = (out.match(/"packDir":\s*"([^"]+)"/) || [])[1]?.replace(/\\\\/g, '\\');
  if (!packDir) {
    const outRoot = spec.outputRoot;
    packDir = readdirSync(outRoot).filter(n => n.startsWith(spec.packName + '-') && statSync(join(outRoot, n)).isDirectory()).sort().map(n => join(outRoot, n)).pop();
  }
}
if (!packDir || !existsSync(join(packDir, 'idle', 'metadata.json'))) { report.push({ name: 'pack', ok: false, sec: 0, tail: `pack dir not found: ${packDir}` }); finish(false); }

// 2..6
step('validate', PY, [join(SKILL, 'validate_package.py'), packDir], { tail: 2 });
step('parity', 'node', ['scripts/qa-idle-source-parity.mjs', packDir], { tail: 5, expect: /IDLE PARITY PASS/ });
step('import', 'node', ['scripts/import-sixstate-pack.mjs', packDir, slug, heroId], { tail: 1 });
step('portrait', 'node', ['scripts/hero-portrait-from-idle.mjs', slug], { tail: 1 });
step('build', 'node', ['scripts/build-static.mjs'], { tail: 1, expect: /HERO DOCTOR PASS/ });

// 7 detail screen (QA server on :18091 serves dist/)
let server = null;
try { await fetch('http://127.0.0.1:18091/index.html'); } catch {
  const { spawn } = await import('node:child_process');
  server = spawn('node', ['scripts/qa-static-server.mjs'], { cwd: root, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));
}
try {
  const probe = step('detail', 'node', ['scripts/qa-detail-probe.mjs', detailId], { tail: 1 });
  const row = JSON.parse(probe.trim().split(/\r?\n/).pop());
  const live = (row.live || []).find(l => l.animating && l.opaque > 0);
  if (!live) { report.at(-1).ok = false; report.at(-1).tail = `no animating idle canvas on the hero-detail screen: ${JSON.stringify(row)}`; finish(false); }

  // 8 evidence GIF from real canvas frames
  step('frames', 'node', ['scripts/qa-idle-frames.mjs', detailId, '24', '105'], { tail: 1 });
  const fdir = join(root, 'docs', 'qa', 'idle-anchor', 'frames', detailId);
  const files = readdirSync(fdir).filter(f => /^f\d+\.png$/.test(f)).sort();
  const first = await sharp(join(fdir, files[0])).metadata();
  const w = Math.round(first.width / 2), h = Math.round(first.height / 2);
  const tiles = await Promise.all(files.map(f => sharp(join(fdir, f)).resize(w, h).flatten({ background: '#161a24' }).raw().toBuffer()));
  const gif = join(root, 'docs', 'qa', 'idle-anchor', `detail-${detailId}.gif`);
  await sharp(Buffer.concat(tiles), { raw: { width: w, height: h * tiles.length, channels: 3, pageHeight: h } })
    .gif({ delay: Array(tiles.length).fill(105), loop: 0 }).toFile(gif);
  report.push({ name: 'evidence', ok: true, sec: 0, tail: `docs/qa/idle-anchor/detail-${detailId}.gif (${tiles.length} frames)` });
} finally { if (server) server.kill(); }
finish(true);
