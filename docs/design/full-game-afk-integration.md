# PR285 — actual AFK and mobile combat correction
2026-10-06 owner screenshots IMG_7693/IMG_7509 show old main at preview 4c6297b: clipped large mobile units; owner reports static AFK attacks.
This review-only slice integrates the already isolated PR282 code into the complete PR285 game. No prototype, route removal, replacement UI, unlock, save/economy change, main merge or production promotion.
A1 canonical full-body AFK heroes approach mobs, play authored ATK/VFX, return with original cosmetic clock.
A2 mobile battle uses .34 global body scale (from .52), opposing fronts 220 world units; desktop unchanged.
A3 actual guest login → campaign live AFK → prepare → battle → return and all screen owners stay intact.
A4 enemy VFX direction and semantic effect icons use existing render owners.
Source provenance: PR282 e83a5df; selected scripts/src/tests only. Prior PR282 evidence is historical, not new full-host verification.
Fresh RED against PR285 source reproduces missing campaignFarmActorPose and oversized geometry. Focused integration and full build/browser/preview evidence recorded separately. Ticket Board unavailable; existing documented owner waiver retained, no claim/lease fabricated.
Review branch only; explicit owner GitHub approval required before any merge. Broad UI refinement still pending screen audit.
