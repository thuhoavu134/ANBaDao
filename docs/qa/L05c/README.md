# L05c — round-cap and full replay parity

Status: `REVIEW / IN_PROGRESS`  
Contract baseline: `5ca7c3caee449a5705a6ffd0df9b693f5ace1cb6`  
Code commit: `1a74d11bda0ce5add50d498f2b9d659f7a0f91ee`

## Contract

The authored round-cap fixture must terminate at round 15 and never observe
round 16. The same fixture seed at speed 1× and 2× must preserve the complete
replay-rule-outcome fingerprint, action count and impact count. This slice only
exposes the seed in the existing observation projection so the claim is
auditable; it does not alter seed setup, reward, balance, save migration,
roster, art, audio or gameplay rules.

## TDD and refactor

- RED: the new assertion failed because `replayParity.seed` was not published.
- GREEN: `tests/combat-l05c-parity.test.mjs` is `4/4 PASS`.
- REFACTOR: full combat suite is `39/39 PASS`; source/adapter syntax checks and
  `git diff --check` pass.

## Production evidence

Vercel deployment `dpl_32eET1QCRjaw17tDTzQh9xXsxdDU` is `READY` from the code
SHA. The complete-source build embedded a `952395`-byte battle payload and the
selected runtime-error query is empty.

Chrome production runs at 1× and 2× both observed:

- seed `l05a-production-seed`;
- fingerprint `86267582`;
- `93` actions and `644` impacts;
- authored round `15/15`, `maxObservedRound=15`, `roundsBeyondCap=0`;
- `roundCapReached=true` and `gaps=[]`.

The report completion speed is `1` and `2` respectively; the visible result is
`Khải hoàn` at `HIỆP 15/15`. Final 2× app-origin console errors: `0`.

Full machine evidence is in
[`l05c-round-cap-replay-parity.json`](./l05c-round-cap-replay-parity.json).

## Blockers and handoff

Device capabilities are `[]`, so responsive Chrome and Safari/iPhone/iPad QA
remain unavailable. Ticket Board and archive are unavailable, the Game
Development Studio CLI is not installed, local checkout assets are incomplete,
and `doctor`/`smoke` scripts are absent. Continue with `REVIEW / IN_PROGRESS`;
next handoff is device matrix plus Ticket Board claim/lock/evidence when those
backends become available.
