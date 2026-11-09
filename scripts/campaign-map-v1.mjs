// Chiến Dịch · Giang Hồ Đồ (owner chọn Mẫu B 09/11). Keep AFTER lore (dùng DATA.chapters đã đổi tên).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const target = join(root, 'dist/index.html');
const js = readFileSync(join(root, 'src/ui/campaign-map-runtime.js'), 'utf8');
const css = readFileSync(join(root, 'src/ui/campaign-map.css'), 'utf8');
new Function(js);

let html = readFileSync(target, 'utf8');
html = html.replace(/<style id="hv-campmap-css">[\s\S]*?<\/style>\n?/, '');
html = html.replace(/<script id="hv-campmap-js">[\s\S]*?<\/script>\n?/, '');
html = html.replace('</head>', `<style id="hv-campmap-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('campaign-map: body end missing');
html = html.slice(0, end) + `<script id="hv-campmap-js">${js}</script>\n` + html.slice(end);
writeFileSync(target, html);
console.log('Campaign Giang Ho Do installed');
