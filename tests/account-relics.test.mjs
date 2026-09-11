import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ACCOUNT_RELICS,
  RELIC_MAX_LEVEL,
  RELIC_SETS,
  accountRelicBonus,
  accountRelicMasterBonus,
  accountRelicMasterLevel,
  accountRelicMasterProgress,
  emptyAccountRelics,
  normalizeAccountRelics,
  prepareRelicEnhance,
  relicEnhanceCost
} from '../src/domain/equipment/account-relics.mjs';

function player(extra = {}) {
  return {
    gold: 4000,
    hoat: 80,
    relics: emptyAccountRelics(),
    ...extra
  };
}

test('L13-R1: eight relics sit in two sets of four and empty board grants nothing', () => {
  assert.equal(ACCOUNT_RELICS.length, 8);
  assert.equal(RELIC_SETS.length, 2);
  const counts = Object.fromEntries(RELIC_SETS.map(set => [set.id, 0]));
  const stats = { hp: 0, atk: 0, def: 0, spd: 0 };
  for (const relic of ACCOUNT_RELICS) {
    counts[relic.set] += 1;
    stats[relic.stat] += 1;
    assert.ok(relic.column === 'left' || relic.column === 'right');
  }
  assert.deepEqual(counts, { 'lac-viet': 4, 'de-vuong': 4 });
  assert.deepEqual(stats, { hp: 2, atk: 2, def: 2, spd: 2 });
  assert.equal(accountRelicMasterLevel(emptyAccountRelics()), 0);
  assert.deepEqual(accountRelicBonus(emptyAccountRelics()), { hp: 0, atk: 0, def: 0, spd: 0 });
});

test('L13-R2: enhance spends gold and hoat, stays immutable, and rejects max or missing funds', () => {
  const state = player();
  const first = prepareRelicEnhance(state, { id: 'trong-dong' });
  const cost = relicEnhanceCost(0);
  assert.equal(first.ok, true);
  assert.equal(first.relics['trong-dong'].lvl, 1);
  assert.equal(first.gold, 4000 - cost.gold);
  assert.equal(first.hoat, 80 - cost.hoat);
  assert.equal(state.relics['trong-dong'].lvl, 0);
  assert.equal(state.gold, 4000);
  assert.equal(prepareRelicEnhance(state, { id: 'no-such' }).code, 'INVALID_RELIC');
  assert.equal(prepareRelicEnhance(player({ gold: 0, hoat: 80 }), { id: 'trong-dong' }).code, 'INSUFFICIENT_GOLD');
  assert.equal(prepareRelicEnhance(player({ gold: 4000, hoat: 0 }), { id: 'trong-dong' }).code, 'INSUFFICIENT_HOAT');
  const capped = player({ relics: { ...emptyAccountRelics(), 'trong-dong': { lvl: RELIC_MAX_LEVEL } } });
  assert.equal(prepareRelicEnhance(capped, { id: 'trong-dong' }).code, 'RELIC_MAX_LEVEL');
  const burst = prepareRelicEnhance(state, { id: 'no-than', times: 3 });
  assert.equal(burst.ok, true);
  assert.equal(burst.raised, 3);
  assert.equal(burst.relics['no-than'].lvl, 3);
});

test('L13-R3: combat bonus adds per-level primary stat, 2/4-set and Bậc Thầy', () => {
  const relics = emptyAccountRelics();
  relics['trong-dong'] = { lvl: 2 };
  relics['cuu-dinh'] = { lvl: 1 };
  const two = accountRelicBonus(relics);
  assert.equal(two.hp, 12 * 2 + 12 * 1 + 40);
  assert.equal(two.atk, 0);
  assert.equal(two.def, 0);
  for (const relic of ACCOUNT_RELICS.filter(item => item.set === 'lac-viet')) relics[relic.id] = { lvl: 2 };
  const four = accountRelicBonus(relics);
  assert.equal(four.hp, 12 * 2 + 12 * 2 + 40 + 80);
  assert.equal(four.def, 2 * 2 + 8);
  assert.equal(four.spd, 0.4 * 2);
  for (const relic of ACCOUNT_RELICS) relics[relic.id] = { lvl: 3 };
  const armed = accountRelicBonus(relics);
  const master = accountRelicMasterBonus(3);
  assert.equal(accountRelicMasterLevel(relics), 3);
  assert.equal(armed.hp, 12 * 3 * 2 + 40 + 80 + master.hp);
  assert.equal(armed.atk, 2 * 3 * 2 + 6 + 12 + master.atk);
  assert.ok(accountRelicMasterProgress(relics).active);
  relics['ngoc-bich'] = { lvl: 0 };
  assert.equal(accountRelicMasterLevel(relics), 0);
  assert.equal(accountRelicMasterProgress(relics).active, false);
});

test('normalize fills missing relics at level 0 and clamps junk', () => {
  const next = normalizeAccountRelics({ 'trong-dong': { lvl: 9.4 }, ghost: { lvl: 3 }, 'no-than': { lvl: -2 } });
  assert.equal(next['trong-dong'].lvl, 9);
  assert.equal(next['no-than'].lvl, 0);
  assert.equal(next.ghost, undefined);
  assert.equal(Object.keys(next).length, 8);
});

const ui = readFileSync(new URL('../src/ui/account-gear-runtime.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/ui/account-gear-board.css', import.meta.url), 'utf8');
const inject = readFileSync(new URL('../scripts/account-gear-v1.mjs', import.meta.url), 'utf8');

test('L13-R4: wheel opens Bảo Vật as a flanking relic board', () => {
  assert.match(ui, /open:\s*'relic'/);
  const angles = [...ui.matchAll(/angle:\s*(-?\d+)/g)].map(match => ((Number(match[1]) % 360) + 360) % 360);
  assert.equal(angles.length, 11);
  assert.equal(new Set(angles).size, 11);
  let minGap = 360;
  for (let i = 0; i < angles.length; i++) {
    for (let j = i + 1; j < angles.length; j++) {
      const delta = Math.abs(angles[i] - angles[j]) % 360;
      minGap = Math.min(minGap, Math.min(delta, 360 - delta));
    }
  }
  assert.ok(minGap >= 32, 'wheel gap ' + minGap);
  assert.match(css, /--wheel-r:min\(40vw/);
  assert.match(css, /\.hv-assist-spoke\{[^}]*pointer-events:\s*none/);
  assert.match(css, /\.hv-assist-spoke span\{[^}]*pointer-events:\s*auto/);
  assert.match(css, /-webkit-line-clamp:\s*2/);
  assert.match(ui, /data-gear-view="relic"/);
  assert.match(ui, /data-relic="/);
  assert.match(ui, /Bậc Thầy Bảo Vật/);
  assert.match(ui, /Cường hóa nhanh/);
  assert.match(ui, /Đồ giám/);
  assert.match(ui, /openRelic/);
  assert.match(ui, /assist === 'relic'/);
  assert.match(ui, /accountRelicBonus/);
  assert.match(css, /\.hv-relic-slot/);
  assert.match(css, /\.hv-relic-col/);
  assert.match(inject, /account-relics\.mjs/);
  new Function(ui);
});
