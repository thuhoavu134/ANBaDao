# TKT-0159 — Skill-test lifecycle follow-up, 2026-09-22

Status: DRAFT / PREVIEW_GATE. This checkpoint does not authorize a main merge.

## Baseline and scope

- Refreshed main: `7ebc973aa244b3e7e0ea26236cc306704d2bdb25`.
- Existing PR #191 head before this follow-up: `1127485f8deec1126c356d19dcecc2b2d572e904`.
- Branch: `work/tkt-0159-action-movement-profiles-20260921`.
- Owner modified: inline controller in `skill-test.html`; new regression suite: `tests/skill-test-lifecycle.test.mjs`.
- No changes to combat math, authored timing, production movement mapping, save, reward, assets, Victory/Defeat, HTML layout or CSS.

## Reproduced defects and fixes

R1 — The old action enabled controls before awaiting its 500ms label delay, then unconditionally enabled them again in finally. A second action could therefore lose its control lock. The old delayed label also overwrote a newer hero/movement selection. The cosmetic delay no longer keeps the action promise/finally alive; a run/session ownership check guards control and label writes.

R2 — Actor/movement preflight failures happened outside the error boundary; invalid actions could throw at toUpperCase; rejected runtime promises only appended to the log while marker polling continued. Validation/preflight now share the recoverable error boundary. Polling checks runtime rejection without swallowing it as a missing marker.

R3 — sessionStorage and iframe setup happened outside the loading try/catch. Setup failures now keep Reset usable and permit retry.

R4 — Assigning iframe.src does not synchronously replace its old API. Reset now waits for the matching session in the loaded iframe URL, checks load ownership after every await, clears the obsolete action row, and prevents old action/load work from reporting errors or unlocking/relabeling the new session.

## Verification actually executed

The exact baseline page was reconstructed from the authenticated GitHub read and verified against Git blob `0eba49ca28c27550ae3d542e119f5d0e3987b0b9` before testing. The actual inline controller is executed without source replacement in a Node VM with controlled DOM/iframe/API/timer fixtures.

Command: `node --test --test-concurrency=1 tests/skill-test-lifecycle.test.mjs`

- Baseline: 21 tests, 10 passed, **11 failed**, exit 1.
- Candidate: **21 passed, 0 failed**, exit 0.
- Final rerun after reviewing the diff: **21 passed, 0 failed**, exit 0.
- Controller and test syntax checks: exit 0.
- HTML/CSS before the script is byte-identical to baseline.
- Tested code tree: `547103c3b6947c151f22f544e1b3ae9ffc2f52a5`.
- Candidate page blob: `d2524bfb666eddf123ffe471523bc6bb5cc19563`.
- Test blob: `a787b7bc708c77add0ba91603e394a6049754316`.
- Machine report: `tickets/TKT-0159/evidence/lifecycle-20260922.json`.

The nine hero/action combinations here are **controller fixture coverage**, not a new certification of the actual 6v6 battle, authored VFX, SFX or return motion.

## Explicit limitations and process gap

Full build/full repository suite and real battle desktop/mobile browser QA were not run locally on this candidate. The environment could not resolve GitHub for a full checkout, and the 615730217-byte playable artifact exceeded the connector's 536870912-byte limit. Do not weaken CI, substitute fixture results for real gameplay evidence, or claim production/live.

The source/test-only exception already recorded in `docs/vibe-brief.md` was used because Ticket Board tooling was unavailable. No ticket claim, lease or lock is fabricated. VibeLab run `20260922-022235-euygbmsh` remains blocked at ticket-guard; the overall gate is not complete.

An unattached candidate tree had been drafted before local RED execution. This is reproducible failing-baseline / passing-candidate regression evidence, **not a claim of strict test-first order**. No branch ref was published until the focused tests and diff review completed.

Physical iPhone/Safari, full real battle browser evidence, current CI, hosted preview and owner approval remain separate requirements. No main merge or production deployment is authorized by this checkpoint.

## Next action

Check the CI run for the published follow-up commit, inspect real desktop/mobile battle reports and screenshots, and provide the branch preview for owner testing of all four movement profiles. Keep PR #191 Draft until the owner explicitly approves merge after that preview. Do not redo locked result-screen work or roll Combat V2 into production.
