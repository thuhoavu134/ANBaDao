---
id: TKT-0065
title: Tháp Trắng Đêm — đội NPC tự tạo + trận iframe thật
status: READY
phase: READY
priority: P0
created: 2026-09-12T07:20:00.000Z
updated: 2026-09-12T07:20:00.000Z
acceptance_ids: ['L65-T1', 'L65-T2', 'L65-T3', 'L65-T4', 'L65-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/domain/tower/tower-npc-team.mjs', 'src/ui/tower-battle-runtime.js', 'scripts/tower-battle-v1.mjs', 'scripts/lanes/tkt-0065-tower-battle.mjs', 'scripts/qa-tower-battle.mjs', 'tests/tower-battle.test.mjs', 'docs/qa/L65-TOWER-BATTLE/']
resource_locks: ["tower-battle"]
parallel_wave: H
depends_on: []
conflicts_with: ['TKT-0046']
branch_hint: work/l65-tower-battle-20260912
---
# TKT-0065 — Tháp Trắng Đêm đội NPC tự tạo + trận iframe thật

Wave **H** P0. Một agent. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

Owner 12/09: **ấn Leo tầng phải mở trận thật**, tự tạo đội NPC 6 người, có diễn hoạt combat. Cấm auto-win / skip iframe.

## Goal

Live `startTower` trong `src/ui/tower-runtime.js` đang gọi `prepareTowerAttempt` → `towerPowerWinReport()` giả thắng, **0 trận**. Wrap `startTower` **sau** hall inject (stub này import **sau** Safari / sau `tkt-0046-tower.mjs`):

1. `prepareTowerClimb` / `spendStamina(5)` — giữ `TOWER_CLIMB_STAMINA` 5⚡.
2. Tạo **6 NPC** (`src/domain/tower/tower-npc-team.mjs`) — 3 front + 3 back, `sourceHeroId` **6 ID khác nhau** lấy từ roster 12 (shadow clone). `uniqueTeamCombatants` bỏ trùng `sourceHeroId` — không clone cùng 1 tướng 2 lần.
3. Scale HP/ATK/DEF/SPD theo tầng như `towerEncounterUnits` (hm 0.12 / am 0.09 / dm 0.05). Tầng `%5===0` 1 unit boss (tên `Chúa Tầng N`) vẫn đủ 6 người.
4. `DATA.encounters.__tower = six; ST.mode='tower'; runBattle('__tower', onEnd)`.
5. `onEnd(win)`: win → `prepareTowerClear` với report thật `window.__HV_LAST_BATTLE_REPORT` (không `towerPowerWinReport`); thua → `prepareTowerFail`. `commitTower`. `navTo('tower')`.
6. Power gate `towerPowerGate` = **cảnh báo toast thôi**, vẫn mở iframe. Không auto-fail không đánh.

Điền stub `scripts/lanes/tkt-0065-tower-battle.mjs` — **không** thêm import mới vào `build-static.mjs`.

## Keep (live)

- `TOWER_CLIMB_STAMINA` 5 · vàng `120+floor*30` · gem tầng 5 · shard tầng 10 · trial/sigil/milestone
- Hall giả 3D `#hvTowerRoot` / `tower-3d-runtime.js` / `tower-3d.css` / `tower-hall.jpg`
- `prepareTowerClimb` / `prepareTowerClear` / `prepareTowerFail` / `prepareTowerClaimMilestone`
- `JOURNEY_UNLOCK` tháp ch.1

## Non-goals

Không sửa `index.html`. Không sửa `battle.html`. Không sửa `campaign-scene.js`. Không sửa `src/ui/tower-3d-runtime.js` / `tower-3d.css` / `tower-screen.css`. Không viết lại `tower-progress.mjs` (test L22 khoá 4 blob + auto-attempt — để nguyên; path live wrap `startTower` không gọi `prepareTowerAttempt`). Không Combat V2. Không 72 tướng. Không atlas skill trận. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Shared patch

`scripts/qa-tower-screen.mjs` đang assert `battles === 0`. Filling agent **đổi** thành `battles >= 1` (hoặc bỏ assert skip). File này không exclusive — LIVE TKT-0023/0046; chỉ lật 1 assert.

## Acceptance

- L65-T1: wrap `startTower` gọi `runBattle('__tower')`; **không** gọi `towerPowerWinReport` trên path live
- L65-T2: factory trả **đúng 6** unit, mỗi unit có `sourceHeroId` unique trong roster 12, 3 front / 3 back
- L65-T3: win/lose settle qua `prepareTowerClear` / `prepareTowerFail` + report thật; stamina 5; vàng công thức cũ
- L65-T4: stub lane `tkt-0065-tower-battle.mjs` load runtime; không `battle.html`; không `tower-3d`
- L65-P1: Chrome 390×844 + 768×1024 — Leo tầng mở iframe `#hvBattleFrame` / `battle.html?embedded=1`, thấy NPC đánh, 0 app error. Power thấp vẫn vào trận (toast cảnh báo OK)

## Affected paths (exclusive)

- `src/domain/tower/tower-npc-team.mjs`
- `src/ui/tower-battle-runtime.js`
- `scripts/tower-battle-v1.mjs`
- `scripts/lanes/tkt-0065-tower-battle.mjs`
- `scripts/qa-tower-battle.mjs`
- `tests/tower-battle.test.mjs`
- `docs/qa/L65-TOWER-BATTLE/`

Shared read-only: `src/ui/tower-runtime.js` `startTower` (wrap, không rewrite file), `src/domain/tower/tower-progress.mjs`. Frozen: `battle.html`, `campaign-scene.js`, `index.html`, `tower-3d-runtime.js`.

## Pattern copy

`index.html` `startHunt` / `startRogueBattle` / legacy `startTower` (~4188) — `DATA.encounters.__x` + `ST.mode` + `runBattle`. `rogueEncounter` / `rivalDefs` cho `sourceHeroId`.

Builder → REVIEW. Không tự MERGED/DONE.
