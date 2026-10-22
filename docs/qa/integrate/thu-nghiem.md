# Integrate thu-nghiem (hero_splus_thu_nghiem) — PASS

- pack: `C:\lt\packs\thu-nghiem\out\thu-nghiem-6state-20261022-184737`
- bundle: `C:\lt\packs\thu-nghiem\bundle.json`
- date: 2026-10-22T13:15:44.325Z

| step | result | time | tail |
|---|---|---|---|
| validate | OK | 1s |   ]<br>} |
| parity | OK | 3s | idle parity: thu-nghiem-6state-20261022-184737  vs  idle_3---d466863e-d002-4cd1-ba32-d193bb330344.mp4  (30 loop frames, scale 0.396004)<br>  left edge    video    9.5px (max 1.2)  atlas   12.0px (max 1.0)  x1.3  ok<br>  right edge   video   13.9px (max 2.4)  atlas   13.0px (max 1.0)  x0.9  ok<br>  body centre  video   10.1px (max 1.6)  atlas   10.5px (max 1.0)  x1.0  ok<br>IDLE PARITY PASS |
| import | OK | 8s | {"slug":"thu-nghiem","body":197,"foot":209.9,"pivot":128,"clips":{"idle":"idle-0-408fe946.webp","run":"run-0-2f05c2ca.webp","basic":"basic-0-a7b7f8ee.webp","ultimate":"ultimate-0-22e02b47.webp","hit":"hit-0-28e31dde.webp","fall-die":"fall-die-0-6227d6ab.webp"},"detail":"detail-89665bcf.webp"} |
| vfx | OK | 19s | vfx-basic: vfx-basic-7eaf34f6.webp 300x169 x16 317402B<br>vfx-ultimate: vfx-ultimate-3f863825.webp 360x202 x24 543416B<br>KEY VFX PASS: 2 atlas -> C:\lt\wt-pipeline\assets\vfx\thu-nghiem |
| sfx | OK | 1s | thu-nghiem-basic                  atk_3 1.80s +0.46s<br>thu-nghiem-basic-hit             vfxatk 2.03s +1.23s<br>thu-nghiem-ultimate                ulti 2.36s +0.88s<br>thu-nghiem-ultimate-vfx         vfxulti 2.27s +1.06s<br>thu-nghiem-ultimate-hit         vfxulti 3.16s +1.60s<br>thu-nghiem-hit                    Hit_3 1.17s +0.39s<br>EXTRACT SFX PASS: 6 cues -> C:\lt\wt-pipeline\assets\audio\sfx\t |
| scaffold | OK | 0s | heroJson  skip (exists: re-integration keeps the hand-tuned hero.json)<br>  domain    skip<br>  import    skip<br>  entry     skip<br>  kits      skip<br>  hit       skip<br>  test      skip<br>SCAFFOLD PASS |
| portrait | OK | 1s | thu-nghiem -> assets/characters/thu-nghiem/portrait-1de8d7fb.webp 166182 bytes |
| build | OK | 235s | [Luc Anh local speed] skip VFX duration |
| battle | OK | 83s | drew hit-0, basic-0, vfx-basic, ultimate-0, vfx-ultimate, run-0, detail; no JS errors |
| detail | OK | 16s | {"id":"thu_nghiem","card":true,"stageId":"thu_nghiem","canvases":[{"id":"authoredDetailIdle","w":512,"h":440,"vis":true}],"imgs":[{"src":"thu-nghiem/portrait-1de8d7fb.webp","vis":false}],"live":[{"id":"authoredDetailIdle","opaque":826,"animating":true}]} |
| frames | OK | 17s | thu_nghiem: 30 frames / 3750ms (125.0ms per frame)<br>captured indices [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29] (runtime clock read)<br>saved 30 frames (1 per authored frame, 125.0ms each) -> docs/qa/idle-anchor/frames/thu_nghiem |
| evidence | OK | 0s | docs/qa/idle-anchor/detail-thu_nghiem.gif (30 frames, 125ms each = one full loop) |

Evidence: `docs/qa/idle-anchor/detail-thu_nghiem.gif` and `docs/qa/thu-nghiem/battle-*.png` — attach to the PR.

Deliver yourself: branch, commit, `node scripts/tools/verified-push.mjs <origin/main> HEAD <branch>`, open the PR (never push main).
