# Owner screenshot corrections — 18 October 2026

Reference: IMG_7810.png (Victory lettering) and IMG_7807.png (oversized bell). Follow-up clarifies that the bell must fit each buff recipient and enemy Đình Lôi VFX must mirror with facing.

- Bell: projected recipient body center and height, approximately 1.15 visible body heights. Uses existing persistent page cache and guard lifetime, no extra animation/load owner.
- Đình Lôi ultimate: visible landscape content fits world y=430..610, the midpoints of formation rows 340/520/700. Crop only empty compatibility-cell padding, preserve uniform 16:9 ratio; no enlarged full-screen strip. Both ultimate phases mirror exactly once.
- Shared legacy VFX direction: `battleVfxMirror(actor, sourceFacing=1)` defaults to team facing, accepts explicit `visualFacing`/`facing` overrides and left-facing source assets. Wired into Đình Lôi/Lục Ảnh/Linh Đồng/Bạch Diện legacy blitters and new Đình Lôi ultimate/shield helpers. Existing independently authored hero renderers retain their own direction contracts.
- Result titles: hide only the old top-center raster lettering with a notched CSS clip; retain animated wings. Separate gold Victory and silver Defeat SVG outlines occupy the old title area. Font outlines carry the DejaVu license and deterministic generator; no mobile font dependency.
- Cổ Nương: character cast and all 18 poses now complete in 2000ms at x1, then idle. Three VFX/SFX waves and 300ms echoes retain their approved sequence/recovery; this does **not** compress the whole 4500ms effects sequence into two seconds.

Validation: geometry regression initially failed (missing helper); after implementation, 46 focused tests pass. Assertions cover recipient-relative sizing, midpoint bounds, two-side mirroring/explicit facing, all 18 poses within 2s, and existing three-wave combat/audio/cancellation tests. Raw battle owner composition with direction patch, readiness/persistent seams and final refresh parses (5 battle inline scripts, including the actual Bạch Diện renderer, and 3 host scripts). Both SVGs rasterized at 2x and visually inspected for crisp outlines.

Limits: these are focused source/geometry checks, not a full generated-game capture. `npm test` stops at missing baseline `scripts/luc-anh-idle-asset.mjs` in the sparse local checkout. Playwright browser executable is unavailable. Full preview and physical iPhone validation remain pending. VibeLab run 20261017-171408-cgav608 remains evidence-review; no full gate, merge, or production success is claimed.
