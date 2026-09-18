# Hồn Việt battle standardization — Phase 0/1 checkpoint

Date: 2026-09-18
Base main: `db234ef9014a4e6adc7b6a263ff0d40e1bb7a20d`
Branch: `work/tkt-0163-battle-standardize-phase01-20260918`
Status: review checkpoint; not merged/deployed.

## Implemented in this slice

- Added `__HV_BATTLE_PHASE01` opt-in QA snapshot/events surface. It is disabled unless the URL contains `qaPhase01`, so production behavior is not changed by default.
- Snapshot exposes battle lock/current actor, units (id/source/team/state/hp/x/y) and the shared native atlas cache inspection.
- Existing action contract is now covered by source regression checks for action IDs, battle ID, target, resolver and lock guard.
- Existing native resource contract is covered for 128 MiB budget, release/clear and shared cache markers.

## Verification

- Focused Phase 0/1 + combat observation tests: **6/6 PASS**.
- `npm run build`: **PASS**.
- `npm test`: **EXIT 0**.
- Main was not changed. This branch is the reviewable first slice only.

## Next phase, not included here

- Use `?qaPhase01=1` on the deployed battle to capture a real 6v6 snapshot/video.
- Add exact marker/action/hit completion telemetry after reproducing IMG_7408 on the same commit/device.
- Add explicit homeAnchor/C/M position contracts and Android/LDPlayer validation.
