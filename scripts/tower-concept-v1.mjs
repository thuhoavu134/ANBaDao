import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const js = readFileSync(join(process.cwd(), 'src/ui/tower-concept.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/tower-concept.css'), 'utf8');
new Function(js);

let html = readFileSync(target, 'utf8');
html = html.replace(/<style id="hv-tower-concept-css">[\s\S]*?<\/style>\n?/, '');
html = html.replace(/<script id="hv-tower-concept-js">[\s\S]*?<\/script>\n?/, '');
html = html.replace('</head>', `<style id="hv-tower-concept-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Tower concept body end missing');
html = html.slice(0, end) + `<script id="hv-tower-concept-js">${js}</script>\n` + html.slice(end);
writeFileSync(target, html);
console.log('Tower concept installed');
