import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../src/server/store.mjs';
import { createApp } from '../src/server/app.mjs';
import { loadGiftCatalog, parseGiftEnv } from '../src/domain/profile/gift-codes.mjs';

const SECRET = 'test-secret-gift-l84';

function app(extra = {}) {
  return createApp({
    store: extra.store || createMemoryStore(),
    secret: SECRET,
    now: () => 1_700_000_000_000,
    gifts: extra.gifts || loadGiftCatalog({
      envRaw: extra.envRaw || ''
    })
  });
}

test('L84-T2: POST /api/gift trả quà, mã lạ 400', async () => {
  const handle = app({
    gifts: { TET2026: { label: 'Tết Lục Thần', gold: 8000, gems: 500, stam: 50 } }
  });
  const ok = await handle('POST', '/api/gift', { body: { code: 'tet-2026' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.gold, 8000);
  assert.equal(ok.json.key, 'TET2026');
  const bad = await handle('POST', '/api/gift', { body: { code: 'KHONGCO' } });
  assert.equal(bad.status, 400);
});

test('L84-T3: env GIFT_CODES đè file', () => {
  const cat = loadGiftCatalog({
    file: { LUCTHAN: { label: 'cũ', gold: 1, gems: 1, stam: 1 } },
    envRaw: '{"TET2026":{"label":"Tết","gold":9,"gems":8,"stam":7}}'
  });
  assert.equal(cat.TET2026.gold, 9);
  assert.equal(parseGiftEnv('not-json').TET2026, undefined);
  assert.ok(cat.LUCTHAN);
});

test('L85-T2: POST /api/gift trả shards', async () => {
  const handle = app({
    gifts: {
      ANH20: { label: 'Mảnh Lục Ảnh', shards: { luc_anh: 20 }, gems: 50 }
    }
  });
  const ok = await handle('POST', '/api/gift', { body: { code: 'anh20' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.shards.luc_anh, 20);
  assert.equal(ok.json.gems, 50);
});
