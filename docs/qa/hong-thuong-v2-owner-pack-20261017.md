# Hồng Thương — owner reduced-frame pack integration

Owner supplied `kiemthe-six-state-package-v2-phase-aware.zip` and explicitly directed using the reduced 18-frame states to conserve size. This supersedes the prior request for original MP4s. No new frames generated; source RGBA color/alpha retained, no second chroma-key pass.

Reproduce with Pillow: `python scripts/hong-thuong-import-v2.py /path/to/kiemthe-six-state-package-v2-phase-aware.zip`. Do not run the legacy MP4 converter over these approved assets. ZIP hash is recorded in runtime-meta.json; source video hashes are retained in source-pack-manifest.json.

- Idle: all 81 source samples, original 3375 ms loop; 11 small pages. Campaign build now enumerates metadata pages instead of six hard-coded pages.
- Basic: samples 0/1 windup, repeat single-thrust samples 2/3/4 three times, then samples 5/6/7 recovery. 1120 ms; hits at 240/480/720 ms. Unused source tail excluded.
- Ultimate: prep samples 0–3 (192 ms), repeat samples 4–8 per target (720 ms; contacts 144/432/576 ms), finisher samples 9–17 (864 ms; contact 432 ms). Existing contiguous travel/return segments retained. Timings are adapted playback timings, not claims about full-rate source motion.
- Run/hit/fall: 18 samples each, respectively 864/648/1152 ms.
- Normalize every clip through its metadata crop back to one common source-space scale (474/1080), with a shared source-space body/foot anchor (880,1035). Fixed registration per clip; no per-frame fitting. Avatar also replaced using approved RGBA idle.
- Keep the approved sample 22 VFX and existing SFX unchanged. No damage/rage/status balance changes.

Validation: actual WebP dimensions and RGBA checked for all 18 atlases; source-level runtime regressions 6/6 PASS; installer syntax checked; contact rendering visually inspected for color and silhouette. Character atlas payload is 10,481,294 bytes versus ~12.6 MB for the old character WebP set (avatar adds 72,236 bytes). Source PNG package is not shipped.

Full build/domain suite and normal 6v6 browser/device playtest NOT RUN in this sparse checkout; no physical iPhone/Safari or production claim. PR stays unmerged. Prior unavailable-workflow-tool waiver applies; no ticket or VibeLab pass asserted.
