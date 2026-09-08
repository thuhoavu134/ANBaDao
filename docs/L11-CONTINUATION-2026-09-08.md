# L11 continuation — 2026-09-08

Source baseline: `b6a2ae20a9b1b3071a8f5263740312e9d1465b04`, branch `handoff/l11-splus-profiles-v2-20260908`. Status REVIEW / IN_PROGRESS. This continuation supersedes earlier failing test counts, not the remaining acceptance gates.

## Verified source slice

- Resolved all six original V2 regressions and reviewed handlers across all six elements against the authored profiles. Updated explicit V1 assertions only where V2 changed the requirement.
- Added 33 regression cases (182 S+ before final lifecycle/consumption cases; the prior checkpoint was 411/411). This continuation adds the crop/target-scope regression slice; current full suite is 414/414. Build completed through `scripts/build-static.mjs`, including independent/embedded battle parity and old save/reward/seed regressions. See `qa/L11-SPLUS-PROFILES/continuation-full-green.log`.
- Source HP shields/heals, precise target scopes, control/rage restrictions, damage/shield bypass, immediate forced basic, latest-death revive, HoT final tick, Fire/Wood actions and consumed zone cleanup covered by new focused regressions.
- Popup handles queued close/reopen, Escape, destroy and focus cleanup. Battle resolves current actor by ID, refuses orphan cast, resets UI on restart/exit. Source adapter remains the single scheduler owner.
- Catalog/bridge/combat now identify V2. Runtime adapter script marker remains v1 as a build integration identifier.
- Luna handled bounded Fire/Wood implementation, initial actor closure fix, dialog regression tests and read-only profile audit; root reviewed/integrated and corrected remaining cases.

## Review decisions and remaining acceptance

- Trầm Tuệ actionSlow uses the existing queue: immediate delay by 40% of remaining queue length, then -40% ordering speed while the two-round status is active. This is a REVIEW interpretation of action bar wording in a round scheduler, not a new realtime clock.
- Hạc Phá stun 1.5 rounds remains authored as fractional expiry but integer round evaluation is not exact half-round timing. Tố Linh half-slot movement and airborne presentation also need timing acceptance. No silent approval of these approximations.
- Unquantified damage multipliers, Cửu Tính five-stack explosion magnitude, parasite cap, Hắc Đao four adjacent cells on a 2×3 board and Sơn Cương recast bleed consumption need explicit review. Passing tests do not certify all126 descriptions numerically.
- Source crop gutter and live 126 viewBox metadata now pass; full authored-atlas visual matrix remains REVIEW because no art bytes were changed. Target picker and clean reload restart are browser-verified. Device/Safari/mobile viewport remains NOT_RUN because the connected browser exposes no emulation capability.
- Ticket Board unavailable; claim/lease null, locks empty. Owner explicitly authorized source/test continuation. Vibe gate run `20260908-153841-f3ao79i` retains these honest blockers. No DONE/MERGED.
- Combat V2 stays on handoff branch. Main/production remains the documentation checkpoint `03d4fdf`; preview READY alone is not release approval.

## Reproduce

```sh
npm test
node --test --test-reporter=tap tests/splus-*.test.mjs
```

Retained RED evidence: continuation-red, parity-red, fire-wood-red, ui-orphan-red, dialog-red, consumption-red. Intermediate failed builds are historical attempts; the final full-green log is the current source verification. Restored local runtime assets matched upstream Git blobs; no substitute art or dependency changes were introduced.

## Final source/preview verification

- Code revision `4a79095bedca6100f19c855f6edfc83ad75fd033` (main implementation `9c83ac2`). Both pushed fast-forward on the handoff branch.
- Vercel `dpl_8dXiaDtsn4LBhkdEmRVu9CvWijYD` READY, target preview, exact code SHA confirmed. URL: https://luc-than-4ji0utvf2-cuong-duc-ai-s-projects.vercel.app/battle.html?qaSplus42=hero_splus_nung . Deployment protection retained; browser used a temporary Vercel access link, excluded from evidence.
- Final full build/test: **411/411 PASS**, `continuation-final-full-green.log`. A repeated run under synchronized scratch had two generated-file parity failures. Isolated source verification in `/tmp` passed; source assets were unchanged. Treat this as workspace artifact synchronization, not a reason to weaken parity tests.
- Chrome desktop: catalog42, Fire filter7, Nung search1, detail route and P/S1/Ult popup/close/Escape verified. The first catalog S1 Cơ Trọng also displayed the authored22% source HP shield. A bulk popup loop timed out; no claim of126 popup/crop PASS.
- Browser RED at9c83ac2: inherited pointer-events:none prevented clicking battle skill buttons. Fixed in4a79095 via source shared button CSS. Browser GREEN: actual click opens Nung Ult with43/100 rage, disabled below60; S1 popup enabled, Cast selects target and resolves through the existing scheduler.
- Completed Fire vs Wood battle: **15 rounds,139 actions,1649 events,12 actors**, finite HP/rage true,8 living units in8 unique slots; no QA rewards. Machine evidence: `continuation-browser-battle.json`. App-origin error query returned none; extension metadata errors were observed separately.
- Remaining browser limitations: no full six-element matrix, no embedded-host restart certification, no mobile/Safari/device run. Result Continue was clicked without a confirmed restart; do not count this as restart PASS. Unit tests cover replacement IDs, orphan prevention and dialog lifecycle.
- Art review finding: some metal crops show a sliver of adjacent-row ornament. Source atlas has tightly touching ornaments/alpha fringe. Full126 crop acceptance remains OPEN. No art bytes were modified.
- UI targeting review: Nung S1 currently exposes all enemy target buttons while resolver chooses the authored opposite-front target. Scope resolution is correct, but target-picker presentation should be narrowed before release.
- Vibe run progressed to evidence-review; gate is still open for these acceptance items, timing decisions and unavailable Board/device. This is a tested continuation checkpoint, not L11 completion or production promotion.

## Scope/crop/restart follow-up — `e1f0b964`

- Pushed fast-forward to `handoff/l11-splus-profiles-v2-20260908`; main/production were not changed.
- Crop fix: every S+ icon rect has a source gutter `{x:3,y:5}` before its SVG viewBox. The browser catalog rendered 42 heroes / 126 icons; sampled viewBoxes were `3 5 268 240`, `277 5 268 240`, `551 5 267 240`. Full visual atlas acceptance stays REVIEW; no art bytes changed.
- Target picker fix: Nung S1 Cast exposed exactly one button, `Chọn Tuệ Y, còn 24000 máu`; after selection the dialog and target layer cleared.
- Restart: reload + `Vào trận giữ Ải Mây` produced one status panel, one skill strip, one closed dialog, actor `player:hero_splus_nung`, and zero stale target buttons.
- Current source verification is **414/414 PASS**; focused scope/runtime/dialog slice is **10/10 PASS**. Machine evidence: [continuation-scope-crop-restart-20260908.json](qa/L11-SPLUS-PROFILES/continuation-scope-crop-restart-20260908.json).
- Desktop catalog at 1363×936 had 42 cards and no horizontal overflow. Mobile/Safari/device is **NOT_RUN**: the available browser has no viewport/emulation capability. Fractional timing decisions remain REVIEW and are not rounded.
- The branch-linked preview stayed on the old bundle, so browser QA used an isolated host only for this check; it is not a production promotion or release approval.
