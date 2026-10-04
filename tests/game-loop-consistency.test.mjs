import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as daily from '../src/domain/daily/daily-run.mjs';
import * as progress from '../src/domain/campaign/player-progress.mjs';
import { executeLocalTransaction, settleRewardTransaction } from '../src/domain/transaction/receipt-contract.mjs';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const opts = { day: 100, weekIndex: 14, now: 8640000000 };
const fresh = () => ({ gold: 500, gems: 20, tinh: 0, hoat: 0, clearedChapters: [],
  heroes: { a: { owned: true, level: 1 } }, daily: daily.emptyDaily(), weekly: daily.emptyWeekly() });

test('production domains and unknown hosts retain feature gates; preview requires explicit opt-in', () => {
  for (const host of ['luc-than.vercel.app', 'luc-than-chi.vercel.app', 'another.vercel.app', 'localhost']) {
    for (const optIn of [false, true]) {
      const original = () => true;
      const c = { document: { documentElement: { dataset: {} } }, location: { hostname: host },
        window: { HonVietPreviewConfig: { unlockJourney: optIn } }, featLocked: original, toast() {} };
      vm.runInNewContext(read('src/ui/preview-journey-unlock.js'), c);
      const production = ['luc-than.vercel.app', 'luc-than-chi.vercel.app'].includes(host);
      assert.equal(c.featLocked('tower'), production || !optIn, host + ':' + optIn);
    }
  }
});

test('daily and weekly settlement receive the configured forge materials exactly once', () => {
  const p = fresh(); Object.assign(p, daily.prepareDailyOpen(p, opts));
  p.daily.quests.find(q => q.id === 'q_win').progress = 3;
  const r = daily.prepareClaimQuest(p, 'q_win', opts);
  assert.equal(r.ok, true); assert.equal(r.gold, 700); assert.equal(r.tinh, 4);
  assert.equal(p.tinh, 0, 'prepare never mutates the save');
  assert.equal(daily.prepareClaimQuest({ ...p, daily: r.daily }, 'q_win', opts).code, 'ALREADY_CLAIMED');
  p.weekly.quests.find(q => q.id === 'w_win').progress = 12;
  const w = daily.prepareClaimWeeklyQuest(p, 'w_win', opts);
  assert.equal(w.tinh, 12); assert.equal(w.hoat, 12);
});

test('beginner and capped-roster assignments stay attainable and survive reopen/unlock', () => {
  const p = fresh(); Object.assign(p, daily.prepareDailyOpen(p, opts));
  for (const id of ['q_summon', 'q_tower', 'q_hunt', 'q_arena', 'q_craft', 'q_guild']) {
    const def = daily.dailyQuestDefinition(p, id);
    assert.ok(['win', 'train'].includes(def.type), id);
  }
  const q = p.daily.quests.find(q => q.id === 'q_guild');
  const def = daily.dailyQuestDefinition(p, q.id); q.progress = def.goal;
  p.clearedChapters = [0, 1, 2, 3];
  Object.assign(p, daily.prepareDailyOpen(p, opts));
  assert.equal(daily.dailyQuestDefinition(p, q.id).type, def.type, 'no mid-period reroll');
  assert.equal(daily.prepareClaimQuest(p, q.id, opts).ok, true);
  const next = daily.prepareDailyOpen(p, { ...opts, day: 101 });
  assert.equal(daily.dailyQuestDefinition({ ...p, daily: next.daily }, q.id).type, 'guild');
  const capped = fresh(); capped.heroes.a.level = 30;
  Object.assign(capped, daily.prepareDailyOpen(capped, opts));
  assert.equal(daily.dailyQuestDefinition(capped, 'q_level').type, 'win');
});

test('existing progress and claims are retained when adopting adaptive assignments', () => {
  const p = fresh(); p.daily = { ...daily.emptyDaily(), dayIndex: opts.day, quests: daily.rollQuests() };
  p.daily.quests.find(q => q.id === 'q_guild').progress = 1;
  p.daily.quests.find(q => q.id === 'q_tower').claimed = true;
  const before = JSON.stringify(p);
  const r = daily.prepareDailyOpen(p, opts);
  assert.equal(JSON.stringify(p), before);
  assert.equal(daily.dailyQuestDefinition({ ...p, daily: r.daily }, 'q_guild').type, 'guild');
  assert.equal(r.daily.quests.find(q => q.id === 'q_tower').claimed, true);
});

test('all positive rewards have visible rows, including forge materials and actual account XP', () => {
  const rows = daily.dailyRewardItems({ gold: 120, tinh: 10, hoat: 10, playerXp: 80, gems: 0 });
  assert.deepEqual(rows.map(r => [r.label, r.value]), [['Vàng', 120], ['Tinh', 10], ['Hoạt', 10], ['EXP tài khoản', 80]]);
});

function runtime() {
  const notices = [], ceremonies = [];
  const c = { ...daily, ...progress, P: fresh(), window: {}, DATA: { daily: { stamCap: 120, quests: daily.DAILY_QUESTS } },
    document: { body: {}, getElementById: () => null, addEventListener() {} },
    today: () => opts.day, persist: () => true, refreshResbar() {}, refreshStamina() {},
    renderDaily() {}, navTo() {}, ensureWeeklyReset() {}, applyReward() {},
    toast: message => notices.push(message), showProgressBurst: (title, detail) => notices.push(detail),
    showRewardCeremony: (...args) => ceremonies.push(args), executeLocalTransaction, settleRewardTransaction };
  vm.createContext(c);
  const html = read('dist/index.html');
  const fragment = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); assert.ok(i >= 0 && j > i, a); return html.slice(i, j); };
  vm.runInContext(fragment('function hvRunCommittedTransaction(', 'function hvApplyClanXp('), c);
  vm.runInContext(fragment('function weeklyProgress(', 'function claimWeeklyQuest('), c);
  vm.runInContext(fragment('function questProgress(', 'function claimQuest('), c);
  vm.runInContext(read('src/ui/daily-runtime.js'), c);
  return { c, notices, ceremonies };
}

test('live progress, claim and brief notification agree; repeat claim grants nothing', () => {
  const { c, notices, ceremonies } = runtime();
  c.questProgress('train', 1, false);
  assert.equal(c.P.daily.quests.find(q => q.id === 'q_craft').progress, 1);
  assert.equal(c.window.HonVietDaily.quest('q_craft'), true);
  assert.equal(c.P.gold, 620); assert.equal(c.P.tinh, 10); assert.equal(c.P.hoat, 10);
  assert.equal(c.P.hvPlayerProgress.xp, 80);
  assert.match(notices.at(-1), /120 Vàng.*10 Tinh.*10 Hoạt.*80 EXP tài khoản/);
  assert.equal(ceremonies.length, 0, 'routine reward never opens a blocking ceremony');
  const before = JSON.stringify(c.P);
  assert.equal(c.window.HonVietDaily.quest('q_craft'), false);
  assert.equal(JSON.stringify(c.P), before);
  c.P.daily.activityPoints = 80;
  c.claimActMilestone(80);
  assert.equal(ceremonies.length, 1);
  assert.equal(ceremonies[0][2][0].value, 50, 'major milestone shows real gems');
});

test('failed save rolls back currencies, XP and claim; retry succeeds once', () => {
  const { c, notices } = runtime(); c.questProgress('win', 3, false);
  const before = JSON.stringify(c.P); c.persist = () => false;
  assert.equal(c.window.HonVietDaily.quest('q_win'), false);
  assert.equal(JSON.stringify(c.P), before); assert.equal(notices.length, 1);
  assert.match(notices[0], /lưu giao dịch/); assert.doesNotMatch(notices[0], /EXP|Vàng/);
  c.persist = () => true;
  assert.equal(c.window.HonVietDaily.quest('q_win'), true);
  assert.equal(c.P.gold, 700); assert.equal(c.P.tinh, 4); assert.equal(c.P.hvPlayerProgress.xp, 80);
});

test('max-level account reward notification does not advertise nonexistent XP', () => {
  const { c, notices } = runtime(); progress.hvMigratePlayerProgress(c.P);
  c.P.hvPlayerProgress.xp = progress.hvLevelXp(60); c.questProgress('win', 3, false);
  c.window.HonVietDaily.quest('q_win');
  assert.doesNotMatch(notices.at(-1), /EXP/);
});
