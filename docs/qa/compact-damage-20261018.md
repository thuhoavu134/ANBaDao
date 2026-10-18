# Compact damage rows — REVIEW

Owner requested tighter, overlapping, inward-stepped rows using IMG_7816.png vs IMG_7504(1).png. Both references were inspected.

- Baseline main: 428c8cc821b291183a851db9c5831fa10ee3233e.
- Damage row pitch 28 → 14 world px; newer rows step inward 3 px relative to older rows, mirrored by team. Existing 18/22 px normal/critical type and colors unchanged.
- Each contact reflows living rows to remove gaps from prior upward travel. Each hit retains its exact value, creation time and lifetime; no extra HP settlement. Status rows retain their previous 22 px spacing.
- Actual compact painter draws newest damage first, oldest last, so earlier rows cover the overlapping edge of later rows. Non-damage relative order remains stable.
- 154 focused tests passed, then the added generated painter ordering case passed in the 10-case contract suite (155 distinct focused cases total).
- Read `evidence/hit-feedback-compact/comparison.png`: actual runtime/painter offscreen at 2×, old vs new spacing. Right-hand critical rows form a tight three-step group; outlines overlap with a small inward shift. This is renderer evidence, not a full-game screenshot.
- Full build/browser/device/deploy remain unverified: recovered workspace still lacks full atlas source. Existing missing Lục Ảnh atlas blocker from PR317/318 is unresolved. No new deployment or merge claimed.

## Update: 3 rows and per-actor totals

Owner corrected the requested summary from a whole-team turn to each individual actor's attack/cast. No team-round aggregation is shipped.

- Visible damage capped at 3 rows per victim; newest hit retires oldest popup only. Separate targets and healing/status queues remain independent.
- Damage painter pads integer magnitudes to at least 3 digits (1 → 001, 27 → 027), preserving numeric values/signs and large numbers.
- Existing actionTotal DOM owner is reused. Legacy recovery caller stays; generic/authored S+ and Cổ Nương capture per-actor ledger damage/healing before the cast and publish deltas at recovery. No summing popup text, no gameplay damage changes. Multi-hit/AoE include all ledger damage even after popup retirement.
- Gold/brown horizontal HUD with two-line italic label and large gold number; embedded display:none is overridden only when not hidden. Healing-only actions retain a healing label. Session reset clears timer/HUD; stale session completion cannot publish.
- 160 focused tests PASS, including cap isolation, 12 hits, 001/027/large formatting, per-actor totals, session/timer reset, real legacy/S+ source installer parsing, both recovery hooks, all roster event emissions and deferred x1/x2/x3 impacts.
- Inspected evidence/hit-feedback-compact/three-rows.png from actual damage renderer: five events leave 375/001/027 in three overlapping rows. This is offscreen painter evidence only; the label stating ledger total is an annotation, not the actual HUD.
- CSS HUD full-game screenshot/interaction, mobile Safari and complete build remain NOT VERIFIED due to the existing incomplete asset checkout. Do not claim exact visual parity or deployment. Previous comparison.png documents the prior spacing revision.
