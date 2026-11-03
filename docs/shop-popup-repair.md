# Canonical shop popup repair

Status: IMPLEMENTED + AUTOMATED CHECKS PASS, awaiting owner visual approval. PR409 still unmerged.

## What changed vs checkpoint 7757ac07
- One modal owner: `#hvShopRoot` is the only overlay; `showScreen('shop')` now keeps real `hubScreen` rendered underneath and the modal dims/blur it. No concept image is used as a fake backdrop.
- One close control per visible panel: the legacy green `.hv-shopc-x` is removed; every screen uses the same authored jade sprite (`assets/ui/jobs/jobs-close.png`) via `.hv-cityf-x`, `.hv-ptsf-x`, `.hv-shopf .hv-shop-back`.
- Frames are regenerated from immutable sources in `assets/ui/shop/source/{city,pts,night}.jpg` by `scripts/ui/prepare-shop-frames.py`; output hashes and every transform (matte removal, mirrored top rail, night-only parchment band erase) live in `assets/ui/shop/frame-manifest.json`. No generative patching of already-patched files.
- The accumulated `/* Owner 2026-11-03 ... */` override tail was replaced by one canonical section (`CANONICAL_SHOP_MODAL`, `CANONICAL_BACKDROP`, `CANONICAL_NIGHT_NOTE`). Conflicting rules were removed, not stacked.
- Night frame: legacy `hv-shopf-res` row hidden (frame has no slots), real note copy and `Đã mua x/8` pill placed in the frame's blank band.
- Duplicate root click listener guarded (`__shopBackBound`).

## Evidence
- `scripts/ui/verify-shop-popup.cjs` writes a unique run dir under `docs/qa/shop-popup/<timestamp>/` with manifest: git revision, source hashes, built index hash, viewport, browser, image hashes, 19 checks. Verified run: `2026-11-03T11-38-28-550Z` (PASS, 9 screenshots at 360/390/430).
- `scripts/ui/check-popup-evidence.mjs` rejects stale evidence: build hash, source hash, image hash and timestamps must match the current tree.
- Visual review of the final 390px screenshots: city / pts / night all CLEAN (real hub behind, single jade X, no clipped text, filled note band).

## Reusable process
`workflows/approved-art-popup/` (validated `--strict`: 8 steps) encodes contract → immutable art → implementation → fresh evidence → evidence gate → owner review, with explicit blocked path and no auto-merge. It is a proposal for owner approval, not auto-run.

## Limits
- Chromium (Edge) only. Physical iPhone Safari NOT tested; iOS font metrics remain an assumption.
- Baseline main already carries 88 unrelated failing tests; those are not caused by this slice.
