import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const domain = readFileSync(join(process.cwd(), 'src/domain/daily/daily-run.mjs'), 'utf8')
  .replace(/^export /gm, '');
const runtime = readFileSync(join(process.cwd(), 'src/ui/daily-runtime.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/daily-screen.css'), 'utf8');
new Function(domain);
new Function(runtime);

let html = readFileSync(target, 'utf8');
html = html.replace(/<style id="hv-daily-css">[\s\S]*?<\/style>\n?/, '');
html = html.replace(/<script id="hv-daily-js">[\s\S]*?<\/script>\n?/, '');
html = html.replace('</head>', `<style id="hv-daily-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Daily shell body end missing');
html = html.slice(0, end)
  + `<script id="hv-daily-js">(()=>{\n${domain}\n${runtime}\n})();</script>\n`
  + html.slice(end);
writeFileSync(target, html);
console.log('Daily lacquer screen installed');
