#!/usr/bin/env node
/**
 * Chạy trọn pipeline cho MỘT boss Săn Boss, sau khi đã có 5 clip gốc.
 *
 *   node scripts/hero/boss-pipeline.mjs --slug hac-xa
 *   node scripts/hero/boss-pipeline.mjs --slug hac-xa --raw C:\lt\packs\hac-xa\raw --skip-test
 *
 * Các bước (dừng ngay khi một bước fail):
 *   1. kiểm clip gốc (độ phân giải + 4 mép phải là nền xanh)
 *   2. phóng lên 1920x1080 (lanczos, giữ nguyên fps)
 *   3. đóng gói 6 state bằng kiemthe-animation-packager (Blender key nền, uniform framing)
 *   4. cắt atlas + anim.json bằng scripts/hero/boss-atlas.py
 *   5. chép SFX (nếu có) vào assets/audio/sfx/<slug>/
 *   6. build-static + (tuỳ chọn) npm test
 *
 * Sau khi xong, xem docs/qa/HAC-XA-PROGRESS.md để biết cần kiểm gì trước khi báo owner.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PY = process.env.HV_PY || 'C:\\lt\\.venvs\\pack\\Scripts\\python.exe';
const BLENDER = process.env.BLENDER_PATH || 'C:\\Program Files\\Blender Foundation\\Blender 5.1\\blender.exe';
const PACKAGER = 'C:\\Users\\Admin\\aicoworker\\openclaw\\skills\\kiemthe-animation-packager\\scripts\\package_six_states.py';

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : def;
}
const slug = arg('slug');
if (!slug) { console.error('thiếu --slug'); process.exit(2); }
const raw = arg('raw', `C:\\lt\\packs\\${slug}\\raw`);
const packRoot = arg('pack', `C:\\lt\\packs\\${slug}\\pack-v1`);
const idleFixed = arg('idle', `C:\\lt\\packs\\${slug}\\idle-fixed\\idle`);
const skipTest = process.argv.includes('--skip-test');

const STATES = ['idle', 'hit', 'fall-die', 'atk', 'ultimate'];
const run = (cmd, args, opts = {}) => {
  console.log(`\n$ ${path.basename(cmd)} ${args.join(' ')}`);
  return execFileSync(cmd, args, { stdio: 'inherit', ...opts });
};

// 1. kiểm clip
try {
  run(PY, [path.join(ROOT, 'scripts', 'hero', 'clip-edge-check.py'), '--dir', raw, '--max-touch', arg('max-touch', '0')], { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
} catch (e) {
  console.error('\n✖ Clip gốc không đạt (thiếu clip, hoặc chạm 4 mép). Sửa/tạo lại clip trước.');
  process.exit(1);
}

// 2. phóng 1920x1080
for (const s of STATES) {
  const src = path.join(raw, `${s}.mp4`);
  const out = path.join(raw, `${s}-1080.mp4`);
  run('ffmpeg', ['-y', '-v', 'error', '-i', src, '-vf', 'scale=1920:1080:flags=lanczos',
    '-c:v', 'libx264', '-crf', '14', '-pix_fmt', 'yuv420p', '-an', out]);
}

// 3. manifest + packager
const manifest = {
  packName: `${slug}-boss`,
  outputRoot: packRoot,
  // Boss không có clip chạy (owner 09/11) — packager đòi đủ 6 state nên dùng idle thế chỗ run.
  states: { ...Object.fromEntries(STATES.map(s => [s, path.join(raw, `${s}-1080.mp4`)])), run: path.join(raw, 'idle-1080.mp4') },
  framing: 'uniform',
};
const manifestPath = path.join(raw, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
run(PY, [PACKAGER, '--manifest', manifestPath, '--framing', 'uniform'], { env: { ...process.env, BLENDER_PATH: BLENDER } });

// 4. atlas cho game
const packDir = fs.readdirSync(packRoot).filter(d => fs.statSync(path.join(packRoot, d)).isDirectory()).sort().pop();
if (!packDir) { console.error('✖ không thấy thư mục pack'); process.exit(1); }
run(PY, [path.join(ROOT, 'scripts', 'hero', 'boss-atlas.py'), '--slug', slug,
  '--pack', path.join(packRoot, packDir), ...(fs.existsSync(idleFixed) ? ['--idle', idleFixed] : []),
  '--out', path.join(ROOT, 'assets', 'hunt', slug)]);

// 5. SFX
const sfxSrc = `C:\\lt\\packs\\${slug}\\sfx`;
const sfxDst = path.join(ROOT, 'assets', 'audio', 'sfx', slug);
if (fs.existsSync(sfxSrc)) {
  fs.mkdirSync(sfxDst, { recursive: true });
  for (const f of fs.readdirSync(sfxSrc)) {
    fs.copyFileSync(path.join(sfxSrc, f), path.join(sfxDst, f));
    console.log('sfx', f);
  }
} else {
  console.log('(không có SFX — bỏ qua)');
}

// 6. build + test
run('node', [path.join(ROOT, 'scripts', 'build-static.mjs')]);
if (!skipTest) run('npm', ['test'], { shell: true });

console.log(`\n✔ xong ${slug}. Kiểm ảnh chụp trận trước khi báo owner.`);
