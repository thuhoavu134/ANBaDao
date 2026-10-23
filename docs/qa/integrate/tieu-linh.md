# Integrate tieu-linh (hero_splus_tieu_linh) — FAIL

- pack: `C:\lt\packs\tieu-linh\out\tieu-linh-6state-20261024-004427`
- bundle: `C:\lt\packs\tieu-linh\bundle.json`
- date: 2026-10-23T18:22:14.496Z

| step | result | time | tail |
|---|---|---|---|
| validate | OK | 2s |   ]<br>} |
| parity | OK | 4s | idle parity: tieu-linh-6state-20261024-004427  vs  idle_7---9d4d7907-9c31-4d8f-9542-e2f3da332a64.mp4  (30 loop frames, scale 0.383128)<br>  left edge    video   71.3px (max 5.7)  atlas   68.0px (max 6.0)  x1.0  ok<br>  right edge   video   59.8px (max 5.7)  atlas   39.0px (max 5.0)  x0.7  ok<br>  body centre  video   47.1px (max 5.7)  atlas   45.5px (max 5.5)  x1.0  ok<br>IDLE PARITY PASS |
| seam | OK | 4s |   step between packed frames: median 4.39, worst 6.12<br>  seam (last -> first): 3.55 = 0.81x median<br>  window: frames 23..129, silhouette IoU 0.8654<br>LOOP SEAM PASS (seam <= 1.6x median) |
| import | OK | 11s | {"slug":"tieu-linh","body":202,"foot":207.1,"pivot":132,"clips":{"idle":"idle-0-4aecc86a.webp","run":"run-0-9c76226f.webp","basic":"basic-0-af73caa5.webp","ultimate":"ultimate-0-2064c90e.webp","hit":"hit-0-e9f07088.webp","fall-die":"fall-die-0-d1eadd24.webp"},"detail":"detail-18f5cdea.webp"} |
| vfx | OK | 21s | vfx-basic: vfx-basic-444629dd.webp 300x169 x16 259124B<br>vfx-ultimate: vfx-ultimate-0d737d0d.webp 360x202 x24 775720B<br>KEY VFX PASS: 2 atlas -> C:\lt\luc-than-main\assets\vfx\tieu-linh |
| sfx | OK | 1s | tieu-linh-basic                   atk_7 1.44s +0.25s<br>tieu-linh-basic-hit            vfxatk_4 2.06s +0.85s<br>tieu-linh-ultimate               ulti_5 2.74s +1.51s<br>tieu-linh-ultimate-vfx        vfxulti_4 0.34s +0.56s<br>tieu-linh-ultimate-hit        vfxulti_4 1.08s +0.99s<br>tieu-linh-hit                     hit_4 1.12s +1.22s<br>EXTRACT SFX PASS: 6 cues -> C:\lt\luc-than-main\assets\audio\sfx |
| sfx-source | OK | 0s | tieu-linh-basic            giữ tiếng clip<br>tieu-linh-basic-hit        giữ tiếng clip<br>tieu-linh-ultimate         giữ tiếng clip<br>tieu-linh-ultimate-vfx     giữ tiếng clip<br>tieu-linh-ultimate-hit     giữ tiếng clip<br>tieu-linh-hit              giữ tiếng clip<br>tieu-linh-passive          sb013  ← kho Kiếm Thế<br>sfx-source: 7 cue (6 từ clip, 1 kho, 0 pixabay, 0 thiếu)<br>SFX SOURCE PASS |
| scaffold | OK | 0s | heroJson  skip (exists: re-integration keeps the hand-tuned hero.json)<br>  domain    skip<br>  import    skip<br>  entry     skip<br>  kits      skip<br>  hit       skip<br>  effects   skip<br>  test      skip<br>SCAFFOLD PASS |
| portrait | OK | 1s | tieu-linh -> assets/characters/tieu-linh/portrait-025e4a34.webp 180182 bytes |
| build | OK | 234s | [Luc Anh local speed] skip VFX duration |
| test | OK | 323s | baseline 2078/89 (names 89) -> candidate 2163/89 (names 89); new 0, fixed 0<br>TEST GATE PASS |
| battle | OK | 83s | drew hit-0, basic-0, vfx-basic, ultimate-0, vfx-ultimate, run-0, detail; no JS errors |
| detail | **FAIL** | 13s | no animating idle canvas on the hero-detail screen: {"id":"tieu_linh","card":false} |

Fix the failing step and re-run the same command.
