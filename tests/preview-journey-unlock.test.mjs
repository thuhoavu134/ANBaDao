import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L26-T1: journey unlock table stays frozen', () => {
  const html = read('index.html');
  assert.match(html, /summon:\{ch:1,label:'Chiêu Mộ'\}/);
  assert.match(html, /forge:\{ch:1,label:'Rèn Binh'\}/);
  assert.match(html, /tower:\{ch:1,label:'Thông Thiên Tháp'\}/);
  assert.match(html, /expedition:\{ch:2,label:'Hành Tẩu'\}/);
  assert.match(html, /hunt:\{ch:3,label:'Săn Boss'\}/);
  assert.match(html, /arena:\{ch:3,label:'Đấu Trường'\}/);
  assert.match(html, /guild:\{ch:4,label:'Bang Hội'\}/);
});

test('L26-T2: preview unlock wraps featLocked off production and does not add a document click', () => {
  const ui = read('src/ui/preview-journey-unlock.js');
  assert.match(ui, /luc-than\.vercel\.app/);
  assert.match(ui, /featLocked\s*=\s*function[\s\S]*return false/);
  assert.match(ui, /renderHub\(\)/);
  assert.doesNotMatch(ui, /JOURNEY_UNLOCK\s*=/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"](?:click|pointerdown)/);
  assert.doesNotMatch(ui, /P\.inventory\s*=/);
});

test('L26-T3: preview unlock injects after forge hall', () => {
  const build = read('scripts/build-static.mjs');
  const inject = read('scripts/preview-journey-unlock-v1.mjs');
  assert.match(build, /forge-hall-v1\.mjs[\s\S]*preview-journey-unlock-v1\.mjs/);
  assert.match(inject, /src\/ui\/preview-journey-unlock\.js/);
});
