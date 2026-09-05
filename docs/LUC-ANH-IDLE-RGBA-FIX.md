# Lục Ảnh idle: restore the authored alpha source

## Cause

The two uploads have the same frame dimensions and numbering but different
alpha data. `IDLE.rar` contains 96 RGB PNGs on black; `IDLE(2).rar` contains
96 RGBA PNGs at 1510 × 1004. The production `idle-1080-atlas.webp` had an
edge-connected black cleanup instead of the newer upload's authored alpha.
Black remained in enclosed gaps around the scissors and lantern handle.
The hero-detail canvas also applied `contrast(1.14) saturate(1.06)`.

The downloaded production atlas matched Git blob
`6655e30128922b4354ac7b3994a965412f904980`. Comparing aligned first frames found
1,414 pixels with alpha above 240 in that atlas but below 32 in the newer RGBA
source. This is an asset-source problem, not an opaque canvas background.

## Replacement contract

- Input: `IDLE(2).rar`, SHA-256
  `b6eec16bfb8b01fcf57c16af7ab1d4a869265deec6651323793e90ee79ff64d0`.
- Exactly `0001.png`–`0096.png`; reject RGB, missing frames, extra frames and
  unexpected dimensions. Preserve the authored alpha; no chroma key or color
  threshold is applied.
- One source crop for every frame: left 230, top 7, width 976, height 976.
  This reproduces the previous atlas placement. All 96 frames were checked:
  no source pixels with alpha ≥128 lie outside this crop.
- Uniform resize to 480 × 480; row-major 8 × 12 atlas (3840 × 5760).
  Frame duration stays 42 ms, and the existing renderer baseline stays intact.
- Encode lossless WebP. Resizing still changes resolution; “lossless” describes
  encoding after normalization, not equivalence to the full-resolution PNGs.
- New URL: `assets/characters/luc-anh/idle-rgba-v1-atlas.webp` to avoid the old
  cached file. Hero detail, battle, manifest and result animation share this
  contract. Remove the obsolete trim patch from the active build chain and
  fail the build if the replacement atlas is absent.
- Hero detail uses `filter: none`; it no longer changes the source colors.

## Rebuild and verification

```sh
npm install
node scripts/pack-luc-anh-idle-rgba.mjs /path/to/extracted/IDLE
npm test
npm run build
```

The packer writes a companion `.webp.json` with the original frame hashes,
output SHA-256 and exact byte size. It decodes the encoded atlas and compares
every alpha value and every visible RGB value against the normalized RGBA
pixels. It fails on any lossless round-trip mismatch. Fully transparent RGB
is not compared because it is invisible and may be discarded by WebP.

For the restored upload, the output is 21,682,860 bytes (21.68 MB decimal,
20.68 MiB), SHA-256
`9fc7ba71a302b232068b3ac54c2c9c0e72e5cd183cd1c04fcfeae42e12a0fa8a`.
This is larger than the previous 11,676,728-byte lossy atlas; it preserves
visible normalized RGBA exactly. It should not be advertised as the earlier
“about 5 MB” optimized asset. Atlas dimensions and decoded pixel count have
not increased.

Regression tests cover rejection of a flattened RGB source, retention of
opaque black clothing and partial alpha, fixed pixel coordinates across
changing frames, and integrity of the shipped atlas and source report.

Pre-deploy checks on 2026-09-05: 71 tests passed; the static build completed;
all 16 executable inline scripts parsed; the embedded battle matched the
864,369-byte standalone build exactly. Hero-detail, battle, result and manifest
bindings point to the same RGBA atlas. Frame 0001 was visually compared on
white and green backgrounds; enclosed handle gaps now use the authored alpha.

The GitHub connector limits a request to 16 MiB. The verified WebP is therefore
stored in two binary parts under `asset-sources/luc-anh/`, with sizes and hashes
in the companion report. `luc-anh-idle-asset.mjs` verifies each part and the
complete SHA-256 before the static build copies the reconstructed WebP. These
parts are not deployed. The browser still loads a single ordinary WebP file;
animation rendering, geometry and timing do not depend on the transport split.

## Limits

The RGBA upload itself contains very faint alpha residue in some background
pixels (sampled far-background values around 1–7/255). This fix preserves
that supplied alpha instead of indiscriminately removing dark artwork.
It addresses the opaque black patches introduced by the wrong source.
Native iPhone Safari requires a separate device check; desktop Chrome
verification does not establish Safari rendering or memory behavior.
