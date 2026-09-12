import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const domain = readFileSync(join(process.cwd(), 'src/domain/economy/balance.mjs'), 'utf8')
  .replace(/^export /gm, '');
const runtime = readFileSync(join(process.cwd(), 'src/ui/economy-balance-runtime.js'), 'utf8');
new Function(domain);
new Function(runtime);

let html = readFileSync(target, 'utf8');
html = html.replace(/<script id="hv-econ-js">[\s\S]*?<\/script>\n?/, '');
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Econ body end missing');
html = html.slice(0, end)
  + `<script id="hv-econ-js">(()=>{\n${domain}\n${runtime}\n})();</script>\n`
  + html.slice(end);
writeFileSync(target, html);
console.log('Economy balance overlay installed');
