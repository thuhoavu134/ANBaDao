# Integrate khaos (hero_splus_khaos) — FAIL

- pack: `C:\lt\packs\khaos\out\khaos-6state-20261024-201657`
- bundle: `C:\lt\packs\khaos\bundle.json`
- date: 2026-10-24T13:30:42.796Z

| step | result | time | tail |
|---|---|---|---|
| intake | OK | 2s |   hit          Hitkhao---a0c5d86c-9a71-4cf5-9d73-94bff5d6fcfa.mp4  1920x1080 24fps 4000ms audio=true<br>  fall-die     falldiekhao---e7591059-2a59-443e-9f0f-efbf7b004757.mp4  1920x1080 24fps 4000ms audio=true<br>INTAKE PASS: C:\lt\packs\khaos\manifest.json |
| pack | OK | 568s | }<br>C:\Users\Admin\aicoworker\openclaw\skills\kiemthe-animation-packager\scripts\package_six_states.py:335: DeprecationWarning: Image.Image.getdata is deprecated and will be removed in Pillow 14 (2027-10-15). Use get_flattened_data instead.<br>  column_means = list(strip.resize((strip.width, 1), Image.Resampling.BOX).getdata()) |
| validate | OK | 1s |   ]<br>} |
| parity | OK | 4s | idle parity: khaos-6state-20261024-201657  vs  idlelkhao---a306e58c-50f3-4164-88da-5fa27f209ccf.mp4  (30 loop frames, scale 0.365159)<br>  left edge    video    0.0px (max 0.0)  atlas    0.0px (max 0.0)  x0.0  ok<br>  right edge   video   24.1px (max 3.3)  atlas   10.0px (max 1.0)  x0.4  ok<br>  body centre  video   12.1px (max 1.6)  atlas    5.0px (max 0.5)  x0.4  ok<br>IDLE PARITY PASS |
| seam | OK | 5s |   step between packed frames: median 1.51, worst 2.94<br>  seam (last -> first): 1.19 = 0.78x median<br>  window: frames 15..83, silhouette IoU 0.9126<br>LOOP SEAM PASS (seam <= 1.6x median) |
| import | OK | 11s | {"slug":"khaos","body":151,"foot":197.4,"pivot":144,"clips":{"idle":"idle-0-c603c6d9.webp","run":"run-0-b60fe9f9.webp","basic":"basic-0-6b2ead3d.webp","ultimate":"ultimate-0-01646a28.webp","hit":"hit-0-749b8df7.webp","fall-die":"fall-die-0-b121042f.webp"},"detail":"detail-4fad0460.webp"} |
| vfx | OK | 0s | skipped (--no-vfx): attack VFX is baked into the state clips |
| sfx | OK | 1s | khaos-basic                     atkkhao 1.36s +0.60s<br>khaos-ultimate                 ultikhao 1.89s +1.29s<br>khaos-hit                       Hitkhao 1.18s +0.37s<br>WARN basic-hit: no vfx-basic clip<br>WARN ultimate-vfx: no vfx-ultimate clip<br>WARN ultimate-hit: no vfx-ultimate clip<br>EXTRACT SFX PASS: 3 cues -> C:\lt\luc-than-main\assets\audio\sfx\khaos |
| sfx-source | OK | 1s | khaos-basic                giữ tiếng clip<br>khaos-basic-hit            sb013  ← kho Kiếm Thế<br>khaos-ultimate             giữ tiếng clip<br>khaos-ultimate-vfx         sb014  ← kho Kiếm Thế<br>khaos-ultimate-hit         sb015  ← kho Kiếm Thế<br>khaos-hit                  giữ tiếng clip<br>khaos-passive              sb016  ← kho Kiếm Thế<br>sfx-source: 7 cue (3 từ clip, 4 kho, 0 pixabay, 0 thiếu)< |
| portrait | OK | 1s | khaos -> assets/characters/khaos/portrait-ff001562.webp 164340 bytes |
| landmark | OK | 0s | LANDMARK PASS assets/characters/khaos/portrait-ff001562.webp -> [62,27,11] |
| build | **FAIL** | 234s | Node.js v25.9.0 |

Fix the failing step and re-run the same command.
