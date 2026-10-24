# Integrate lang-nguyet (hero_splus_lang_nguyet) — PASS

- pack: `C:\lt\packs\lang-nguyet\out\lang-nguyet-6state-20261024-093801`
- bundle: `C:\lt\packs\lang-nguyet\bundle.json`
- date: 2026-10-24T02:58:57.521Z

| step | result | time | tail |
|---|---|---|---|
| intake | OK | 3s |   vfx-basic    vfxatk_3---bb6965a2-1a2b-486b-a8a0-1f23620a08a3.mp4  1920x1080 24fps 4000ms audio=true<br>  vfx-ultimate vfxulti_3---07215e33-c44f-4252-8282-523d7b9c6e64.mp4  1920x1080 24fps 4000ms audio=true<br>INTAKE PASS: C:\lt\packs\lang-nguyet\manifest.json |
| pack | OK | 544s | }<br>C:\Users\Admin\aicoworker\openclaw\skills\kiemthe-animation-packager\scripts\package_six_states.py:335: DeprecationWarning: Image.Image.getdata is deprecated and will be removed in Pillow 14 (2027-10-15). Use get_flattened_data instead.<br>  column_means = list(strip.resize((strip.width, 1), Image.Resampling.BOX).getdata()) |
| validate | OK | 1s |   ]<br>} |
| parity-override | OK | 0s | max x4: Idle mang cung phát sáng bán trong suốt: mask alpha 200 chỉ thấy phần đặc nên bbox nhảy giữa người và cung (x13), mask 60 thấy đủ cánh cung thì ổn định (x3.5, dưới mức 4). |
| parity | OK | 4s | idle parity: lang-nguyet-6state-20261024-093801  vs  idle_6---58f48a3a-f8df-4a26-a82a-a41002cd9a5e.mp4  (30 loop frames, scale 0.312994)<br>  left edge    video   12.2px (max 0.9)  atlas   43.0px (max 6.0)  x3.5  ok<br>  right edge   video   13.1px (max 1.9)  atlas    4.0px (max 1.0)  x0.3  ok<br>  body centre  video   10.8px (max 1.4)  atlas   23.5px (max 3.0)  x2.2  ok<br>IDLE PARITY PASS |
| seam | OK | 4s |   step between packed frames: median 1.12, worst 1.69<br>  seam (last -> first): 1.19 = 1.06x median<br>  window: frames 46..125, silhouette IoU 0.9303<br>LOOP SEAM PASS (seam <= 1.6x median) |
| import | OK | 8s | {"slug":"lang-nguyet","body":158,"foot":158.5,"pivot":120,"clips":{"idle":"idle-0-d9147be4.webp","run":"run-0-390ceda4.webp","basic":"basic-0-b82f5911.webp","ultimate":"ultimate-0-81d095a7.webp","hit":"hit-0-cdce48cd.webp","fall-die":"fall-die-0-29aa7088.webp"},"detail":"detail-df04e0dd.webp"} |
| vfx | OK | 19s | vfx-basic: vfx-basic-afd0ef7a.webp 300x169 x16 358556B<br>vfx-ultimate: vfx-ultimate-3ef0acb5.webp 360x202 x24 1001906B<br>KEY VFX PASS: 2 atlas -> C:\lt\luc-than-repack\assets\vfx\lang-nguyet |
| sfx | OK | 1s | lang-nguyet-basic                 atk_6 0.93s +0.78s<br>lang-nguyet-basic-hit          vfxatk_3 0.16s +1.20s<br>lang-nguyet-ultimate               Ulti 4.11s +0.92s<br>lang-nguyet-ultimate-vfx      vfxulti_3 0.99s +1.60s<br>lang-nguyet-ultimate-hit      vfxulti_3 3.04s +0.60s<br>lang-nguyet-hit                   hit_3 0.98s +0.66s<br>EXTRACT SFX PASS: 6 cues -> C:\lt\luc-than-repack\assets\audio\s |
| sfx-source | OK | 0s | lang-nguyet-basic          giữ tiếng clip<br>lang-nguyet-basic-hit      giữ tiếng clip<br>lang-nguyet-ultimate       giữ tiếng clip<br>lang-nguyet-ultimate-vfx   giữ tiếng clip<br>lang-nguyet-ultimate-hit   giữ tiếng clip<br>lang-nguyet-hit            giữ tiếng clip<br>lang-nguyet-passive        sb013  ← kho Kiếm Thế<br>sfx-source: 7 cue (6 từ clip, 1 kho, 0 pixabay, 0 thiếu)<br>SFX SOURCE PASS |
| scaffold | OK | 0s | heroJson  skip (exists: re-integration keeps the hand-tuned hero.json)<br>  domain    skip<br>  import    skip<br>  entry     added<br>  kits      skip<br>  hit       skip<br>  effects   skip<br>  test      skip<br>SCAFFOLD PASS |
| portrait | OK | 1s | lang-nguyet -> assets/characters/lang-nguyet/portrait-b1ca6091.webp 111738 bytes |
| landmark | OK | 0s | LANDMARK PASS assets/characters/lang-nguyet/portrait-b1ca6091.webp -> [59,30,13] |
| build | OK | 232s | [Luc Anh local speed] skip VFX duration |
| test | OK | 321s | baseline 2078/89 (names 89) -> candidate 2182/88 (names 88); new 0, fixed 1<br>  fixed:    tests/campaign-scene.test.mjs:102:1#1 :: legacy chapter reward heroes do not enter the official preparation bench<br>TEST GATE PASS |
| battle | OK | 83s | drew hit-0, basic-0, vfx-basic, ultimate-0, vfx-ultimate, fall-die-0, run-0, detail; no JS errors |
| detail | OK | 16s | {"id":"lang_nguyet","card":true,"stageId":"lang_nguyet","canvases":[{"id":"authoredDetailIdle","w":480,"h":440,"vis":true}],"imgs":[{"src":"lang-nguyet/portrait-b1ca6091.webp","vis":false}],"live":[{"id":"authoredDetailIdle","opaque":478,"animating":true}]} |
| frames | OK | 16s | lang_nguyet: 30 frames / 3333.333ms (111.1ms per frame, from the page)<br>captured 30/30 frames in 60 polls<br>saved 30 frames (1 per authored frame, 111.1ms each) -> docs/qa/idle-anchor/frames/lang_nguyet |
| evidence | OK | 0s | docs/qa/idle-anchor/detail-lang_nguyet.gif (30 frames, 111ms each = one full loop) |

Evidence: `docs/qa/idle-anchor/detail-lang_nguyet.gif` and `docs/qa/lang-nguyet/battle-*.png` — attach to the PR.

Deliver yourself: branch, commit, `node scripts/tools/verified-push.mjs <origin/main> HEAD <branch>`, open the PR (never push main).
