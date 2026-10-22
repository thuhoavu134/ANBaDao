# Integrate bach-y-van-phong (hero_splus_van_phong) — PASS

- pack: `C:\lt\pack-van-phong\out\bach-y-van-phong-6state-idlelock-pre-20261022-160933`
- date: 2026-10-22T09:19:08.490Z

| step | result | time | tail |
|---|---|---|---|
| pack | OK | 300s | }<br>C:\lt\tmp\packager-precellw\package_six_states.py:223: DeprecationWarning: Image.Image.getdata is deprecated and will be removed in Pillow 14 (2027-10-15). Use get_flattened_data instead.<br>  column_means = list(strip.resize((strip.width, 1), Image.Resampling.BOX).getdata()) |
| validate | OK | 1s |   ]<br>} |
| parity | OK | 3s | idle parity: bach-y-van-phong-6state-idlelock-pre-20261022-160933  vs  idle6---1542da2b-d3ec-4db1-be1d-4ee3c485fb9f.mp4  (30 loop frames, scale 0.34329)<br>  left edge    video   63.9px (max 4.1)  atlas   61.0px (max 5.0)  x1.0  ok<br>  right edge   video   34.3px (max 3.4)  atlas   35.0px (max 3.0)  x1.0  ok<br>  body centre  video   39.5px (max 3.1)  atlas   39.0px (max 3.5)  x1.0  ok<br>IDLE PA |
| import | OK | 5s | {"slug":"bach-y-van-phong","body":142,"foot":189.7,"pivot":120,"clips":{"idle":"idle-0-09775368.webp","run":"run-0-c4f05127.webp","basic":"basic-0-392b968d.webp","ultimate":"ultimate-0-e1ccfe83.webp","hit":"hit-0-6f61db2b.webp","fall-die":"fall-die-0-df5e8209.webp"},"detail":"detail-d22c22fa.webp"} |
| portrait | OK | 1s | bach-y-van-phong -> assets/characters/bach-y-van-phong/portrait-e174e3cc.webp 64082 bytes |
| build | OK | 232s | [Luc Anh local speed] skip VFX duration |
| detail | OK | 16s | {"id":"van_phong","card":true,"stageId":"van_phong","canvases":[{"id":"authoredDetailIdle","w":480,"h":440,"vis":true}],"imgs":[{"src":"bach-y-van-phong/portrait-e174e3cc.webp","vis":false}],"live":[{"id":"authoredDetailIdle","opaque":358,"animating":true}]} |
| frames | OK | 17s | saved 24 frames -> docs/qa/idle-anchor/frames/van_phong |
| evidence | OK | 0s | docs/qa/idle-anchor/detail-van_phong.gif (24 frames) |

Evidence GIF: `docs/qa/idle-anchor/detail-van_phong.gif` — attach to the PR, then open the PR (never push main).
