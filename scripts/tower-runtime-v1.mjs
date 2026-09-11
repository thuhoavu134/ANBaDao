import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const domain = readFileSync(join(process.cwd(), 'src/domain/tower/tower-progress.mjs'), 'utf8')
  .replace(/^export /gm, '');
const runtime = readFileSync(join(process.cwd(), 'src/ui/tower-runtime.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/tower-screen.css'), 'utf8');
new Function(domain);
new Function(runtime);

let html = readFileSync(target, 'utf8');
if (html.includes('id="hv-tower-js"')) throw new Error('Tower runtime already installed');
html = html.replace('</head>', `<style id="hv-tower-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Tower shell body end missing');
html = html.slice(0, end)
  + `<script id="hv-tower-js">(()=>{\n${domain}\n${runtime}\n})();</script>\n`
  + html.slice(end);
writeFileSync(target, html);
console.log('Tower lacquer screen installed');
