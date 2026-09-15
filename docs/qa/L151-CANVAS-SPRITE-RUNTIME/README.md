# L151 Canvas Sprite Runtime

Owner 15/09 · không Spine, không rewrite gameplay. Catalog + lazy loader + decoded LRU + renderer metadata. Linh Đồng trước.

## Chrome

- Desktop idle / ATK / Ultimate: `desktop-dpr1-*.png`, `desktop-dpr2-*.png`
- 390×844 idle / ATK / Ultimate: `mobile-390-*.png`
- Boot chỉ tải `idle-atlas.webp`
- ATK mới tải `basic-atlas.webp` + `skill1_vfx-atlas.webp`
- `__HV_SPRITE_RUNTIME.inspect()` boot: 81,100,800 decoded (idle)
- Sau ATK+Ult: 133,478,400 decoded ≤ 128 MiB
- Không lỗi console app. Safari/iPhone NOT_RUN. LIVE #147 `e8cd581`. Owner tự `git pull && vercel --prod`.

## RAM vs file

| Clip | Compressed | Atlas | Decoded RGBA |
|---|---:|---|---:|
| idle | 10,909,760 | 3840×5280 | 81,100,800 |
| attack | 5,046,406 | 3840×2640 | 40,550,400 |
| ultimate | 4,420,342 | 3840×3520 | 54,067,200 |
| skill1Vfx | 7,239,332 | 4400×2976 | 52,377,600 |
| ultimateVfx | 12,856,778 | 4400×2976 | 52,377,600 |

Trần cache 128 MiB. Chân trận vẫn 477×440. VFX `source-over`.
