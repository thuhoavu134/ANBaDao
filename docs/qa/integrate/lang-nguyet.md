# Integrate lang-nguyet (hero_splus_lang_nguyet) — PASS

- pack: `C:\lt\packs\lang-nguyet\out\lang-nguyet-6state-20261024-000713`
- bundle: `C:\lt\packs\lang-nguyet\bundle.json`
- date: 2026-10-23T17:41:59.341Z

| step | result | time | tail |
|---|---|---|---|
| validate | OK | 1s |   ]<br>} |
| parity-override | OK | 0s | max x4: Idle mang cung phát sáng bán trong suốt: phía video green-screen coi ánh sáng là nền nên bỏ qua, phía atlas đã key thì tính, tỉ lệ lệch x3.5 dù ô pack chỉ nhích 6px/frame. Owner xem GIF idle để duyệt. |
| parity | OK | 3s | idle parity: lang-nguyet-6state-20261024-000713  vs  idle_6---58f48a3a-f8df-4a26-a82a-a41002cd9a5e.mp4  (30 loop frames, scale 0.312994)<br>  left edge    video   12.2px (max 0.9)  atlas   43.0px (max 6.0)  x3.5  ok<br>  right edge   video   13.1px (max 1.9)  atlas    4.0px (max 1.0)  x0.3  ok<br>  body centre  video   10.8px (max 1.4)  atlas   23.5px (max 3.0)  x2.2  ok<br>IDLE PARITY PASS |
| seam | OK | 4s |   step between packed frames: median 1.03, worst 1.56<br>  seam (last -> first): 1.10 = 1.07x median<br>  window: frames 46..125, silhouette IoU 0.9303<br>LOOP SEAM PASS (seam <= 1.6x median) |
| import | OK | 7s | {"slug":"lang-nguyet","body":158,"foot":158.5,"pivot":120,"clips":{"idle":"idle-0-917706d8.webp","run":"run-0-7dd23d41.webp","basic":"basic-0-604d2f65.webp","ultimate":"ultimate-0-8f40c209.webp","hit":"hit-0-9100db8d.webp","fall-die":"fall-die-0-437a24ed.webp"},"detail":"detail-9abaacc2.webp"} |
| vfx | OK | 19s | vfx-basic: vfx-basic-afd0ef7a.webp 300x169 x16 358556B<br>vfx-ultimate: vfx-ultimate-3ef0acb5.webp 360x202 x24 1001906B<br>KEY VFX PASS: 2 atlas -> C:\lt\luc-than-main\assets\vfx\lang-nguyet |
| sfx | OK | 1s | lang-nguyet-basic                 atk_6 0.93s +0.78s<br>lang-nguyet-basic-hit          vfxatk_3 0.16s +1.20s<br>lang-nguyet-ultimate               Ulti 4.11s +0.92s<br>lang-nguyet-ultimate-vfx      vfxulti_3 0.99s +1.60s<br>lang-nguyet-ultimate-hit      vfxulti_3 3.04s +0.60s<br>lang-nguyet-hit                   hit_3 0.98s +0.66s<br>EXTRACT SFX PASS: 6 cues -> C:\lt\luc-than-main\assets\audio\sfx |
| sfx-source | OK | 0s | lang-nguyet-basic          giữ tiếng clip<br>lang-nguyet-basic-hit      giữ tiếng clip<br>lang-nguyet-ultimate       giữ tiếng clip<br>lang-nguyet-ultimate-vfx   giữ tiếng clip<br>lang-nguyet-ultimate-hit   giữ tiếng clip<br>lang-nguyet-hit            giữ tiếng clip<br>lang-nguyet-passive        sb013  ← kho Kiếm Thế<br>sfx-source: 7 cue (6 từ clip, 1 kho, 0 pixabay, 0 thiếu)<br>SFX SOURCE PASS |
| scaffold | OK | 0s | heroJson  skip (exists: re-integration keeps the hand-tuned hero.json)<br>  domain    skip<br>  import    skip<br>  entry     skip<br>  kits      skip<br>  hit       skip<br>  effects   skip<br>  test      skip<br>SCAFFOLD PASS |
| portrait | OK | 1s | lang-nguyet -> assets/characters/lang-nguyet/portrait-c60e9295.webp 103880 bytes |
| build | OK | 232s | [Luc Anh local speed] skip VFX duration |
| test | OK | 323s | baseline 2078/89 (names 89) -> candidate 2153/89 (names 89); new 0, fixed 0<br>TEST GATE PASS |
| battle | OK | 83s | drew hit-0, basic-0, vfx-basic, ultimate-0, vfx-ultimate, fall-die-0, run-0, detail; no JS errors |
| detail | OK | 16s | {"id":"lang_nguyet","card":true,"stageId":"lang_nguyet","canvases":[{"id":"authoredDetailIdle","w":480,"h":440,"vis":true}],"imgs":[{"src":"lang-nguyet/portrait-c60e9295.webp","vis":false}],"live":[{"id":"authoredDetailIdle","opaque":478,"animating":true}]} |
| frames | OK | 16s | lang_nguyet: 30 frames / 3333.333ms (111.1ms per frame, from the page)<br>captured 30/30 frames in 65 polls<br>saved 30 frames (1 per authored frame, 111.1ms each) -> docs/qa/idle-anchor/frames/lang_nguyet |
| evidence | OK | 0s | docs/qa/idle-anchor/detail-lang_nguyet.gif (30 frames, 111ms each = one full loop) |

Evidence: `docs/qa/idle-anchor/detail-lang_nguyet.gif` and `docs/qa/lang-nguyet/battle-*.png` — attach to the PR.

Deliver yourself: branch, commit, `node scripts/tools/verified-push.mjs <origin/main> HEAD <branch>`, open the PR (never push main).
