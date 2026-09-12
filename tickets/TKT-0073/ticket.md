---
id: TKT-0073
title: WAITING_ASSET — chân dung thoại NPC
status: WAITING_ASSET
phase: WAITING_ASSET
priority: P3
created: 2026-09-12T07:20:00.000Z
updated: 2026-09-12T07:20:00.000Z
acceptance_ids: ['L73-T1']
required_gates: ["vibelab"]
affected_paths: ['scripts/lanes/tkt-0073-npc-busts.mjs', 'assets/characters/npc/narrator/dialogue.jpg', 'assets/characters/npc/ong_chu_wifi/dialogue.jpg', 'docs/qa/L73-NPC-BUSTS/']
resource_locks: ["npc-busts"]
parallel_wave: H
depends_on: []
conflicts_with: []
branch_hint: work/l73-npc-busts-20260912
---
# TKT-0073 — WAITING_ASSET chân dung thoại NPC

Wave **H** plug. **Không làm art / runtime lúc này.** Chờ file jpg/png rồi ghép. Stub `scripts/lanes/tkt-0073-npc-busts.mjs` giữ `LANE` rỗng tới khi asset về.

## Plug

`assets/characters/npc/{id}/dialogue.jpg` cho `NPC` + speaker lore (không phải 12 tướng live):

- `narrator` Người Dẫn Mộng
- `mob_sale` Quái Khuyến Mãi 50%
- `boss_chungcu` `boss_sep_tong` `boss_cua` `boss_giam_doc` `boss_ban_the` `boss_nguoi_gac_mong`
- `ong_chu_wifi` `meo_9_deadline` `ky_lan_ca_phe`

Fallback live: `NPC.emblem` emoji + color chip. **Không** sinh portrait sheet cho 12 ID live (`ong_hang_pho` `luc_anh` `thay_mo` đã có). **Không** nới roster 72.

Khi art về: điền stub `await import('../npc-busts-v1.mjs')` map `characterAsset(sp,'dialogue')`. Không sửa `index.html`. Không sửa `campaign-scene.js`. Không sửa `battle.html`. Không restyle `.cs-prepare`.

## Non-goals

Không imagegen wave này. Không Combat V2. Không 72 tướng. Không merge/live tới khi owner gõ `live` **và** file art đã có.

Builder giữ WAITING_ASSET. Không tự READY/MERGED/DONE.
