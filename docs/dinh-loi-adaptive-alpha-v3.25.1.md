# Đình Lôi Adaptive Alpha v3.25.1

The v3.25.0 chroma result is rejected as a WIP because fixed-color keying left green background contamination. v3.25.1 rebuilds all 14 supplied Đình Lôi assets from the original 64-frame GIF files.

Pipeline:

1. Coalesce/extract every original GIF into 64 full-resolution RGBA frames.
2. Derive an adaptive matte per pixel from green-channel dominance instead of a fixed RGB key.
3. Multiply the matte by the source alpha so authored transparency is preserved.
4. Despill only the semi-transparent keyed edge; never alter fully opaque artwork globally.
5. Feather only alpha by less than one pixel, preserving RGB detail.
6. Resize with Lanczos and pack deterministically into an 8×8 PNG atlas.
7. Inspect representative frames on black, white, checkerboard and battle-tone backgrounds.

Evidence:

- `artifacts/dinh-loi-qa-v3251/all-assets-four-backgrounds.jpg`
- `artifacts/dinh-loi-qa-v3251/alpha-rebuild-report.json`
- Reproducible tool: `scripts/rebuild-dinh-loi-alpha.mjs`

Green-gold light trails inside projectile and skill artwork are retained because they are authored VFX, not the chroma background.
