# L154 Bạch Diện Canvas Sprite Runtime

Pack `artifacts/bach-dien/bach-dien-agent-assets-q90-480.zip` → atlas 8×12 / VFX 10×10. Không 4×2. Contact sheets from the agent package. Chrome 15/09.

## Chrome

- Desktop idle / ATK / Ultimate: `desktop-dpr1-*.png`
- S+ 390×844: `splus-390-*.png` (`qaSplus42=hero_splus_bach_dien`)
- Trận thường 390×844: `mobile-390-*.png` (`bachDienQa=1`)
- Boot idle-only trên S+. ATK tải `basic-atlas.webp` + `skill1_vfx-atlas.webp`
- Sau ATK decoded 124,748,800 ≤ 128 MiB (idle bị LRU nhường chỗ vì clip nhân vật 81 MiB)
- Chân trận 477×440. VFX `source-over`. Không Spine. Không lỗi console app.
- Safari/iPhone NOT_RUN.

## RAM vs file

| Clip | Compressed | Atlas | Decoded RGBA |
|---|---:|---|---:|
| idle | 11,751,746 | 3840×5280 | 81,100,800 |
| run | 12,106,474 | 3840×5280 | 81,100,800 |
| attack | 10,452,088 | 3840×5280 | 81,100,800 |
| ultimate | 12,429,038 | 3840×5280 | 81,100,800 |
| skill1Vfx | 6,852,696 | 4400×2480 | 43,648,000 |
| ultimateVfx | 7,531,196 | 4400×2480 | 43,648,000 |

Trần cache chung với Linh Đồng 128 MiB. Roster 12 đóng. Lưới 42 giữ.

npm test 1030/1030. LIVE #150 `aedd4cb`. Safari/iPhone NOT_RUN. Owner tự `git pull && vercel --prod`.
