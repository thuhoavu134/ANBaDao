import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { REWARD_ICONS, REWARD_ICON_FALLBACK } from '../scripts/result-reward-icons.mjs';

const root = new URL('../', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');

test('reward icons: one canonical asset per logical reward, no shop glyph with baked text', () => {
  assert.equal(REWARD_ICONS.gold, 'assets/result-icons-art/gold-imagen.png');
  assert.equal(REWARD_ICONS.mastery, 'assets/result-icons-art/mastery-imagen.png');
  assert.equal(REWARD_ICONS.playerXp, 'assets/result-icons-art/scroll-imagen.png');
  assert.equal(REWARD_ICONS.shards, 'assets/result-icons-art/hero-shard-imagen.png');
  // The economy glyph carries baked "300" / "Hạn mua 1/1" text and must not be
  // used as a reward tile icon.
  assert.ok(!Object.values(REWARD_ICONS).some(src => src.includes('meta/economy/icon-gems')));
  assert.ok(REWARD_ICONS.gems.includes('resource-gem-imagen'));
  // playerXp and exp are the same logical reward and must share one asset.
  assert.equal(REWARD_ICONS.playerXp, REWARD_ICONS.exp);
  // every entry is a local asset under assets/
  for (const src of Object.values(REWARD_ICONS)) assert.match(src, /^assets\/.+\.(png|webp)$/);
  assert.match(REWARD_ICON_FALLBACK, /^assets\//);
});

test('battle.html reward cards mirror the shared map (no drift, gems present, neutral fallback)', () => {
  const battle = read('battle.html');
  assert.match(battle, /RESULT_REWARD_ART_FALLBACK = "assets\/result-art\/reward-empty-slot-imagen-v154\.png"/);
  for (const [id, src] of Object.entries(REWARD_ICONS)) {
    const key = id === 'shards' ? 'shards' : id;
    assert.ok(battle.includes(`${key}: "${src}"`), `battle.html missing ${key} -> ${src}`);
  }
  const cardMap = battle.slice(battle.indexOf('RESULT_REWARD_ART_ICONS = Object.freeze({'),
    battle.indexOf('const RESULT_REWARD_ART_FALLBACK'));
  assert.ok(!cardMap.includes('meta/economy/icon-gems'), 'battle cards still use the shop glyph');
  // Unknown ids must not fall back to mastery art (that reads as a wrong reward).
  assert.ok(!/return item\.icon \|\| RESULT_REWARD_ART_ICONS\.mastery;/.test(battle));
});

test('result loot tiles use the shared map instead of a private icon table', () => {
  const contract = read('scripts/result-screen-contract-v1.mjs');
  assert.match(contract, /from '\.\/result-reward-icons\.mjs'/);
  assert.match(contract, /const REWARD_ICON_MAP = rewardIconMapLiteral\(\)/);
  assert.ok(!contract.includes("gems:'assets/meta/economy/icon-gems.png'"), 'private loot icon table came back');
  assert.ok(!contract.includes("esc(icons[r.id]||'assets/result-icons-art/scroll-imagen.png')"),
    'unknown rewards still fall back to the EXP scroll');
});

test('result word mark is vector, sized to the crest, and no longer the 480px raster', () => {
  const patch = read('scripts/owner-refresh-20261018.mjs');
  assert.ok(patch.includes('assets/result-art/result-word-v2/'), 'word mark not pointed at the vector asset');
  assert.ok(/result-word-v2\/[\s\S]{0,40}\.svg/.test(patch), 'word mark src is not an .svg');
  assert.ok(!patch.includes('-letters.png'), 'raster lettering still referenced');
  assert.match(patch, /\.irv-word\{[^}]*width:min\(62vw,286px\)!important/);
  assert.match(patch, /\.irv-word\{[^}]*aspect-ratio:auto!important/);
  const svg = read('assets/result-art/result-word-v2/victory.svg');
  assert.match(svg, /viewBox="0 0 [\d.]+ [\d.]+"/);
  assert.ok(!/<text/.test(svg), 'word mark must be outlines, not live text');
});
