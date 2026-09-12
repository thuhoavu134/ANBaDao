import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const runtime = readFileSync(join(process.cwd(), 'src/ui/skill-seals-d-runtime.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/skill-seals-d.css'), 'utf8');
new Function(runtime);

let html = readFileSync(target, 'utf8');
html = html.replace(/<style id="hv-skill-seals-d-css">[\s\S]*?<\/style>\n?/, '');
html = html.replace(/<script id="hv-skill-seals-d-js">[\s\S]*?<\/script>\n?/, '');
html = html.replace('</head>', `<style id="hv-skill-seals-d-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('skill seals D body end missing');
html = html.slice(0, end)
  + `<script id="hv-skill-seals-d-js">${runtime}</script>\n`
  + html.slice(end);
writeFileSync(target, html);
console.log('Skill seals D installed');
