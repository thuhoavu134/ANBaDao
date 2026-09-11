---
id: TKT-0031
title: Lễ Hội lacquer + immutable festival domain
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T18:30:00.000Z
updated: 2026-09-11T19:00:00.000Z
acceptance_ids: ["L20-T1","L20-T2","L20-T3","L20-P1","L20-P2","L20-P3","L20-P4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/festival/festival-run.mjs","src/ui/festival-runtime.js","src/ui/festival-screen.css","scripts/festival-runtime-v1.mjs","scripts/build-static.mjs","tests/festival-run.test.mjs","scripts/qa-festival-screen.mjs","assets/festival/"]
resource_locks: ["festival-screen"]
---
# TKT-0031 — Lễ Hội sơn mài + domain hoa đăng / Bách Bảo Luân

Goal: Lift the live Lễ Hội loop (Hoa Đăng 5/ngày, Tam Nguyện, Lễ Ấn, Bách Bảo Luân 20 ô, Rương Báu / Chí Bảo) into a pure domain module and a lacquer screen in the same style as Tháp / Mộng Lộ / Chợ / Gọi Mộng / Đấu Trường / Săn Boss. Lantern, spin and chest open go through `hvRunCommittedTransaction`. Keep the existing hub button. Do **not** change costs, weights, wheel slots, or chest tables.

Non-goals: new currency, Combat V2, second hub listener, seed/banner (D01/D02), changing 12-id roster.

Branch: `work/l20-festival-onto-main` from main `d62dea1`. Do not merge until owner says `live`.

## Keep (live formulas)

- Hoa Đăng 5/ngày · đèn đầu miễn phí · sau đó 🪙100
- 3 hướng An Khang / Duyên Phố / Khai Lộ (weights live)
- Tam Nguyện đủ 3 hướng: +1 Lễ Ấn · +🪙150 · +💎5 một lần/ngày
- Mốc ấn 3/7/12: 🪙500/💎15 · 🪙900/💎25 · 🪙1500/💎40
- Bách Bảo Luân 20 ô · 1🐚 / lượt
- Rương Báu: 35% 30 SS / 33% 20 SSR / 22% SSR+5 / 10% 💎120
- Chí Bảo: 45% 40 SSR / 40% SSR+10 / 15% 60 SSR

## Acceptance

- L20-T1: frozen catalog; 5 đèn; 🪙100; 3 hướng; mốc 3/7/12; 20 ô; bảng rương
- L20-T2: first lantern free; later 🪙100; 5/day cap; input not mutated
- L20-T3: Tam Nguyện +1 ấn +🪙150 +💎5 once/day
- L20-P1: milestone 3; day rollover resets count/themes, keeps marks
- L20-P2: 20 slots; 1🐚; chest token on slot 6
- L20-P3: chest tables; equipment grant; no chest fail
- L20-P4: lacquer `#hvFestivalRoot`; no second `data-art-go="festival"`; inject after hunt

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.

## Result

- GREEN 7/7 `tests/festival-run.test.mjs` (L20-T1..T3 + L20-P1..P4)
- Chrome 390×844 save mới (không `qa=unlock-all`): Sự kiện không khóa, vào Tam Nguyện Sông Mơ. Evidence `docs/qa/L08-FESTIVAL/`
- Safari / device: NOT_RUN
- Deploy: not done — owner gõ `live` mới squash-merge
- Ticket Board: TICKET_BOARD_NOT_AVAILABLE — không giả claim
