import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const runtime = readFileSync(join(process.cwd(), 'src/ui/overlay-safari-runtime.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/overlay-safari.css'), 'utf8');
new Function(runtime);

let html = readFileSync(target, 'utf8');
html = html.replace(/<style id="hv-overlay-safari-css">[\s\S]*?<\/style>\n?/, '');
html = html.replace(/<script id="hv-overlay-safari-js">[\s\S]*?<\/script>\n?/, '');
html = html.replace(
  'width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"',
  'width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover"'
);
html = html.replace('</head>', `<style id="hv-overlay-safari-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Safari overlay body end missing');
html = html.slice(0, end)
  + `<script id="hv-overlay-safari-js">${runtime}</script>\n`
  + html.slice(end);
writeFileSync(target, html);
console.log('Safari overlay pin installed');
