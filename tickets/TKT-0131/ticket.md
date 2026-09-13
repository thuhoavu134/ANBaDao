---
id: TKT-0131
title: Spotlight dừng trên ô trúng, tắt khi Thưởng/Đổi sò
status: REVIEW
phase: REVIEW
priority: P0
created: 2026-09-13T15:12:00.000Z
updated: 2026-09-13T15:22:00.000Z
acceptance_ids: ['L131-T1', 'L131-T2', 'L131-T3', 'L131-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - src/ui/bach-bao-ruong-runtime.js
  - src/ui/bach-bao-ruong.css
  - tests/bbr-hold-light.test.mjs
  - docs/qa/L131-HOLD-LIGHT/
resource_locks: ["bbr-spin"]
branch_hint: work/l131-hold-light-20260913
---
# TKT-0131

Owner 13/09 22:09: vòng quay kết thúc ở đâu thì ánh sáng vẫn chiếu vật phẩm ấy, không tắt. Chờ nhận thưởng hoặc đổi sò mới tắt. Quay tiếp thì ánh sáng đi tiếp từ đó.

## Goal

Spotlight `is-hot` khoá đúng ô `lastIdx` khi còn `pending`. Vành `is-hold` (ô khác tối, ô trúng sáng). Thưởng / Đổi sò / bust → tắt. Quay tiếp bắt đầu từ `lastIdx`.

## Non-goals

Không đổi BETS 2/10/50, convertQty, loot table, pity. Không 72 tướng.

## Acceptance

- L131-T1: paintDesk gắn `is-hot is-win` đúng `lastIdx`; ring `is-hold` khi pending; không tô mọi ô cùng loại
- L131-T2: doTake / doConvert / doScore `lastIdx = 0`; quay tiếp `start = lastIdx`
- L131-T3: CSS `is-hold` giữ sáng; reduced-motion tắt pulse; không document click; BETS đóng băng
- L131-P1: Chrome 390×844 — 1 ô is-hot sau quay; tắt sau Đổi sò

## Gate

- RED 2 fail (thiếu is-hold / lastIdx is-hot)
- GREEN 3/3 L131 + npm test 917 PASS
- Chrome 390×844 L131-P1 PASS
- Safari NOT_RUN
- Builder dừng REVIEW. Gõ **live** để squash-merge.
