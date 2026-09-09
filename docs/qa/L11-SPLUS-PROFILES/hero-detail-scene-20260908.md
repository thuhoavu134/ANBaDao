# Hero detail portrait scene — REVIEW

Contract: implement the player hero-detail composition from IMG_0460.jpeg, not the internal 42-hero QA catalog. Parent: a9b043d on the handoff branch.

- A1: portrait stage, existing official art/idle and authored background, identity above and skills below.
- A2: live stats and original upgrade nodes outside tabs, without duplicate economy handlers.
- A3: previous/next visits only owned official heroes through the existing renderer.
- A4: bounded responsive width, original sprite aspect ratio, accessible skill disclosures and 44px controls.
- Non-goals: combat, saves, economy, new hero art, fractional timing, production.

Existing stage/canvas and command DOM nodes are moved, not cloned. Skill seals use existing slot glyphs, not new illustrated icons. Detailed skill copy stays in the accessible skills panel. Existing backgrounds are reused; static-only heroes do not acquire fabricated idle animations.

Evidence: new source contract RED 0/3, then scene/roster/return-context/skill-kit GREEN 23/23. Source-owner build completed. These are source/domain checks, not browser acceptance. Board/Vibe unavailable; previously authorized source/test continuation, no fabricated claim or DONE status.

Pending: browser screenshot and real mobile/Safari review; idle continuity, upgrade interaction, owned-hero arrows and return-to-roster interaction. Review illustrated icon/pedestal treatment against reference. Visual parity is NOT approved. Existing build owner scripts/hero-detail-tabs.mjs installs the changed JS/CSS; no dist-only edits.

Fractional timing REVIEW_UNCHANGED. Historical full-test/15-round evidence was not rerun or relabeled. No production promotion.
