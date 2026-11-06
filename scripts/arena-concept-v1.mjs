import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const js = readFileSync(join(process.cwd(), 'src/ui/arena-concept.js'), 'utf8') + '\n' + readFileSync(join(process.cwd(), 'src/ui/arena-meta.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/arena-concept.css'), 'utf8') + '\n' + readFileSync(join(process.cwd(), 'src/ui/arena-meta.css'), 'utf8');
new Function(js);

let html = readFileSync(target, 'utf8');
html = html.replace(/<style id="hv-arena-concept-css">[\s\S]*?<\/style>\n?/, '');
html = html.replace(/<script id="hv-arena-concept-js">[\s\S]*?<\/script>\n?/, '');
html = html.replace('</head>', `<style id="hv-arena-concept-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Arena concept body end missing');
html = html.slice(0, end) + `<script id="hv-arena-concept-js">${js}</script>\n` + html.slice(end);
writeFileSync(target, html);
console.log('Arena concept installed');
