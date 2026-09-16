# Bạch Diện — Agent Asset Package v1

## Canonical identity

- Hero ID: `hero_splus_bach_dien`
- Legacy alias: `bach_dien`
- Display name: Bạch Diện Thần Quân — Bạch Diện
- Element: Âm Hồn
- Role: single-target burst magic assassin / soul swap / dodge and retaliation
- Suggested position: back row, slot 5 or 6
- Facing: 3/4 view toward the right

## Visual identity

Porcelain-white opera mask with cinnabar red drama makeup, ink-black hair and accents, white silk opera robes with ink-black trim, red tassels, black iron folding fan with blade tips, three small wooden masks floating behind the neck. Preserve the reference silhouette and identity. Do not redesign the character during asset integration.

## Asset mapping

| Runtime slot | File | Description |
|---|---|---|
| avatar | `assets/characters/bach-dien/avatar.webp` | portrait/reference avatar, not a battle frame |
| idle | `assets/characters/bach-dien/idle.webp` | character only |
| run | `assets/characters/bach-dien/run.webp` | character only |
| hit | `assets/characters/bach-dien/hit.webp` | character only |
| fall | `assets/characters/bach-dien/fall.webp` | character only |
| attack | `assets/characters/bach-dien/atk.webp` | ATK / Huyễn Diện Trảm character pass |
| ultimate | `assets/characters/bach-dien/ultimate.webp` | Ultimate / Ly Hồn Đoạt Phách character pass |
| attackVfx | `assets/vfx/bach-dien/atk.webp` | one combined ATK VFX pass |
| ultimateVfx | `assets/vfx/bach-dien/ultimate.webp` | one combined Ultimate VFX pass |
| attackSfx | `assets/audio/bach-dien/atk.m4a` | extracted audio from ATK VFX source video |
| ultimateSfx | `assets/audio/bach-dien/ultimate.m4a` | extracted audio from Ultimate VFX source video |

## Technical contract

- Source: Blender 5.1.2 compositor render from supplied MP4 videos.
- Source video: 848×464, 30fps, 94 video frames.
- Character runtime canvas: 480×440 RGBA.
- VFX runtime canvas: 440×248 RGBA.
- Character crop: stable union of the largest connected character component, with bottom-center pivot.
- VFX crop: preserve full source composition; do not character-crop VFX.
- Delivery: animated WebP q90 with alpha; audio is separate M4A.
- No floor, scene or background is part of the character clips.
- Do not treat animated WebP as a 4×2 atlas. If converting to an atlas, read the manifest and frame metadata.

## Gameplay content reference

- Passive: Diện Khúc Luân Hồi. Successful skill or dodge changes one mask: Hỷ gives +25% crit rate for 2 rounds; Nộ gives +30% crit damage and converts 15% dealt damage to healing. A critical hit received triggers Thế Thân Chi Diện, consuming masks to nullify that hit and reappear behind the attacker.
- Skill 1: Huyễn Diện Trảm. Cooldown 2 rounds; lowest-HP enemy; 240% magic damage. Below 40% target HP: guaranteed crit and Mê Loạn (-50% magic armor for 2 rounds).
- Ultimate: Ly Hồn Đoạt Phách. Cost 100 rage; highest-ATK enemy; 420% single-target magic damage; steals 25% target ATK for 2 rounds; target cannot act, heal or receive buffs for 1 round.

## Voice lines

- Hero screen: “Đời người như vở kịch ngắn ngủi... Đến khi hạ màn, ai mới là kẻ đeo mặt nạ?”
- Basic: “Nhát quạt đoạn trần duyên!”
- Skill 1: “Hý biến vô thường... Xem ngươi diễn tiếp ra sao!”
- Ultimate: “Mượn xác tráo hồn... Khúc ca tuyệt mệnh!”
- Defeat: “Mặt nạ... vỡ rồi...”

## Integration rules

1. Read `PACKAGE-MANIFEST.json` before copying any asset.
2. Preserve the canonical ID and mapping above.
3. Do not change combat numbers or action semantics as part of asset integration.
4. Verify dimensions, frame count, alpha, pivot, duration and hashes.
5. Keep avatar separate from battle animation.
6. Keep ATK/Ultimate VFX combined; do not invent projectile/impact splits.
7. Report compressed bytes and decoded memory separately.
