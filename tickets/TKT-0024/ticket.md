---
id: TKT-0024
title: Slim production deploy artifact and skip native sharp
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-11T11:10:00.000Z
updated: 2026-09-11T11:18:00.000Z
acceptance_ids: ["L24-D1","L24-D2","L24-D3"]
required_gates: ["vibelab","tdd"]
affected_paths: ["scripts/build-static.mjs","package.json","vercel.json","tests/deploy-artifact.test.mjs"]
resource_locks: ["build-static","vercel-config"]
---
# TKT-0024 — Tối ưu deploy

Goal: Production dist no longer ships QA docs. Vercel install skips native `sharp`. Game files, battle embed, assets, and Tháp stay identical.

Non-goals: combat seed, reward, save, art quality, removing BATTLE_HTML_BASE64, deleting repo docs.

## Acceptance

- L24-D1: dist has no `docs/`; index, battle, and assets remain
- L24-D2: BATTLE_HTML_BASE64 still matches dist/battle.html
- L24-D3: sharp is a devDependency; Vercel install omits dev

## Result

- RED: sharp still in dependencies; build copied `docs/`
- GREEN: 3/3 `tests/deploy-artifact.test.mjs`; dist 383MB → 361MB; no `dist/docs`; battle embed 1,416,017 bytes
- Safari/device: NOT_RUN

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.
