# Hồn Việt battle standardization — Phase 1 action trace

Date: 2026-09-18
Branch: work/tkt-0164-battle-phase1-trace-20260918
Status: review checkpoint; main not changed.

## Implemented

- Added `src/domain/combat/battle-presentation-trace.mjs` with opt-in trace API:
  - stable `actionId`;
  - action start/marker/complete lifecycle;
  - duplicate action start rejection;
  - duplicate impact detection/counting;
  - duplicate completion rejection;
  - bounded event buffer and disabled-by-default mode.
- Added build owner `scripts/battle-phase1-trace-v1.mjs` that injects the trace into generated battle only when URL includes `?qaPhase01=1`.
- Added source contract tests for action/resource/diagnostic wiring.

## Verification

- Focused Phase 1 trace tests: PASS.
- `npm run build`: PASS.
- `npm test`: EXIT 0.
- No combat math, art, timing, or audio behavior changed by default.
- Browser/Android/LDPlayer visual replay: not run; QA flag is ready for the next hosted/device gate.

## Next gate

Open hosted battle with `?qaPhase01=1`, reproduce the IMG_7408 6v6 sequence, export `window.__HV_BATTLE_PHASE1_TRACE.events()` and compare action/marker/cache state with the video timestamps. Only then change position/timing contracts.
