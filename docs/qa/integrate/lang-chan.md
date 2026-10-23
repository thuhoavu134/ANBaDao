# Integrate lang-chan (hero_splus_lang_chan) — PASS

- pack: `C:\lt\packs\lang-chan\out\lang-chan-6state-20261024-050254`
- bundle: `C:\lt\packs\lang-chan\bundle.json`
- date: 2026-10-23T22:36:27.927Z

| step | result | time | tail |
|---|---|---|---|
| validate | OK | 1s |   ]<br>} |
| parity | OK | 3s | idle parity: lang-chan-6state-20261024-050254  vs  idle_8---2e5b242a-e9ae-4531-a7cd-fb71c127e12e.mp4  (30 loop frames, scale 0.357964)<br>  left edge    video   40.8px (max 4.3)  atlas   35.0px (max 9.0)  x0.9  ok<br>  right edge   video    0.0px (max 0.0)  atlas    2.0px (max 1.0)  x200.0  ok<br>  body centre  video   20.4px (max 2.1)  atlas   18.5px (max 4.5)  x0.9  ok<br>IDLE PARITY PASS |
| seam | OK | 4s |   step between packed frames: median 0.94, worst 1.37<br>  seam (last -> first): 1.01 = 1.07x median<br>  window: frames 51..113, silhouette IoU 0.926<br>LOOP SEAM PASS (seam <= 1.6x median) |
| import | OK | 9s | {"slug":"lang-chan","body":183,"foot":193.5,"pivot":120,"clips":{"idle":"idle-0-690b4d54.webp","run":"run-0-5943a030.webp","basic":"basic-0-21b004f5.webp","ultimate":"ultimate-0-cde87fd8.webp","hit":"hit-0-6c9993d7.webp","fall-die":"fall-die-0-a863e068.webp"},"detail":"detail-746fe017.webp"} |
| vfx | OK | 20s | vfx-basic: vfx-basic-5c9b527d.webp 300x169 x16 473080B<br>vfx-ultimate: vfx-ultimate-e3fc8d9a.webp 360x202 x24 724036B<br>KEY VFX PASS: 2 atlas -> C:\lt\luc-than-main\assets\vfx\lang-chan |
| sfx | OK | 1s | lang-chan-basic                   atk_8 3.20s +0.74s<br>lang-chan-basic-hit            vfxatk_5 3.90s +1.23s<br>lang-chan-ultimate               ulti_6 2.03s +1.10s<br>lang-chan-ultimate-vfx        vfxulti_5 0.91s +0.58s<br>lang-chan-ultimate-hit        vfxulti_5 3.19s +1.60s<br>lang-chan-hit                     hit_5 1.24s +0.44s<br>EXTRACT SFX PASS: 6 cues -> C:\lt\luc-than-main\assets\audio\sfx |
| sfx-source | OK | 0s | lang-chan-basic            giữ tiếng clip<br>lang-chan-basic-hit        giữ tiếng clip<br>lang-chan-ultimate         giữ tiếng clip<br>lang-chan-ultimate-vfx     giữ tiếng clip<br>lang-chan-ultimate-hit     giữ tiếng clip<br>lang-chan-hit              giữ tiếng clip<br>lang-chan-passive          cy_fjcx_c  ← kho Kiếm Thế<br>sfx-source: 7 cue (6 từ clip, 1 kho, 0 pixabay, 0 thiếu)<br>SFX SOURCE PAS |
| scaffold | OK | 0s | heroJson  skip (exists: re-integration keeps the hand-tuned hero.json)<br>  domain    skip<br>  import    skip<br>  entry     skip<br>  kits      skip<br>  hit       skip<br>  effects   skip<br>  test      skip<br>SCAFFOLD PASS |
| portrait | OK | 1s | lang-chan -> assets/characters/lang-chan/portrait-590d357d.webp 132476 bytes |
| build | OK | 226s | [Luc Anh local speed] skip VFX duration |
| test | OK | 323s | baseline 2078/89 (names 89) -> candidate 2174/89 (names 89); new 0, fixed 0<br>TEST GATE PASS |
| battle | OK | 83s | drew hit-0, basic-0, vfx-basic, ultimate-0, vfx-ultimate, run-0, detail; no JS errors |
| detail | OK | 16s | {"id":"lang_chan","card":true,"stageId":"lang_chan","canvases":[{"id":"authoredDetailIdle","w":480,"h":440,"vis":true}],"imgs":[{"src":"lang-chan/portrait-590d357d.webp","vis":false}],"live":[{"id":"authoredDetailIdle","opaque":604,"animating":true}]} |
| frames | OK | 16s | lang_chan: 30 frames / 2625ms (87.5ms per frame, from the page)<br>captured 30/30 frames in 43 polls<br>saved 30 frames (1 per authored frame, 87.5ms each) -> docs/qa/idle-anchor/frames/lang_chan |
| evidence | OK | 0s | docs/qa/idle-anchor/detail-lang_chan.gif (30 frames, 88ms each = one full loop) |

Evidence: `docs/qa/idle-anchor/detail-lang_chan.gif` and `docs/qa/lang-chan/battle-*.png` — attach to the PR.

Deliver yourself: branch, commit, `node scripts/tools/verified-push.mjs <origin/main> HEAD <branch>`, open the PR (never push main).
