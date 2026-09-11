import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  HUNT_ADD_HP,
  HUNT_ATTEMPTS_PER_DAY,
  HUNT_BOSSES,
  HUNT_CONTRACTS,
  HUNT_CONTRACT_IDS,
  HUNT_COST,
  HUNT_MARK_KEYS,
  HUNT_MARK_MILESTONES,
  HUNT_TURN_LIMIT,
  LIVE_HUNT,
  emptyHunt,
  huntBossHp,
  huntEncounter,
  huntMarkCount,
  prepareHuntDay,
  prepareHuntSettle,
  prepareHuntStart,
  prepareSelectContract,
  todayBoss
} from '../src/domain/hunt/hunt-run.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function player(extra = {}) {
  return {
    gold: 400,
    gems: 80,
    so: 2,
    stamina: 80,
    shards: {},
    clearedChapters: [0, 1],
    hunt: { ...emptyHunt(), day: 9, attempts: 2, contract: null, contractDone: false, best: {}, marks: {}, claimedMarks: {} },
    ...extra
  };
}

test('L19-T1: live catalog frozen — 6⚡, 2 lượt, 60 hiệp, 3 boss, 3 khế, mốc 3/7/12', () => {
  assert.equal(HUNT_COST, 6);
  assert.equal(HUNT_ATTEMPTS_PER_DAY, 2);
  assert.equal(HUNT_TURN_LIMIT, 60);
  assert.equal(HUNT_BOSSES.length, 3);
  assert.equal(HUNT_CONTRACT_IDS.length, 3);
  assert.deepEqual(HUNT_MARK_KEYS, [3, 7, 12]);
  assert.equal(HUNT_MARK_MILESTONES[3].gold, 250);
  assert.equal(HUNT_MARK_MILESTONES[3].gems, 5);
  assert.equal(HUNT_MARK_MILESTONES[7].shards, 1);
  assert.equal(HUNT_MARK_MILESTONES[12].gold, 900);
  assert.equal(HUNT_CONTRACTS.break_core.marks, 1);
  assert.equal(HUNT_CONTRACTS.clean_field.marks, 1);
  assert.equal(HUNT_CONTRACTS.finisher.marks, 2);
  assert.equal(LIVE_HUNT.cost, 6);
  assert.equal(Object.isFrozen(HUNT_BOSSES), true);
  assert.equal(HUNT_BOSSES[0].id, 'ca_voi_nuot_trang');
  assert.equal(HUNT_BOSSES[0].drop, 'hon_cay_bang');
  assert.equal(HUNT_BOSSES[1].drop, 'ong_ke_that_nghiep');
  assert.equal(HUNT_BOSSES[2].drop, 'ky_lan_ca_phe');
});

test('L19-T2: todayBoss / HP / encounter keep live formulas', () => {
  assert.equal(todayBoss(0).id, 'ca_voi_nuot_trang');
  assert.equal(todayBoss(1).id, 'nhen_det_ac_mong');
  assert.equal(todayBoss(2).id, 'dong_ho_cat_vo');
  assert.equal(todayBoss(3).id, 'ca_voi_nuot_trang');
  assert.equal(huntBossHp([]), 45000);
  assert.equal(huntBossHp([0, 1]), Math.round(45000 * (1 + 0.35 * 2)));
  const enc = huntEncounter(0, [0, 1]);
  assert.equal(enc.length, 3);
  assert.equal(enc[0].id, 'add1');
  assert.equal(enc[1].id, 'huntboss');
  assert.equal(enc[2].id, 'add2');
  assert.equal(enc[0].stats.hp, HUNT_ADD_HP);
  assert.equal(enc[0].stats.atk, Math.round(110 * 1.3));
  assert.equal(enc[1].stats.hp, Math.round(45000 * 1.7));
  assert.equal(enc[1].stats.atk, Math.round(150 * 1.3));
  assert.equal(enc[1].skill.fx.kind, 'shield');
  assert.equal(enc[1].skill.fx.target, 'aoe_ally');
  assert.equal(enc[2].stats.atk, Math.round(105 * 1.3));
  assert.equal(enc[1].huntForm, 'ca_voi_nuot_trang');
  assert.equal(enc[1].huntScale > 1.5, true);
  assert.equal(enc[0].huntForm, 'crystal');
  assert.equal(enc[2].huntForm, 'crystal');
});

test('L19-T3: settle vàng/mảnh theo ST; hạ gục +💎40; không mutate input', () => {
  const src = player({ hunt: { ...player().hunt, contract: 'break_core' } });
  const win = prepareHuntSettle(src, { day: 9, dmg: 8000, killed: false, addsDown: false, hpMax: 76500 });
  assert.equal(win.ok, true);
  assert.equal(win.gold, 400 + Math.floor(8000 / 40));
  assert.equal(win.shards.hon_cay_bang, Math.floor(8000 / 6000));
  assert.equal(win.so, 3);
  assert.equal(win.gems, 80);
  assert.equal(src.gold, 400);
  assert.equal(src.so, 2);
  assert.deepEqual(src.clearedChapters, [0, 1]);
  assert.deepEqual(win.clearedChapters, [0, 1]);
  const kill = prepareHuntSettle(player({ hunt: { ...player().hunt, contract: 'finisher' } }), {
    day: 9, dmg: 76500, killed: true, addsDown: true, hpMax: 76500
  });
  assert.equal(kill.killed, true);
  assert.equal(kill.gems, 80 + 20 + 40);
  assert.equal(kill.mails.some(m => m.gold === 300), true);
});

test('L19-P1: start trừ 6⚡ + 1 lượt; thiếu khế / hết lượt / thiếu ⚡ fail', () => {
  const noC = prepareHuntStart(player(), { day: 9, stamina: 80 });
  assert.equal(noC.ok, false);
  assert.equal(noC.code, 'NO_CONTRACT');
  const ready = player({ hunt: { ...player().hunt, contract: 'break_core' } });
  const go = prepareHuntStart(ready, { day: 9, stamina: 80 });
  assert.equal(go.ok, true);
  assert.equal(go.stamina, 74);
  assert.equal(go.hunt.attempts, 1);
  assert.equal(ready.stamina, 80);
  assert.equal(ready.hunt.attempts, 2);
  assert.equal(go.encounter[1].id, 'huntboss');
  const none = prepareHuntStart(player({ hunt: { ...player().hunt, contract: 'break_core', attempts: 0 } }), { day: 9, stamina: 80 });
  assert.equal(none.code, 'NO_ATTEMPTS');
  const tired = prepareHuntStart(player({ hunt: { ...player().hunt, contract: 'break_core' }, stamina: 5 }), { day: 9, stamina: 5 });
  assert.equal(tired.code, 'INSUFFICIENT_STAMINA');
});

test('L19-P2: Săn Khế Phá Lõi / Quét / Đoạt Mệnh; khóa khế sau lần đầu', () => {
  const core = prepareHuntSettle(player({ hunt: { ...player().hunt, contract: 'break_core' } }), {
    day: 9, dmg: 30000, killed: false, addsDown: false, hpMax: 100000
  });
  assert.equal(core.contractOK, true);
  assert.equal(core.goldGain, Math.floor(30000 / 40) + Math.floor(Math.floor(30000 / 40) * 0.25));
  assert.equal(huntMarkCount(core.hunt, 'ca_voi_nuot_trang'), 1);
  const clean = prepareHuntSettle(player({ hunt: { ...player().hunt, contract: 'clean_field' } }), {
    day: 9, dmg: 1000, killed: false, addsDown: true, hpMax: 100000
  });
  assert.equal(clean.contractOK, true);
  assert.equal(clean.shardGain, Math.floor(1000 / 6000) + 1);
  const miss = prepareHuntSettle(player({ hunt: { ...player().hunt, contract: 'break_core' } }), {
    day: 9, dmg: 1000, killed: false, addsDown: false, hpMax: 100000
  });
  assert.equal(miss.contractOK, false);
  assert.equal(miss.hunt.contractDone, false);
  const lock = prepareSelectContract(player({ hunt: { ...player().hunt, attempts: 1, contract: 'break_core' } }), { id: 'finisher', day: 9 });
  assert.equal(lock.code, 'CONTRACT_LOCKED');
});

test('L19-P3: mốc 3 Săn Ấn; rollover ngày reset lượt/khế, giữ ấn', () => {
  const src = player({
    hunt: {
      ...player().hunt,
      contract: 'break_core',
      marks: { ca_voi_nuot_trang: 2 },
      claimedMarks: { ca_voi_nuot_trang: [] }
    }
  });
  const hit = prepareHuntSettle(src, { day: 9, dmg: 30000, killed: false, addsDown: false, hpMax: 100000 });
  assert.equal(huntMarkCount(hit.hunt, 'ca_voi_nuot_trang'), 3);
  assert.deepEqual(hit.milestones, [3]);
  assert.equal(hit.gold, 400 + Math.floor(30000 / 40) + Math.floor(Math.floor(30000 / 40) * 0.25) + 250);
  assert.equal(hit.gems, 80 + 5);
  assert.equal(src.gold, 400);
  const rolled = prepareHuntDay({
    ...hit,
    hunt: hit.hunt
  }, { day: 10 });
  assert.equal(rolled.refreshed, true);
  assert.equal(rolled.hunt.attempts, 2);
  assert.equal(rolled.hunt.contract, null);
  assert.equal(rolled.hunt.contractDone, false);
  assert.equal(huntMarkCount(rolled.hunt, 'ca_voi_nuot_trang'), 3);
});

const uiPath = new URL('../src/ui/hunt-runtime.js', import.meta.url);
const cssPath = new URL('../src/ui/hunt-screen.css', import.meta.url);
const injectPath = new URL('../scripts/hunt-runtime-v1.mjs', import.meta.url);

test('L19-P4: lacquer screen is wired and does not add a second hub landmark', () => {
  const ui = readFileSync(uiPath, 'utf8');
  const css = readFileSync(cssPath, 'utf8');
  const inject = readFileSync(injectPath, 'utf8');
  assert.match(ui, /prepareHuntSettle/);
  assert.match(ui, /Sổ Săn Đêm/);
  assert.match(ui, /data-hunt-contract/);
  assert.doesNotMatch(ui, /data-art-go="hunt"/);
  assert.match(css, /#hvHuntRoot/);
  assert.match(css, /[.]hv-hunt-card/);
  assert.match(inject, /hunt-run[.]mjs/);
  assert.match(inject, /hunt-battle-visual/);
  assert.match(inject, /hv-hunt-draw/);
  assert.match(inject, /honVietDrawHuntUnit/);
  new Function(ui);
  const build = join(root, 'scripts/build-static.mjs');
  if (existsSync(build)) {
    assert.match(readFileSync(build, 'utf8'), /arena-runtime-v1[\s\S]*hunt-runtime-v1/);
  }
});

test('L19-P5: hunt battle draws beasts in-engine and keeps 60-round HUD', () => {
  const visual = readFileSync(new URL('../src/ui/hunt-battle-visual.js', import.meta.url), 'utf8');
  const inject = readFileSync(injectPath, 'utf8');
  assert.match(visual, /window\.honVietDrawHuntUnit/);
  assert.match(visual, /honVietInferHuntForm/);
  assert.match(visual, /nhen_det_ac_mong/);
  assert.match(visual, /ca_voi_nuot_trang/);
  assert.match(visual, /dong_ho_cat_vo/);
  assert.match(visual, /crystal/);
  assert.match(visual, /assets\/hunt\/dong-ho-cat-vo\.png/);
  assert.match(visual, /assets\/hunt\/mong-tinh\.png/);
  assert.match(inject, /\/\*hv-hunt-draw\*\//);
  assert.match(inject, /HIỆP \$\{String\(shown\)\.padStart\(2,"0"\)\}\/\$\{String\(cap\)\.padStart\(2,"0"\)\}/);
  assert.match(inject, /roundCap=Number\(raw\.maxRounds\)>=60\?60/);
  assert.match(inject, /hvHuntBattleConfig/);
  new Function(visual);
  const battle = join(root, 'dist/battle.html');
  if (existsSync(battle)) {
    const html = readFileSync(battle, 'utf8');
    if (html.includes('hv-hunt-battle-js')) {
      assert.match(html, /\/\*hv-hunt-draw\*\//);
      assert.match(html, /honVietDrawHuntUnit/);
      assert.match(html, /cap=hunt\?60:15/);
    }
  }
});
