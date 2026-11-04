import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const js = readFileSync(join(process.cwd(), 'src/ui/summon-reveal.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/summon-reveal.css'), 'utf8');
new Function(js);

let html = readFileSync(target, 'utf8');
html = html.replace(/<style id="hv-summon-reveal-css">[\s\S]*?<\/style>\n?/, '');
html = html.replace(/<script id="hv-summon-reveal-js">[\s\S]*?<\/script>\n?/, '');
html = html.replace('</head>', `<style id="hv-summon-reveal-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Summon reveal body end missing');
html = html.slice(0, end) + `<script id="hv-summon-reveal-js">${js}</script>\n` + html.slice(end);
writeFileSync(target, html);
console.log('Summon reveal installed');
