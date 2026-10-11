# Battle rage, pace and readiness — 2026-10-11

Baseline: main b13ca9b24e6a0887c56f2b759bc6f4032eb6baa5.
Branch: fix/battle-readiness-rage-pace-20261011. No production promotion authorized for this patch yet.

## Findings and acceptance

- Auto cadence spent 25 rage on every affordable regular skill. A regression using the real decision and debit bodies produced 15 turns of skills/basics with no ultimate. One paid regular skill per ultimate cycle now banks rage afterward; successful ultimate resets the allowance. Failed preparation/decision alone and free talents cannot spend the allowance. Costs, rage rewards and S+ cooldown/AI ownership remain unchanged.
- Linh Đồng/Bạch Diện marker waits ignored battle speed. Real emitted wait functions measured 600 ms for a 600 ms marker at both 2x and 3x. The per-cast speed snapshot now scales authored time consistently for actor/VFX, marker waits and the existing sound release cue. Fractional authored durations remain unchanged.
- A stalled atlas had no load timeout and could occupy the sole iOS loading slot forever. A bounded network timeout now releases it and uses the existing explicit retry path. Logs identify the URL. Budget/dimension failures are still rejected.
- Legacy readiness wrongly checked the atlas deadline again after optional audio preparation. A sound timeout could report missing images even with images already decoded. Audio failure no longer changes the successful image check; aborts still cancel.

## Evidence so far

RED: rage cycle 2 failures; speed 4 failures (2x/3x); stalled request 1 failure; late optional audio 1 failure.
GREEN local: 29 focused tests passed, including existing decoded cache, readiness controller and legacy readiness tests.
Full build/CI/browser: pending at initial commit. Local workspace is a sparse connector recovery, so full asset build runs in repository CI.
Existing production browser: owner-authorized 6-stamina battle with Lục Ảnh completed, 2 rounds/11 total actions, no blocking asset dialog observed. This was baseline evidence, not proof of the new patch.
Physical iPhone/Safari and the exact owner's 4G failure: NOT_RUN / not reproduced. No claim that all device-specific asset issues are resolved.

Rage audit: legacy basic +15 (tempo can add 3), turn gain 6–10, hit reward 4–12, evade +4, kill +12 and ally death +5 use existing owners. Mixed S+ gainRage mutates the passed unit and clamps 0–100; rageBan/timeFreeze block positive gains, rageSlow/rageRate modify them. S+ basic +15, costs/cooldowns use catalog definitions. These mechanics have not been rebalanced.

Review must include full normal build, existing mobile/desktop browser regression and current-head test results. Merge requires owner approval under AGENTS.md. Artifact quota or deployment access failures must be reported separately from test failures.
