# Project memory — Hồn Việt / Lục Thần

## Current goal

Continue the source-owned L04 lifecycle/return-context work while keeping the
player journey, combat rules, save ownership and production evidence stable.

## Active slice

- Ticket label: `L04-lifecycle-next` (Ticket Board unavailable; keep the state
  `REVIEW` / `IN_PROGRESS`).
- Contract revision: `12e6279a39490d891114bdc7283d4bf7e99be4e4`.
- Code commit on `main`: `e37c6df342e912a3c8ef15ac2ad5ed152547db21`.
- Scope: `src/ui/scene-lifetime.js` and its focused test. A one-shot timeout now
  removes its own disposer after firing, so completed callbacks do not remain
  in the activation scope's pending resource set.

## Decisions and non-goals

- Main agent codes directly; `vibe-builder` owns source/build/docs and
  `vibe-lab` owns the gate/evidence handoff.
- Keep the reusable campaign DOM root separate from activation resources.
- No changes to seed, reward, balance, save migration, roster, art, audio,
  combat rule or dist-only output.

## Validation

- RED: new timer lifecycle test failed with `pending 1 !== 0` on the baseline.
- GREEN: focused return-context/lifecycle/campaign suite `18/18 PASS`.
- REFACTOR: changed-owner syntax checks pass.
- Vercel deployment `dpl_8ZUUaBWq4z4yd58Br8piF7UNN68N` is `READY`; build log
  ran `npm run build` and wrote an embedded battle payload of `952325` bytes.
- Production Chrome re-entry: 20 Tướng → Chinh chiến rounds; roster and
  campaign roots remained unique (`count=1`) and visible; app-origin errors
  after filtering browser-extension diagnostics: `0`.

## Limitations and next action

- `TICKET_BOARD_NOT_AVAILABLE`: repository has no `scripts/ticketctl.mjs`.
- `DEVICE_BACKEND_NOT_AVAILABLE`: only Chrome CDP is exposed; no Safari,
  iPhone/iPad or responsive-device backend.
- `game-dev` CLI is not installed; do not install or change credentials.
- Local connector checkout lacks the full binary asset package, so local
  `npm run build` and the all-test command cannot be treated as full-pass;
  Vercel built the complete repository successfully.
- Next: when a device backend or Ticket Board becomes available, rerun the
  same production matrix and update the handoff. Keep the ticket at `REVIEW`;
  do not mark it `DONE` or `MERGED`.
