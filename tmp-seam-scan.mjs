// Temp measurement: for the owner's idle clip, find the sampling phase whose loop seam is smoothest.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const video = process.argv[2];
const n = Number(process.argv[3] || 30);
const work = 'C:/lt/tmp/seamscan';
mkdirSync(work, { recursive: true });
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, join(work, 'f%04d.png')]);
const files = readdirSync(work).filter(f => /^f\d+\.png$/.test(f)).sort().map(f => join(work, f));
const GW = 64, GH = 56;
const frames = [];
for (const f of files) {
  const { data } = await sharp(f).resize(GW, GH, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  frames.push(data);
}
const F = frames.length, size = GW * GH;
const step = (a, b) => { let s = 0; for (let i = 0; i < size; i++) s += Math.abs(a[i] - b[i]); return s / size; };
console.log(`source: ${F} frames`);

const results = [];
for (let phase = 0; phase < F; phase++) {
  const picks = [];
  for (let k = 0; k < n; k++) picks.push(frames[(phase + Math.round((k * F) / n)) % F]);
  const steps = [];
  for (let i = 0; i < n - 1; i++) steps.push(step(picks[i], picks[i + 1]));
  const sorted = [...steps].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const seam = step(picks[n - 1], picks[0]);
  results.push({ phase, seam, median, ratio: seam / Math.max(0.001, median), worst: Math.max(...steps) });
}
results.sort((a, b) => a.ratio - b.ratio);
console.log('best phases (ratio = seam / median step):');
for (const r of results.slice(0, 6)) console.log(`  phase ${r.phase}: seam ${r.seam.toFixed(2)} median ${r.median.toFixed(2)} ratio ${r.ratio.toFixed(2)} worst ${r.worst.toFixed(2)}`);
console.log('worst phases:');
for (const r of results.slice(-3)) console.log(`  phase ${r.phase}: seam ${r.seam.toFixed(2)} median ${r.median.toFixed(2)} ratio ${r.ratio.toFixed(2)}`);
const zero = results.find(r => r.phase === 0);
console.log(`phase 0 (what we use now): ratio ${zero.ratio.toFixed(2)}`);
