# Integrate tinh-mac (hero_splus_tinh_mac) — PASS

- pack: `C:\lt\packs\tinh-mac\out\tinh-mac-6state-20261024-195632`
- bundle: `C:\lt\packs\tinh-mac\bundle.json`
- date: 2026-10-24T13:16:52.864Z

| step | result | time | tail |
|---|---|---|---|
| intake | OK | 2s |   hit          Hit_3---5c8d9bca-f9c7-46f5-b942-779fc8886fd6.mp4  1920x1080 24fps 4000ms audio=true<br>  fall-die     falldie_2---39630ec7-1550-45f1-9627-7d4663fc2e24.mp4  1920x1080 24fps 4000ms audio=true<br>INTAKE PASS: C:\lt\packs\tinh-mac\manifest.json |
| pack | OK | 522s | }<br>C:\Users\Admin\aicoworker\openclaw\skills\kiemthe-animation-packager\scripts\package_six_states.py:335: DeprecationWarning: Image.Image.getdata is deprecated and will be removed in Pillow 14 (2027-10-15). Use get_flattened_data instead.<br>  column_means = list(strip.resize((strip.width, 1), Image.Resampling.BOX).getdata()) |
| validate | OK | 1s |   ]<br>} |
| parity | OK | 3s | idle parity: tinh-mac-6state-20261024-195632  vs  idle_3---d466863e-d002-4cd1-ba32-d193bb330344.mp4  (30 loop frames, scale 0.396004)<br>  left edge    video   16.6px (max 1.2)  atlas   12.0px (max 2.0)  x0.7  ok<br>  right edge   video   16.6px (max 1.2)  atlas   15.0px (max 3.0)  x0.9  ok<br>  body centre  video   14.3px (max 1.2)  atlas    9.5px (max 1.0)  x0.7  ok<br>IDLE PARITY PASS |
| seam | OK | 5s |   step between packed frames: median 3.19, worst 5.41<br>  seam (last -> first): 1.38 = 0.43x median<br>  window: frames 14..84, silhouette IoU 0.913<br>LOOP SEAM PASS (seam <= 1.6x median) |
| import | OK | 10s | {"slug":"tinh-mac","body":197,"foot":209.9,"pivot":128,"clips":{"idle":"idle-0-9c512549.webp","run":"run-0-c0d19d72.webp","basic":"basic-0-39a93c7f.webp","ultimate":"ultimate-0-add4844c.webp","hit":"hit-0-8511e10a.webp","fall-die":"fall-die-0-3a986c3f.webp"},"detail":"detail-1aaafc8c.webp"} |
| vfx | OK | 0s | skipped (--no-vfx): attack VFX is baked into the state clips |
| sfx | OK | 1s | tinh-mac-basic                    atk_3 1.80s +0.46s<br>tinh-mac-ultimate                  ulti 2.36s +0.88s<br>tinh-mac-hit                      Hit_3 1.17s +0.39s<br>WARN basic-hit: no vfx-basic clip<br>WARN ultimate-vfx: no vfx-ultimate clip<br>WARN ultimate-hit: no vfx-ultimate clip<br>EXTRACT SFX PASS: 3 cues -> C:\lt\luc-than-main\assets\audio\sfx\tinh-mac |
| sfx-source | OK | 1s | tinh-mac-basic             giữ tiếng clip<br>tinh-mac-basic-hit         sb013  ← kho Kiếm Thế<br>tinh-mac-ultimate          giữ tiếng clip<br>tinh-mac-ultimate-vfx      sb014  ← kho Kiếm Thế<br>tinh-mac-ultimate-hit      sb015  ← kho Kiếm Thế<br>tinh-mac-hit               giữ tiếng clip<br>tinh-mac-passive           sb016  ← kho Kiếm Thế<br>sfx-source: 7 cue (3 từ clip, 4 kho, 0 pixabay, 0 thiếu)< |
| portrait | OK | 1s | tinh-mac -> assets/characters/tinh-mac/portrait-6bf9e439.webp 171724 bytes |
| landmark | OK | 0s | LANDMARK PASS assets/characters/tinh-mac/portrait-6bf9e439.webp -> [54,30,11] |
| build | OK | 233s | [Luc Anh local speed] skip VFX duration |
| test | OK | 321s | baseline 2078/89 (names 89) -> candidate 2188/88 (names 88); new 0, fixed 1<br>  fixed:    tests/campaign-scene.test.mjs:102:1#1 :: legacy chapter reward heroes do not enter the official preparation bench<br>TEST GATE PASS |
| battle | OK | 83s | drew hit-0, basic-0, vfx-basic, ultimate-0, vfx-ultimate, run-0, detail; no JS errors |
| detail | OK | 16s | {"id":"tinh_mac","card":true,"stageId":"tinh_mac","canvases":[{"id":"authoredDetailIdle","w":512,"h":440,"vis":true}],"imgs":[{"src":"tinh-mac/portrait-6bf9e439.webp","vis":false}],"live":[{"id":"authoredDetailIdle","opaque":812,"animating":true}]} |
| frames | OK | 17s | tinh_mac: 30 frames / 2958.333ms (98.6ms per frame, from the page)<br>captured 30/30 frames in 45 polls<br>saved 30 frames (1 per authored frame, 98.6ms each) -> docs/qa/idle-anchor/frames/tinh_mac |
| evidence | OK | 0s | docs/qa/idle-anchor/detail-tinh_mac.gif (30 frames, 99ms each = one full loop) |

Evidence: `docs/qa/idle-anchor/detail-tinh_mac.gif` and `docs/qa/tinh-mac/battle-*.png` — attach to the PR.

Deliver yourself: branch, commit, `node scripts/tools/verified-push.mjs <origin/main> HEAD <branch>`, open the PR (never push main).
