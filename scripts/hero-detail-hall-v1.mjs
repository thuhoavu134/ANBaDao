import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const runtime = readFileSync(join(process.cwd(), 'src/ui/hero-detail-hall-runtime.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/hero-detail-hall.css'), 'utf8');
new Function(runtime);

let html = readFileSync(target, 'utf8');
html = html.replace(/<style id="hv-hero-detail-hall-css">[\s\S]*?<\/style>\n?/, '');
html = html.replace(/<script id="hv-hero-detail-hall-js">[\s\S]*?<\/script>\n?/, '');
html = html.replace('</head>', `<style id="hv-hero-detail-hall-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Hồ sơ tướng hall body end missing');
html = html.slice(0, end)
  + `<script id="hv-hero-detail-hall-js">${runtime}</script>\n`
  + html.slice(end);
writeFileSync(target, html);
console.log('Hồ sơ tướng 3D overlay installed');
