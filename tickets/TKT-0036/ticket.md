---
id: TKT-0036
title: Rèn hall giả 3D overlay body
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-12T04:28:00.000Z
updated: 2026-09-12T04:28:00.000Z
acceptance_ids: ["L25-T1","L25-T2","L25-T3","L25-T4","L25-T5","L25-P1"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/ui/forge-hall-runtime.js","src/ui/forge-hall.css","scripts/forge-hall-v1.mjs","scripts/build-static.mjs","assets/ui/forge/forge-hall.jpg","tests/forge-hall.test.mjs"]
resource_locks: ["forge-hall"]
---
# TKT-0036 — Rèn hall giả 3D

Goal: Side **Rèn** mở overlay `#hvForgeRoot` gắn `document.body` (pattern Trợ trận / Tướng): hall sáng nhiều lớp, không sơn mài. Giữ `forgeCommand` / CRAFT 20·200 / DUAL 42·420 / pity 30 / +15. Không thêm `data-art-go`, không thêm `document` click listener.

Non-goals: Combat V2, Túi/Mail/Bang, đổi seed/banner/roster, 5 nan Lịch Luyện `go:null`, visual Bày trận.

Branch: `work/l25-forge-hall-20260912` from main `32b32de`.

## Keep (live)

- `forgeCommand` + `hvRunCommittedTransaction`
- `CRAFT={tinh:20,gold:200}` · `DUAL_FORGE={tinh:42,gold:420}` · `FORGE_MAX_LEVEL=15` · `craftPitySSR:30`
- Hub `labelAct('forge','forge','Rèn')` → `navTo('forge')`

## Acceptance

- L25-T1: costs/pity/+15 frozen
- L25-T2: overlay `position:fixed;inset:0;overflow:auto` + hall jpg
- L25-T3: `document.body.append` + wrap `showScreen`, no document click
- L25-T4: inject after daily
- L25-T5: dedicated hall, not menu-v3233
- L25-P1: Chrome 390 + 768 — overlay mở từ Rèn, khuôn + slot hiện, thẻ min-height
- L26: preview (không phải luc-than.vercel.app) tạm `featLocked=false` để owner test; JOURNEY_UNLOCK không đổi; live vẫn khóa theo chương

Builder moves this ticket to REVIEW. Do not mark MERGED/DONE.

## Result

- GREEN `tests/forge-hall.test.mjs` L25-T1..T5; `tests/forge-transactions.test.mjs` 18/18 PASS
- Chrome 390×844 + 768×1024 PASS (overlay body, 3 khuôn, 4 slot, hall jpg). Evidence `docs/qa/L25-FORGE-HALL/`
- Safari / device: NOT_RUN

