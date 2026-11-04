import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const js = readFileSync(join(process.cwd(), 'src/ui/qa-grant.js'), 'utf8');
new Function(js);
let html = readFileSync(target, 'utf8');
html = html.replace(/<script id="hv-qa-grant-js">[\s\S]*?<\/script>\n?/, '');
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('body end missing');
html = html.slice(0, end) + `<script id="hv-qa-grant-js">${js}</script>\n` + html.slice(end);
writeFileSync(target, html);
console.log('QA grant installed');
