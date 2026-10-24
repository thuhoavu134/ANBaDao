# Integrate tieu-linh (hero_splus_tieu_linh) — PASS

- pack: `C:\lt\packs\tieu-linh\out\tieu-linh-6state-20261024-095905`
- bundle: `C:\lt\packs\tieu-linh\bundle.json`
- date: 2026-10-24T03:23:13.567Z

| step | result | time | tail |
|---|---|---|---|
| intake | OK | 3s |   vfx-basic    vfxatk_4---375e0bb2-3ded-47e0-acfe-84b7a300bc8f.mp4  1920x1080 24fps 4000ms audio=true<br>  vfx-ultimate vfxulti_4---7f9ec8b6-9cee-42e5-9aad-712613810904.mp4  1920x1080 24fps 6000ms audio=true<br>INTAKE PASS: C:\lt\packs\tieu-linh\manifest.json |
| pack | OK | 723s | }<br>C:\Users\Admin\aicoworker\openclaw\skills\kiemthe-animation-packager\scripts\package_six_states.py:335: DeprecationWarning: Image.Image.getdata is deprecated and will be removed in Pillow 14 (2027-10-15). Use get_flattened_data instead.<br>  column_means = list(strip.resize((strip.width, 1), Image.Resampling.BOX).getdata()) |
| validate | OK | 2s |   ]<br>} |
| parity | OK | 4s | idle parity: tieu-linh-6state-20261024-095905  vs  idle_7---9d4d7907-9c31-4d8f-9542-e2f3da332a64.mp4  (30 loop frames, scale 0.383128)<br>  left edge    video   71.3px (max 5.7)  atlas   92.0px (max 12.0)  x1.3  ok<br>  right edge   video   59.8px (max 5.7)  atlas   62.0px (max 15.0)  x1.0  ok<br>  body centre  video   47.1px (max 5.7)  atlas   56.0px (max 9.0)  x1.2  ok<br>IDLE PARITY PASS |
| seam | OK | 5s |   step between packed frames: median 4.94, worst 6.82<br>  seam (last -> first): 4.00 = 0.81x median<br>  window: frames 23..129, silhouette IoU 0.8654<br>LOOP SEAM PASS (seam <= 1.6x median) |
| import | OK | 13s | {"slug":"tieu-linh","body":202,"foot":207.1,"pivot":132,"clips":{"idle":"idle-0-5fe4001f.webp","run":"run-0-08b67114.webp","basic":"basic-0-fd2674e0.webp","ultimate":"ultimate-0-4073820c.webp","hit":"hit-0-dfbd8c86.webp","fall-die":"fall-die-0-a283ae53.webp"},"detail":"detail-63e61cb6.webp"} |
| vfx | OK | 20s | vfx-basic: vfx-basic-444629dd.webp 300x169 x16 259124B<br>vfx-ultimate: vfx-ultimate-0d737d0d.webp 360x202 x24 775720B<br>KEY VFX PASS: 2 atlas -> C:\lt\luc-than-repack\assets\vfx\tieu-linh |
| sfx | OK | 1s | tieu-linh-basic                   atk_7 1.44s +0.25s<br>tieu-linh-basic-hit            vfxatk_4 2.06s +0.85s<br>tieu-linh-ultimate               ulti_5 2.74s +1.51s<br>tieu-linh-ultimate-vfx        vfxulti_4 0.34s +0.56s<br>tieu-linh-ultimate-hit        vfxulti_4 1.08s +0.99s<br>tieu-linh-hit                     hit_4 1.12s +1.22s<br>EXTRACT SFX PASS: 6 cues -> C:\lt\luc-than-repack\assets\audio\s |
| sfx-source | OK | 1s | tieu-linh-basic            giữ tiếng clip<br>tieu-linh-basic-hit        giữ tiếng clip<br>tieu-linh-ultimate         giữ tiếng clip<br>tieu-linh-ultimate-vfx     giữ tiếng clip<br>tieu-linh-ultimate-hit     giữ tiếng clip<br>tieu-linh-hit              giữ tiếng clip<br>tieu-linh-passive          sb013  ← kho Kiếm Thế<br>sfx-source: 7 cue (6 từ clip, 1 kho, 0 pixabay, 0 thiếu)<br>SFX SOURCE PASS |
| scaffold | OK | 0s | heroJson  skip (exists: re-integration keeps the hand-tuned hero.json)<br>  domain    skip<br>  import    skip<br>  entry     added<br>  kits      skip<br>  hit       skip<br>  effects   skip<br>  test      skip<br>SCAFFOLD PASS |
| portrait | OK | 1s | tieu-linh -> assets/characters/tieu-linh/portrait-5e51851b.webp 189948 bytes |
| landmark | OK | 0s | LANDMARK PASS assets/characters/tieu-linh/portrait-5e51851b.webp -> [60,31,10] |
| build | OK | 233s | [Luc Anh local speed] skip VFX duration |
| test | OK | 323s | baseline 2078/89 (names 89) -> candidate 2185/88 (names 88); new 0, fixed 1<br>  fixed:    tests/campaign-scene.test.mjs:102:1#1 :: legacy chapter reward heroes do not enter the official preparation bench<br>TEST GATE PASS |
| battle | OK | 83s | drew hit-0, basic-0, vfx-basic, ultimate-0, vfx-ultimate, run-0, detail; no JS errors |
| detail | OK | 16s | {"id":"tieu_linh","card":true,"stageId":"tieu_linh","canvases":[{"id":"authoredDetailIdle","w":528,"h":440,"vis":true}],"imgs":[{"src":"tieu-linh/portrait-5e51851b.webp","vis":false}],"live":[{"id":"authoredDetailIdle","opaque":872,"animating":true}]} |
| frames | OK | 18s | tieu_linh: 30 frames / 4458.333ms (148.6ms per frame, from the page)<br>captured 30/30 frames in 59 polls<br>saved 30 frames (1 per authored frame, 148.6ms each) -> docs/qa/idle-anchor/frames/tieu_linh |
| evidence | OK | 0s | docs/qa/idle-anchor/detail-tieu_linh.gif (30 frames, 149ms each = one full loop) |

Evidence: `docs/qa/idle-anchor/detail-tieu_linh.gif` and `docs/qa/tieu-linh/battle-*.png` — attach to the PR.

Deliver yourself: branch, commit, `node scripts/tools/verified-push.mjs <origin/main> HEAD <branch>`, open the PR (never push main).
