# Integrate lang-tieu (hero_splus_lang_tieu) — PASS

- pack: `C:\lt\packs\lang-tieu\out\lang-tieu-6state-20261023-231649`
- bundle: `C:\lt\packs\lang-tieu\bundle.json`
- date: 2026-10-23T16:54:20.450Z

| step | result | time | tail |
|---|---|---|---|
| validate | OK | 1s |   ]<br>} |
| parity | OK | 3s | idle parity: lang-tieu-6state-20261023-231649  vs  idle_5---b5fb29f8-ebe5-4692-b462-b28d4cf23c74.mp4  (30 loop frames, scale 0.401473)<br>  left edge    video   37.7px (max 7.2)  atlas   32.0px (max 5.0)  x0.8  ok<br>  right edge   video   32.1px (max 2.4)  atlas   30.0px (max 2.0)  x0.9  ok<br>  body centre  video   14.1px (max 2.4)  atlas   13.0px (max 2.0)  x0.9  ok<br>IDLE PARITY PASS |
| seam | OK | 4s |   step between packed frames: median 4.63, worst 9.96<br>  seam (last -> first): 4.90 = 1.06x median<br>  window: frames 8..96, silhouette IoU 0.8983<br>LOOP SEAM PASS (seam <= 1.6x median) |
| import | OK | 9s | {"slug":"lang-tieu","body":202,"foot":208.2,"pivot":128,"clips":{"idle":"idle-0-d87a7f2d.webp","run":"run-0-8687b1bb.webp","basic":"basic-0-af9bcf02.webp","ultimate":"ultimate-0-5062671e.webp","hit":"hit-0-cb0cae68.webp","fall-die":"fall-die-0-8ba9389b.webp"},"detail":"detail-eba81748.webp"} |
| vfx | OK | 21s | vfx-basic: vfx-basic-52132f6f.webp 300x169 x16 277010B<br>vfx-ultimate: vfx-ultimate-abb99820.webp 360x202 x24 684666B<br>KEY VFX PASS: 2 atlas -> C:\lt\luc-than-main\assets\vfx\lang-tieu |
| sfx | OK | 1s | lang-tieu-basic                   atk_5 1.59s +0.75s<br>lang-tieu-basic-hit            vfxatk_2 2.59s +1.42s<br>lang-tieu-ultimate               ulti_4 4.76s +1.02s<br>lang-tieu-ultimate-vfx        vfxulti_2 3.95s +0.78s<br>lang-tieu-ultimate-hit        vfxulti_2 4.35s +1.59s<br>lang-tieu-hit                     Hit_4 0.94s +0.98s<br>EXTRACT SFX PASS: 6 cues -> C:\lt\luc-than-main\assets\audio\sfx |
| sfx-source | OK | 0s | lang-tieu-basic            giữ tiếng clip<br>lang-tieu-basic-hit        giữ tiếng clip<br>lang-tieu-ultimate         giữ tiếng clip<br>lang-tieu-ultimate-vfx     giữ tiếng clip<br>lang-tieu-ultimate-hit     giữ tiếng clip<br>lang-tieu-hit              giữ tiếng clip<br>lang-tieu-passive          sl_bdmw_c  ← kho Kiếm Thế<br>sfx-source: 7 cue (6 từ clip, 1 kho, 0 pixabay, 0 thiếu)<br>SFX SOURCE PAS |
| scaffold | OK | 0s | heroJson  skip (exists: re-integration keeps the hand-tuned hero.json)<br>  domain    skip<br>  import    skip<br>  entry     skip<br>  kits      skip<br>  hit       skip<br>  effects   skip<br>  test      skip<br>SCAFFOLD PASS |
| portrait | OK | 1s | lang-tieu -> assets/characters/lang-tieu/portrait-df50026e.webp 151182 bytes |
| build | OK | 235s | [Luc Anh local speed] skip VFX duration |
| test | OK | 323s | baseline 2078/89 (names 89) -> candidate 2144/89 (names 89); new 0, fixed 0<br>TEST GATE PASS |
| battle | OK | 83s | drew hit-0, basic-0, vfx-basic, ultimate-0, vfx-ultimate, run-0, detail; no JS errors |
| detail | OK | 16s | {"id":"lang_tieu","card":true,"stageId":"lang_tieu","canvases":[{"id":"authoredDetailIdle","w":512,"h":440,"vis":true}],"imgs":[{"src":"lang-tieu/portrait-df50026e.webp","vis":false}],"live":[{"id":"authoredDetailIdle","opaque":838,"animating":true}]} |
| frames | OK | 17s | lang_tieu: 30 frames / 3708.333ms (123.6ms per frame, from the page)<br>captured 30/30 frames in 54 polls<br>saved 30 frames (1 per authored frame, 123.6ms each) -> docs/qa/idle-anchor/frames/lang_tieu |
| evidence | OK | 0s | docs/qa/idle-anchor/detail-lang_tieu.gif (30 frames, 124ms each = one full loop) |

Evidence: `docs/qa/idle-anchor/detail-lang_tieu.gif` and `docs/qa/lang-tieu/battle-*.png` — attach to the PR.

Deliver yourself: branch, commit, `node scripts/tools/verified-push.mjs <origin/main> HEAD <branch>`, open the PR (never push main).
