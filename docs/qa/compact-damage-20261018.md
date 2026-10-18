# Compact damage rows — REVIEW

Owner requested tighter, overlapping, inward-stepped rows using IMG_7816.png vs IMG_7504(1).png. Both references were inspected.

- Baseline main: 428c8cc821b291183a851db9c5831fa10ee3233e.
- Damage row pitch 28 → 14 world px; newer rows step inward 3 px relative to older rows, mirrored by team. Existing 18/22 px normal/critical type and colors unchanged.
- Each contact reflows living rows to remove gaps from prior upward travel. Each hit retains its exact value, creation time and lifetime; no extra HP settlement. Status rows retain their previous 22 px spacing.
- Actual compact painter draws newest damage first, oldest last, so earlier rows cover the overlapping edge of later rows. Non-damage relative order remains stable.
- 154 focused tests passed, then the added generated painter ordering case passed in the 10-case contract suite (155 distinct focused cases total).
- Read `evidence/hit-feedback-compact/comparison.png`: actual runtime/painter offscreen at 2×, old vs new spacing. Right-hand critical rows form a tight three-step group; outlines overlap with a small inward shift. This is renderer evidence, not a full-game screenshot.
- Full build/browser/device/deploy remain unverified: recovered workspace still lacks full atlas source. Existing missing Lục Ảnh atlas blocker from PR317/318 is unresolved. No new deployment or merge claimed.
