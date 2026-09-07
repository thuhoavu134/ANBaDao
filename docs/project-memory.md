# Project memory — Hồn Việt / Lục Thần

## Current goal

Continue the source-owned L04 lifecycle/return-context work while keeping the
player journey, combat rules, save ownership and production evidence stable.

## Active slice

- Ticket label: `L04-A2-runtime-stale-draft-revision` (Ticket Board unavailable;
  keep the state `REVIEW` / `IN_PROGRESS`).
- Contract baseline: `0299d4b5e1c3c3010392652f964321645ec820c3`.
- Previous code baseline: `e37c6df342e912a3c8ef15ac2ad5ed152547db21`.
- Current code commit: `6e1bb9c28538ee65355f59f8bf6601b9934807d2`.
- Scope: `scripts/return-context-v1.mjs` now reads the live `P.revision` when
  capturing hero-detail return context and checks the same revision before
  navigation/scroll restoration.

## Decisions and non-goals

- Main agent codes directly; `vibe-builder` owns source/build/docs and
  `vibe-lab` owns the gate/evidence handoff.
- Keep the reusable campaign DOM root separate from activation resources.
- No changes to seed, reward, balance, save migration, roster, art, audio,
  combat rule or dist-only output.

## Validation

- RED: new runtime assertion failed because the build owner had no live
  `readRevision` propagation.
- GREEN/REFACTOR: focused return-context/lifecycle/campaign suite `19/19 PASS`;
  syntax and diff checks pass.
- Production Chrome smoke on `https://luc-than.vercel.app/`: Chinh chiến root
  `count=1/visible`, then roster root `count=1/visible` with 12 cards; filtered
  app-origin errors `0`. The Ông Phở card did not produce a stable detail route
  in this run, so detail/back is not claimed PASS.

## Limitations and next action

- `TICKET_BOARD_NOT_AVAILABLE`: repository has no `scripts/ticketctl.mjs`.
- `DEVICE_BACKEND_NOT_AVAILABLE`: only Chrome CDP is exposed; no Safari,
  iPhone/iPad or responsive-device backend.
- `game-dev` CLI is not installed; do not install or change credentials.
- Local connector checkout lacks the full binary asset package, so local
  `npm run build` and the all-test command cannot be treated as full-pass;
  Vercel built the complete repository successfully.
- Vercel deployment `dpl_BkWWPdV3GGfwurfk3fSeY2hfMmYb` is READY and selected
  runtime errors are `0`; browser device capabilities are `[]`.
- Next: retest hero-detail route/back, then run the device matrix and Ticket
  Board claim/lock/evidence when available. Keep the ticket at `REVIEW`;
  do not mark it `DONE` or `MERGED`.

## Latest route checkpoint — 2026-09-07

- Contract baseline: `0706198b82a69535ebcf1d503e55e2a6802913f9`.
- Current source/build commit: `935a472c111b3d4096307cc5a95c434ee7bc9b1f`.
- Source owner `scripts/hero-roster-phase-a-v4.mjs` now gives
  `#hvHeroRosterV4` explicit `100vh`/`100dvh` height. The route owns one grid
  scroll surface; no extra document-level click/pointer listener was added.
- RED: viewport-height route assertion failed on baseline. GREEN: `1/1` focused
  route test. REFACTOR: focused route/roster/return-context/roster-plan `23/23`
  pass, syntax and diff clean.
- Production `dpl_AspyJaphzeGFtuqNeFw7KwH5Rana` is READY; build embedded
  `952325` bytes and runtime errors are `0`. Chrome evidence is root `680×936`,
  grid `680×716`, 12 cards, Ông Phở detail/back with selected card retained,
  and 0 app-origin errors.
- Ticket state remains `REVIEW / IN_PROGRESS`. Device capabilities `[]`, Ticket
  Board, archive, game-dev, local binary assets and doctor/smoke remain blocked.

## Latest L05c checkpoint — 2026-09-07

- Contract baseline: `5ca7c3caee449a5705a6ffd0df9b693f5ace1cb6`.
- Current source/build commit: `1a74d11bda0ce5add50d498f2b9d659f7a0f91ee`.
- `src/domain/combat/action-observation.mjs` now exposes
  `replayParity.seed` in the `hon-viet-combat-replay-parity/v1` projection.
  This is evidence-only and preserves seed setup, reward/balance, save
  migration, roster, art, audio and gameplay rules.
- RED was the missing seed assertion. GREEN focused L05c is `4/4 PASS`;
  REFACTOR full combat is `39/39 PASS`, with syntax and diff checks clean.
- Production deployment `dpl_32eET1QCRjaw17tDTzQh9xXsxdDU` is READY from the
  code SHA; embedded battle is `952395` bytes and selected runtime errors are
  `0`.
- Chrome production 1× and 2× both report seed `l05a-production-seed`,
  fingerprint `86267582`, `93` actions, `644` impacts, authored round `15`,
  `maxObservedRound=15`, `roundsBeyondCap=0`, `roundCapReached=true`, and
  `gaps=[]`. Final 2× app-origin errors are `0`; visible result is `Khải hoàn`.
- Ticket remains `REVIEW / IN_PROGRESS`. Device capabilities `[]`, Ticket
  Board, archive, game-dev, local binary assets and doctor/smoke remain blocked.
- Machine evidence: `docs/qa/L05c/l05c-round-cap-replay-parity.json`.
