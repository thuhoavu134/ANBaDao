import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { handleNode } from '../src/server/http.mjs';

const root = process.cwd();
const dist = join(root, 'dist');
const base = existsSync(join(dist, 'index.html')) ? dist : root;
const port = Number(process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
  '.map': 'application/json'
};

function safeFile(urlPath) {
  const clean = decodeURIComponent((urlPath || '/').split('?')[0]);
  const rel = clean === '/' ? 'index.html' : clean.replace(/^\/+/, '');
  const full = resolve(join(base, rel));
  if (!full.startsWith(resolve(base))) return null;
  return full;
}

const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const url = req.url || '/';
  if (url.startsWith('/api/')) {
    try {
      await handleNode(req, res);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: String(err && err.message || err) }));
    }
    return;
  }
  let file = safeFile(url);
  if (file && existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!file || !existsSync(file) || !statSync(file).isFile()) {
    const index = join(base, 'index.html');
    if (existsSync(index) && !extname(url.split('?')[0])) file = index;
    else {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
  }
  res.setHeader('Content-Type', MIME[extname(file).toLowerCase()] || 'application/octet-stream');
  createReadStream(file).pipe(res);
});

server.listen(port, '0.0.0.0', () => {
  console.log('preview+api on 0.0.0.0:' + port + ' root=' + base);
});
