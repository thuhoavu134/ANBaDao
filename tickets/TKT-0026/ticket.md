---
id: TKT-0026
title: Mộng Lộ lacquer run with checkpoint domain
status: REVIEW
phase: REFACTOR
priority: P2
created: 2026-09-11T12:00:00.000Z
updated: 2026-09-11T12:40:00.000Z
acceptance_ids: ["L15-P1","L15-P2","L15-P3","L15-P4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/expedition/expedition-run.mjs","src/ui/expedition-runtime.js","src/ui/expedition-screen.css","scripts/expedition-runtime-v1.mjs","scripts/build-static.mjs","tests/expedition-run.test.mjs"]
resource_locks: ["expedition-screen"]
---
# TKT-0026 — Mộng Lộ sơn mài + domain run/checkpoint

Goal: Lift the live 5-floor rogue (Ngã Rẽ, Phúc Mộng, Mộng Ấn, resume) into a pure domain module and a lacquer screen in the same style as Tháp. Keep gold / blessing / sigil / gem formulas. Keep the existing hub Mộng Lộ entry.

Non-goals: new currency, campaign progress, combat seed, pity/banner, second hub listener, auto-resolving expedition battles, changing 5-floor length.

## Acceptance

- L15-P1: start / resume / abandon; lose keeps `best`; campaign chapters untouched
- L15-P2: Ngã Rẽ required except floor 5; gold `180 + floor×90 × route`; sigils 0/1/2; clear gems `80 + min(20, sigils×2)`
- L15-P3: 3-blessing offer; pick advances floor; reroll costs 2 Mộng Ấn once per floor
- L15-P4: lacquer `#hvExpeditionRoot`; Chrome 390×844; no second `data-art-go="expedition"`; 0 app errors

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.

## Result

- GREEN 7/7 `tests/expedition-run.test.mjs` (L15-T1..T3 + L15-P1..P4)
- Chrome 390×844 `?qa=unlock-all`: hub 1 landmark Mộng Lộ; start → 3 Ngã Rẽ → fight `__rogue` → 3 Phúc → tầng 2 → abort giữ kỷ lục; `clearedChapters` không đổi; 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L15-EXPEDITION/`
- Ticket Board: TICKET_BOARD_NOT_AVAILABLE — không giả claim
