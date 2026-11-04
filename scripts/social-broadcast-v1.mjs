// Owner 2026-11-04: kenh chat that (Thế Giới / Bang Hội / Gia Tộc / Hệ Thống) + dong chu chay loa he thong.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist/index.html');
const parts = [
  ['hv-chat-channels', 'src/ui/chat-channels-runtime.js', 'src/ui/chat-channels.css'],
  ['hv-broadcast-marquee', 'src/ui/broadcast-marquee-runtime.js', 'src/ui/broadcast-marquee.css']
];
let html = readFileSync(target, 'utf8');
for (const [id, js, css] of parts) {
  const runtime = readFileSync(join(process.cwd(), js), 'utf8');
  const style = readFileSync(join(process.cwd(), css), 'utf8');
  new Function(runtime);
  html = html.replace(new RegExp(`<style id="${id}-css">[\\s\\S]*?<\\/style>\\n?`), '');
  html = html.replace(new RegExp(`<script id="${id}-js">[\\s\\S]*?<\\/script>\\n?`), '');
  html = html.replace('</head>', `<style id="${id}-css">${style}</style>\n</head>`);
  const end = html.lastIndexOf('</body>');
  if (end < 0) throw new Error('body end missing');
  html = html.slice(0, end) + `<script id="${id}-js">${runtime}</script>\n` + html.slice(end);
}
writeFileSync(target, html);
console.log('Social channels + broadcast marquee installed');
