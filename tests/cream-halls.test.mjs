import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L103: hall chức năng nền kem, jpg chỉ dải trên; không đụng login/hub', () => {
  const files = {
    tower: read('src/ui/tower-3d.css'),
    shop: read('src/ui/shop-3d.css'),
    summon: read('src/ui/summon-3d.css'),
    hunt: read('src/ui/hunt-3d.css'),
    expedition: read('src/ui/expedition-3d.css'),
    jobs: read('src/ui/jobs-hall.css'),
    mail: read('src/ui/mail-hall.css')
  };
  assert.match(files.tower, /#hvTowerRoot\{[^}]*background:#f3e4c4/);
  assert.match(files.shop, /#hvShopRoot\{[^}]*background:#f3e4c4/);
  assert.match(files.summon, /#hvSummonRoot\{[^}]*background:#f3e4c4/);
  assert.match(files.hunt, /#hvHuntRoot\{[^}]*background:#f3e4c4/);
  assert.match(files.expedition, /#hvExpeditionRoot\{[^}]*background:#f3e4c4/);
  // Owner 2026-11-01: Giao viec dung khung go son mai (concept 2) thay cho nen kem.
  assert.match(files.jobs, /jobs-lacquer-frame\.png/);
  assert.doesNotMatch(files.jobs, /#hvJobsRoot\{[^}]*background:#f3e4c4;/);
  // Owner 2026-11-01: Hom thu dung khung go son mai (concept 2) thay cho nen kem.
  assert.match(files.mail, /mail-lacquer-frame\.png/);
  const chat = read('src/ui/chat-hall.css');
  const bag = read('src/ui/bag-hall.css');
  assert.match(chat, /#hvChatRoot \.hv-chat-panel\{[^}]*background:#f3e4c4;/);
  assert.match(chat, /\.chat-bubble\{[^}]*color:#fff8e8/);
  // Owner 2026-11-01: Túi đồ dùng khung gỗ sơn mài (concept 4 cột) thay cho nền kem.
  assert.match(bag, /bag-lacquer-frame\.png/);
  assert.match(files.tower, /tower-hall\.jpg/);
  assert.match(files.shop, /shop-hall\.jpg/);
  assert.match(files.summon, /summon-hall\.jpg/);
  assert.match(files.hunt, /hunt-hall\.jpg/);
  assert.match(files.expedition, /expedition-hall\.jpg/);
  const login = read('src/ui/login-gate.css');
  assert.doesNotMatch(login, /#f3e4c4/);
});
