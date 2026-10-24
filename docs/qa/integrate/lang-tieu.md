# Integrate lang-tieu (hero_splus_lang_tieu) — PASS

- pack: `C:\lt\packs\lang-tieu\out\lang-tieu-6state-20261024-090504`
- bundle: `C:\lt\packs\lang-tieu\bundle.json`
- date: 2026-10-24T02:35:43.594Z

| step | result | time | tail |
|---|---|---|---|
| validate | OK | 2s |   ]<br>} |
| parity | OK | 4s | idle parity: lang-tieu-6state-20261024-090504  vs  idle_5---b5fb29f8-ebe5-4692-b462-b28d4cf23c74.mp4  (30 loop frames, scale 0.401473)<br>  left edge    video   37.7px (max 7.2)  atlas   32.0px (max 5.0)  x0.8  ok<br>  right edge   video   32.1px (max 2.4)  atlas   30.0px (max 2.0)  x0.9  ok<br>  body centre  video   14.1px (max 2.4)  atlas   13.0px (max 2.0)  x0.9  ok<br>IDLE PARITY PASS |
| seam | OK | 5s |   step between packed frames: median 4.89, worst 10.26<br>  seam (last -> first): 5.11 = 1.04x median<br>  window: frames 8..96, silhouette IoU 0.8983<br>LOOP SEAM PASS (seam <= 1.6x median) |
| import | OK | 12s | {"slug":"lang-tieu","body":202,"foot":208.2,"pivot":128,"clips":{"idle":"idle-0-2c7cb439.webp","run":"run-0-30de9c6d.webp","basic":"basic-0-0691d8be.webp","ultimate":"ultimate-0-b117f690.webp","hit":"hit-0-9598444e.webp","fall-die":"fall-die-0-bd3f2f82.webp"},"detail":"detail-f557ec79.webp"} |
| vfx | OK | 20s | vfx-basic: vfx-basic-52132f6f.webp 300x169 x16 277010B<br>vfx-ultimate: vfx-ultimate-abb99820.webp 360x202 x24 684666B<br>KEY VFX PASS: 2 atlas -> C:\lt\luc-than-repack\assets\vfx\lang-tieu |
| sfx | OK | 1s | lang-tieu-basic                   atk_5 1.59s +0.75s<br>lang-tieu-basic-hit            vfxatk_2 2.59s +1.42s<br>lang-tieu-ultimate               ulti_4 4.76s +1.02s<br>lang-tieu-ultimate-vfx        vfxulti_2 3.95s +0.78s<br>lang-tieu-ultimate-hit        vfxulti_2 4.35s +1.59s<br>lang-tieu-hit                     Hit_4 0.94s +0.98s<br>EXTRACT SFX PASS: 6 cues -> C:\lt\luc-than-repack\assets\audio\s |
| sfx-source | OK | 1s | lang-tieu-basic            giữ tiếng clip<br>lang-tieu-basic-hit        giữ tiếng clip<br>lang-tieu-ultimate         giữ tiếng clip<br>lang-tieu-ultimate-vfx     giữ tiếng clip<br>lang-tieu-ultimate-hit     giữ tiếng clip<br>lang-tieu-hit              giữ tiếng clip<br>lang-tieu-passive          sl_bdmw_c  ← kho Kiếm Thế<br>sfx-source: 7 cue (6 từ clip, 1 kho, 0 pixabay, 0 thiếu)<br>SFX SOURCE PAS |
| scaffold | OK | 0s | heroJson  skip (exists: re-integration keeps the hand-tuned hero.json)<br>  domain    skip<br>  import    skip<br>  entry     added<br>  kits      skip<br>  hit       skip<br>  effects   skip<br>  test      skip<br>SCAFFOLD PASS |
| portrait | OK | 1s | lang-tieu -> assets/characters/lang-tieu/portrait-58e340a1.webp 161300 bytes |
| landmark | OK | 0s | LANDMARK PASS assets/characters/lang-tieu/portrait-58e340a1.webp -> [59,29,12] |
| build | OK | 236s | [Luc Anh local speed] skip VFX duration |
| test | OK | 322s | baseline 2078/89 (names 89) -> candidate 2179/88 (names 88); new 0, fixed 1<br>  fixed:    tests/campaign-scene.test.mjs:102:1#1 :: legacy chapter reward heroes do not enter the official preparation bench<br>TEST GATE PASS |
| battle | OK | 83s | drew hit-0, basic-0, vfx-basic, ultimate-0, vfx-ultimate, run-0, detail; no JS errors |
| detail | OK | 16s | {"id":"lang_tieu","card":true,"stageId":"lang_tieu","canvases":[{"id":"authoredDetailIdle","w":512,"h":440,"vis":true}],"imgs":[{"src":"lang-tieu/portrait-58e340a1.webp","vis":false}],"live":[{"id":"authoredDetailIdle","opaque":838,"animating":true}]} |
| frames | OK | 17s | lang_tieu: 30 frames / 3708.333ms (123.6ms per frame, from the page)<br>captured 30/30 frames in 54 polls<br>saved 30 frames (1 per authored frame, 123.6ms each) -> docs/qa/idle-anchor/frames/lang_tieu |
| evidence | OK | 0s | docs/qa/idle-anchor/detail-lang_tieu.gif (30 frames, 124ms each = one full loop) |

Evidence: `docs/qa/idle-anchor/detail-lang_tieu.gif` and `docs/qa/lang-tieu/battle-*.png` — attach to the PR.

Deliver yourself: branch, commit, `node scripts/tools/verified-push.mjs <origin/main> HEAD <branch>`, open the PR (never push main).
