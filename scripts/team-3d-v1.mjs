import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
// Màn tải chỉ nạp runtime-meta.json của tướng thực sự có file (tránh 404 cho tướng cũ dùng atlas nhúng).
const charsDir = join(process.cwd(), 'assets/characters');
const metaSlugs = existsSync(charsDir)
  ? readdirSync(charsDir, { withFileTypes: true }).filter(d => d.isDirectory() && existsSync(join(charsDir, d.name, 'runtime-meta.json'))).map(d => d.name).sort()
  : [];
const runtime = `window.HV_RUNTIME_META_SLUGS=${JSON.stringify(metaSlugs)};\n`
  + readFileSync(join(process.cwd(), 'src/ui/team-3d-runtime.js'), 'utf8') + '\n' + readFileSync(join(process.cwd(), 'src/ui/team-idle.js'), 'utf8') + '\n'
  + readFileSync(join(process.cwd(), 'src/ui/boot-loader.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/team-3d.css'), 'utf8');
new Function(runtime);

let html = readFileSync(target, 'utf8');
html = html.replace(/<style id="hv-team-3d-css">[\s\S]*?<\/style>\n?/, '');
html = html.replace(/<script id="hv-team-3d-js">[\s\S]*?<\/script>\n?/, '');
html = html.replace('</head>', `<style id="hv-team-3d-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Trận Hình 3d body end missing');
html = html.slice(0, end)
  + `<script id="hv-team-3d-js">${runtime}</script>\n`
  + html.slice(end);
writeFileSync(target, html);
console.log('Trận Hình 3D overlay installed');
