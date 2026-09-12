import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGiftRewardIndex } from '../src/domain/profile/gift-rewards.mjs';
import { redeemGiftCode, applyGiftToPlayer } from '../src/domain/profile/gift-codes.mjs';
import { createMemoryStore } from '../src/server/store.mjs';
import { createApp } from '../src/server/app.mjs';

test('L86-T1: tướng/vật phẩm mới tự vào danh sách thưởng', () => {
  const idx = buildGiftRewardIndex(
    { heroes: { luc_anh: {}, tan_tuong_72: {} }, items: { defs: { 'event.lantern': true } } },
    { skipIndexFile: true }
  );
  assert.ok(idx.heroes.includes('tan_tuong_72'));
  assert.ok(idx.heroes.includes('ong_hang_pho'));
  assert.ok(idx.items.includes('event.lantern'));
  assert.ok(idx.items.some(id => id.startsWith('equipment.weapon')));
  assert.ok(idx.pets.includes('kim-quy'));
  assert.ok(idx.currencies.includes('gold'));
});

test('L86-T2: mã tặng item + pet ghi bag/owned', () => {
  const cat = {
    EVENT: {
      label: 'Quà event',
      items: { 'equipment.weapon.ssr': 1, 'event.lantern': 3 },
      pets: ['kim-quy'],
      shards: { tan_tuong_72: 10 }
    }
  };
  const a = redeemGiftCode({ codes: [], bag: {}, pet: { owned: {} }, shards: {} }, 'event', cat);
  assert.equal(a.ok, true);
  assert.equal(a.player.bag['equipment.weapon.ssr'], 1);
  assert.equal(a.player.bag['event.lantern'], 3);
  assert.equal(a.player.pet.owned['kim-quy'], true);
  assert.equal(a.player.shards.tan_tuong_72, 10);
  const b = applyGiftToPlayer({ bag: { 'event.lantern': 1 } }, { items: { 'event.lantern': 2 } });
  assert.equal(b.player.bag['event.lantern'], 3);
});

test('L86-T3: GET /api/gift trả index', async () => {
  const handle = createApp({
    store: createMemoryStore(),
    secret: 'x',
    giftIndex: buildGiftRewardIndex({ heroes: { moi: {} } }, { skipIndexFile: true })
  });
  const res = await handle('GET', '/api/gift', {});
  assert.equal(res.status, 200);
  assert.ok(res.json.rewards.heroes.includes('moi'));
  assert.ok(res.json.rewards.items.length > 0);
});
