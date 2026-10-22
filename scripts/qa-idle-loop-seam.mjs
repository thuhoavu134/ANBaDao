// Does the idle LOOP seamlessly? Measures the picture step between consecutive PACKED frames and compares it with
// the step at the seam (last frame -> first frame). A seam much larger than a normal step is the hitch the owner
// sees at the wrap. The idle keeps every 3rd frame of a 24 fps clip, so the seam must be compared with the step
// between SAMPLES, never with a single source frame step.
//
//   node scripts/qa-idle-loop-seam.mjs <packDir> [--state idle] [--max-ratio 1.6]     (packed atlas)
//   node scripts/qa-idle-loop-seam.mjs <gif|framesDir> [--video <src.mp4>] [--max-ratio 1.6]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';

const GW = 64, GH = 56;
const gray = buf => sharp(buf).resize(GW, GH, { fit: 'fill' }).flatten({ background: '#161a24' }).greyscale().raw().toBuffer();
const step = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };
const median = arr => { const s = [...arr].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

export function measureLoop(frames) {
  const steps = [];
  for (let i = 0; i < frames.length - 1; i++) steps.push(step(frames[i], frames[i + 1]));
  const seam = step(frames[frames.length - 1], frames[0]);
  const med = median(steps);
  return { count: frames.length, median: med, seam, worst: Math.max(...steps), ratio: seam / Math.max(0.001, med) };
}

/** Read the packed idle cells straight out of the atlas (no temp files) and measure its loop. */
export async function atlasSeam(packDir, state = 'idle') {
  const meta = JSON.parse(readFileSync(join(packDir, state, 'metadata.json'), 'utf8'));
  const [cw, ch] = meta.crop.cell;
  const frames = [];
  for (const page of meta.atlasPages) {
    const img = sharp(join(packDir, state, page.file)).ensureAlpha();
    for (let n = frames.length; n < meta.frameCount; n++) {
      const c = n % page.columns, r = Math.floor(n / page.columns);
      if (r >= page.rows) break;
      const cell = await img.clone().extract({ left: c * cw, top: r * ch, width: cw, height: ch }).png().toBuffer();
      frames.push(await gray(cell));
    }
  }
  return { ...measureLoop(frames), loop: meta.loop };
}

if (process.argv[1] && /qa-idle-loop-seam\.mjs$/.test(process.argv[1])) {
  const argv = process.argv.slice(2);
  const target = argv[0];
  const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
  const maxRatio = Number(arg('--max-ratio', 1.6));
  const video = arg('--video');
  if (!target) { console.error('usage: <packDir|gif|framesDir> [--state idle] [--video <src.mp4>] [--max-ratio 1.6]'); process.exit(2); }
  const show = (label, m) => {
    console.log(`${label}: ${m.count} frames`);
    console.log(`  step between packed frames: median ${m.median.toFixed(2)}, worst ${m.worst.toFixed(2)}`);
    console.log(`  seam (last -> first): ${m.seam.toFixed(2)} = ${m.ratio.toFixed(2)}x median`);
  };

  let measured;
  if (existsSync(join(target, 'idle', 'metadata.json'))) {
    measured = await atlasSeam(resolve(target), arg('--state', 'idle'));
    show(`packed idle atlas (${target})`, measured);
    if (measured.loop) console.log(`  window: frames ${measured.loop.startSourceFrame}..${measured.loop.endSourceFrameInclusive}, silhouette IoU ${measured.loop.alphaSilhouetteIoUStartEnd}`);
  } else {
    const work = join(tmpdir(), 'idle-seam-' + Date.now());
    mkdirSync(work, { recursive: true });
    let files;
    if (statSync(target).isDirectory()) files = readdirSync(target).filter(f => /\.png$/i.test(f)).sort().map(f => join(target, f));
    else {
      const dir = join(work, 'gif');
      mkdirSync(dir, { recursive: true });
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', resolve(target), join(dir, 'f%03d.png')]);
      files = readdirSync(dir).filter(f => /\.png$/i.test(f)).sort().map(f => join(dir, f));
    }
    const frames = [];
    for (const f of files) frames.push(await gray(f));
    measured = measureLoop(frames);
    show(`frames (${target})`, measured);
    if (video) {
      const dir = join(work, 'src');
      mkdirSync(dir, { recursive: true });
      const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', resolve(video)], { encoding: 'utf8' }).trim()) * 1000;
      const src = [];
      for (let k = 0; k < frames.length; k++) {
        const f = join(dir, `s${String(k).padStart(3, '0')}.png`);
        execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', (dur * k / frames.length / 1000).toFixed(4), '-i', resolve(video), '-vframes', '1', f]);
        src.push(await gray(f));
      }
      show(`source clip (${video})`, measureLoop(src));
    }
    rmSync(work, { recursive: true, force: true });
  }

  const ok = measured.ratio <= maxRatio;
  console.log(ok ? `LOOP SEAM PASS (seam <= ${maxRatio}x median)` : `LOOP SEAM FAIL: seam ${measured.ratio.toFixed(2)}x median > ${maxRatio}x — the wrap shows a hitch`);
  process.exit(ok ? 0 : 1);
}
