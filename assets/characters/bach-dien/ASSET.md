# Bạch Diện Thần Quân — Canvas Sprite Runtime (TKT-0154)

Nguồn pack `artifacts/bach-dien/bach-dien-agent-assets-q90-480.zip` (Blender 5.1.2 compositor, animated WebP q90). Runtime **không** dùng animated WebP như atlas 4×2 — đóng gói lại grid 8×12 nhân vật / 10×10 VFX từ metadata pack.

- ID: `hero_splus_bach_dien` · alias `bach_dien`, `bach-dien`
- Hệ Âm Hồn · Sát thủ phép · hàng sau ô 5/6
- Extra ngoài lưới 42. Không nằm roster 12.
- Character cell 480×440 · VFX 440×248 · 94 frame · 30fps · pivot đáy giữa
- Combined ATK/Ultimate VFX, không tách projectile/impact
- SFX wav HonVietSfx. Không Spine.

## File runtime

| File | Role |
|---|---|
| `avatar.webp` | chân dung pack, không phải battle frame |
| `card.webp` / `hud-icon.webp` | thẻ / HUD tham chiếu TKT-0152 |
| `idle-atlas.webp` `run-atlas.webp` `hit-atlas.webp` `fall-atlas.webp` | state |
| `basic-atlas.webp` `ultimate-atlas.webp` | ATK / Ult character |
| `skill1_vfx-atlas.webp` `ultimate_vfx-atlas.webp` | combined VFX |
| `runtime-meta.json` | canvas-sprite-runtime/v2 |
| `PACKAGE-MANIFEST.json` | hash/timing pack gốc |

decodedBytes nhân vật: `8×480 × 12×440 × 4 = 81 100 800`. VFX: `10×440 × 10×248 × 4 = 43 648 000`.
