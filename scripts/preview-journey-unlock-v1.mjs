import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const runtime = readFileSync(join(process.cwd(), 'src/ui/preview-journey-unlock.js'), 'utf8');
new Function(runtime);

let html = readFileSync(target, 'utf8');
html = html.replace(/<script id="hv-preview-unlock-js">[\s\S]*?<\/script>\n?/, '');
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Preview unlock body end missing');
html = html.slice(0, end)
  + `<script id="hv-preview-unlock-js">${runtime}</script>\n`
  + html.slice(end);
writeFileSync(target, html);
console.log('Preview journey unlock installed (off luc-than.vercel.app)');
