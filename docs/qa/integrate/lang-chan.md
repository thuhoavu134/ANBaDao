# Integrate lang-chan (hero_splus_lang_chan) — PASS

- pack: `C:\lt\packs\lang-chan\out\lang-chan-6state-20261024-102320`
- bundle: `C:\lt\packs\lang-chan\bundle.json`
- date: 2026-10-24T03:58:58.666Z

| step | result | time | tail |
|---|---|---|---|
| validate | OK | 1s |   ]<br>} |
| parity-override | OK | 0s | max x12: Vòng bát quái phát sáng dưới chân mờ đi trên 3/30 frame khi tách nền, nên khung bao nhảy ~60px ở đúng 3 frame đó; mép phải và thân nhân vật đứng yên, clip gốc mượt (mép trái 330→382 đều). Lỗi này có từ bản pack đầu (x8.7) chứ không do đổi màu. Cần chỉnh keying giữ phần phát sáng, làm sau. |
| parity | OK | 3s | idle parity: lang-chan-6state-20261024-102320  vs  idle_8---2e5b242a-e9ae-4531-a7cd-fb71c127e12e.mp4  (30 loop frames, scale 0.357964)<br>  left edge    video   40.8px (max 3.2)  atlas  414.0px (max 72.0)  x10.1  ok<br>  right edge   video    0.0px (max 0.0)  atlas    0.0px (max 0.0)  x0.0  ok<br>  body centre  video   20.4px (max 1.6)  atlas  207.0px (max 36.0)  x10.1  ok<br>IDLE PARITY PASS |
| seam | OK | 4s |   step between packed frames: median 1.00, worst 1.43<br>  seam (last -> first): 0.92 = 0.92x median<br>  window: frames 57..120, silhouette IoU 0.9537<br>LOOP SEAM PASS (seam <= 1.6x median) |
| import | OK | 10s | {"slug":"lang-chan","body":183,"foot":193.5,"pivot":120,"clips":{"idle":"idle-0-0204ee30.webp","run":"run-0-d0ab3593.webp","basic":"basic-0-d5648798.webp","ultimate":"ultimate-0-31a4d76d.webp","hit":"hit-0-7b0d9d74.webp","fall-die":"fall-die-0-7cf03191.webp"},"detail":"detail-ebf50e62.webp"} |
| vfx | OK | 21s | vfx-basic: vfx-basic-5c9b527d.webp 300x169 x16 473080B<br>vfx-ultimate: vfx-ultimate-e3fc8d9a.webp 360x202 x24 724036B<br>KEY VFX PASS: 2 atlas -> C:\lt\luc-than-repack\assets\vfx\lang-chan |
| sfx | OK | 1s | lang-chan-basic                   atk_8 3.20s +0.74s<br>lang-chan-basic-hit            vfxatk_5 3.90s +1.23s<br>lang-chan-ultimate               ulti_6 2.03s +1.10s<br>lang-chan-ultimate-vfx        vfxulti_5 0.91s +0.58s<br>lang-chan-ultimate-hit        vfxulti_5 3.19s +1.60s<br>lang-chan-hit                     hit_5 1.24s +0.44s<br>EXTRACT SFX PASS: 6 cues -> C:\lt\luc-than-repack\assets\audio\s |
| sfx-source | OK | 0s | lang-chan-basic            giữ tiếng clip<br>lang-chan-basic-hit        giữ tiếng clip<br>lang-chan-ultimate         giữ tiếng clip<br>lang-chan-ultimate-vfx     giữ tiếng clip<br>lang-chan-ultimate-hit     giữ tiếng clip<br>lang-chan-hit              giữ tiếng clip<br>lang-chan-passive          cy_fjcx_c  ← kho Kiếm Thế<br>sfx-source: 7 cue (6 từ clip, 1 kho, 0 pixabay, 0 thiếu)<br>SFX SOURCE PAS |
| scaffold | OK | 0s | heroJson  skip (exists: re-integration keeps the hand-tuned hero.json)<br>  domain    skip<br>  import    skip<br>  entry     added<br>  kits      skip<br>  hit       skip<br>  effects   skip<br>  test      skip<br>SCAFFOLD PASS |
| portrait | OK | 1s | lang-chan -> assets/characters/lang-chan/portrait-9fd6b6ba.webp 136330 bytes |
| landmark | OK | 0s | LANDMARK PASS assets/characters/lang-chan/portrait-9fd6b6ba.webp -> [67,30,15] |
| build | OK | 235s | [Luc Anh local speed] skip VFX duration |
| test | OK | 321s | baseline 2078/89 (names 89) -> candidate 2188/88 (names 88); new 0, fixed 1<br>  fixed:    tests/campaign-scene.test.mjs:102:1#1 :: legacy chapter reward heroes do not enter the official preparation bench<br>TEST GATE PASS |
| battle | OK | 83s | drew hit-0, basic-0, vfx-basic, ultimate-0, vfx-ultimate, run-0, detail; no JS errors |
| detail | OK | 16s | {"id":"lang_chan","card":true,"stageId":"lang_chan","canvases":[{"id":"authoredDetailIdle","w":480,"h":440,"vis":true}],"imgs":[{"src":"lang-chan/portrait-9fd6b6ba.webp","vis":false}],"live":[{"id":"authoredDetailIdle","opaque":590,"animating":true}]} |
| frames | OK | 16s | lang_chan: 30 frames / 2666.667ms (88.9ms per frame, from the page)<br>captured 30/30 frames in 45 polls<br>saved 30 frames (1 per authored frame, 88.9ms each) -> docs/qa/idle-anchor/frames/lang_chan |
| evidence | OK | 0s | docs/qa/idle-anchor/detail-lang_chan.gif (30 frames, 89ms each = one full loop) |

Evidence: `docs/qa/idle-anchor/detail-lang_chan.gif` and `docs/qa/lang-chan/battle-*.png` — attach to the PR.

Deliver yourself: branch, commit, `node scripts/tools/verified-push.mjs <origin/main> HEAD <branch>`, open the PR (never push main).
