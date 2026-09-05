import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const runtime = readFileSync(join(process.cwd(), 'src/ui/hero-detail-tabs.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/hero-detail-tabs.css'), 'utf8');
new Function(runtime);
let html = readFileSync(target, 'utf8');
html = html.replace('</head>', `<style id="hero-detail-tabs-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Hero detail shell body end missing');
html = html.slice(0, end) + `<script id="hero-detail-tabs-js">${runtime}</script>\n` + html.slice(end);
writeFileSync(target, html);
console.log('Hero detail tabs installed: existing panels and commands, stable idle layout');
