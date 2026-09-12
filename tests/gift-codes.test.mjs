import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXTRA_GIFTCODES, redeemGiftCode, validateNick, normalizeGiftKey } from '../src/domain/profile/gift-codes.mjs';

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

test('L83-T2: runtime gọi redeemCode + mã thêm', () => {
  const ui = readFileSync(join(root, 'src/ui/profile-runtime.js'), 'utf8');
  assert.match(ui, /redeemCode/);
  assert.match(ui, /LUCTHAN/);
  assert.match(ui, /THANHCHINH/);
  assert.match(ui, /art-player/);
  assert.match(ui, /hvProfileRoot/);
});
