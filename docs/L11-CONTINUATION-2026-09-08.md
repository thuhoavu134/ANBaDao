> **Bàn giao hiện hành 09/09/2026:** [HANDOFF-2026-09-09.md](HANDOFF-2026-09-09.md). PR #17 đã merge tại `f8ebc1a`; production READY, alias chính đã xác minh. [Quy trình triển khai](AGENT-IMPLEMENTATION-WORKFLOW-2026-09-09.md). Các mục phía dưới giữ trạng thái lịch sử tại thời điểm ghi.

## 2026-09-09 — Owner-approved promotion to main

Owner reviewed candidate `2f8049cf6a0882503e4d45ab5275f8ad48aff8ff` and explicitly requested promotion to main. This supersedes the earlier no-production instruction. PR: https://github.com/bktimmy247/luc-than/pull/17. Preview `dpl_Ewq2LZDGiBJUrR9GDY13tAsEN6pV` is READY for that exact candidate. Main auto-deploys production; deployment completion must be checked against the resulting merge SHA.

Approved scope includes hero-detail UI, campaign preparation/green-tick reserve selection/result routing, and the S+ V2 continuation. Build PASS; latest local suite: 409 tests, 407 PASS and 2 failures due to missing sharp. Earlier 411/414 counts are historical checkpoints. Mobile/Safari and full visual acceptance remain open; fractional-duration mechanics remain REVIEW and must not be rounded. Owner release approval does not close those technical review gates or mark a Ticket Board item DONE.

The promotion merge changes documentation only relative to the approved candidate; runtime/assets retain the approved blob SHAs. Earlier status and no-production statements below are historical.

# L11 continuation — 2026-09-08

## Latest local continuation: campaign reference flow

Implemented green-tick toggle, partial campaign squads, occupied-position drag, battlefield preparation and explicit confirm/next result routing. Build PASS; final tests **407 pass / 2 pre-existing missing-sharp failures**. Local browser is blocked, so visual/mobile acceptance remains open. Owner has now explicitly authorized source upload to `bktimmy247/luc-than` on the handoff branch; production remains unchanged. See [campaign reference contract, evidence and remaining work](qa/L11-SPLUS-PROFILES/campaign-reference-flow-20260908.md). This is a REVIEW candidate, not completion of the entire reference UI.

Source baseline: `b6a2ae20a9b1b3071a8f5263740312e9d1465b04`, branch `handoff/l11-splus-profiles-v2-20260908`. Status REVIEW / IN_PROGRESS. This continuation supersedes earlier failing test counts, not the remaining acceptance gates.

## Verified source slice

- Resolved all six original V2 regressions and reviewed handlers across all six elements against the authored profiles. Updated explicit V1 assertions only where V2 changed the requirement.
- Added 33 regression cases (182 S+ before final lifecycle/consumption cases; the prior checkpoint was 411/411). This continuation adds the crop/target-scope regression slice; the prior full-green checkpoint is 414/414, while the current local rerun is 398 pass / 2 infrastructure failures because `sharp` is absent. Build completed through `scripts/build-static.mjs`, including independent/embedded battle parity and old save/reward/seed regressions. See `qa/L11-SPLUS-PROFILES/continuation-full-green.log`.
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

## Crop visual follow-up — `25c3a083`

- Local contact-sheet review found residual adjacent-row/column fragments with the earlier `{x:3,y:5}` inset, most clearly in Dream row boundaries and Fire/Wood ultimate edges.
- Source crop is now `{x:12,y:12}` for all 126 regions. Six generated contact sheets (21 regions per atlas) show no adjacent fragment and no visible loss of the authored icon silhouette. No art bytes changed.
- Focused S+ suite after the crop change is **192/192 PASS**; focused scope/runtime/dialog slice remains **10/10 PASS**. Build completes. The current checkout's full rerun is blocked only by missing `sharp` in two pre-existing image tests (`398 pass / 2 infrastructure failures`); retain the prior verified `414/414` checkpoint as historical full-green evidence.
- Browser preview used for the earlier target/restart evidence predates this crop-only commit; do not claim a new browser viewBox or mobile/device PASS until a host with the new bundle and a real viewport backend is available.

## Browser crop/restart follow-up — `9decbaae`

Latest UI continuation: player hero detail now has a portrait scene, persistent stats/upgrades, skill disclosures and owned-hero arrows. Source/regression slice 23/23; build PASS. Browser/mobile/reference acceptance is pending, not approved. See [hero-detail scene evidence](qa/L11-SPLUS-PROFILES/hero-detail-scene-20260908.md). No combat, fractional timing or production changes.

- The handoff branch Git preview `dpl_HxFbZEFrfgc3VpTcckHKouy7pYYb` is READY at [`luc-than-9lwfqw787`](https://luc-than-9lwfqw787-cuong-duc-ai-s-projects.vercel.app/battle.html?qaSplus42=hero_splus_nung), built from exact docs/evidence commit `9decbaae9b87b11ab649a1a9edda0cf302fee307`. This is a preview deployment only; no production alias or Combat V2 promotion was performed.
- After `Vào trận giữ Ải Mây`, the live Nung skill strip rendered P/S1/Ult with fire-atlas viewBoxes `12 12 250 230`, `286 12 250 230`, and `560 12 249 230`. The desktop screenshot showed the three icons without a visible neighboring-row/column fragment; this is a runtime sample, not full 126-icon browser acceptance.
- Nung S1 → `Thi triển` exposed exactly one `.unit-target`, `enemy:hero_splus_tue_y` (`Chọn Tuệ Y, còn 24000 máu`). Selecting it closed the dialog and cleared the target layer; the next actor was Hỏa Tiêu. This keeps target-picker presentation within the authored scope, not merely resolver correctness.
- A clean reload returned `readyState=complete`, `Trận đấu bắt đầu`, one visible start control, zero open dialogs and zero stale target buttons. Mobile/Safari/device remains **NOT_RUN** because the connected browser still exposes no viewport/emulation capability.
- Fractional timing remains **REVIEW_UNCHANGED**; no durations were rounded or silently approved. Main/production remains unchanged and Combat V2 remains on the handoff branch.
