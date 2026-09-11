---
id: TKT-0010
title: Remove overlay Rút lui and Bật tiếng chrome
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T08:30:00.000Z
updated: 2026-09-11T08:50:00.000Z
acceptance_ids: ["L12-C1","L12-C2","L12-C3"]
required_gates: ["vibelab","tdd"]
affected_paths: ["index.html","battle.html","scripts/ios-audio-unlock-patch.mjs","tests/battle-enter-loading.test.mjs","tests/battle-ios-audio.test.mjs"]
resource_locks: ["battle-overlay","ios-audio"]
---
# TKT-0010 — Bỏ nút chrome Rút lui / Bật tiếng

Goal: Gỡ hai nút nổi xấu trên lớp trận: overlay **Rút lui** (`#hvBattleExit`) và floating **Bật tiếng** (`#hvUnmuteAudio`). HUD **Âm** / tốc độ / tự động giữ nguyên. Escape và `battle-abort` vẫn thoát trận. AudioContext + first-gesture unlock vẫn chạy, không hiện nút.

Non-goals: combat rules, BGM/SFX mapping, Bày trận, Trợ trận/trang bị, seed/reward.

## Acceptance

- L12-C1: overlay trận không có `#hvBattleExit` / chữ Rút lui chrome; CSS không còn `is-open .hv-battle-exit{display:block}`
- L12-C2: unlock script không tạo `#hvUnmuteAudio` / `Bật tiếng`; vẫn có early AudioContext và unlock theo gesture
- L12-C3: HUD `#exitBattleButton` giữ `hidden` cả khi embedded (không hiện Rút lui trên thanh trận)

## Result

- RED 7/11 → GREEN 11/11 `tests/battle-enter-loading.test.mjs` + `tests/battle-ios-audio.test.mjs`
- Chrome 390×844: overlay không Rút lui / Bật tiếng; HUD Rút lui hidden; HUD Âm còn. 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L12-HIDE-CHROME/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
