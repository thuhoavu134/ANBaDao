# Integrate lang-van (hero_splus_lang_van) — PASS

- pack: `C:\lt\packs\lang-van\out\lang-van-6state-20261024-084005`
- bundle: `C:\lt\packs\lang-van\bundle.json`
- date: 2026-10-24T02:03:41.220Z

| step | result | time | tail |
|---|---|---|---|
| intake | OK | 2s |   atk          atk_4.mp4  1920x1080 24fps 8000ms audio=true<br>  ultimate     ulti_3.mp4  1920x1080 24fps 6000ms audio=true<br>INTAKE PASS: C:\lt\packs\lang-van\manifest.json |
| pack | OK | 730s | }<br>C:\Users\Admin\aicoworker\openclaw\skills\kiemthe-animation-packager\scripts\package_six_states.py:335: DeprecationWarning: Image.Image.getdata is deprecated and will be removed in Pillow 14 (2027-10-15). Use get_flattened_data instead.<br>  column_means = list(strip.resize((strip.width, 1), Image.Resampling.BOX).getdata()) |
| validate | OK | 1s |   ]<br>} |
| parity | OK | 3s | idle parity: lang-van-6state-20261024-084005  vs  idle2tay.mp4  (30 loop frames, scale 0.375215)<br>  left edge    video   64.2px (max 4.5)  atlas   58.0px (max 5.0)  x0.9  ok<br>  right edge   video   15.8px (max 1.1)  atlas   15.0px (max 1.0)  x1.0  ok<br>  body centre  video   36.6px (max 2.3)  atlas   33.5px (max 2.5)  x0.9  ok<br>IDLE PARITY PASS |
| seam | OK | 4s |   step between packed frames: median 3.74, worst 5.04<br>  seam (last -> first): 2.34 = 0.63x median<br>  window: frames 16..96, silhouette IoU 0.8887<br>LOOP SEAM PASS (seam <= 1.6x median) |
| import | OK | 9s | {"slug":"lang-van","body":194,"foot":202.8,"pivot":120,"clips":{"idle":"idle-0-c0f73d47.webp","run":"run-0-f6081403.webp","basic":"basic-0-c5cc0035.webp","ultimate":"ultimate-0-110bb440.webp","hit":"hit-0-2b086161.webp","fall-die":"fall-die-0-4141aab8.webp"},"detail":"detail-6bfedffb.webp"} |
| vfx | OK | 0s | skipped (--no-vfx): attack VFX is baked into the state clips |
| sfx | OK | 1s | lang-van-basic                atk_4.mp4 6.36s +1.58s<br>lang-van-ultimate            ulti_3.mp4 4.50s +1.37s<br>lang-van-hit                  hit_2.mp4 0.74s +0.25s<br>WARN basic-hit: no vfx-basic clip<br>WARN ultimate-vfx: no vfx-ultimate clip<br>WARN ultimate-hit: no vfx-ultimate clip<br>EXTRACT SFX PASS: 3 cues -> C:\lt\luc-than-repack\assets\audio\sfx\lang-van |
| sfx-source | OK | 1s | lang-van-basic             giữ tiếng clip<br>lang-van-basic-hit         sb013  ← kho Kiếm Thế<br>lang-van-ultimate          giữ tiếng clip<br>lang-van-ultimate-vfx      sb014  ← kho Kiếm Thế<br>lang-van-ultimate-hit      sb015  ← kho Kiếm Thế<br>lang-van-hit               giữ tiếng clip<br>lang-van-passive           sb016  ← kho Kiếm Thế<br>sfx-source: 7 cue (3 từ clip, 4 kho, 0 pixabay, 0 thiếu)< |
| portrait | OK | 1s | lang-van -> assets/characters/lang-van/portrait-b7fb2728.webp 157344 bytes |
| build | OK | 237s | [Luc Anh local speed] skip VFX duration |
| test | OK | 306s | baseline 2078/89 (names 89) -> candidate 2175/88 (names 88); new 0, fixed 1<br>  fixed:    tests/campaign-scene.test.mjs:102:1#1 :: legacy chapter reward heroes do not enter the official preparation bench<br>TEST GATE PASS |
| battle | OK | 83s | drew hit-0, basic-0, ultimate-0, run-0, detail; no JS errors |
| detail | OK | 16s | {"id":"lang_van","card":true,"stageId":"lang_van","canvases":[{"id":"authoredDetailIdle","w":480,"h":440,"vis":true}],"imgs":[{"src":"lang-van/portrait-b7fb2728.webp","vis":false}],"live":[{"id":"authoredDetailIdle","opaque":796,"animating":true}]} |
| frames | OK | 16s | lang_van: 30 frames / 3375ms (112.5ms per frame, from the page)<br>captured 30/30 frames in 56 polls<br>saved 30 frames (1 per authored frame, 112.5ms each) -> docs/qa/idle-anchor/frames/lang_van |
| evidence | OK | 0s | docs/qa/idle-anchor/detail-lang_van.gif (30 frames, 113ms each = one full loop) |

Evidence: `docs/qa/idle-anchor/detail-lang_van.gif` and `docs/qa/lang-van/battle-*.png` — attach to the PR.

Deliver yourself: branch, commit, `node scripts/tools/verified-push.mjs <origin/main> HEAD <branch>`, open the PR (never push main).
