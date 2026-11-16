import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildRosterView, BACH_DIEN_ROSTER_PREVIEW } from '../src/domain/hero/roster-view.mjs';

const root = new URL('../', import.meta.url);
const read = rel => fs.readFileSync(new URL(rel, root), 'utf8');
const exists = rel => fs.existsSync(new URL(rel, root));

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
    extras: [BACH_DIEN_ROSTER_PREVIEW]
  };
}

test('L155-T1 Bạch Diện preview card shows on owned and all, soul filter, not fire', () => {
  assert.equal(BACH_DIEN_ROSTER_PREVIEW.id, 'bach_dien');
  assert.equal(BACH_DIEN_ROSTER_PREVIEW.portrait, 'assets/characters/bach-dien/card.webp');
  assert.equal(exists('assets/characters/bach-dien/card.webp'), true);
  const owned = buildRosterView({ ...base(), scope: 'owned' });
  assert.equal(owned.cards.some(c => c.id === 'bach_dien'), true);
  assert.equal(owned.cards.find(c => c.id === 'bach_dien').portrait, 'assets/characters/bach-dien/card.webp');
  assert.equal(owned.cards.find(c => c.id === 'bach_dien').element, 'soul');
  assert.equal(owned.cards.find(c => c.id === 'bach_dien').name, 'Bạch Diện');
  assert.equal(owned.owned, 3);
  assert.equal(owned.total, 3);
  assert.equal(owned.squadPower, 1000, 'preview card does not join squad power');

  const all = buildRosterView({ ...base(), scope: 'all' });
  assert.equal(all.cards.map(c => c.id).includes('bach_dien'), true);

  const soul = buildRosterView({ ...base(), scope: 'all', element: 'soul' });
  assert.deepEqual(soul.cards.map(c => c.id), ['bach_dien']);

  const fire = buildRosterView({ ...base(), scope: 'all', element: 'hoa' });
  assert.equal(fire.cards.some(c => c.id === 'bach_dien'), false);
});

test('L155-T2 roster runtime paints Bạch Diện official; BETS frozen', () => {
  const runtime = read('src/ui/hero-roster-runtime.js');
  const index = read('index.html');
  assert.match(runtime, /'bach_dien', 'linh_dong'/);
  assert.match(runtime, /data-hero-id="\$\{esc\(card\.id\)\}"/);
  assert.match(index, /OFFICIAL_ROSTER_12_IDS=Object\.freeze\(\[[^\]]*bach_dien/);
  const ui = read('src/ui/bach-bao-ruong-runtime.js');
  assert.match(ui, /const BETS = \[2, 10, 50\]/);
});

test('L155-T3 tap Bạch Diện opens hero detail like official heroes', () => {
  const runtime = read('src/ui/hero-roster-runtime.js');
  assert.doesNotMatch(runtime, /qaSplus42=hero_splus_bach_dien/);
  assert.doesNotMatch(runtime, /qaSplus42=hero_splus_linh_dong/);
  assert.match(runtime, /renderHeroDetail\(id\); showScreen\('heroDetail'\)/);
  // Roster now admits every known hero (29), so the guard is DATA.heroes membership.
  assert.match(runtime, /if \(!DATA\.heroes\[id\]\) return;/);
});

test('L155-T4 encyclopedia 42 stays; DATA.heroes has bach-dien slug', () => {
  const encyclopedia = read('src/ui/splus-encyclopedia.js');
  assert.match(encyclopedia, /data\.profiles\?\.length!==42/);
  assert.match(encyclopedia, /data\.skillIcons\?\.length!==126/);
  const index = read('index.html');
  assert.match(index, /bach_dien:\{slug:'bach-dien'/);
  assert.match(index, /bach_dien:\{he:'soul'/);
});
