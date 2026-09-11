import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ACT_MILESTONES,
  DAILY_CALENDAR_DAYS,
  DAILY_IDLE_CAP_H,
  DAILY_IDLE_GOLD_PER_H,
  DAILY_IDLE_MIN_H,
  DAILY_JOURNAL_MAX,
  DAILY_NAP_EVE,
  DAILY_NAP_GAIN,
  DAILY_NAP_NOON,
  DAILY_QUEST_COUNT,
  DAILY_QUESTS,
  DAILY_STAM_CAP,
  LICH_LUYEN_SPOKE_COUNT,
  LICH_LUYEN_SPOKES,
  LIVE_DAILY,
  WEEKLY_MILESTONES,
  WEEKLY_QUEST_COUNT,
  WEEKLY_QUESTS,
  appendJournal,
  dailyDayIndex,
  emptyDaily,
  idlePreview,
  lichSpokeLocked,
  napWindowOpen,
  prepareClaimActMilestone,
  prepareClaimIdle,
  prepareClaimQuest,
  prepareClaimWeeklyMilestone,
  prepareClaimWeeklyQuest,
  prepareDailyOpen,
  prepareLichEnter,
  prepareNap,
  prepareSignIn,
  rollQuests,
  signInReward
} from '../src/domain/daily/daily-run.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function player(extra = {}) {
  return {
    gold: 500,
    gems: 800,
    so: 3,
    stamina: 80,
    tinh: 10,
    hoat: 10,
    clearedChapters: [0, 1],
    idle: { claimedAt: 1_000_000 },
    guild: { id: 'g1', donated: true, bought: ['a'] },
    daily: {
      dayIndex: 10,
      lastLoginDay: 10,
      signInDay: 0,
      signInClaimedDay: -1,
      streak: 1,
      quests: rollQuests(),
      activityPoints: 0,
      actClaimed: [],
      napNoon: false,
      napEve: false
    },
    weekly: { weekIndex: 1, points: 0, claimed: [], quests: WEEKLY_QUESTS.map(q => ({ id: q.id, progress: 0, claimed: false })) },
    journal: [],
    squad: [{ id: 'ong_hang_pho' }],
    ...extra
  };
}

const dayArgs = { day: 10, weekIndex: 1, stamCap: 120, now: 1_000_000 };

test('L21-T1: frozen catalog — 14 quests, mốc ngày/tuần, sign-in 28/14/7, idle 12h/60g, nap 50', () => {
  assert.equal(DAILY_STAM_CAP, 120);
  assert.equal(DAILY_NAP_GAIN, 50);
  assert.equal(DAILY_NAP_NOON.start, 11);
  assert.equal(DAILY_NAP_NOON.end, 14);
  assert.equal(DAILY_NAP_EVE.start, 18);
  assert.equal(DAILY_NAP_EVE.end, 21);
  assert.equal(DAILY_IDLE_CAP_H, 12);
  assert.equal(DAILY_IDLE_GOLD_PER_H, 60);
  assert.equal(DAILY_IDLE_MIN_H, 0.02);
  assert.equal(DAILY_QUEST_COUNT, 14);
  assert.equal(DAILY_QUESTS.length, 14);
  assert.equal(DAILY_QUESTS[0].id, 'q_win');
  assert.equal(DAILY_QUESTS[0].pts, 15);
  assert.equal(DAILY_QUESTS[13].id, 'q_guild');
  assert.deepEqual(ACT_MILESTONES.map(m => m.p), [20, 40, 60, 80]);
  assert.equal(ACT_MILESTONES[0].reward.gold, 200);
  assert.equal(ACT_MILESTONES[1].reward.gems, 20);
  assert.equal(ACT_MILESTONES[2].reward.gold, 400);
  assert.equal(ACT_MILESTONES[3].reward.gems, 50);
  assert.equal(WEEKLY_QUEST_COUNT, 5);
  assert.equal(WEEKLY_QUESTS[0].id, 'w_win');
  assert.deepEqual(WEEKLY_MILESTONES.map(m => m.p), [25, 50, 75, 100]);
  assert.equal(WEEKLY_MILESTONES[0].reward.gold, 500);
  assert.equal(WEEKLY_MILESTONES[1].reward.gems, 40);
  assert.equal(WEEKLY_MILESTONES[2].reward.gold, 900);
  assert.equal(WEEKLY_MILESTONES[3].reward.gems, 90);
  assert.equal(signInReward(1).gold, 120);
  assert.equal(signInReward(7).gems, 30);
  assert.equal(signInReward(14).gems, 60);
  assert.equal(signInReward(21).gems, 30);
  assert.equal(signInReward(28).gems, 120);
  assert.equal(DAILY_CALENDAR_DAYS, 28);
  assert.equal(LIVE_DAILY.journalMax, 40);
  assert.equal(napWindowOpen('noon', 11), true);
  assert.equal(napWindowOpen('noon', 14), false);
  assert.equal(napWindowOpen('eve', 18), true);
  assert.equal(napWindowOpen('eve', 21), false);
  const now = 1_746_000_000_000;
  const tz = -420;
  assert.equal(dailyDayIndex(now, tz), Math.floor((now - tz * 60000) / 86400000));
  assert.equal(Object.isFrozen(DAILY_QUESTS), true);
  assert.equal(rollQuests().length, 14);
});

test('L21-T2: first sign-in 🪙120 +1🐚; day 7/14/28 gems; already claimed; meo_mun +2⚡; input not mutated', () => {
  const src = player();
  const first = prepareSignIn(src, dayArgs);
  assert.equal(first.ok, true);
  assert.equal(first.gold, 620);
  assert.equal(first.so, 4);
  assert.equal(first.n, 1);
  assert.equal(first.rw.gold, 120);
  assert.equal(first.daily.signInDay, 1);
  assert.equal(first.daily.signInClaimedDay, 10);
  assert.equal(first.daily.streak, 2);
  assert.equal(src.gold, 500);
  assert.equal(src.so, 3);
  assert.equal(src.daily.signInDay, 0);
  assert.match(first.journals[0], /Điểm danh ngày 1/);
  const again = prepareSignIn(player({ daily: first.daily }), dayArgs);
  assert.equal(again.code, 'ALREADY_CLAIMED');
  const d7 = prepareSignIn(player({ daily: { ...player().daily, signInDay: 6 } }), dayArgs);
  assert.equal(d7.rw.gems, 30);
  assert.equal(d7.gems, 830);
  assert.equal(d7.gold, 500);
  const d14 = prepareSignIn(player({ daily: { ...player().daily, signInDay: 13 } }), dayArgs);
  assert.equal(d14.rw.gems, 60);
  const d28 = prepareSignIn(player({ daily: { ...player().daily, signInDay: 27 } }), dayArgs);
  assert.equal(d28.rw.gems, 120);
  const pet = prepareSignIn(player({ stamina: 80 }), { ...dayArgs, petMeoMun: true });
  assert.equal(pet.stamina, 82);
  const cap = prepareSignIn(player({ stamina: 120 }), { ...dayArgs, petMeoMun: true, stamCap: 120 });
  assert.equal(cap.stamina, 120);
});

test('L21-T3: nap noon/eve +50 cap 120; idle formula + pet ×1.15; min 0.02h', () => {
  const noon = prepareNap(player({ stamina: 80 }), 'noon', dayArgs);
  assert.equal(noon.ok, true);
  assert.equal(noon.stamina, 120);
  assert.equal(noon.daily.napNoon, true);
  assert.equal(player().daily.napNoon, false);
  const noon2 = prepareNap(player({ daily: noon.daily, stamina: 120 }), 'noon', dayArgs);
  assert.equal(noon2.code, 'NAP_DONE');
  const eve = prepareNap(player({ stamina: 10 }), 'eve', dayArgs);
  assert.equal(eve.stamina, 60);
  assert.equal(eve.daily.napEve, true);
  assert.equal(prepareNap(player(), 'dusk', dayArgs).code, 'UNKNOWN_WINDOW');

  const oneHour = idlePreview(player({ clearedChapters: [], idle: { claimedAt: 0 } }), { now: 3600000 });
  assert.equal(oneHour.hrs, 1);
  assert.equal(oneHour.gold, 60);
  assert.equal(oneHour.chapterMult, 1);
  const twoCh = idlePreview(player({ idle: { claimedAt: 0 } }), { now: 3600000 });
  assert.equal(twoCh.chapterMult, 2);
  assert.equal(twoCh.gold, 120);
  const guild = idlePreview(player({ clearedChapters: [], idle: { claimedAt: 0 } }), {
    now: 3600000,
    guildIdleMult: 1.2,
    clanIdleMult: 1.05
  });
  assert.equal(guild.gold, Math.floor(1 * 60 * 1 * 1.2 * 1.05));

  const early = prepareClaimIdle(player({ idle: { claimedAt: 0 } }), { ...dayArgs, now: 1000 });
  assert.equal(early.code, 'IDLE_TOO_EARLY');
  const claim = prepareClaimIdle(player({ idle: { claimedAt: 0 }, gold: 500, clearedChapters: [] }), {
    ...dayArgs,
    now: 3600000,
    rng: () => 0
  });
  assert.equal(claim.ok, true);
  assert.equal(claim.goldGain, 60);
  assert.equal(claim.gold, 560);
  assert.equal(claim.idle.claimedAt, 3600000);
  const petIdle = prepareClaimIdle(player({ idle: { claimedAt: 0 }, gold: 500, clearedChapters: [] }), {
    ...dayArgs,
    now: 3600000,
    petGaBaoThuc: true,
    rng: () => 0
  });
  assert.equal(petIdle.goldGain, Math.round(60 * 1.15));
  const src = player({ idle: { claimedAt: 0 }, gold: 500 });
  prepareClaimIdle(src, { ...dayArgs, now: 3600000, rng: () => 0 });
  assert.equal(src.gold, 500);
  assert.equal(src.idle.claimedAt, 0);
});

test('L21-P1: claim quest pts+reward; act 20→🪙200; weekly quest+mốc; input not mutated', () => {
  const ready = player();
  ready.daily.quests = rollQuests().map(q => q.id === 'q_win' ? { ...q, progress: 3 } : q);
  const src = JSON.parse(JSON.stringify(ready));
  const claim = prepareClaimQuest(ready, 'q_win', dayArgs);
  assert.equal(claim.ok, true);
  assert.equal(claim.gold, 700);
  assert.equal(claim.daily.activityPoints, 15);
  assert.equal(claim.clanXp, 5);
  assert.equal(claim.daily.quests.find(q => q.id === 'q_win').claimed, true);
  assert.equal(src.gold, 500);
  assert.equal(src.daily.quests.find(q => q.id === 'q_win').claimed, false);
  assert.equal(prepareClaimQuest(player({ daily: claim.daily }), 'q_win', dayArgs).code, 'ALREADY_CLAIMED');
  assert.equal(prepareClaimQuest(player(), 'q_win', dayArgs).code, 'NOT_DONE');

  const actSrc = player({ daily: { ...player().daily, activityPoints: 20, actClaimed: [] } });
  const act = prepareClaimActMilestone(actSrc, 20, dayArgs);
  assert.equal(act.ok, true);
  assert.equal(act.gold, 700);
  assert.deepEqual(act.daily.actClaimed, [20]);
  assert.equal(actSrc.gold, 500);
  assert.equal(prepareClaimActMilestone(player({ daily: act.daily, gold: act.gold }), 20, dayArgs).code, 'ALREADY_CLAIMED');

  const wSrc = player();
  wSrc.weekly.quests = WEEKLY_QUESTS.map(q => q.id === 'w_win' ? { id: q.id, progress: 12, claimed: false } : { id: q.id, progress: 0, claimed: false });
  const wq = prepareClaimWeeklyQuest(wSrc, 'w_win', dayArgs);
  assert.equal(wq.ok, true);
  assert.equal(wq.gold, 1150);
  assert.equal(wq.weekly.points, 25);
  const wm = prepareClaimWeeklyMilestone(player({ weekly: wq.weekly, gold: wq.gold }), 25, dayArgs);
  assert.equal(wm.ok, true);
  assert.equal(wm.gold, 1650);
  assert.deepEqual(wm.weekly.claimed, [25]);
});

test('L21-P2: day rollover resets quests/naps/signInClaimed, keeps streak; weekly weekIndex; chapters untouched', () => {
  const src = player({
    daily: {
      dayIndex: 9,
      lastLoginDay: 9,
      signInDay: 4,
      signInClaimedDay: 9,
      streak: 5,
      quests: rollQuests().map(q => ({ ...q, progress: 2, claimed: true })),
      activityPoints: 60,
      actClaimed: [20, 40],
      napNoon: true,
      napEve: true
    },
    weekly: { weekIndex: 1, points: 40, claimed: [25], quests: WEEKLY_QUESTS.map(q => ({ id: q.id, progress: 3, claimed: false })) }
  });
  const opened = prepareDailyOpen(src, { day: 10, weekIndex: 1 });
  assert.equal(opened.ok, true);
  assert.equal(opened.refreshed, true);
  assert.equal(opened.daily.dayIndex, 10);
  assert.equal(opened.daily.signInDay, 4);
  assert.equal(opened.daily.streak, 5);
  assert.equal(opened.daily.signInClaimedDay, -1);
  assert.equal(opened.daily.activityPoints, 0);
  assert.deepEqual(opened.daily.actClaimed, []);
  assert.equal(opened.daily.napNoon, false);
  assert.equal(opened.daily.napEve, false);
  assert.equal(opened.daily.quests.every(q => q.progress === 0 && !q.claimed), true);
  assert.equal(opened.guild.donated, false);
  assert.deepEqual(opened.guild.bought, []);
  assert.equal(src.daily.signInDay, 4);
  assert.equal(src.guild.donated, true);
  assert.deepEqual(opened.clearedChapters, [0, 1]);
  const same = prepareDailyOpen(player(), { day: 10, weekIndex: 1 });
  assert.equal(same.refreshed, false);
  const week = prepareDailyOpen(player(), { day: 14, weekIndex: 2 });
  assert.equal(week.weekly.weekIndex, 2);
  assert.equal(week.weekly.points, 0);
  assert.deepEqual(week.weekly.claimed, []);
  assert.equal(week.weekly.quests.every(q => q.progress === 0), true);
});

test('L21-P3: rollQuests maps all 14; journal max 40; idle uses chapterMult only', () => {
  const rolled = rollQuests();
  assert.deepEqual(rolled.map(q => q.id), DAILY_QUESTS.map(q => q.id));
  assert.equal(rolled.every(q => q.progress === 0 && q.claimed === false), true);
  const entries = [];
  for (let i = 0; i < 45; i++) entries.push({ n: i, text: 'dòng ' + i });
  const clipped = appendJournal([], { n: 1, text: 'mới' }, DAILY_JOURNAL_MAX);
  assert.equal(clipped.length, 1);
  let j = [];
  for (let i = 0; i < 45; i++) j = appendJournal(j, { n: i, text: String(i) });
  assert.equal(j.length, 40);
  assert.equal(j[0].text, '44');
  const idle = prepareClaimIdle(player({ idle: { claimedAt: 0 }, gold: 100 }), { ...dayArgs, now: 7200000, rng: () => 0 });
  assert.deepEqual(idle.clearedChapters, [0, 1]);
  assert.equal(idle.chapterMult, 2);
  assert.equal(idle.goldGain, 240);
  const empty = emptyDaily();
  assert.equal(empty.quests.length, 0);
});

const uiPath = new URL('../src/ui/daily-runtime.js', import.meta.url);
const cssPath = new URL('../src/ui/daily-screen.css', import.meta.url);
const injectPath = new URL('../scripts/daily-runtime-v1.mjs', import.meta.url);

test('L21-P4: lacquer journal + Lịch Luyện wheel; no second hub landmark; inject after festival', () => {
  const ui = readFileSync(uiPath, 'utf8');
  const css = readFileSync(cssPath, 'utf8');
  const inject = readFileSync(injectPath, 'utf8');
  assert.match(ui, /prepareSignIn/);
  assert.match(ui, /prepareNap/);
  assert.match(ui, /prepareClaimIdle/);
  assert.match(ui, /prepareLichEnter/);
  assert.match(ui, /Nhật Ký Mơ/);
  assert.match(ui, /Lịch luyện/);
  assert.match(ui, /data-daily-sign/);
  assert.match(ui, /data-lich-spoke/);
  assert.match(ui, /data-lich-back/);
  assert.match(ui, /art-dock \[data-art-go="daily"\]/);
  assert.match(ui, /assets\/daily\/spokes\//);
  assert.doesNotMatch(ui, /data-art-go="lichluyen"/);
  assert.doesNotMatch(ui, /menu-v3233/);
  assert.match(css, /#hvDailyRoot/);
  assert.match(css, /#hvLichRoot/);
  assert.match(css, /[.]hv-daily-cal/);
  assert.match(css, /[.]hv-lich-spoke/);
  assert.match(css, /lich-hall\.jpg/);
  assert.match(css, /#hvLichRoot\{[^}]*inset:\s*0/);
  assert.match(css, /#hvLichRoot\{[^}]*z-index:\s*80/);
  assert.doesNotMatch(css, /bottom:calc\(76px/);
  assert.match(inject, /daily-run[.]mjs/);
  new Function(ui);
  const build = join(root, 'scripts/build-static.mjs');
  if (existsSync(build)) {
    assert.match(readFileSync(build, 'utf8'), /festival-runtime-v1[\s\S]*daily-runtime-v1/);
  }
});

test('L21-P5: 11 ải spokes; night-1 opens Qua Ải + Luyện; Tháp after ch.1; locked stay locked', () => {
  assert.equal(LICH_LUYEN_SPOKE_COUNT, 11);
  assert.equal(LICH_LUYEN_SPOKES.length, 11);
  const byKey = Object.fromEntries(LICH_LUYEN_SPOKES.map(s => [s.key, s]));
  assert.equal(byKey.campaign.go, 'campaign');
  assert.equal(byKey.campaign.ch, 0);
  assert.equal(byKey.train.go, 'train');
  assert.equal(byKey.tower.go, 'tower');
  assert.equal(byKey.tower.ch, 1);
  assert.equal(byKey.expedition.ch, 2);
  assert.equal(byKey.hunt.ch, 3);
  assert.equal(byKey.arena.ch, 3);
  assert.equal(byKey.abyss.go, null);
  assert.equal(lichSpokeLocked(byKey.campaign, 0), false);
  assert.equal(lichSpokeLocked(byKey.train, 0), false);
  assert.equal(lichSpokeLocked(byKey.tower, 0), true);
  assert.equal(lichSpokeLocked(byKey.tower, 1), false);
  assert.equal(lichSpokeLocked(byKey.hold, 9), true);
  const src = player({ clearedChapters: [] });
  const open = prepareLichEnter(src, 'campaign');
  assert.equal(open.ok, true);
  assert.equal(open.go, 'campaign');
  assert.deepEqual(open.clearedChapters, []);
  assert.equal(src.clearedChapters.length, 0);
  const train = prepareLichEnter(src, 'train');
  assert.equal(train.ok, true);
  assert.equal(train.go, 'train');
  const towerShut = prepareLichEnter(src, 'tower');
  assert.equal(towerShut.code, 'LOCKED');
  const towerOpen = prepareLichEnter(player({ clearedChapters: [0] }), 'tower');
  assert.equal(towerOpen.ok, true);
  const abyss = prepareLichEnter(player({ clearedChapters: [0, 1, 2, 3, 4] }), 'abyss');
  assert.equal(abyss.code, 'LOCKED');
  assert.equal(prepareLichEnter(src, 'nope').code, 'UNKNOWN_GATE');
  const hall = join(root, 'assets/daily/lich-hall.jpg');
  assert.equal(existsSync(hall), true);
  const icons = new Set();
  for (const spoke of LICH_LUYEN_SPOKES) {
    assert.equal(spoke.icon, spoke.key);
    icons.add(spoke.icon);
    assert.equal(existsSync(join(root, 'assets/daily/spokes', spoke.key + '.jpg')), true, spoke.key);
  }
  assert.equal(icons.size, 11);
});
