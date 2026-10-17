# Kỷ Vân lightning / Thầy Mo three-line damage — 2026-10-17

Status: **DRAFT / REVIEW**. Baseline main is `6fa926747059757de9a9d5072ec643bbcf1d1bd8`, which contains the owner-approved merge of PR #311 (shared hero size). This follow-up uses branch `fix/ky-van-lightning-thay-mo-damage-20261017`. It is a new change; previous merge approval does not mark it merged or deployed.

## Request and reference

The owner requested upright, ordered Ultimate lightning similar to the supplied image, a Kỷ Vân Basic that descends onto the target, and damage for the other two visible Thầy Mo attack lines. The attachment was located and inspected. It shows long gold/white branching columns; a still image does not establish a temporal sequence. The concrete sequence below is the implementation choice for review. The user's full screenshot is not copied into the repository.

## Kỷ Vân: source-owned visual repair

Owners: `src/runtime/ky-van.js`, `assets/characters/ky-van/runtime-meta.json`, plus the Basic description in the hero domain/host installer. The existing `bolt.webp` and `impact.webp` are reused byte-for-byte. There is no generated replacement art or character-scale adjustment.

Basic previously interpolated from actor to target and painted a rotated fan. It now paints one upright column above the target, anchored to the shared body center and foot. Moving the caster cannot move the column. The source bolt cell is 260 × 628; contact pose is frame 5, with source anchor (130, 540). The destination preserves its aspect ratio.

Reviewing the actual atlas caught a second visual issue: frames 0–4 do not grow monotonically. Frames 1/2 nearly reach the foot, then frames 3/4 retract. Pre-contact now reveals **one fixed contact pose** from the top by cropping the source and destination by the same ratio. The visible bottom remains above the target foot until contact; the crop does not stretch the image or expose ground particles early. At contact the full cell opens, followed by the original 60 ms tail frames 5–14 without wrapping.

Basic keeps release at 650 ms and impact at 1050 ms. The downward reveal occupies those 400 ms; the tail ends at 1650 ms. Character clip duration, scheduler, sound bus, readiness lease and cancellation stay with their existing owners.

Ultimate has this deterministic slot sequence for both teams, independent of `units` array order:

| Visual wave | Target slots | Start times at ×1 |
| --- | --- | --- |
| Front column, top to bottom | 0 → 1 → 2 | 1730, 1805, 1880 ms |
| Paired rows, top to bottom | 0 → 3 → 1 → 4 → 2 → 5 | 2180, 2235, 2290, 2345, 2400, 2455 ms |
| Back column, top to bottom | 3 → 4 → 5 | 2860, 2935, 3010 ms |

Absent targets are omitted. Each strike reveals downward for 60 ms. A newer wave replaces the previous column at that target, so duplicate bursts cannot stack at the same position. Each strike lasts 660 ms; the final tail ends at 3670 ms, before the existing 3900.024 ms recovery. The existing Ultimate release/impact markers (1730/2240 ms), single combat resolution and one status roll per target are unchanged. These visual waves do not create extra Ultimate damage events.

The root `ky-van-test.html` is an iframe controller for the real battle runtime; it has no separate lightning renderer to patch. Hero detail shows idle, so no duplicate VFX implementation is introduced there.

## Thầy Mo: three visual contacts, three damage settlements

Owner: `scripts/thay-mo-authored-production-v1.mjs`. The production combat adapter renames the real resolver to `__hvResolveAction3qAdapter`; the public `resolveAction` wrapper records the result. Previously the authored visual owner selected three target IDs while the inner Basic resolver called `applyDamage` only for the primary.

The patch resolves the same cast snapshot, primary first, followed by each other living enemy once. Duplicate, absent, dead or now-allied targets are filtered. It does not reselect another row at impact. Direct resolution without a presentation snapshot uses the same row helper as the visuals. All contacts go through the existing `applyDamage` / mixed settlement path.

The action still has one result record and one Basic rage grant. Per-target multipliers remain the original versioned/legacy multipliers. Two additional targets now receive the damage already represented by their visual lines.

A legacy talent can promote Basic into the same three-line Skill. Its single-target `fear` path now applies the two auxiliary damage hits after the primary damage, fear, control and drain, preserving the primary RNG/status order. The auxiliary hits do not repeat fear, drain, talent activation, cost or Basic rage. The configured Skill AoE branch already damages its group and receives no extra hits; Ultimate and other heroes are excluded.

## RED → GREEN

| Regression | Before the repair | After the repair |
| --- | --- | --- |
| Basic lightning geometry | 5 rotated/travelling sprites; layout tests failed | One fixed target column |
| Initial sequential-frame approach | Source pixels reached the ground early and retracted; 3 new reveal assertions failed | Monotonic crop, no ground pixels before contact, unchanged source density |
| Thầy Mo Basic fixture, initial enemy HP 1000 | `[1000, 888, 1000, 1000, 1000, 1000]` | `[888, 888, 888, 1000, 1000, 1000]` |
| Thầy Mo free-talent fixture | Only primary reached 879 | All three intended targets reach 879; fear only on primary |

The HP figures are deterministic test-fixture values, not a new fixed damage amount or a balance recommendation. Basic actor rage is 30 → 45 once. Free Skill proc actor rage stays 30, with one proc, sound and result record.

## Final focused verification

**40 tests passed, 0 failed**, across these seven files:

```bash
node --test --test-isolation=none \
  tests/ky-van-runtime.test.mjs \
  tests/ky-van-lightning-layout.test.mjs \
  tests/hero-runtime-stature.test.mjs \
  tests/new-hero-idle-scale.test.mjs \
  tests/ky-van.test.mjs \
  tests/thay-mo-basic-row-damage.test.mjs \
  tests/thay-mo-authored-production.test.mjs
```

The Kỷ Vân/body/domain group is 27/27, including both teams, compact/desktop body projection, caster movement, reveal/ground boundary, deterministic occupied-slot order, one column per target, bounded frames, ×1/×2/×3, skip/cancel/lease and late-installer composition. Domain tests retain single-roll Ultimate, recipient-turn status expiry and Basic without the Ultimate debuff.

The Thầy Mo group is 13/13 (nine new regressions and four existing authored tests). Its fixture executes the actual 3Q adapter emitters, full authored installer, mixed settlement patch and final versioned-Basic dispatcher. It uses the real emitted `applyDamage` and `settleLegacyDamage`; the raw `Core` formula, presentation environment and record sink are controlled test inputs. A mixed-combat case spies on the final damage route. This is focused dispatch/settlement evidence, not the full S+ engine or full build. Both teams, two target rows, three identity aliases, dead/duplicate/ally targets, free proc, paid Skill, existing AoE and unrelated actions are covered.

An additional attempt to run the four existing `thay-mo-rage-rotation.test.mjs` cases was blocked by sandbox `EPERM` in their `execFileSync` subprocess, before combat assertions. Those tests were not modified and are not counted as passing. `--test-isolation=none` avoids the test runner's own subprocess boundary but does not remove that inner harness limitation.

## Visual evidence and limits

- [Inspected contact sheet](ky-van-lightning-20261017.png): Basic at 750/950/1050 ms and Ultimate at 1950/2500/3090 ms.
- [Short motion capture](ky-van-lightning-20261017.mp4): 1280 × 768, 15 fps, ×1, silent; Basic followed by Ultimate.

These are **offline production-runtime captures** with actual Kỷ Vân `drawKyVanHero` / `drawKyVanFx`, shipped actor/VFX assets and shared body math. Six repeated Bạch Diện sprites are labeled slot fixtures on a neutral QA stage. The asset lease/audio/visibility environment is controlled. They are not a mock game or a full-game browser/device capture. The Basic contact image and Ultimate wave frames were inspected; the light columns are upright, target-anchored and visibly ordered. Unit assertions provide the exact sub-frame reveal/timing evidence.

The checkout is sparse and lacks unrelated full-build assets. No full build, normal campaign browser run, physical iPhone/iPad/Safari or production deployment is claimed for this revision. Existing Ticket Board/workflow unavailability waiver remains in force; no ticket claim/DONE transition is invented. Follow-up review should use a normal full-source preview when available, then owner visual acceptance before this new PR is merged.
