---
id: TKT-0030
title: Săn Boss lacquer + immutable hunt domain
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T14:20:00.000Z
updated: 2026-09-11T16:30:00.000Z
acceptance_ids: ["L19-T1","L19-T2","L19-T3","L19-P1","L19-P2","L19-P3","L19-P4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/hunt/hunt-run.mjs","src/ui/hunt-runtime.js","src/ui/hunt-screen.css","scripts/hunt-runtime-v1.mjs","scripts/build-static.mjs","tests/hunt-run.test.mjs","scripts/qa-hunt-screen.mjs"]
resource_locks: ["hunt-screen"]
---
# TKT-0030 — Săn Boss sơn mài + domain khế/ấn/thưởng

Goal: Lift the live Săn Boss loop (2 lượt/ngày, 3 boss xoay, Săn Khế, Săn Ấn) into a pure domain module and a lacquer screen in the same style as Tháp / Mộng Lộ / Chợ / Gọi Mộng / Đấu Trường. Contract pick, start debit and settle go through `hvRunCommittedTransaction`. Keep the existing hub button. Do **not** change cost, attempts, HP, gold/shard formulas, contracts, or milestones.

Non-goals: new currency, Combat V2, second hub listener, rewriting the 60-turn battle cap, seed/banner (D01/D02), changing 12-id roster.

Branch: `work/l19-hunt-onto-main` from main `1139ef4`. Do not merge until owner says `live`.

## Keep (live formulas)

- `HUNT.cost 6⚡` · `attemptsPerDay 2` · `turnLimit 60`
- 3 boss xoay `today() % 3`: Cá Voi Nuốt Trăng / Nhện Dệt Ác Mộng / Đồng Hồ Cát Vỡ
- Máu `round(45000×(1+0.35×số chương))` · ATK adds `1+0.15×chương`
- Vàng `floor(ST/40)` · mảnh `floor(ST/6000)` · hạ gục +💎40 +1🐚 + thư 🪙300
- Săn Khế: Phá Lõi 30% máu +25% vàng +1 ấn · Quét 2 add +1 mảnh +1 ấn · Đoạt Mệnh hạ gục +💎20 +2 ấn
- Mốc ấn 3/7/12: 🪙250/💎5 · 🪙500/💎10/1 mảnh · 🪙900/💎20/2 mảnh

## Acceptance

- L19-T1: frozen catalog; 6⚡; 2 lượt; 60 hiệp; 3 boss; 3 khế; mốc 3/7/12
- L19-T2: todayBoss / HP / encounter keep live math
- L19-T3: settle vàng/mảnh theo ST; hạ gục +💎40; input player not mutated
- L19-P1: start debit 6⚡ + 1 lượt; thiếu khế / hết lượt / thiếu ⚡ fail
- L19-P2: contracts Phá Lõi / Quét / Đoạt Mệnh; lock after first hunt
- L19-P3: milestone 3; day rollover resets attempts/contract, keeps marks
- L19-P4: lacquer `#hvHuntRoot`; no second `data-art-go="hunt"`; inject after arena

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.

## Result

- GREEN 7/7 `tests/hunt-run.test.mjs` (L19-T1..T3 + L19-P1..P4)
- Chrome 390×844 `?qa=unlock-all`: 1 hub button Săn Boss; title Sổ Săn Đêm; 3 Săn Khế; chọn Phá Lõi; settle domain mốc 3 → 💎800→805 · 🪙500→1687 · 🐚+1; `clearedChapters` không đổi; 0 app errors
- Safari / device: NOT_RUN
- Deploy: not done — owner gõ `live` mới squash-merge
- Evidence: `docs/qa/L08-HUNT/` (`pass: true`)
- Ticket Board: TICKET_BOARD_NOT_AVAILABLE — không giả claim
