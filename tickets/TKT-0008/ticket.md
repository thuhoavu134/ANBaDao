---
id: TKT-0008
title: Dung luyện on the account gear board
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T03:35:00.000Z
updated: 2026-09-11T04:10:00.000Z
acceptance_ids: ["L13-S1","L13-S2","L13-S3","L13-S4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/equipment/account-board.mjs","src/ui/account-gear-runtime.js","src/ui/account-gear-board.css","scripts/qa-account-gear.mjs","src/domain/equipment/forge-commands.mjs"]
resource_locks: ["equipment-board"]
---
# TKT-0008 — Dung luyện / Cường hóa túi

Goal: Nút Dung luyện trên bảng 12 ô mở màn riêng. Tab Dung luyện nấu đồ thừa lấy Tinh Lực theo bảng salvage hiện có. Tab Cường hóa cường hóa từ túi. Không nấu món đang mặc (P.gear / P.equip) hoặc đang khóa.

Non-goals: nan Trợ trận khác, đổi công thức/seed/reward rèn, bỏ 4 ô theo tướng.

## Acceptance

- L13-S1: chọn rỗng → `NO_SELECTION` / toast **Hãy chọn trang bị!**
- L13-S2: món trên bảng hoặc khóa bị từ chối; candidate bỏ worn; gain b5/a8/s12/ss18/ssr28 + lvl×2
- L13-S3: UI có tray, lọc loại, **Dung luyện x1** / **Dung luyện**, tab Cường hóa x1 / nhanh
- L13-S4: Chrome 390×844 mở được màn, toast rỗng, nấu được món thừa

## Result

- RED → GREEN: 12/12 `tests/account-gear-board.test.mjs`
- Chrome 390×844 `?qa=unlock-all`: empty toast, nấu B+0 → +5 Tinh Lực (60→65), Cường hóa x1 hiện, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L13-ACCOUNT-GEAR/`

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
