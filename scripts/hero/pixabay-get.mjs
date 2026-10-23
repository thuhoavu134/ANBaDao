// Pixabay download helper: the browser is only for FINDING the sound, the file comes straight from the CDN.
//
// Pressing Play on a search result makes the page fetch
//   https://cdn.pixabay.com/audio/<YYYY>/<MM>/<DD>/audio_<hash>.mp3
// and the download URL is the same path with /download/ inserted — a plain GET with a normal User-Agent and
// Referer works, no login (the site's own Download button is what asks you to sign in).
//
//   node scripts/hero/pixabay-get.mjs --preview "<cdn audio url>" --name sword-slash-476148 \
//        --tags "sword,slash,impact,hit" --source "<page url>" --author "<name>"
//
// Writes the file into assets/audio/sfx/_pixabay/ and appends an entry to its index.json, which is what
// scripts/hero/sfx-source.mjs matches against. Then re-run sfx-source.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { downloadUrlFrom } from './sfx-lib.mjs';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
const preview = args.preview || args.url;
if (!preview) { console.error('usage: --preview <cdn.pixabay.com/audio/... url> [--name <slug>] [--tags a,b,c] [--source <page url>] [--author <name>]'); process.exit(2); }

const lib = resolve(args.library || join(process.cwd(), 'assets', 'audio', 'sfx', '_pixabay'));
mkdirSync(lib, { recursive: true });
const index = existsSync(join(lib, 'index.json')) ? JSON.parse(readFileSync(join(lib, 'index.json'), 'utf8').replace(/^\uFEFF/, '')) : { items: [] };
index.items = index.items || [];

const url = downloadUrlFrom(preview);
const name = args.name || (preview.match(/audio_([0-9a-f]+)/)?.[1] ?? 'pixabay') + (extname(new URL(preview).pathname) || '.mp3');
const dst = join(lib, name);

const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://pixabay.com/' } });
if (!res.ok) { console.error(`tải thất bại: HTTP ${res.status} ${url}`); process.exit(1); }
const buf = Buffer.from(await res.arrayBuffer());
if (buf.length < 2048) { console.error(`file quá nhỏ (${buf.length} bytes) — không phải audio?`); process.exit(1); }
writeFileSync(dst, buf);

const entry = {
  file: name,
  tags: String(args.tags || '').split(',').map(s => s.trim()).filter(Boolean),
  source: args.source || preview,
  license: 'Pixabay Content License',
  ...(args.author ? { author: args.author } : {}),
  previewUrl: preview,
  sha256: createHash('sha256').update(buf).digest('hex'),
};
index.items = [...index.items.filter(i => i.file !== name), entry];
writeFileSync(join(lib, 'index.json'), JSON.stringify(index, null, 2) + '\n', 'utf8');
console.log(`đã lưu ${name} (${buf.length} bytes) vào thư viện, tags: ${entry.tags.join(', ') || '(chưa có)'}`);
console.log(`nguồn: ${entry.source}`);
