---
id: TKT-0139
title: Bind Linh Đồng authored animation, VFX, SFX
status: LIVE
phase: LIVE
priority: P0
created: 2026-09-14T03:30:00.000Z
updated: 2026-09-14T04:02:00.000Z
acceptance_ids: ['L139-T1', 'L139-T2', 'L139-T3', 'L139-T4', 'L139-T5', 'L139-T6', 'L139-P1']
required_gates: ["vibelab","tdd"]
affected_paths:
  - assets/characters/linh-dong/
  - assets/audio/sfx/linh-dong/
  - src/domain/character/linh-dong.mjs
  - src/domain/hero/splus-catalog.mjs
  - src/runtime/splus-battle-bridge.js
  - src/ui/splus-encyclopedia.js
  - src/ui/splus-skill-details.css
  - battle.html
  - index.html
  - scripts/pack-linh-dong-rgba.mjs
  - tests/linh-dong-atlas.test.mjs
  - docs/qa/L139-LINH-DONG/
resource_locks: ["linh-dong-atlas"]
branch_hint: work/l139-linh-dong-atlas-20260914
---
# TKT-0139

Owner 14/09: lấy asset Linh Đồng (Drive pack RGBA isolated-pass) tích hợp vào game.
Pack atlas lưới đồng nhất, bind portrait + battle draw + VFX/SFX. Không đổi công thức combat, không đổi cược/loot, không đưa tướng vào roster 12.

## Non-goals

Không đổi BETS 2/10/50, loot. Không đổi splus-mechanics (confusion 50%, silence, spirit mark). Không thêm `linh_dong` vào `OFFICIAL_ROSTER_12_IDS`. Không thay tướng 13 bằng art sinh mới. Không per-frame crop, không key màu đen.

## Acceptance

- L139-T1: `assets/characters/linh-dong/` có idle/run/hit/fall/basic/ultimate + 2 VFX atlas; avatar/card; SFX wav+ogg
- L139-T2: `CHARACTER_MANIFEST.linh_dong` trỏ art thật; roster 12 không gồm `linh_dong`
- L139-T3: `battle.html` có `isLinhDong` + `drawLinhDongHero` + VFX/SFX; bridge S+ gọi atlas thay token chữ
- L139-T4: `hon-viet-skill/v1` basic + skill1 + ultimate; registry nhận `linh-dong.*`
- L139-T5: catalog `hero_splus_linh_dong` art authored; confusion/silence không đổi
- L139-T6: atlas cell đồng nhất theo clip; RGBA alpha; BETS đóng băng
- L139-P1: Chrome — `qaSplus42=hero_splus_linh_dong` vẽ atlas, không ô chữ "Đang thử cơ chế"

## Result

LIVE #133 `6215a85`. Authored RGBA pack 14/09: 8 atlas (idle/run/hit/fall/basic/ultimate + skill1/ult VFX), portrait, ATK/ULT SFX. Battle draw + encyclopedia portrait. Roster 12 đóng. BETS 2/10/50 đóng. Mechanics confusion 50% / silence-all / healDown 0.2 không đổi.
L139-T1…T6 PASS. npm test 944. L139-P1 Chrome 390×844 + 1280×720 PASS. Safari NOT_RUN.
Owner tự `git pull && vercel --prod`.
