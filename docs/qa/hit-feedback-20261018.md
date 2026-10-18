# Hit feedback / foot shadows — HF-20261018

Status: REVIEW / not certified for production. Base main: 2499dc39639fb0100bd8aeeeaf5b1ce859f1bd9d.

Scope: shared HP damage presentation, critical styling, orderly per-target numbers, unified battlefield foot shadows. Combat math, damage values, authored timing, roster, save and reward rules are unchanged.

Owner approved replacing unavailable vibe-builder/vibe-lab skills with vibelab-build in this task. Merge and production promotion still require owner approval.

## Findings / changes

- Async S+ casts held a presentation Map. Tiêu Phong, Tịch Dao and Hồng Thương called splusFloater while that Map was active, then cleared it: numbers were merged back into the Map and discarded without painting.
- S+ critical boolean was passed as the old large-text argument, but the painter recognized critical via its text prefix. The prefix is now preserved.
- The old painter used yellow/orange for both regular and critical damage; critical is now burgundy with a font-independent vector impact star.
- The old six-lane modulo reused positions and a fixed foot-minus-108 anchor could put numbers inside tall bodies. New rows use body bounds and push older rows upward at a fixed gap.
- S+ renderers returned before the legacy shadow block. A single pre-dispatch shadow owner covers them, removes the old dark oval and respects authored moving/hidden poses.

## Evidence

- RED: all six initial new contract tests failed on the old source, including zero popups from three positive damage calls and loss of the critical prefix.
- GREEN: 141 catalog/action event cases across 47 S+ catalog entries pass. Unavailable skill aliases are checked as rejected actions, not claimed as playable skills. This covers logic/bridge, not art for all 47 entries.
- Deferred Tiêu Phong real domain + production resolver + bridge: each target/wave has its popup at its virtual marker for x1/x2/x3, including critical last wave.
- Additional contract tests cover value 1, lethal-target follow, 12 rapid hits, healing flush, counter/reaction classification, light shadow and authored spear/vanish poses.
- Offscreen renderer image: `../../evidence/hit-feedback/renderer.png`. Inspected actual painter output: gold regular values, burgundy critical values, visible vector mark, distinct ordered rows, subtle shadow. This is explicitly not an in-game/browser screenshot.

- Final focused regression command: 184 tests passed, 0 failed (new contract/deferred/roster/installer tests plus S+ combat, Hồng Thương runtime, Cổ Nương bridge and Thầy Mo row-damage tests). Two compact-painter unit cases also pass separately; generated-payload case awaits full build.

## Blocked / baseline failure

- Local full build is blocked by unavailable binary assets, first missing `asset-sources/luc-anh/idle-rgba-v1-atlas.webp.part01`. No placeholder atlas was substituted and no gate was disabled.
- Local Chromium is unavailable; downloading its archive returned invalid ZIP bytes. Full game browser interaction, visual timing and physical iPhone/Safari are NOT RUN.
- Existing `tests/tieu-phong-runtime.test.mjs` case “basic and ultimate tornado passes are larger, broader triplets anchored at ground” fails 0 vs 3 draws on both unchanged base source and this patch. Reproduced on the base runtime; not silently changed to pass.
- Full build/CI/browser evidence must pass before merge or production claims. Existing gameplay/asset test failures remain visible.
