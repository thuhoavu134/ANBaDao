// Geometry grid for the word mark: static composition of the real art layers.
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('C:/lt/wt-result-icons');
const OUT = join(ROOT, 'docs/qa/result-type-icons');
mkdirSync(OUT, { recursive: true });
const { startBrowser } = await import(pathToFileURL(join(ROOT, 'scripts/qa-battle-readiness-browser.mjs')).href);

copyFileSync(join(ROOT, 'docs/qa/result-type-icons/word-preview.html'), join(ROOT, 'dist/word-preview.html'));

const variants = [
  { vw: 60, top: 0.26 },
  { vw: 72, top: 0.22 },
  { vw: 82, top: 0.19 },
  { vw: 92, top: 0.16 },
];
const browser = await startBrowser();
const rows = [];
try {
  for (const [width, height] of [[375, 812], [430, 932]]) {
    const p = await browser.page(width, height, 2);
    try {
      for (const v of variants) {
        for (const which of ['victory', 'defeat']) {
          const url = `${browser.origin}/word-preview.html?w=${width}&vw=${v.vw}&top=${v.top}&word=${which}`;
          await p.send('Page.navigate', { url });
          await new Promise(r => setTimeout(r, 900));
          const file = join(OUT, `grid-${which}-${width}-${v.vw}vw.png`);
          try { await p.screenshot(file); rows.push({ file, which, width, ...v, ok: true }); }
          catch (e) { rows.push({ file, which, width, ...v, ok: false, err: String(e).slice(0, 100) }); }
        }
      }
    } finally { await p.close(); }
  }
} finally {
  writeFileSync(join(OUT, 'grid.json'), JSON.stringify(rows, null, 2));
  console.log('GRID:' + rows.length + ' shots, failed=' + rows.filter(r => !r.ok).length);
  await browser.close();
}
