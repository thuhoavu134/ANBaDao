import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ARENA_COST,
  ARENA_NAMES,
  ARENA_RANK_GEMS,
  ARENA_RIVALRY_MILESTONES,
  ARENA_WIN_GOLD,
  LIVE_ARENA,
  PVE_STAGE_COUNT,
  PVE_STAGES,
  SEASON_LEN,
  SEASON_LP_KEYS,
  SEASON_LP_MILESTONES,
  SEASON_RULES,
  SEASON_WIN_GOLD,
  arenaRivalKey,
  currentSeasonRule,
  emptyArena,
  findPveStage,
  prepareArenaSettle,
  preparePveSettle,
  prepareRivalsLocal,
  prepareSeasonClaim,
  prepareSeasonDefense,
  prepareSeasonSettle,
  rankCandidates,
  rivalPower,
  seasonLpDelta,
  seasonPveScore,
  seasonTier
} from '../src/domain/arena/arena-match.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function player(extra = {}) {
  return {
    gold: 400,
    gems: 80,
    so: 2,
    clearedChapters: [0, 1],
    arena: { ...emptyArena(), rank: 1000, best: 1000, rivalry: { day: 9, deeds: [], marks: 0, claimed: [], grudges: {}, wins: 0, losses: 0, revenges: 0, leaps: 0 } },
    arenaPvE: { stage: 1, cleared: [] },
    season: { index: 0, lp: 0, bestLp: 0, wins: 0, losses: 0, streak: 0, bestStreak: 0, defense: [], claimed: [], badges: [], uniqueWinTeams: [], draftWins: 0 },
    shards: {},
    ...extra
  };
}

const rival = { rank: 780, name: 'Hội Cú Đêm', team: ['ong_hang_pho', 'luc_anh'] };

test('L18-T1: live catalog frozen — cost 5, 8 võ đài, mốc LP/hạng/vinh ấn', () => {
  assert.equal(ARENA_COST, 5);
  assert.equal(ARENA_WIN_GOLD, 220);
  assert.equal(SEASON_WIN_GOLD, 180);
  assert.equal(SEASON_LEN, 35);
  assert.equal(PVE_STAGE_COUNT, 8);
  assert.equal(PVE_STAGES.length, 8);
  assert.equal(SEASON_RULES.length, 5);
  assert.equal(ARENA_NAMES.length, 8);
  assert.deepEqual(SEASON_LP_KEYS, [180, 400, 700, 1000, 1400]);
  assert.equal(SEASON_LP_MILESTONES[180].gems, 40);
  assert.equal(SEASON_LP_MILESTONES[180].gold, 800);
  assert.equal(ARENA_RIVALRY_MILESTONES[3].gold, 300);
  assert.equal(ARENA_RANK_GEMS[0][0], 800);
  assert.equal(ARENA_RANK_GEMS[0][1], 10);
  assert.equal(LIVE_ARENA.cost, 5);
  assert.equal(Object.isFrozen(PVE_STAGES), true);
  assert.equal(findPveStage(8).reward.gems, 100);
});

test('L18-T2: rivalPower / rankCandidates / LP delta keep live formulas', () => {
  assert.deepEqual(rivalPower(1000), { lvl: 1, stars: 1 });
  assert.deepEqual(rivalPower(780), { lvl: 7, stars: 2 });
  assert.deepEqual(rankCandidates(1000), [780, 900, 999]);
  assert.equal(seasonLpDelta(1000, 780, true), Math.round(34 + Math.max(-300, Math.min(300, 1000 - 780)) / 30));
  assert.equal(seasonLpDelta(1000, 780, false), Math.round(-18 - Math.max(0, -(1000 - 780)) / 55));
  assert.equal(seasonTier(0).name, 'Đồng');
  assert.equal(seasonTier(180).name, 'Bạc');
  assert.equal(seasonTier(1400).name, 'Võ Vương');
  assert.equal(seasonPveScore({ towerBest: 2, rogueBest: 1, challengeStars: { a: 2 } }), 2 * 18 + 45 + 50);
  assert.equal(currentSeasonRule(0).id, 'frontline');
});

test('L18-T3: rank win takes rival rank +220g; lose does not drop; player not mutated', () => {
  const near = { rank: 999, name: 'Đội Trực Ca Ba', team: ['ong_hang_pho'] };
  const src = player();
  const win = prepareArenaSettle(src, { win: true, rival: near, day: 9 });
  assert.equal(win.ok, true);
  assert.equal(win.arena.rank, 999);
  assert.equal(win.gold, 400 + 220);
  assert.equal(win.so, 3);
  assert.equal(src.arena.rank, 1000);
  assert.equal(src.gold, 400);
  assert.deepEqual(win.clearedChapters, [0, 1]);
  const lose = prepareArenaSettle(player(), { win: false, rival: near, day: 9 });
  assert.equal(lose.arena.rank, 1000);
  assert.equal(lose.gold, 400);
  assert.equal(Object.keys(lose.arena.rivalry.grudges).length > 0, true);
});

test('L18-P1: rank gem milestones fire once; net kèo rejected', () => {
  const hit = prepareArenaSettle(player({ gems: 80 }), { win: true, rival: { rank: 800, name: 'X', team: ['a'] }, day: 9 });
  assert.equal(hit.arena.claimed.includes(800), true);
  assert.equal(hit.gems, 80 + 10 + 5);
  const again = prepareArenaSettle(player({
    gems: 80,
    arena: { rank: 800, best: 800, claimed: [800], rivals: [], rivalry: player().arena.rivalry }
  }), { win: true, rival: { rank: 790, name: 'Y', team: ['a'] }, day: 9 });
  assert.equal(again.gems, 80);
  const net = prepareArenaSettle(player(), { win: true, rival: { net: true, rank: 700, name: 'Z' }, day: 9 });
  assert.equal(net.code, 'NET');
});

test('L18-P2: rivalry first/leap/revenge; day rollover clears deeds; marks are not combat stats', () => {
  const leapRival = { rank: 780, name: 'Hội Cú Đêm', team: ['a'] };
  const leap = prepareArenaSettle(player(), { win: true, rival: leapRival, day: 9 });
  assert.equal(leap.arena.rivalry.deeds.includes('first'), true);
  assert.equal(leap.arena.rivalry.deeds.includes('leap'), true);
  assert.equal(leap.arena.rivalry.marks, 3);
  const key = arenaRivalKey(leapRival);
  const revengeSrc = player();
  revengeSrc.arena.rivalry.grudges[key] = 1;
  const rev = prepareArenaSettle(revengeSrc, { win: true, rival: leapRival, day: 9 });
  assert.equal(rev.arena.rivalry.revenges, 1);
  const roll = prepareArenaSettle(player({
    arena: { ...player().arena, rivalry: { ...player().arena.rivalry, day: 8, deeds: ['first'] } }
  }), { win: false, rival: leapRival, day: 9 });
  assert.equal(roll.arena.rivalry.deeds.includes('first'), false);
  assert.equal(roll.arena.rivalry.day, 9);
});

test('L18-P3: season LP claim, defense snapshot, PvE first vs rematch, lock', () => {
  const src = player();
  const season = prepareSeasonSettle(src, { win: true, rival, squadIds: ['ong_hang_pho'], day: 0 });
  assert.equal(season.ok, true);
  assert.equal(season.gold, 400 + 180);
  assert.equal(src.season.lp, 0);
  const poor = prepareSeasonClaim(player({ season: { ...player().season, lp: 179 } }), 180, { day: 0 });
  assert.equal(poor.code, 'NOT_ENOUGH_LP');
  const claim = prepareSeasonClaim(player({ season: { ...player().season, lp: 180 }, gems: 10, gold: 100 }), 180, { day: 0 });
  assert.equal(claim.ok, true);
  assert.equal(claim.gems, 50);
  assert.equal(claim.gold, 900);
  const dup = prepareSeasonClaim(player({ season: { ...player().season, lp: 180, claimed: [180] } }), 180, { day: 0 });
  assert.equal(dup.code, 'CLAIMED');
  const def = prepareSeasonDefense(player(), [{ id: 'luc_anh', row: 'front' }], { day: 0 });
  assert.equal(def.season.defense[0].id, 'luc_anh');
  const locked = preparePveSettle(player(), { win: true, stage: findPveStage(2) });
  assert.equal(locked.code, 'LOCKED');
  const first = preparePveSettle(player({ gems: 0 }), { win: true, stage: findPveStage(1) });
  assert.equal(first.first, true);
  assert.equal(first.gold, 600);
  assert.equal(first.gems, 20);
  assert.equal(first.arenaPvE.stage, 2);
  const rematch = preparePveSettle(player({
    gold: 400,
    gems: 20,
    arenaPvE: { stage: 2, cleared: [1] }
  }), { win: true, stage: findPveStage(1) });
  assert.equal(rematch.first, false);
  assert.equal(rematch.gems, 20);
  assert.equal(rematch.gold, 600);
  const lose = preparePveSettle(player(), { win: false, stage: findPveStage(1) });
  assert.equal(lose.win, false);
  assert.deepEqual(lose.clearedChapters, [0, 1]);
  const rivals = prepareRivalsLocal(player(), { names: ['A', 'B', 'C'], teams: [['a'], ['b'], ['c']] });
  assert.equal(rivals.arena.rivals.length, 3);
  assert.equal(rivals.arena.rivals[0].rank, 780);
});

const uiPath = new URL('../src/ui/arena-runtime.js', import.meta.url);
const cssPath = new URL('../src/ui/arena-screen.css', import.meta.url);
const injectPath = new URL('../scripts/arena-runtime-v1.mjs', import.meta.url);

test('L18-P4: lacquer screen is wired and does not add a second hub landmark', () => {
  const ui = readFileSync(uiPath, 'utf8');
  const css = readFileSync(cssPath, 'utf8');
  const inject = readFileSync(injectPath, 'utf8');
  assert.match(ui, /prepareArenaSettle/);
  assert.match(ui, /Võ Đài Kẻ Mất Ngủ/);
  assert.match(ui, /data-arena-tab/);
  assert.doesNotMatch(ui, /data-art-go="arena"/);
  assert.match(css, /#hvArenaRoot/);
  assert.match(css, /[.]hv-ar-tabs/);
  assert.match(inject, /arena-match[.]mjs/);
  new Function(ui);
  const build = join(root, 'scripts/build-static.mjs');
  if (existsSync(build)) {
    assert.match(readFileSync(build, 'utf8'), /arena-runtime-v1[.]mjs/);
  }
});
