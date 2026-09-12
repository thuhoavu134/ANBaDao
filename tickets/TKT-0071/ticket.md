---
id: TKT-0071
title: WAITING_ASSET — thân quái chương 3–4
status: WAITING_ASSET
phase: WAITING_ASSET
priority: P3
created: 2026-09-12T07:20:00.000Z
updated: 2026-09-12T07:20:00.000Z
acceptance_ids: ['L71-T1']
required_gates: ["vibelab"]
affected_paths: ['scripts/lanes/tkt-0071-campaign-foes-b.mjs', 'assets/characters/enemies/ch03/body.jpg', 'assets/characters/enemies/ch04/body.jpg', 'docs/qa/L71-CAMPAIGN-FOES-B/']
resource_locks: ["campaign-foes-b"]
parallel_wave: H
depends_on: []
conflicts_with: []
branch_hint: work/l71-campaign-foes-b-20260912
---
# TKT-0071 — WAITING_ASSET thân quái chương 3–4

Wave **H** plug. **Không làm art / runtime lúc này.** Chờ file jpg/png rồi ghép. Stub `scripts/lanes/tkt-0071-campaign-foes-b.mjs` giữ `LANE` rỗng tới khi asset về.

## Plug

- `assets/characters/enemies/ch03/body.jpg` — ch.3 (`boss_cua` Cua Hoàng Đế + mob chương)
- `assets/characters/enemies/ch04/body.jpg` — ch.4 (`boss_giam_doc` Giám Đốc Máy Ấp Mơ + mob chương)

Fallback live: role-art / shadow roster 12. **Không** sinh combat atlas cho 12 ID live. **Không** nới roster 72.

Khi art về: điền stub `await import('../campaign-foes-b-v1.mjs')`. Không sửa `index.html`. Không sửa `campaign-scene.js`. Không sửa `battle.html`.

## Non-goals

Không imagegen wave này. Không Combat V2. Không 72 tướng. Không merge/live tới khi owner gõ `live` **và** file art đã có.

Builder giữ WAITING_ASSET. Không tự READY/MERGED/DONE.
