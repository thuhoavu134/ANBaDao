import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const js = readFileSync(join(process.cwd(), 'src/ui/expedition-concept.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/expedition-concept.css'), 'utf8');
new Function(js);

let html = readFileSync(target, 'utf8');
html = html.replace(/<style id="hv-expedition-concept-css">[\s\S]*?<\/style>\n?/, '');
html = html.replace(/<script id="hv-expedition-concept-js">[\s\S]*?<\/script>\n?/, '');
html = html.replace('</head>', `<style id="hv-expedition-concept-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Expedition concept body end missing');
html = html.slice(0, end) + `<script id="hv-expedition-concept-js">${js}</script>\n` + html.slice(end);
writeFileSync(target, html);
console.log('Expedition concept installed');
