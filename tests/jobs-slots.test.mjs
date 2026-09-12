import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L105: Giao việc slot trống, chat chữ thuần, túi 3/4 màn', () => {
  const jobs = read('src/ui/jobs-hall-runtime.js');
  const jobsCss = read('src/ui/jobs-hall.css');
  const chat = read('src/ui/chat-hall-runtime.js');
  const chatCss = read('src/ui/chat-hall.css');
  const bag = read('src/ui/bag-hall.css');
  assert.match(jobs, /hv-job-slots/);
  assert.match(jobs, /is-empty/);
  assert.doesNotMatch(jobs, /document\.addEventListener\(['"](?:click|pointerdown|pointerup)/);
  assert.match(jobsCss, /\.hv-job-slot/);
  assert.match(chat, /CHAT_CHANNELS\[k\]\.label/);
  assert.match(chatCss, /nth-of-type\(2\)\{display:none/);
  assert.match(bag, /max-height:75vh/);
});
