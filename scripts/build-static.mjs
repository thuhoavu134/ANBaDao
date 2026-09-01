import { cpSync, mkdirSync, rmSync, existsSync, copyFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const out = join(root, 'dist');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const entries = [
  'index.html',
  'battle.html',
  'qa-dinh-loi-spacing.html',
  'assets',
  'artifacts',
  'docs',
  'RUNTIME-FILES.txt',
  'RUNTIME-PACKAGE.txt',
  'BUILD-UTC.txt',
  'SHA256SUMS.txt',
  'SIZE-REPORT.txt',
  'clean-runtime-report.json',
  'vibelab.json'
];

for (const entry of entries) {
  const src = join(root, entry);
  if (!existsSync(src)) continue;
  const dest = join(out, entry);
  const stats = statSync(src);
  if (stats.isDirectory()) cpSync(src, dest, { recursive: true });
  else { mkdirSync(join(dest, '..'), { recursive: true }); copyFileSync(src, dest); }
}

await import('./luc-anh-runtime-patch.mjs');
await import('./runtime-safety-hotfix.mjs');
await import('./bgm-runtime-patch.mjs');
await import('./ios-audio-unlock-patch.mjs');
await import('./luc-anh-retina-sharpness-patch.mjs');
await import('./runtime-qa-polish-v2.mjs');
await import('./runtime-qa-polish-v4.mjs');
await import('./runtime-qa-polish-v5.mjs');
await import('./hero-card-dedupe-v1.mjs');
await import('./hero-roster-phase-a-v4.mjs');
await import('./hero-roster-v4-runtime-fix-v1.mjs');
console.log(`Static preview written to ${out}`);
