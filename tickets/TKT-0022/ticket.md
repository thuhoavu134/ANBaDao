---
id: TKT-0022
title: Tháp Trắng Đêm domain and lacquer climb screen
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T10:30:00.000Z
updated: 2026-09-11T11:05:00.000Z
acceptance_ids: ["L22-T1","L22-T2","L22-T3","L22-T4"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/tower/tower-progress.mjs","src/ui/tower-runtime.js","src/ui/tower-screen.css","scripts/tower-runtime-v1.mjs","scripts/qa-tower-screen.mjs","assets/ui/tower/"]
resource_locks: ["tower-screen","hub-landmarks"]
---
# TKT-0022 — Tháp Trắng Đêm (L14a)

Goal: Extract tower floor/trial/reward into an immutable domain. Restyle the climb screen to lacquer night-pagoda quality. Put **Tháp** on Thành Chính. Keep existing gold/gems/sigil formulas and 5⚡ climb cost.

Non-goals: new currency, combat seed, campaign win, online rank, Săn Boss, changing pity/banner.

## Acceptance

- L22-T1: normalize empty tower to floor 1; encounter always 4 units; floor 5 has Chúa Tầng
- L22-T2: prepareTowerClear is immutable, uses 120+floor×30 gold, gems every 5, shards every 10 via rng; does not touch clearedChapters; stale floor rejects double settlement
- L22-T3: three rotating trials; success adds sigils + gold bonus; milestone claim is immutable and rejects duplicates / missing sigils
- L22-T4: hub shows Tháp; lacquer screen opens; Leo tầng spends 5⚡; Chrome 390×844, 0 app errors

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.

## Result

- GREEN 4/4 `tests/tower-progress.test.mjs`
- Chrome 390×844: hub Tháp, 3 ấn, Leo tầng 120→115⚡, Tầng 1→2, 0 app errors
- Safari / device: NOT_RUN
- Evidence: `docs/qa/L22-TOWER/`

