# Facing-target correction — 2026-10-07

Owner clarified that attacks choose the wrong opposing hero, not that initiative is wrong. Review only: PR #285, branch review/full-game-ui-20261006. Runtime revision 4a5185d07e2e7a2a494e5da53040ea57280737e3; QA revision 82ce2085e4e58453d8f78981ece19d5affeb3419.

## Fix
- Existing targeting owner now resolves generic single-target Basic/Skill/Ultimate to the opposing living formation lane. Existing taunt, legal-frontline and deterministic casualty fallback remain in force.
- Bạch Diện/Linh Đồng aliases normalize Skill to Basic before resolving the animation target. Previously presentation could approach a stale Skill target while the S+ mechanics owner damaged the opposing Basic target.
- Ông Phở's chain fallback uses the same formation selector.
- Initiative, damage formulas, AoE/support targeting, native S+ special skill rules, saves and rewards remain unchanged.

## RED and GREEN
- Focused RED: generic skill chose enemy0 instead of opposite enemy1; authored alias kept player0 instead of player2.
- Actual-browser RED: run 37626363166 showed Bạch Diện slot2 choosing player0 rather than player2.
- Build anchor collision caught in run 37627223246: the same normalization line exists in the legacy adapter. Insertion is now scoped to the unique performAction signature.
- Clean build and 8 focused tests passed in run 37627980949.
- Full audit run 37627980726 passed: 1671/1671 tests, instant skip win/loss, actual host/reentry/result, AFK canvas, formation geometry and all-screen checks.
- Runtime trace at 4a5185d: full mobile roster checked 9 actions; partial mobile and desktop checked 6 each. All 21 action targets and impact targets matched. Screenshot inspected: mobile offensive skill hit the correct opposing lane.
- Initial browser harness required a non-basic offensive cast in EACH two-round scenario, including a partial support roster. That coverage assertion failed despite all target equalities passing. QA-only revision requires non-basic offensive impact coverage across the suite while retaining every per-action equality and per-scenario Basic check.

## Preview and limitations
- Verified READY preview for runtime 4a5185d: https://luc-than-4g31dw60a-nyto1.vercel.app/
- Host and battle HTTP 200; deployed source confirms target resolution after authored alias normalization.
- Responsive Chromium is not physical iPhone/Safari; physical device acceptance remains owner review.
- CI/CD build, tests and VFX QA passed, but artifact upload failed because GitHub artifact storage quota is exhausted. Separate full audit completed successfully; no quota bypass or deletion.
- Ticket Board remains unavailable under the previously recorded owner waiver; no ticket transition is claimed. VibeLab run 20261007-200308-2upkipg.
- No merge or production promotion. Owner approval required on GitHub.

## Final facing-target browser gate
PASS: run 37630872610 on 82ce2085e4e58453d8f78981ece19d5affeb3419. All three real-host scenarios passed (390px full roster, 390px partial roster, 1280px persisted partial roster): 21/21 matching action/impact targets, no runtime exceptions, queue order unchanged. Full mobile includes offensive Skill and Ultimate impacts. Partial formation screenshot inspected: gray cells absent, add/remove controls retained.
