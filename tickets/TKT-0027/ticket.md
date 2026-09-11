---
id: TKT-0027
title: Chợ Mộng lacquer daily stall with transaction buy
status: REVIEW
phase: REFACTOR
priority: P2
created: 2026-09-11T12:20:00.000Z
updated: 2026-09-11T12:40:00.000Z
acceptance_ids: ["L08-P1","L08-P2","L08-P3","L08-P4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/shop/shop-day.mjs","src/ui/shop-runtime.js","src/ui/shop-screen.css","scripts/shop-runtime-v1.mjs","scripts/build-static.mjs","tests/shop-day.test.mjs","scripts/qa-shop-screen.mjs"]
resource_locks: ["shop-screen"]
---
# TKT-0027 — Chợ Mộng sơn mài + quầy ngày

Goal: Lift the live daily stall (5 món, 1 lần/ngày, refresh nửa đêm) into a pure domain module and a lacquer screen in the same style as Tháp / Mộng Lộ. Keep prices and grants. Keep the existing hub Chợ Mộng entry. Buys go through `hvRunCommittedTransaction`.

Non-goals: new currency, combat-stat goods, pity/banner, seed change, second hub listener, changing the 5-stall catalog.

## Acceptance

- L08-P1: 5 stalls; new day resets `bought` and rolls stock; same day keeps stock
- L08-P2: prices match live (`320g / 60💎 / 160g / 40💎 / 220g`); no atk/hp/def/spd goods
- L08-P3: buy once/day; insufficient funds fail; grants shards / ⚡ / vàng / Tinh+Hoạt; campaign untouched
- L08-P4: lacquer `#hvShopRoot`; Chrome 390×844; no second `data-art-go="shop"`; 0 app errors

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.

## Result

- GREEN 7/7 `tests/shop-day.test.mjs` (L08-T1..T3 + L08-P1..P4)
- Chrome 390×844 `?qa=unlock-all`: hub 1 landmark Chợ Mộng; 5 quầy; mua stam −160g → Hết hàng; click lại không trừ vàng; rollover `bought=0` `stock=5`; `clearedChapters` không đổi; 0 app errors
- Safari / device: NOT_RUN
- Deploy: not done — owner gõ `live` mới squash-merge
- Evidence: `docs/qa/L08-SHOP/` (`pass: true`)
- Ticket Board: TICKET_BOARD_NOT_AVAILABLE — không giả claim
