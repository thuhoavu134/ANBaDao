import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const domain = readFileSync(join(process.cwd(), 'src/domain/summon/summon-pull.mjs'), 'utf8')
  .replace(/^export /gm, '');
const runtime = readFileSync(join(process.cwd(), 'src/ui/summon-runtime.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/summon-screen.css'), 'utf8');
new Function(domain);
new Function(runtime);

let html = readFileSync(target, 'utf8');
html = html.replace(/<style id="hv-summon-css">[\s\S]*?<\/style>\n?/, '');
html = html.replace(/<script id="hv-summon-js">[\s\S]*?<\/script>\n?/, '');
html = html.replace('</head>', `<style id="hv-summon-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Summon shell body end missing');
html = html.slice(0, end)
  + `<script id="hv-summon-js">(()=>{\n${domain}\n${runtime}\n})();</script>\n`
  + html.slice(end);
writeFileSync(target, html);
console.log('Summon lacquer screen installed');
