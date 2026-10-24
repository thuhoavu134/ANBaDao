# Integrate nguyet-diep (hero_splus_nguyet_diep) — FAIL

- pack: `C:\lt\packs\nguyet-diep\out\nguyet-diep-6state-20261024-203903`
- bundle: `C:\lt\packs\nguyet-diep\bundle.json`
- date: 2026-10-24T13:51:12.257Z

| step | result | time | tail |
|---|---|---|---|
| intake | OK | 2s |   hit          hit7---37588bae-49af-4755-b0bb-1b03772deb2d.mp4  1920x1080 24fps 4000ms audio=true<br>  fall-die     fall7---ab1a37fc-a13d-452a-a936-322d3064385b.mp4  1920x1080 24fps 4000ms audio=true<br>INTAKE PASS: C:\lt\packs\nguyet-diep\manifest.json |
| pack | OK | 473s | }<br>C:\Users\Admin\aicoworker\openclaw\skills\kiemthe-animation-packager\scripts\package_six_states.py:335: DeprecationWarning: Image.Image.getdata is deprecated and will be removed in Pillow 14 (2027-10-15). Use get_flattened_data instead.<br>  column_means = list(strip.resize((strip.width, 1), Image.Resampling.BOX).getdata()) |
| validate | OK | 1s |   ]<br>} |
| parity | OK | 3s | idle parity: nguyet-diep-6state-20261024-203903  vs  idlenguyetdiep---d08f4763-2d53-4199-9e18-f6f82b951b68.mp4  (30 loop frames, scale 0.401843)<br>  left edge    video   40.2px (max 3.2)  atlas   38.0px (max 3.0)  x0.9  ok<br>  right edge   video   42.6px (max 3.2)  atlas   56.0px (max 6.0)  x1.3  ok<br>  body centre  video   15.7px (max 1.6)  atlas   22.0px (max 4.0)  x1.4  ok<br>IDLE PARITY PAS |
| seam | OK | 4s |   step between packed frames: median 2.16, worst 3.04<br>  seam (last -> first): 2.44 = 1.13x median<br>  window: frames 13..71, silhouette IoU 0.9202<br>LOOP SEAM PASS (seam <= 1.6x median) |
| import | OK | 10s | {"slug":"nguyet-diep","body":186,"foot":203.3,"pivot":120,"clips":{"idle":"idle-0-de43e47c.webp","run":"run-0-45239080.webp","basic":"basic-0-2b4e6926.webp","ultimate":"ultimate-0-57754107.webp","hit":"hit-0-d808342f.webp","fall-die":"fall-die-0-19dfa456.webp"},"detail":"detail-191046f4.webp"} |
| vfx | OK | 0s | skipped (--no-vfx): attack VFX is baked into the state clips |
| sfx | OK | 1s | nguyet-diep-basic                  atk7 2.68s +0.97s<br>nguyet-diep-ultimate              Ulti7 2.61s +0.81s<br>nguyet-diep-hit                    hit7 1.31s +0.25s<br>WARN basic-hit: no vfx-basic clip<br>WARN ultimate-vfx: no vfx-ultimate clip<br>WARN ultimate-hit: no vfx-ultimate clip<br>EXTRACT SFX PASS: 3 cues -> C:\lt\luc-than-main\assets\audio\sfx\nguyet-diep |
| sfx-source | OK | 1s | nguyet-diep-basic          giữ tiếng clip<br>nguyet-diep-basic-hit      sb013  ← kho Kiếm Thế<br>nguyet-diep-ultimate       giữ tiếng clip<br>nguyet-diep-ultimate-vfx   sb014  ← kho Kiếm Thế<br>nguyet-diep-ultimate-hit   sb015  ← kho Kiếm Thế<br>nguyet-diep-hit            giữ tiếng clip<br>nguyet-diep-passive        sb016  ← kho Kiếm Thế<br>sfx-source: 7 cue (3 từ clip, 4 kho, 0 pixabay, 0 thiếu)< |
| portrait | OK | 1s | nguyet-diep -> assets/characters/nguyet-diep/portrait-468de591.webp 124904 bytes |
| landmark | OK | 0s | LANDMARK PASS assets/characters/nguyet-diep/portrait-468de591.webp -> [63,24,14] |
| build | **FAIL** | 234s | Node.js v25.9.0 |

Fix the failing step and re-run the same command.
