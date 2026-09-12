---
id: TKT-0070
title: WAITING_ASSET — thân quái chương 1–2
status: WAITING_ASSET
phase: WAITING_ASSET
priority: P3
created: 2026-09-12T07:20:00.000Z
updated: 2026-09-12T07:20:00.000Z
acceptance_ids: ['L70-T1']
required_gates: ["vibelab"]
affected_paths: ['scripts/lanes/tkt-0070-campaign-foes-a.mjs', 'assets/characters/enemies/ch01/body.jpg', 'assets/characters/enemies/ch02/body.jpg', 'docs/qa/L70-CAMPAIGN-FOES-A/']
resource_locks: ["campaign-foes-a"]
parallel_wave: H
depends_on: []
conflicts_with: []
branch_hint: work/l70-campaign-foes-a-20260912
---
# TKT-0070 — WAITING_ASSET thân quái chương 1–2

Wave **H** plug. **Không làm art / runtime lúc này.** Chờ file jpg/png rồi ghép. Stub `scripts/lanes/tkt-0070-campaign-foes-a.mjs` giữ `LANE` rỗng tới khi asset về.

## Plug

Thả file vào:

- `assets/characters/enemies/ch01/body.jpg` — ch.1 Mộng Phố (`ch01_fight_street_mobs`, `mob_sale`, `ch01_boss_chungcu`)
- `assets/characters/enemies/ch02/body.jpg` — ch.2 Rừng Deadline (`ch02_fight_email_bay`, `ch02_fight_bao_cao_song`, `ch02_boss_sep_tong`)

Fallback live: role-art / shadow roster 12. **Không** sinh combat atlas cho 12 ID live. **Không** nới roster 72.

Khi art về: điền stub `await import('../campaign-foes-a-v1.mjs')` map `characterAsset` encounter → file plug. Không sửa `index.html`. Không sửa `campaign-scene.js`. Không sửa `battle.html`. Không sửa công thức encounter.

## Non-goals

Không imagegen wave này. Không Combat V2. Không 72 tướng. Không idle/combat sheet 12 live. Không merge/live tới khi owner gõ `live` **và** file art đã có.

Builder giữ WAITING_ASSET. Không tự READY/MERGED/DONE.
