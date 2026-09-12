---
id: TKT-0072
title: WAITING_ASSET — thân quái chương 5–6
status: WAITING_ASSET
phase: WAITING_ASSET
priority: P3
created: 2026-09-12T07:20:00.000Z
updated: 2026-09-12T07:20:00.000Z
acceptance_ids: ['L72-T1']
required_gates: ["vibelab"]
affected_paths: ['scripts/lanes/tkt-0072-campaign-foes-c.mjs', 'assets/characters/enemies/ch05/body.jpg', 'assets/characters/enemies/ch06/body.jpg', 'docs/qa/L72-CAMPAIGN-FOES-C/']
resource_locks: ["campaign-foes-c"]
parallel_wave: H
depends_on: []
conflicts_with: []
branch_hint: work/l72-campaign-foes-c-20260912
---
# TKT-0072 — WAITING_ASSET thân quái chương 5–6

Wave **H** plug. **Không làm art / runtime lúc này.** Chờ file jpg/png rồi ghép. Stub `scripts/lanes/tkt-0072-campaign-foes-c.mjs` giữ `LANE` rỗng tới khi asset về.

## Plug

- `assets/characters/enemies/ch05/body.jpg` — ch.5 (`boss_ban_the` Bản Thể Bị Quên + mob chương)
- `assets/characters/enemies/ch06/body.jpg` — ch.6 (`boss_nguoi_gac_mong` Người Gác Mộng + mob chương)

Fallback live: role-art / shadow roster 12. **Không** sinh combat atlas cho 12 ID live. **Không** nới roster 72.

Khi art về: điền stub `await import('../campaign-foes-c-v1.mjs')`. Không sửa `index.html`. Không sửa `campaign-scene.js`. Không sửa `battle.html`.

## Non-goals

Không imagegen wave này. Không Combat V2. Không 72 tướng. Không merge/live tới khi owner gõ `live` **và** file art đã có.

Builder giữ WAITING_ASSET. Không tự READY/MERGED/DONE.
