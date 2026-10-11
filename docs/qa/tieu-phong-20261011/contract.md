# Tiêu Phong integration — REVIEW
Baseline main 2e52abaf109c08effbe7f6514f1ea77d87393e37. Explicit owner request: integrate fan hero with stun 1 recipient turn. Existing handoff workflow waiver retained; no Ticket Board state claimed. No main merge or production promotion requested in this turn.

Acceptance: six states on roster/detail/AFK/battle; ATK 900ms; ultimate 2700ms at x1; x2/x3 shared clock. Three ground-level tornadoes hit exactly the front/back lane (slots 0/3,1/4,2/5), each contact settles at its own marker. One ultimate cost (60 existing default). Wave 1 independent per-target 50% stun for 1 recipient turn; wave 2 independent 40% antiheal for 2 recipient turns; wave 3 independent 30% critical at 2x base attack coefficient. Native armor, shields, immunity, resistance, seeded RNG and status owner retained. Other wave damage defaults to 1x ATK, a review balance value. No new passive.

Use all 87 actual idle entries, not stale README 83. All 18 poses retained for other clips. Existing uploads and selected Kiếm Thế VFX/SFX; no invented licensing grant. Original keying inherited. Paged WebP assets; Screen VFX blend, original offsets preserved. Shared decoded cache and audio bus.

RED: new tieu-phong tests fail before implementation. GREEN focused combat tests pass. Full build unavailable in local sparse snapshot; fresh full checkout CI required. Browser/Safari/deployment must be reported separately.

Owner pacing revision: ultimate 2.7s at x1. Rise 0–500ms, first release 800ms, then 1300/1800ms; each ground traversal 400ms. Hold airborne through 2200ms, land by 2700ms. All 18 poses retained with piecewise retiming. Rebuild SFX at the same three release cues for x1/x2/x3. Basic remains 900ms.

Owner VFX size revision: ultimate tornado height is 115% of the tallest enemy body in its selected lane, preserving aspect ratio and ground anchor. Basic VFX and 2.7s timing unchanged.

Owner follow-up: apply the same 115% enemy-body height to basic tornado too; basic stays 900ms. Owner explicitly approved merge after this adjustment.
