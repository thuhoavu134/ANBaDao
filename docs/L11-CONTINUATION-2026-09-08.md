# L11 continuation — 2026-09-08

Source baseline: `b6a2ae20a9b1b3071a8f5263740312e9d1465b04`, branch `handoff/l11-splus-profiles-v2-20260908`. Status REVIEW / IN_PROGRESS. This continuation supersedes earlier failing test counts, not the remaining acceptance gates.

## Verified source slice

- Resolved all six original V2 regressions and reviewed handlers across all six elements against the authored profiles. Updated explicit V1 assertions only where V2 changed the requirement.
- Added 33 regression cases (182 S+ before final lifecycle/consumption cases; full suite now 411/411). Build completed through `scripts/build-static.mjs`, including independent/embedded battle parity and old save/reward/seed regressions. See `qa/L11-SPLUS-PROFILES/continuation-full-green.log`.
- Source HP shields/heals, precise target scopes, control/rage restrictions, damage/shield bypass, immediate forced basic, latest-death revive, HoT final tick, Fire/Wood actions and consumed zone cleanup covered by new focused regressions.
- Popup handles queued close/reopen, Escape, destroy and focus cleanup. Battle resolves current actor by ID, refuses orphan cast, resets UI on restart/exit. Source adapter remains the single scheduler owner.
- Catalog/bridge/combat now identify V2. Runtime adapter script marker remains v1 as a build integration identifier.
- Luna handled bounded Fire/Wood implementation, initial actor closure fix, dialog regression tests and read-only profile audit; root reviewed/integrated and corrected remaining cases.

## Review decisions and remaining acceptance

- Trầm Tuệ actionSlow uses the existing queue: immediate delay by 40% of remaining queue length, then -40% ordering speed while the two-round status is active. This is a REVIEW interpretation of action bar wording in a round scheduler, not a new realtime clock.
- Hạc Phá stun 1.5 rounds remains authored as fractional expiry but integer round evaluation is not exact half-round timing. Tố Linh half-slot movement and airborne presentation also need timing acceptance. No silent approval of these approximations.
- Unquantified damage multipliers, Cửu Tính five-stack explosion magnitude, parasite cap, Hắc Đao four adjacent cells on a 2×3 board and Sơn Cương recast bleed consumption need explicit review. Passing tests do not certify all126 descriptions numerically.
- 126 atlas crops, live list/detail/battle UI and restart require preview browser evidence. Local browser access was blocked (`ERR_BLOCKED_BY_CLIENT`); verify deployment URL next. Device/Safari NOT_RUN.
- Ticket Board unavailable; claim/lease null, locks empty. Owner explicitly authorized source/test continuation. Vibe gate run `20260908-153841-f3ao79i` retains these honest blockers. No DONE/MERGED.
- Combat V2 stays on handoff branch. Main/production remains the documentation checkpoint `03d4fdf`; preview READY alone is not release approval.

## Reproduce

```sh
npm test
node --test --test-reporter=tap tests/splus-*.test.mjs
```

Retained RED evidence: continuation-red, parity-red, fire-wood-red, ui-orphan-red, dialog-red, consumption-red. Intermediate failed builds are historical attempts; the final full-green log is the current source verification. Restored local runtime assets matched upstream Git blobs; no substitute art or dependency changes were introduced.
