import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const cloudSource = readFileSync(join(process.cwd(), 'src/domain/save/cloud-session.mjs'), 'utf8').replace(/^export\s+/gm, '');
const runtime = cloudSource + '\n' + readFileSync(join(process.cwd(), 'src/ui/net-auth-runtime.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/net-auth.css'), 'utf8');
new Function(runtime);

let html = readFileSync(target, 'utf8');
html = html.replace(/<style id="hv-net-auth-css">[\s\S]*?<\/style>\n?/, '');
html = html.replace(/<script id="hv-net-auth-js">[\s\S]*?<\/script>\n?/, '');
html = html.replace('</head>', `<style id="hv-net-auth-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Trực Tuyến auth body end missing');
html = html.slice(0, end)
  + `<script id="hv-net-auth-js">${runtime}</script>\n`
  + html.slice(end);
writeFileSync(target, html);
console.log('Trực Tuyến auth (same-origin + Google) installed');
