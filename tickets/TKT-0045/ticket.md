---
id: TKT-0045
title: Kit v2 cho 10 tướng legacy
status: LIVE
phase: REFACTOR
priority: P2
created: 2026-09-12T02:35:00.000Z
updated: 2026-09-12T03:45:00.000Z
acceptance_ids: ["L35-T1","L35-T2","L35-T3","L35-P1"]
required_gates: ["vibelab","tdd"]
affected_paths: ["src/domain/hero/skill-kit.mjs","scripts/skill-kit-runtime-v1.mjs","tests/skill-kit.test.mjs"]
resource_locks: ["hero-kits-v2"]
parallel_wave: B
depends_on: []
conflicts_with: []
branch_hint: work/l35-hero-kits-v2-20260912
---
# TKT-0045 — Kit v2 cho 10 tướng legacy

Wave **B**. **Một** agent (không tách 10 PR — cùng `skill-kit.mjs`). Song song được với Wave A vì không sửa hall/lanes/`build-static.mjs`.

## Goal

Đủ Basic + Ultimate + passive v2.1 cho 10 ID còn legacy. Giữ 12 ID playable. Không đưa S+ 42 vào roster.

## 10 ID

`thay_mo` · `lac_yen` · `cung_thu_tre` · `co_dao_ganh_hoi` · `phong_tu` · `thuy_nuong_roi_nuoc` · `hong_lien_dao_nuong` · `thach_quyen` · `dinh_loi` · `to_diep`

Đã v2: `ong_hang_pho`, `luc_anh` — **không** viết lại.

## Keep

- `legacySkillMap` (Skill 1 cũ → Basic, không mất đầu tư save)
- `heroStats` / `teamPower` không đổi
- Combat luật 6v6 · 15 hiệp · không multi-wave
- Không hỏi lại định hướng hai đòn

## Non-goals

Combat V2 / splus-*, hall overlay, seed/banner, atlas 42 tướng, Bày trận visual.

## Acceptance

- L35-T1: `HERO_SKILL_KIT_REGISTRY` có đủ 12 official IDs; 2 kit cũ hash/field không đổi
- L35-T2: mỗi kit mới có basic + ultimate + ≥1 passive + `legacySkillMap`
- L35-T3: `getHeroSkillKit(id)` không trả null cho 12 ID
- L35-P1: Chrome hồ sơ 1 tướng mẫu (không phải Ông Phở/Lục Ảnh) hiện tên Basic/Ultimate/Nội tại từ kit v2

Builder → REVIEW. Không tự MERGED/DONE.


## Result

- 10 kit v2 cho tướng legacy. Ông Phở + Lục Ảnh không đổi. Registry 12 ID. Builder dừng REVIEW. Không merge tới khi owner gõ `live`.
