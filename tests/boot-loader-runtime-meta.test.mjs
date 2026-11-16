import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');
const plain = v => JSON.parse(JSON.stringify(v));

function sandbox(fetched) {
  return {
    window: { HV_RUNTIME_META_SLUGS: ['ky-van'] },
    fetch: url => {
      fetched.push(url);
      return Promise.resolve({ ok: true, json: () => ({ clips: { idle: { file: 'idle.webp', pages: [{ file: 'idle-0.webp' }], cellW: 10 } } }) });
    },
    Promise, Map
  };
}

test('Màn tải (boot-loader): không gọi runtime-meta.json cho tướng không có file', async () => {
  const fn = read('src/ui/boot-loader.js').match(/function urlsFor\(id\) \{[\s\S]*?\n  \}/);
  assert.ok(fn, 'boot-loader.js phải có urlsFor(id)');
  const fetched = [], ctx = sandbox(fetched);
  vm.runInNewContext(fn[0] + '; globalThis.urlsFor = urlsFor;', ctx);
  assert.deepEqual(plain(await ctx.urlsFor('ong_hang_pho')), [], 'tướng không có runtime-meta trả danh sách rỗng');
  assert.deepEqual(plain(await ctx.urlsFor('ky_van')), ['assets/characters/ky-van/idle.webp', 'assets/characters/ky-van/idle-0.webp']);
  assert.deepEqual(fetched, ['assets/characters/ky-van/runtime-meta.json'], 'chỉ gọi fetch cho tướng có file');
});

test('Idle đội hình (team-idle): không gọi runtime-meta.json cho tướng không có file', async () => {
  const fn = read('src/ui/team-idle.js').match(/function loadMeta\(id\) \{[\s\S]*?\n  \}/);
  assert.ok(fn, 'team-idle.js phải có loadMeta(id)');
  const fetched = [], ctx = sandbox(fetched);
  vm.runInNewContext('const metaCache = new Map();' + fn[0] + '; globalThis.loadMeta = loadMeta;', ctx);
  assert.equal(await ctx.loadMeta('ong_hang_pho'), null);
  assert.equal(await ctx.loadMeta('ong_hang_pho'), null, 'lần 2 dùng cache, vẫn không fetch');
  const ky = await ctx.loadMeta('ky_van');
  assert.equal(ky.slug, 'ky-van');
  assert.deepEqual(fetched, ['assets/characters/ky-van/runtime-meta.json']);
});

test('Build ghi danh sách tướng có runtime-meta.json ở đầu runtime Trận Hình', () => {
  const build = read('scripts/team-3d-v1.mjs');
  assert.match(build, /window\.HV_RUNTIME_META_SLUGS=/);
  assert.ok(build.indexOf('HV_RUNTIME_META_SLUGS=') < build.indexOf("src/ui/team-idle.js"), 'danh sách đứng trước team-idle và boot-loader');
  const dist = join(root, 'dist/index.html');
  if (!existsSync(dist)) return;
  const m = readFileSync(dist, 'utf8').match(/window\.HV_RUNTIME_META_SLUGS=(\[[^\]]*\]);/);
  assert.ok(m, 'dist/index.html phải có danh sách');
  const listed = JSON.parse(m[1]);
  const dir = join(root, 'assets/characters');
  const expected = readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory() && existsSync(join(dir, d.name, 'runtime-meta.json'))).map(d => d.name).sort();
  assert.deepEqual(listed, expected);
  assert.ok(listed.includes('ky-van'));
  assert.ok(!listed.includes('ong-hang-pho'));
});
