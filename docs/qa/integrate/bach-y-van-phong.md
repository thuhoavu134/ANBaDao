# Integrate bach-y-van-phong (hero_splus_van_phong) — PASS

- pack: `C:\lt\packs\bach-y-van-phong\out\bach-y-van-phong-6state-20261024-193742`
- bundle: `C:\lt\packs\bach-y-van-phong\bundle.json`
- date: 2026-10-24T12:56:22.615Z

| step | result | time | tail |
|---|---|---|---|
| intake | OK | 3s |   vfx-basic    vfxatk6---3d7c315d-2429-45ac-b8f2-fb648549fe4a.mp4  1920x1080 24fps 4000ms audio=true<br>  vfx-ultimate vfxulti6---20dc6796-0968-44c6-abfa-2c16c9f95f58.mp4  1920x1080 24fps 6000ms audio=true<br>INTAKE PASS: C:\lt\packs\bach-y-van-phong\manifest.json |
| pack | OK | 408s | }<br>C:\Users\Admin\aicoworker\openclaw\skills\kiemthe-animation-packager\scripts\package_six_states.py:335: DeprecationWarning: Image.Image.getdata is deprecated and will be removed in Pillow 14 (2027-10-15). Use get_flattened_data instead.<br>  column_means = list(strip.resize((strip.width, 1), Image.Resampling.BOX).getdata()) |
| validate | OK | 1s |   ]<br>} |
| parity | OK | 3s | idle parity: bach-y-van-phong-6state-20261024-193742  vs  idle6---1542da2b-d3ec-4db1-be1d-4ee3c485fb9f.mp4  (30 loop frames, scale 0.42998)<br>  left edge    video   79.1px (max 6.0)  atlas   81.0px (max 6.0)  x1.0  ok<br>  right edge   video   39.6px (max 3.4)  atlas   41.0px (max 3.0)  x1.0  ok<br>  body centre  video   50.7px (max 3.4)  atlas   47.0px (max 3.0)  x0.9  ok<br>IDLE PARITY PASS |
| seam | OK | 4s |   step between packed frames: median 2.83, worst 4.07<br>  seam (last -> first): 2.65 = 0.94x median<br>  window: frames 29..88, silhouette IoU 0.9789<br>LOOP SEAM PASS (seam <= 1.6x median) |
| import | OK | 8s | {"slug":"bach-y-van-phong","body":178,"foot":182.5,"pivot":120,"clips":{"idle":"idle-0-aced9b77.webp","run":"run-0-42006783.webp","basic":"basic-0-97f30d88.webp","ultimate":"ultimate-0-1bb3809f.webp","hit":"hit-0-65194fc4.webp","fall-die":"fall-die-0-cf958ec7.webp"},"detail":"detail-dc629c44.webp"} |
| vfx | OK | 20s | vfx-basic: vfx-basic-72130a11.webp 300x161 x16 268566B<br>vfx-ultimate: vfx-ultimate-a4567e2f.webp 360x202 x24 859308B<br>KEY VFX PASS: 2 atlas -> C:\lt\luc-than-main\assets\vfx\bach-y-van-phong |
| sfx | OK | 1s | van-phong-basic                    Atk6 1.90s +0.25s<br>van-phong-basic-hit             vfxatk6 0.97s +0.95s<br>van-phong-ultimate                ulti6 1.73s +0.51s<br>van-phong-ultimate-vfx         vfxulti6 1.04s +1.49s<br>van-phong-ultimate-hit         vfxulti6 3.95s +1.60s<br>van-phong-hit                      hit6 1.35s +0.31s<br>EXTRACT SFX PASS: 6 cues -> C:\lt\luc-than-main\assets\audio\sfx |
| sfx-source | OK | 0s | van-phong-basic            giữ tiếng clip<br>van-phong-basic-hit        giữ tiếng clip<br>van-phong-ultimate         giữ tiếng clip<br>van-phong-ultimate-vfx     giữ tiếng clip<br>van-phong-ultimate-hit     giữ tiếng clip<br>van-phong-hit              giữ tiếng clip<br>van-phong-passive          sb013  ← kho Kiếm Thế<br>sfx-source: 7 cue (6 từ clip, 1 kho, 0 pixabay, 0 thiếu)<br>SFX SOURCE PASS |
| portrait | OK | 1s | bach-y-van-phong -> assets/characters/bach-y-van-phong/portrait-4540d1ff.webp 96356 bytes |
| landmark | OK | 0s | LANDMARK PASS assets/characters/bach-y-van-phong/portrait-4540d1ff.webp -> [50,21,15] |
| build | OK | 235s | [Luc Anh local speed] skip VFX duration |
| test | OK | 321s | baseline 2078/89 (names 89) -> candidate 2188/88 (names 88); new 0, fixed 1<br>  fixed:    tests/campaign-scene.test.mjs:102:1#1 :: legacy chapter reward heroes do not enter the official preparation bench<br>TEST GATE PASS |
| battle | OK | 83s | drew hit-0, basic-0, vfx-basic, ultimate-0, vfx-ultimate, run-0, detail; no JS errors |
| detail | OK | 16s | {"id":"van_phong","card":true,"stageId":"van_phong","canvases":[{"id":"authoredDetailIdle","w":480,"h":440,"vis":true}],"imgs":[{"src":"bach-y-van-phong/portrait-4540d1ff.webp","vis":false}],"live":[{"id":"authoredDetailIdle","opaque":543,"animating":true}]} |
| frames | OK | 16s | van_phong: 30 frames / 2500ms (83.3ms per frame, from the page)<br>captured 30/30 frames in 49 polls<br>saved 30 frames (1 per authored frame, 83.3ms each) -> docs/qa/idle-anchor/frames/van_phong |
| evidence | OK | 0s | docs/qa/idle-anchor/detail-van_phong.gif (30 frames, 83ms each = one full loop) |

Evidence: `docs/qa/idle-anchor/detail-van_phong.gif` and `docs/qa/bach-y-van-phong/battle-*.png` — attach to the PR.

Deliver yourself: branch, commit, `node scripts/tools/verified-push.mjs <origin/main> HEAD <branch>`, open the PR (never push main).
