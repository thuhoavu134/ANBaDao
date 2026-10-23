# Integrate lang-van (hero_splus_lang_van) — PASS

- pack: `C:\lt\packs\lang-van\out\lang-van-6state-20261023-080750`
- bundle: `C:\lt\packs\lang-van\bundle.json`
- date: 2026-10-23T01:28:52.416Z

| step | result | time | tail |
|---|---|---|---|
| validate | OK | 1s |   ]<br>} |
| parity | OK | 3s | idle parity: lang-van-6state-20261023-080750  vs  idle2tay.mp4  (30 loop frames, scale 0.375215)<br>  left edge    video   59.3px (max 4.5)  atlas   59.0px (max 5.0)  x1.0  ok<br>  right edge   video   16.1px (max 1.5)  atlas   14.0px (max 1.0)  x0.9  ok<br>  body centre  video   35.1px (max 2.3)  atlas   34.5px (max 2.5)  x1.0  ok<br>IDLE PARITY PASS |
| seam | OK | 3s |   step between packed frames: median 3.00, worst 4.41<br>  seam (last -> first): 3.48 = 1.16x median<br>  window: frames 1..81, silhouette IoU 0.9202<br>LOOP SEAM PASS (seam <= 1.6x median) |
| import | OK | 8s | {"slug":"lang-van","body":194,"foot":202.8,"pivot":120,"clips":{"idle":"idle-0-bb6cb621.webp","run":"run-0-b8a10829.webp","basic":"basic-0-c7fe811b.webp","ultimate":"ultimate-0-e0586ce6.webp","hit":"hit-0-bf01213d.webp","fall-die":"fall-die-0-9ef32cf6.webp"},"detail":"detail-56e8b689.webp"} |
| vfx | OK | 0s | skipped (--no-vfx): attack VFX is baked into the state clips |
| sfx | OK | 1s | lang-van-basic                atk_4.mp4 6.36s +1.58s<br>lang-van-ultimate            ulti_3.mp4 4.50s +1.37s<br>lang-van-hit                  hit_2.mp4 0.74s +0.25s<br>WARN basic-hit: no vfx-basic clip<br>WARN ultimate-vfx: no vfx-ultimate clip<br>WARN ultimate-hit: no vfx-ultimate clip<br>EXTRACT SFX PASS: 3 cues -> C:\lt\luc-than-main\assets\audio\sfx\lang-van |
| scaffold | OK | 0s | heroJson  created<br>  domain    created<br>  import    added<br>  entry     added<br>  kits      added<br>  hit       added<br>  effects   added<br>  test      created<br>SCAFFOLD PASS |
| portrait | OK | 1s | lang-van -> assets/characters/lang-van/portrait-43908036.webp 151828 bytes |
| build | OK | 234s | [Luc Anh local speed] skip VFX duration |
| test | OK | 319s | baseline 2078/89 (names 89) -> candidate 2110/89 (names 89); new 0, fixed 0<br>TEST GATE PASS |
| battle | OK | 83s | drew hit-0, basic-0, ultimate-0, fall-die-0; no JS errors |
| detail | OK | 16s | {"id":"lang_van","card":true,"stageId":"lang_van","canvases":[{"id":"authoredDetailIdle","w":480,"h":440,"vis":true}],"imgs":[{"src":"lang-van/portrait-43908036.webp","vis":false}],"live":[{"id":"authoredDetailIdle","opaque":797,"animating":true}]} |
| frames | OK | 16s | lang_van: 30 frames / 3375ms (112.5ms per frame, from the page)<br>captured 30/30 frames in 49 polls<br>saved 30 frames (1 per authored frame, 112.5ms each) -> docs/qa/idle-anchor/frames/lang_van |
| evidence | OK | 0s | docs/qa/idle-anchor/detail-lang_van.gif (30 frames, 113ms each = one full loop) |

Evidence: `docs/qa/idle-anchor/detail-lang_van.gif` and `docs/qa/lang-van/battle-*.png` — attach to the PR.

Deliver yourself: branch, commit, `node scripts/tools/verified-push.mjs <origin/main> HEAD <branch>`, open the PR (never push main).
