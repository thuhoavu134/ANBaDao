# Di chuyen den diem thi trien theo tung ky nang

Date: 2026-09-18
PR: #161
Branch: work/skill-cast-movement-20260918
Base main: 4a646f99768dc906156611b5357d42553e623b83
Mode: repair / focused combat-presentation slice
Release status: review branch only; no merge or production deployment.

## User contract

Ranged does not mean stationary. Determine movement independently for each skill:
home -> configured cast point -> stop and cast -> authored recovery -> awaited
return to immutable home. Do not implement one fixed forward step for all heroes.

Non-goals: change damage/RNG/rewards, retarget, replace art, change animation
frame timing, rewrite the scheduler, enable Combat V2 or expand the roster.

## Implementation and ownership

- `src/combat-domain/skill-cast-movement.mjs`: pure destination planning plus
  awaited movement through the EXISTING tween and state owner.
- `scripts/battle-skill-movement-v1.mjs`: installs after canonical Linh Dong and
  Bach Dien bridges, before the final embedded battle payload is synchronized.
- Luc Anh, Linh Dong, Bach Dien and Thay Mo cast entries now await approach rather
  than forcing x/y to baseX/baseY. Generic actions can use an explicit skill policy.
- Thay Mo no longer resets home inside impact recovery. All four branches use an
  awaited return after their existing recovery boundary.
- Ong Pho authored dashes/combos and Dinh Loi's existing movement are retained.
- Unknown heroes retain their existing behavior. Explicit `home` remains valid;
  movement is not inferred from a staff, bow, fan or ranged effect label.
- `baseX/baseY` remain unchanged. Formation-center calculations include defeated
  members and use home anchors, not transient sprite positions.
- Ownership is bound to battle plus the existing actionCount. A stale plan left
  when a dead actor skips return must not block that actor after revival on a
  later action. Cancellation must not emit cast-ready/return-complete.

## Current LUC THAN policy mapping (provisional visual tuning)

Distances are multiples of own-formation X spacing in world coordinates. They
are NOT original 3Q pixel values, and visual matching has NOT been measured.

| Hero | Basic | Skill alias | Ultimate |
| --- | --- | --- | --- |
| Luc Anh | target, gap 1.45 | formation center +0.75 | formation center +1.05 |
| Linh Dong | target, gap 1.35 | target, gap 1.35 | formation center +0.95 |
| Bach Dien | target, gap 1.20 | target, gap 1.20 | target, gap 0.90 |
| Thay Mo | target, gap 1.50 | formation center +0.80 | formation center +1.00 |

The current Linh Dong/Bach Dien canonical adapters normalize their skill alias
into Basic as before. No new third active skill is introduced.

Reference: `3q-cast-movement-evidence.json` supplied in the conversation. Its
static inspection distinguishes cast/effect mode from movement mode: stationary,
target-relative, column-front and own-formation-center offset. It is evidence for
those semantics, not evidence that this LUC THAN mapping visually matches 3Q.

## Acceptance and executable tests

A1: Per-skill policies, mirrored target approach, stable formation center,
explicit stationary policy, missing/dead target and compact geometry.
Verify: `tests/skill-cast-movement.test.mjs`.

A2: Generated cast entries await approach; return blocks await the existing
movement owner; home is immutable; cancellation and revived actors do not keep
stale action ownership; embedded iframe is identical to standalone battle.
Verify: `tests/battle-skill-movement-wiring.test.mjs` and
`tests/skill-cast-movement.test.mjs`. These use Node VM and tween test doubles;
they are NOT browser/gameplay replay evidence.

A3: Actual 6v6 battle at mobile/tablet/desktop, original art, before-cast-return
screenshots and matching trace, x1/x2/x3, no missing assets or console errors.
Status: UNVERIFIED. Physical Safari/iPhone: NOT_RUN.

Commands:

```sh
npm run build
node --test tests/battle-skill-movement-wiring.test.mjs tests/skill-cast-movement.test.mjs
npm test
```

## Observed checkpoints

- RED revision 9f09e679c9cb6ec0de3e90f52cf8c55c4bf43dcd, CI run
  35347479442: build succeeded; tests 1093, pass 1084, fail 9, skipped 0.
  The nine new generated-payload regressions demonstrated the missing owner and
  the four stationary cast entries on both teams.
- First wired revision 3fb27b138afe8bb7f0e328aec6a11b8e0d1233c1, CI run
  35347906463: completed successfully (build/test). This is a historical
  checkpoint, NOT evidence for later hardening commits.
- Additional policy/return/cancellation tests were added in d0b0b4a233eda37f9b8de1cf0814cb2b3b1543eb.
- Action-scoped ownership repair: e604d63d1b7a75eb4fe861eff745fdab7147456e.
- The PR's current-head CI and review record must supply the final result; do not
  promote a previous green revision to cover a newer untested revision.

## Environment / remaining gates

The working container repeatedly failed transport; no local checkout, command
execution, screenshots or browser results are claimed. Real GitHub PR CI executes
the repository's existing build/test workflow. No extra dependencies or workflow
permission changes were introduced. Ticket-board state was not changed or
inferred. This is not a ship/production acceptance report.

For visual review, build this exact PR revision, open the generated battle with
`?qaPhase01=1`, and use the existing battle controls to execute the four heroes on
both teams. Capture frames before movement, at cast-ready and after return.
Inspect `window.__HV_SKILL_MOVEMENT_QA.events()` and `.snapshot()`; compare the
same positions and action sequence against the frames. Also enter battle from
Chinh ch ien (the host iframe), not just the standalone page. Confirm the same
revision there. QA trace events are opt-in and bounded to 240 records.

Remaining tuning: visually confirm spacing and overlap on real staggered
formations, formation-center cast presentation, duration/readability at x1/x2/x3,
and actual iPhone/Safari behavior. Do not claim a screenshot or 3Q video comparison
from the Node tests.

Rollback: revert this PR's source, build import, tests and document together.
There are no save/schema/asset migrations. Main and owner deployment remain
unchanged until separately authorized.
