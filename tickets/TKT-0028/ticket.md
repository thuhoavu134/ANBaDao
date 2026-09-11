---
id: TKT-0028
title: Gọi Mộng lacquer + immutable summon domain
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T13:00:00.000Z
updated: 2026-09-11T13:00:00.000Z
acceptance_ids: ["L07-T1","L07-T2","L07-T3","L07-P1","L07-P2","L07-P3","L07-P4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/summon/summon-pull.mjs","src/ui/summon-runtime.js","src/ui/summon-screen.css","scripts/summon-runtime-v1.mjs","scripts/build-static.mjs","tests/summon-pull.test.mjs","scripts/qa-summon-screen.mjs"]
resource_locks: ["summon-screen"]
---
# TKT-0028 — Gọi Mộng sơn mài + domain triệu hồi

Goal: Lift the live Gọi Mộng loop (×1 / ×10 / daily free / pity 60 / Hồi Ức 120) into a pure domain module and a lacquer screen in the same style as Tháp / Mộng Lộ / Chợ. Buys and spark picks go through `hvRunCommittedTransaction`. Keep the existing hub landmark. Do **not** change rates, pity, costs, dup shards, or seed/banner (D01/D02 still pending).

Non-goals: new currency, new banner, changing `GACHA.rates`, expanding/shrinking `OFFICIAL_ROSTER_12_IDS`, Combat V2, second hub listener, pity/seed edits.

## Keep (live formulas)

- `cost1 80` · `cost10 720`
- Rates SSR 3 / SS 9 / S 18 / A 30 / B 40
- Pity 60, SSR roll resets pity
- ×10 always at least one S+
- Dup shards 15/10/6/4/3 · essence 12/8/5/3/2
- Hồi Ức 120 → pick SSR; owned → +30 mảnh +8 Mộng Tủy
- Daily free ×1
- Pool guard: empty rarity pool locks pulls (live 12-id roster is SSR-only)

## Acceptance

- L07-T1: frozen catalog; rates sum 100; costs/pity unchanged
- L07-T2: pity 60 forces SSR and resets; SSR from rates also resets; input player not mutated
- L07-T3: ×10 floor to S+; free only n=1; second free same day fails
- L07-P1: insufficient gems fail; campaign untouched; empty pool does not debit
- L07-P2: new own vs dup shards+essence; spark += n
- L07-P3: spark select 120; owned 30+8; not SSR rejected
- L07-P4: lacquer `#hvSummonRoot`; no second `data-art-go="summon"`; inject after shop

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.

## Result

- GREEN 7/7 `tests/summon-pull.test.mjs` (L07-T1..T3 + L07-P1..P4)
- Chrome 390×844 `?qa=unlock-all`: 1 hub landmark Gọi Mộng; title Vòng Gọi Mộng; pity 60; live 12-id pool khóa pull (không trừ 💎); 12 nút Hồi Ức; spark 120→0; `clearedChapters` không đổi; 0 app errors
- Safari / device: NOT_RUN
- Deploy: not done — owner gõ `live` mới squash-merge
- Evidence: `docs/qa/L08-SUMMON/` (`pass: true`)
- Ticket Board: TICKET_BOARD_NOT_AVAILABLE — không giả claim
