import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildRosterView } from '../src/domain/hero/roster-view.mjs';

const root = new URL('../', import.meta.url);
const read = rel => fs.readFileSync(new URL(rel, root), 'utf8');

const LINH_CARD = Object.freeze({
  id: 'linh_dong',
  name: 'Linh Đồng',
  shortName: 'Linh Đồng',
  element: 'mong',
  role: 'Pháp sư / Khống chế',
  rarity: 'SSR',
  owned: true,
  level: 1,
  stars: 1,
  power: 0,
  portrait: 'assets/characters/linh-dong/card.webp',
  inSquad: false,
  preview: true
});

function base() {
  return {
    ids: ['luc_anh', 'ong_hang_pho'],
    heroes: {
      luc_anh: { name: 'Lục Ảnh — Kép Đèn Kéo Quân', he: 'mong', rarity: 'ssr', role: 'Huyền thuật' },
      ong_hang_pho: { name: 'Ông Phở', he: 'hoa', rarity: 'ssr', role: 'Đấu sĩ' }
    },
    player: {
      gold: 500, gems: 800, squad: [{ id: 'luc_anh' }],
      heroes: {
        luc_anh: { owned: true, level: 1, stars: 1 },
        ong_hang_pho: { owned: true, level: 1, stars: 1 }
      }
    },
    powerFor: () => 1000,
    portraitFor: id => id + '.webp',
    extras: [LINH_CARD]
  };
}

test('L140-T1 Linh Dong preview card shows on owned and all, moon filter, not fire', () => {
  const owned = buildRosterView({ ...base(), scope: 'owned' });
  assert.equal(owned.cards.some(c => c.id === 'linh_dong'), true);
  assert.equal(owned.cards.find(c => c.id === 'linh_dong').portrait, 'assets/characters/linh-dong/card.webp');
  assert.equal(owned.cards.find(c => c.id === 'linh_dong').element, 'mong');
  assert.equal(owned.owned, 3);
  assert.equal(owned.total, 3);
  assert.equal(owned.squadPower, 1000, 'preview card does not join squad power');

  const all = buildRosterView({ ...base(), scope: 'all' });
  assert.equal(all.cards.map(c => c.id).includes('linh_dong'), true);

  const moon = buildRosterView({ ...base(), scope: 'all', element: 'mong' });
  assert.deepEqual(moon.cards.map(c => c.id).sort(), ['linh_dong', 'luc_anh']);

  const fire = buildRosterView({ ...base(), scope: 'all', element: 'hoa' });
  assert.equal(fire.cards.some(c => c.id === 'linh_dong'), false);
});

test('L140-T2 roster runtime paints Linh Dong as official identity; BETS frozen', () => {
  const runtime = read('src/ui/hero-roster-runtime.js');
  const index = read('index.html');
  assert.match(runtime, /linh_dong/);
  assert.match(index, /OFFICIAL_ROSTER_12_IDS=Object\.freeze\(\[[^\]]*linh_dong/);
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /const BETS = \[2, 10, 50\]/);
});

test('L140-T3 tap Linh Dong opens hero detail like official heroes', () => {
  const runtime = read('src/ui/hero-roster-runtime.js');
  assert.doesNotMatch(runtime, /qaSplus42=hero_splus_linh_dong/);
  assert.match(runtime, /renderHeroDetail\(id\); showScreen\('heroDetail'\)/);
  // Roster now admits every known hero (29), so the guard is DATA.heroes membership.
  assert.match(runtime, /if \(!DATA\.heroes\[id\]\) return;/);
});
