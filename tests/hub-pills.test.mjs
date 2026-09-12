import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/ui/hub-back.css'), 'utf8');

test('L107: Chợ Đấu Gọi Tháp = pill chữ trắng + icon trên nền đen', () => {
  assert.match(css, /#hvHubBackChip\{/);
  assert.match(css, /art-landmark\.shop/);
  assert.match(css, /art-landmark\.arena/);
  assert.match(css, /art-landmark\.summon/);
  assert.match(css, /art-landmark\.tower/);
  assert.match(css, /background:#16120f!important/);
  assert.match(css, /color:#fff!important/);
  assert.match(css, /flex-direction:row!important/);
});
