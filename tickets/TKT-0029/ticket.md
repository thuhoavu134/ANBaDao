---
id: TKT-0029
title: Đấu Trường lacquer + immutable arena domain
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T13:20:00.000Z
updated: 2026-09-11T13:40:00.000Z
acceptance_ids: ["L18-T1","L18-T2","L18-T3","L18-P1","L18-P2","L18-P3","L18-P4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/arena/arena-match.mjs","src/ui/arena-runtime.js","src/ui/arena-screen.css","scripts/arena-runtime-v1.mjs","scripts/build-static.mjs","tests/arena-match.test.mjs","scripts/qa-arena-screen.mjs"]
resource_locks: ["arena-screen"]
---
# TKT-0029 — Đấu Trường sơn mài + domain hạng/mùa/võ đài

Goal: Lift the live Đấu Trường loop (Đấu Hạng / Mùa / Võ Đài) into a pure domain module and a lacquer screen in the same style as Tháp / Mộng Lộ / Chợ / Gọi Mộng. Settles and LP claims go through `hvRunCommittedTransaction`. Keep the existing hub landmark. Do **not** change costs, LP, rank gems, rivalry marks, or PvE first-clear rewards.

Non-goals: new currency, Combat V2, second hub listener, net PvP rewrite, seed/banner (D01/D02), changing 12-id roster.

## Keep (live formulas)

- `ARENA.cost 5⚡`
- Rank win: occupy rival rank, +🪙220, +1 Sôi Nổi; lose does not drop rank (Kình Địch)
- Rank gem milestones: 800/10 … 1/200
- Rivalry Vinh Ấn: first +1 / leap +2 / revenge +2; marks 3/8/15/25
- Season LP: win `round(34+diff/30)` · lose `round(-18-max(0,-diff)/55)` · win +🪙180
- LP claims: 180/400/700/1000/1400
- Võ Đài 8 tầng, lần đầu gems/mảnh live, rematch +🪙200 only
- `rivalPower` lvl/stars from rank

## Acceptance

- L18-T1: frozen catalog; cost 5; 8 võ đài; LP/hạng/vinh ấn tables
- L18-T2: rivalPower, rankCandidates, seasonLpDelta keep live math
- L18-T3: rank win occupies rival rank +220g; lose no drop; input player not mutated
- L18-P1: rank gem milestones once; net kèo rejected
- L18-P2: rivalry deeds + day rollover; marks are not combat stats
- L18-P3: season claim 180; PvE first vs rematch; locked stage fails
- L18-P4: lacquer `#hvArenaRoot`; no second `data-art-go="arena"`; inject after shop

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.

## Result

- GREEN 7/7 `tests/arena-match.test.mjs` (L18-T1..T3 + L18-P1..P4)
- Chrome 390×844 `?qa=unlock-all`: 1 hub landmark Đấu Trường; title Võ Đài Kẻ Mất Ngủ; 3 tab; 3 kèo hạng; 8 võ đài; mốc LP 180 → +💎40 +🪙800; thắng domain hạng 1000→780; `clearedChapters` không đổi; 0 app errors
- Safari / device: NOT_RUN
- Deploy: not done — owner gõ `live` mới squash-merge
- Evidence: `docs/qa/L08-ARENA/` (`pass: true`)
- Ticket Board: TICKET_BOARD_NOT_AVAILABLE — không giả claim
