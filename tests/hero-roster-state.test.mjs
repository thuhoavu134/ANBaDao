import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildRosterView } from '../src/domain/hero/roster-view.mjs';
import { validateSummonBanner, guardSummonCommand } from '../src/domain/summon/banner-validation.mjs';

function fixture() {
  return { ids: ['luc_anh', 'ong_hang_pho', 'to_diep'],
    heroes: {
      luc_anh: { name: 'Lục Ảnh — Kép Đèn Kéo Quân', he: 'mong', rarity: 'ssr', role: 'Huyền thuật' },
      ong_hang_pho: { name: 'Ông Phở', he: 'hoa', rarity: 'ssr', role: 'Đấu sĩ' },
      to_diep: { name: 'Tố Điệp', he: 'moc', rarity: 'ssr', role: 'Hỗ trợ' },
      removed: { name: 'Không được trở lại', he: 'hoa', rarity: 'b' } },
    player: { gold: 440, gems: 800, squad: [{ id: 'luc_anh' }, { id: 'luc_anh' }, { id: 'ong_hang_pho' }],
      heroes: { luc_anh: { owned: true, level: 2, stars: 1 }, ong_hang_pho: { owned: true, level: 30, stars: 6 }, to_diep: { owned: false, level: 1, stars: 1 } } },
    powerFor: id => ({ luc_anh: 1068, ong_hang_pho: 976 })[id], portraitFor: id => id + '.webp' };
}
test('upgraded heroes remain visible with current level, stars and exact power below 1000', () => {
  const view = buildRosterView(fixture());
  assert.deepEqual(view.cards.map(c => [c.id, c.level, c.stars, c.power]), [['luc_anh', 2, 1, 1068], ['ong_hang_pho', 30, 6, 976]]);
  assert.equal(view.gold, 440); assert.equal(view.gems, 800);
  assert.equal(view.squadPower, 2044, 'unique six-slot team only, not the entire collection');
});
test('element filters use stable IDs and collection exposes locked heroes without fake levels', () => {
  const view = buildRosterView({ ...fixture(), scope: 'all', element: 'moc' });
  assert.equal(view.cards.length, 1); assert.equal(view.cards[0].id, 'to_diep');
  assert.equal(view.cards[0].level, null); assert.equal(view.cards[0].stars, 0);
  assert.equal(view.cards[0].power, 0); assert.equal(view.owned, 2); assert.equal(view.total, 3);
});
test('only official unique identities are displayed, even with extra heroes in DATA', () => {
  const f = fixture(); f.ids.push('luc_anh', 'not_in_data');
  assert.equal(buildRosterView({ ...f, scope: 'all' }).total, 3);
});
test('sorting changes presentation, never the player save or official order', () => {
  const f = fixture(), before = JSON.stringify(f);
  assert.equal(buildRosterView({ ...f, sort: 'level' }).cards[0].id, 'ong_hang_pho');
  assert.equal(buildRosterView({ ...f, sort: 'power' }).cards[0].id, 'luc_anh');
  assert.equal(JSON.stringify(f), before);
});
test('returning after a level change recomputes all card data, not cached DOM labels', () => {
  const f = fixture(); buildRosterView(f); f.player.heroes.luc_anh.level = 3; f.player.gold = 320;
  const next = buildRosterView(f); assert.equal(next.cards[0].level, 3); assert.equal(next.gold, 320);
});
test('roster build excludes DOM scraping, duplicate pointer commands and offscreen parking', () => {
  const ui = readFileSync(new URL('../src/ui/hero-roster-runtime.js', import.meta.url), 'utf8');
  assert.doesNotMatch(ui, /MutationObserver|getBoundingClientRect|innerText|pointerup|touchend|300vw/);
  const plan = readFileSync(new URL('../src/domain/hero/roster-plan.mjs', import.meta.url), 'utf8').replace(/^export\s+/gm, '');
  const view = readFileSync(new URL('../src/domain/hero/roster-view.mjs', import.meta.url), 'utf8')
    .replace("import { summarizeRosterCapacity } from './roster-plan.mjs';", '')
    .replace(/^export\s+/gm, '');
  new Function(plan + '\n' + view + '\n' + ui);
  const build = readFileSync(new URL('../scripts/build-static.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(build, /import\('\.\/hero-roster-v4-runtime-fix-v1|import\('\.\/hero-card-dedupe-v1/);
});
const rates = [['ssr', 3], ['ss', 9], ['s', 18], ['a', 30], ['b', 40]];
test('all-SSR official roster rejects the old mixed-rarity banner before spending anything', () => {
  const player = { gems: 800, pity: 12, spark: 7, freePullDay: null }, before = JSON.stringify(player);
  let rejects = 0;
  const validate = () => validateSummonBanner(rates, tier => tier === 'ssr' ? ['luc_anh'] : []);
  const run = guardSummonCommand(() => { player.gems -= 80; player.pity++; player.spark++; }, validate, () => rejects++);
  assert.equal(run(1, false), null); assert.equal(run(10, false), null); assert.equal(run(1, true), null);
  assert.equal(JSON.stringify(player), before); assert.equal(rejects, 3);
  assert.deepEqual(validate().tiers, ['ss', 's', 'a', 'b']);
});
test('guaranteed tiers and rate total are validated, not only random pools', () => {
  assert.equal(validateSummonBanner([['ssr', 100]], () => [], ['ssr']).ok, false);
  assert.equal(validateSummonBanner([['ssr', 100]], tier => tier === 'ssr' ? ['hero'] : []).ok, false);
  assert.equal(validateSummonBanner([['ssr', 90]], () => ['hero']).reason, 'INVALID_RATES');
  assert.equal(validateSummonBanner(rates, () => ['hero']).ok, true);
});
test('valid banner dispatches once and invalid pull counts never dispatch', () => {
  let calls = 0; const run = guardSummonCommand((n, free) => { calls++; return { n, free }; }, () => ({ ok: true }), () => {});
  assert.deepEqual(run(10, false), { n: 10, free: false });
  assert.equal(run(-1, false), null); assert.equal(run(10, true), null); assert.equal(calls, 1);
});
