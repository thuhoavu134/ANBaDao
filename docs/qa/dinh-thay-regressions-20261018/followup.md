# Owner screenshot and contact follow-up

Baseline main remains e1db5aa; continuation of PR316 at 4bcf96d.

## Combat changes

- Đình Lôi's versioned Basic now targets an enemy with damage multiplier 1. The same impact grants the existing 20% guard to self and a living teammate through the existing received-shield settlement. The installer copies the final shield owner after mixed settlement; it does not bypass bans or replace shield accounting. Auto cadence excludes the paid legacy Skill; explicit/talent Skill calls normalize to Basic and reselect an enemy before readiness/debit/presentation. This removes the separate opening ally-directed wave and uses the one continuous ATK presentation.
- Cổ Nương's domain now owns a deferred cast: Basic/Skill each resolve 12 sword crossing markers per selected victim, Ultimate six pulses per selected victim. Renderer calls the domain at authored markers, never subtracts HP itself. Repeated cast/target/hit tokens are rejected. Each hit uses normal received-damage defenses and receives a fraction of the original action multiplier after the existing minimum formula, rather than multiplying the whole skill damage by the VFX count. Per-contact rounding, evasion, shield consumption and reactive mechanics can change final totals.
- Rage/cost/afterAction are once per cast; parasite is at most one new stack per victim per Basic/Skill cast. Ultimate detonation/healing finalize once after the last pulse. Dead source/victim guards and battle-generation cancellation remain active. This is authored target/contact scheduling, not general pixel collision against incidental units crossed during the flight.

## Verification

57 focused owner/contact/visual/audio/timeline/choreography tests PASS, plus 4 bridge-installer composition tests PASS. Syntax checks pass. New tests execute the real legacy resolver on both teams and actual S+ domain per-contact damage, duplicate hit rejection, single rage grant, shield and dead-victim behavior. Existing x1/x2/x3, mute, skip, scene cancellation and late installer seam tests pass.

Broader test attempt still stops on sparse checkout dependencies (co-nuong/runtime-meta.json and domain/equipment/item-assets.mjs). No full build/device listening/live-game acceptance claimed.

## Still open: result art

The owner's screenshot confirms the visible defect. The prior z-index-only change is insufficient: the old rectangular clip-path used to hide baked-in raster lettering also removes anything from the wing animation inside that rectangle. The available result atlas contains lettering and wings in the same RGBA frames; there is no separately named wing-only layer in the repository inventory. No arbitrary new crop, substitute art, or claim of a visual fix in this follow-up.

PR316 preview for cuonggmn was READY at 22:50 UTC. In this agent browser it redirects to Vercel login. The protected-fetch connector was rejected by automatic approval review because it may create a temporary authenticated share/bypass link without specific authorization. No workaround attempted and deployment protection unchanged. Need authorized access to the exact preview to inspect actual animation/CSS and finish the result-art correction.

## Thầy Mo inventory

Repository has idle, basic cast, skill cast, ultimate cast, hit, basic projectile/impact, skill wave/impact, and ultimate VFX. No authored Run or Fall/Die clip is present. `scripts/result-character-motion-v1.mjs` explicitly uses translated idle for Victory entry and a synthetic rotated idle pose for Defeat. The newly supplied refresh only contains Thầy idle and ultimate VFX/SFX; it does not supply these missing body animations. Do not substitute another hero or report synthetic motion as authored animation.

PR remains draft. No merge authorization inferred.
