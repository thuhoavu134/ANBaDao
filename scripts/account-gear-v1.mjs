import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const domain = readFileSync(join(process.cwd(), 'src/domain/equipment/account-board.mjs'), 'utf8')
  .replace(/^export /gm, '');
const runtime = readFileSync(join(process.cwd(), 'src/ui/account-gear-runtime.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/account-gear-board.css'), 'utf8');
new Function(domain);
new Function(runtime);

let html = readFileSync(target, 'utf8');
if (html.includes('id="hv-account-gear-js"')) throw new Error('Account gear runtime already installed');
html = html.replace('</head>', `<style id="hv-account-gear-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Account gear shell body end missing');
html = html.slice(0, end)
  + `<script id="hv-account-gear-js">(()=>{\n${domain}\n${runtime}\n})();</script>\n`
  + html.slice(end);
writeFileSync(target, html);
console.log('Account gear board installed: Trợ trận wheel + 12-slot enhance/equip + Dung luyện');
