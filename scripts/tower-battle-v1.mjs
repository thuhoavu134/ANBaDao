import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const stripExport = src => src.replace(/^export /gm, '');
const progress = stripExport(readFileSync(join(process.cwd(), 'src/domain/tower/tower-progress.mjs'), 'utf8'));
const npc = stripExport(readFileSync(join(process.cwd(), 'src/domain/tower/tower-npc-team.mjs'), 'utf8'));
const runtime = readFileSync(join(process.cwd(), 'src/ui/tower-battle-runtime.js'), 'utf8');
new Function(progress);
new Function(npc);
new Function(runtime);

let html = readFileSync(target, 'utf8');
html = html.replace(/<script id="hv-tower-battle-js">[\s\S]*?<\/script>\n?/, '');
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Tháp trận NPC body end missing');
html = html.slice(0, end)
  + `<script id="hv-tower-battle-js">(()=>{\n${progress}\n${npc}\n${runtime}\n})();</script>\n`
  + html.slice(end);
writeFileSync(target, html);
console.log('Tháp trận NPC installed');
