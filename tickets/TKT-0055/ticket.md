---
id: TKT-0055
title: Chinh chiến AFK home hall giả 3D overlay body
status: REVIEW
phase: REFACTOR
priority: P1
created: 2026-09-12T04:30:00.000Z
updated: 2026-09-12T04:30:00.000Z
acceptance_ids: ['L45-T1', 'L45-T2', 'L45-T3', 'L45-T4', 'L45-P1']
required_gates: ["vibelab","tdd"]
affected_paths: ['src/ui/campaign-3d-runtime.js', 'src/ui/campaign-3d.css', 'scripts/campaign-3d-v1.mjs', 'scripts/lanes/tkt-0055-campaign.mjs', 'scripts/qa-wave-e-3d.mjs', 'assets/ui/campaign/campaign-hall.jpg', 'tests/campaign-3d.test.mjs', 'docs/qa/L45-CAMPAIGN-3D/']
resource_locks: ["campaign-3d"]
parallel_wave: E
depends_on: []
conflicts_with: []
branch_hint: work/l44-wave-e-3d-20260912
---
# TKT-0055 — Chinh chiến AFK home hall giả 3D overlay body

Wave **E**. Đọc [PARALLEL-LANES](../../docs/PARALLEL-LANES-2026-09-12.md) trước.

## Goal

Dock **Chinh chiến** → `navTo('campaign')`. Overlay `#hvCampaignScene` **kéo lên `document.body`**: hall sáng giả 3D nhiều lớp cho **màn AFK home**, **không** sơn mài giấy `#f4eddb`. CSS override trong file 3d riêng — **không** sửa `campaign-scene.js` / `campaign-scene.css` / domain. **Không** restyle `.cs-prepare` (Bày trận đóng băng). Wrap `showScreen`, gọi base. Điền stub `scripts/lanes/tkt-0055-campaign.mjs`.

## Keep (live)

- Rương AFK 15h · Khiêu chiến · team 1–6 ô trống
- `JOURNEY_UNLOCK` / `featLocked` không đổi
- Visual Bày trận `.cs-prepare` nguyên bản

## Non-goals

Combat V2, nan Lịch `go:null`, visual Bày trận, Auth/DB, atlas skill trận.
Không sửa `index.html`. Không commit `dist/`. Không merge/live tới khi owner gõ `live`.

## Acceptance

- L45-T1: campaign-scene + `.cs-prepare` không đổi
- L45-T2: `#hvCampaignScene` `position:fixed;inset:0` + hall jpg riêng, CSS 3d **không** chứa `.cs-prepare`
- L45-T3: `document.body.append` + wrap `showScreen` + **không** document click
- L45-T4: stub lane `tkt-0055-campaign.mjs` load runtime
- L45-P1: Chrome 390×844 + 768×1024 — mở Chinh chiến home, body hall hiện, 0 app error

## Affected paths (exclusive)

- `src/ui/campaign-3d-runtime.js`
- `src/ui/campaign-3d.css`
- `scripts/campaign-3d-v1.mjs`
- `scripts/lanes/tkt-0055-campaign.mjs`
- `scripts/qa-wave-e-3d.mjs`
- `assets/ui/campaign/campaign-hall.jpg`
- `tests/campaign-3d.test.mjs`
- `docs/qa/L45-CAMPAIGN-3D/`

Shared read-only: `src/ui/campaign-scene.js`, `src/ui/campaign-scene.css`.

Builder → REVIEW. Không tự MERGED/DONE.
