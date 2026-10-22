// Minimal static server for dist/ — used by the CDP-driven QA captures.
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// Serve the dist/ of the checkout being tested. Was hard-coded to C:/lt/luc-than-main/dist, so every QA run in a
// git worktree (or any second checkout) silently verified the MAIN tree's build instead of its own.
const dist = process.env.QA_DIST || join(process.cwd(), 'dist');
const port = Number(process.argv[2] || 18091);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.apng': 'image/apng', '.webm': 'video/webm' };

createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = join(dist, url === '/' ? 'index.html' : url.replace(/^\//, ''));
  try {
    const st = statSync(file);
    if (st.isDirectory()) file = join(file, 'index.html');
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404); res.end('missing');
  }
}).listen(port, '127.0.0.1', () => console.log('serving ' + dist + ' on http://127.0.0.1:' + port));
