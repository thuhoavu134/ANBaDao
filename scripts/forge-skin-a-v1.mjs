// Owner 2026-11-12: Ren Mong 3 tab (Che tao / Cuong hoa / Phan giai), chen cuoi build.
// Thay cho skin A 11/11 (file src/ui/forge-skin-a.* giu lai de doi chieu, khong con chen).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const js = readFileSync(join(process.cwd(), 'src/ui/forge-tabs.js'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/ui/forge-tabs.css'), 'utf8').replaceAll('../../assets/', 'assets/');
new Function(js);

let html = readFileSync(target, 'utf8');
for (const id of ['hv-forge-skin-a-css', 'hv-forge-tabs-css']) html = html.replace(new RegExp(`<style id="${id}">[\\s\\S]*?<\\/style>\\n?`), '');
for (const id of ['hv-forge-skin-a-js', 'hv-forge-tabs-js']) html = html.replace(new RegExp(`<script id="${id}">[\\s\\S]*?<\\/script>\\n?`), '');
html = html.replace('</head>', `<style id="hv-forge-tabs-css">${css}</style>\n</head>`);
const end = html.lastIndexOf('</body>');
if (end < 0) throw new Error('Forge tabs body end missing');
html = html.slice(0, end) + `<script id="hv-forge-tabs-js">${js}</script>\n` + html.slice(end);
// Owner 12/11: man Tro Chuyen giay thuy mac.
const chatJs = readFileSync(join(process.cwd(), 'src/ui/chat-ink.js'), 'utf8');
const chatCss = readFileSync(join(process.cwd(), 'src/ui/chat-ink.css'), 'utf8').replaceAll('../../assets/', 'assets/');
new Function(chatJs);
html = html.replace(/<style id="hv-chat-ink-css">[\s\S]*?<\/style>\n?/, '').replace(/<script id="hv-chat-ink-js">[\s\S]*?<\/script>\n?/, '');
html = html.replace('</head>', `<style id="hv-chat-ink-css">${chatCss}</style>\n</head>`);
const end2 = html.lastIndexOf('</body>');
html = html.slice(0, end2) + `<script id="hv-chat-ink-js">${chatJs}</script>\n` + html.slice(end2);
writeFileSync(target, html);
console.log('Forge tabs installed');
