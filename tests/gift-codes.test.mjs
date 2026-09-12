import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXTRA_GIFTCODES, redeemGiftCode, validateNick, normalizeGiftKey, applyGiftToPlayer } from '../src/domain/profile/gift-codes.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('L83-T1: mã LUCTHAN nhận một lần, nhập lại bị chặn', () => {
  const a = redeemGiftCode({ gold: 10, gems: 1, codes: [] }, 'luc-than', EXTRA_GIFTCODES);
  assert.equal(a.ok, true);
  assert.equal(a.gold, 5000);
  assert.equal(a.player.gold, 5010);
  const b = redeemGiftCode(a.player, 'LUCTHAN', EXTRA_GIFTCODES);
  assert.equal(b.ok, false);
  assert.match(b.msg, /đã nhận/);
});

test('L83-T1b: nick 4-14, normalize mã', () => {
  assert.equal(normalizeGiftKey(' thanh-chinh '), 'THANHCHINH');
  assert.equal(validateNick('abc').ok, false);
  assert.equal(validateNick('Nhi9433').ok, true);
  assert.equal(validateNick('<x>').ok, false);
});

test('L83-T2: runtime gọi redeemCode + mã thêm + /api/gift', () => {
  const ui = readFileSync(join(root, 'src/ui/profile-runtime.js'), 'utf8');
  assert.match(ui, /redeemCode/);
  assert.match(ui, /LUCTHAN/);
  assert.match(ui, /THANHCHINH/);
  assert.match(ui, /\/api\/gift/);
  assert.match(ui, /art-player/);
  assert.match(ui, /hvProfileRoot/);
});

test('L85-T1: mã event cộng mảnh tướng + tinh', () => {
  const cat = {
    SUKIEN: {
      label: 'Sự kiện Lục Ảnh',
      gold: 100,
      shards: { luc_anh: 20, ong_hang_pho: 5 },
      tinh: 40
    }
  };
  const a = redeemGiftCode({ gold: 0, gems: 0, tinh: 1, shards: { luc_anh: 2 }, codes: [] }, 'sukien', cat);
  assert.equal(a.ok, true);
  assert.equal(a.player.shards.luc_anh, 22);
  assert.equal(a.player.shards.ong_hang_pho, 5);
  assert.equal(a.player.tinh, 41);
  const b = applyGiftToPlayer({ economy: { dreamEssence: 3 } }, { essence: 10, so: 2 });
  assert.equal(b.player.economy.dreamEssence, 13);
  assert.equal(b.player.so, 2);
});
