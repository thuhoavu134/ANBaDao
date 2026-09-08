import test from 'node:test';
import assert from 'node:assert/strict';
import { SPLUS_ATLASES, SPLUS_SKILL_ICONS } from '../src/domain/hero/splus-profiles.mjs';
import { SPLUS_HEROES } from '../src/domain/hero/splus-catalog.mjs';
import { createSplusMechanics } from '../src/domain/combat/splus-mechanics.mjs';
import { createSplusFixture } from '../scripts/splus-runtime-v1.mjs';

function engineFor(heroId) {
  const fixture = createSplusFixture(SPLUS_HEROES, heroId);
  const engine = createSplusMechanics({
    units: fixture.heroes,
    rng: () => 0.5,
  });
  engine.start();
  return { fixture, engine };
}

test('S+ atlas rects keep a source-pixel gutter on every side of each cell', () => {
  const expected = { x: 3, y: 5 };
  for (const icon of SPLUS_SKILL_ICONS) {
    assert.deepEqual(icon.crop, expected, `${icon.id} declares its crop gutter`);
    const atlas = SPLUS_ATLASES[icon.element];
    const elementHeroes = SPLUS_HEROES.filter(hero => hero.element === icon.element);
    const rowIndex = elementHeroes.findIndex(hero => hero.id === icon.heroId);
    const row = atlas.rows[rowIndex];
    const column = ['passive', 'skill', 'ultimate'].indexOf(icon.slot);
    const cellX = column * 274;
    const cellWidth = column === 2 ? 273 : 274;
    const cellHeight = atlas.rows[rowIndex + 1] - row;
    assert.ok(icon.rect[0] >= cellX + expected.x, `${icon.id} must not expose the previous column`);
    assert.ok(icon.rect[1] >= row + expected.y, `${icon.id} must not expose the previous row`);
    assert.ok(icon.rect[2] <= cellWidth - expected.x * 2, `${icon.id} must not expose the next column`);
    assert.ok(icon.rect[3] <= cellHeight - expected.y * 2, `${icon.id} must not expose the next row`);
  }
});

test('Nung Skill 1 exposes only the opposing front target, not every enemy slot', () => {
  const { engine } = engineFor('hero_splus_nung');
  assert.deepEqual(engine.targets('player:hero_splus_nung', 'skill').map(unit => unit.slot), [0]);
});

test('row-scoped S+ skills keep the picker inside the authored row while targeted ultimates remain selectable', () => {
  const rowScoped = engineFor('hero_splus_hoa_bai').engine;
  assert.deepEqual(rowScoped.targets('player:hero_splus_hoa_bai', 'skill').map(unit => unit.slot), [0, 1, 2]);

  const targeted = engineFor('hero_splus_lac_an').engine;
  assert.deepEqual(targeted.targets('player:hero_splus_lac_an', 'ultimate').map(unit => unit.slot), [0, 1, 2, 3, 4, 5]);
});
