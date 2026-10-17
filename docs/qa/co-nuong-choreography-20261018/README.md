# Cổ Nương — owner choreography correction, 2026-10-18

Baseline PR314 ba7d21fd6800f8c6c580dc18887de1361e7883cb. Owner explicitly corrected the prior interpretation: three swords launch from the instrument in succession; each makes two out-and-back traversals through the victim; purple smoke persists on the victim; Ultimate fills a victim's body. Push permission persists; no merge permission.

## Skill contract read before changes

Source: src/domain/hero/splus-profiles/soul.mjs and src/domain/combat/splus-mechanics.mjs.
- Basic: one target; Skill: front row, 80% ATK, cooldown two rounds, no Ultimate rage cost, normal ATK rage gain.
- Basic/Skill apply one parasite stack only after actual HP damage, max three stacks, three rounds. Each end-round tick is 2% victim max HP capped at 50% caster ATK per stack; caster heals 50% actual drain. Reflection mitigation 50%.
- Ultimate: all enemies, 120% ATK, detonate only the caster's remaining parasites and remove them; 30% actual drained damage heals other living allies, divided equally.
- Three swords and repeated traversals are presentation only. No extra damage calls, rage gain, status rolls or stacks were added. Combat domain unchanged.

## Asset inspection and implementation

Inspected every frame of jgm_110_znwz_c and 116 Cổ Mộ thumbnail candidates. The 48 sword cells visually group into 16 headings of three shimmer frames (the pack dirs field is null; this grouping is from visual inspection). Cells 36..38 point right. Play only that shimmer group and rotate to path tangent, instead of spinning through all headings in place.

Three blades stagger 120 authored ms. Release at 520ms, flight 360ms, four alternating 200ms passes = two out/back cycles per blade. First center crossing remains 980ms, matching existing damage settlement. Last blade finishes before 2040ms; recovery remains 4000ms. Small differing pass heights keep the three blades visible. Both teams use direction-aware paths. Harp launch is a body-space offset (+18% toward the enemy, +2% below center); this still needs pixel-level confirmation against the actual character in full-game rendering.

The prior parasite clip jgm_110_ryue_e is sparse stars, not the requested cloud. Added zgm_110_hqps_b: 15 original RGBA frames at 60ms, 5x3 atlas, 156x138 cells, 12px padding. Screen blend. Source metadata and reproducible Pillow converter committed. One cloud per victim follows live projected body; it loops only while the combat HUD reports a Cổ Nương parasite. Expiry, cleanse, death, or detonation removes it without an unrelated 1200ms timer. No recoloring/keying.

Ultimate uses projected target body height. Source luminous union y=20..182 gives a fixed 162px reference (max RGB * alpha >12 across all 15 source frames), center pivot y=101. No per-frame fit. Cổ Nương painter now uses the shared body scale so its harp origin and visible body agree with shared projection. Enemy effects mirror once.

## Evidence and limits

- RED: new choreography suite 0/3 on prior source; red.txt.
- GREEN: `node --test tests/co-nuong*.test.mjs`, 24/24. Includes real domain Basic/Skill/Ultimate targets, shield-only no-mark, max stacks, status-owned smoke and Ultimate consumption, plus existing timeline/audio/late-installer regression tests.
- `node --check src/runtime/splus-battle-bridge.js` and `git diff --check`: pass.
- Smoke converter verifies cell bounds; new atlas 780x414 RGBA.
- vfx-study.mp4: 8s silent offline Canvas motion study at 0.5x, two opposing sides. Production VFX functions with rectangular body guides, not the full game or authored hero art. Original sword/Ultimate frames reconstructed from the supplied ZIP for this study; existing compressed repository sword/Ultimate atlases are NOT replaced. New smoke atlas is the exact committed runtime file. Screenshots at study-56.png and study-145.png reviewed.
- The study jumps from ATK to a separate Ultimate illustration at 2700ms; it does NOT depict an actual combat rotation, Ultimate release timing or simultaneous real actions. Runtime tests separately verify authored Ultimate timing.
- GitHub connector cannot download existing binary hero atlases (empty base64/UTF-8 decoding error). Full normal-game build/browser, exact instrument attachment, Safari/device listening and production remain unverified. Prior CI had no allocated runner and Vercel deployment blocked. Do not claim full integration complete or merge on these focused tests alone.

VibeLab run 20261017-152648-cugaeq0, existing owner Ticket Board waiver retained. No fabricated ticket or completion state.
